import OpenAI, { toFile } from "openai";
import { db } from "./db";
import { aiInteractions } from "@shared/schema";
import { eq, inArray, and, isNull } from "drizzle-orm";
import { EVAL_CRITERIA, type FeatureType } from "./eval-criteria";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// ─────────────────────────────────────────────────────────────────────────────
// Build the evaluation prompt for a single interaction.
// o4-mini will receive this and return a structured JSON verdict.
// ─────────────────────────────────────────────────────────────────────────────
function buildEvalPrompt(interaction: {
  featureType: string;
  inputData: unknown;
  outputData: string;
}): string {
  const criteria = EVAL_CRITERIA[interaction.featureType as FeatureType];
  if (!criteria) throw new Error(`Unknown feature type: ${interaction.featureType}`);

  const errorModeList = criteria.errorModes
    .map(e => `- **${e.id}** [${e.severity}]: ${e.description}`)
    .join('\n');

  return `${criteria.evaluatorInstructions}

## Error Modes to Check
${errorModeList}

## User Input Context
${JSON.stringify(interaction.inputData, null, 2)}

## Model Response
${interaction.outputData}

## Instructions
Evaluate the response above against the error modes listed. Return a JSON object with exactly these fields:
- "passed": boolean — true only if NO high or medium severity errors are present
- "score": integer 0–100 — 100 = perfect, 0 = completely wrong
- "errorModes": array of error mode IDs that were detected (empty array if none)
- "reasoning": string — your verdict in 2–3 sentences, be specific

Return only valid JSON. No explanation outside the JSON.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Submit a batch of pending interactions to OpenAI Batch API (o4-mini).
// Returns the batch ID and count of interactions submitted.
// ─────────────────────────────────────────────────────────────────────────────
export async function submitEvalBatch(interactionIds?: number[]): Promise<{ batchId: string; count: number }> {
  let interactions;

  if (interactionIds && interactionIds.length > 0) {
    interactions = await db
      .select()
      .from(aiInteractions)
      .where(inArray(aiInteractions.id, interactionIds));
  } else {
    interactions = await db
      .select()
      .from(aiInteractions)
      .where(eq(aiInteractions.evalStatus, 'pending'));
  }

  if (interactions.length === 0) {
    throw new Error("No pending interactions found to evaluate.");
  }

  const lines = interactions.map(interaction =>
    JSON.stringify({
      custom_id: `interaction-${interaction.id}`,
      method: "POST",
      url: "/v1/chat/completions",
      body: {
        model: "o4-mini",
        messages: [{ role: "user", content: buildEvalPrompt(interaction) }],
        max_completion_tokens: 600,
      },
    })
  ).join('\n');

  const uploadedFile = await openai.files.create({
    file: await toFile(Buffer.from(lines, 'utf-8'), 'eval_batch.jsonl', { type: 'application/jsonl' }),
    purpose: 'batch',
  });

  const batch = await openai.batches.create({
    input_file_id: uploadedFile.id,
    endpoint: "/v1/chat/completions",
    completion_window: "24h",
  });

  await db
    .update(aiInteractions)
    .set({ evalStatus: 'batched', batchJobId: batch.id })
    .where(inArray(aiInteractions.id, interactions.map(i => i.id)));

  return { batchId: batch.id, count: interactions.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check the status of a previously submitted batch.
// ─────────────────────────────────────────────────────────────────────────────
export async function checkBatchStatus(batchId: string) {
  const batch = await openai.batches.retrieve(batchId);
  return {
    id: batch.id,
    status: batch.status,
    requestCounts: batch.request_counts,
    outputFileId: batch.output_file_id,
    createdAt: batch.created_at,
    completedAt: batch.completed_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Download and store results from a completed batch.
// ─────────────────────────────────────────────────────────────────────────────
export async function processBatchResults(batchId: string): Promise<{ processed: number; passed: number; failed: number }> {
  const batch = await openai.batches.retrieve(batchId);

  if (batch.status !== 'completed') {
    throw new Error(`Batch is not yet completed. Current status: ${batch.status}`);
  }

  if (!batch.output_file_id) {
    throw new Error(`Batch completed but has no output file.`);
  }

  const fileContent = await openai.files.content(batch.output_file_id);
  const text = await fileContent.text();
  const lines = text.trim().split('\n').filter(Boolean);

  let processed = 0;
  let passed = 0;
  let failed = 0;

  for (const line of lines) {
    try {
      const result = JSON.parse(line);
      const interactionId = parseInt(result.custom_id.replace('interaction-', ''));

      if (result.error) {
        console.error(`[evaluator] Batch error for interaction ${interactionId}:`, result.error);
        continue;
      }

      const content = result.response?.body?.choices?.[0]?.message?.content;
      if (!content) continue;

      let verdict: any;
      try {
        verdict = JSON.parse(content);
      } catch {
        console.error(`[evaluator] Could not parse verdict JSON for interaction ${interactionId}:`, content);
        continue;
      }

      await db
        .update(aiInteractions)
        .set({
          evalStatus: 'completed',
          evalPassed: !!verdict.passed,
          evalScore: typeof verdict.score === 'number' ? verdict.score : null,
          evalErrorModes: Array.isArray(verdict.errorModes) ? verdict.errorModes : [],
          evalReasoning: verdict.reasoning || null,
        })
        .where(eq(aiInteractions.id, interactionId));

      processed++;
      if (verdict.passed) passed++;
      else failed++;
    } catch (e) {
      console.error('[evaluator] Error processing batch result line:', e);
    }
  }

  return { processed, passed, failed };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get a summary of all completed evaluations — used during eval sessions.
// ─────────────────────────────────────────────────────────────────────────────
export async function getEvalSummary() {
  const interactions = await db
    .select()
    .from(aiInteractions)
    .where(eq(aiInteractions.evalStatus, 'completed'));

  const errorModeBreakdown: Record<string, number> = {};
  const byFeature: Record<string, { total: number; passed: number; failed: number }> = {};

  for (const i of interactions) {
    if (!byFeature[i.featureType]) {
      byFeature[i.featureType] = { total: 0, passed: 0, failed: 0 };
    }
    byFeature[i.featureType].total++;
    if (i.evalPassed) byFeature[i.featureType].passed++;
    else byFeature[i.featureType].failed++;

    for (const mode of (i.evalErrorModes || [])) {
      errorModeBreakdown[mode] = (errorModeBreakdown[mode] || 0) + 1;
    }
  }

  const failedInteractions = interactions
    .filter(i => !i.evalPassed)
    .map(i => ({
      id: i.id,
      featureType: i.featureType,
      inputData: i.inputData,
      outputData: i.outputData,
      errorModes: i.evalErrorModes,
      reasoning: i.evalReasoning,
      score: i.evalScore,
      createdAt: i.createdAt,
    }));

  return {
    total: interactions.length,
    passed: interactions.filter(i => i.evalPassed).length,
    failed: interactions.filter(i => !i.evalPassed).length,
    errorModeBreakdown,
    byFeature,
    failedInteractions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate an improved prompt based on confirmed failure examples.
// This is called manually during an eval session — never automatically.
// Uses GPT-4o (not o4-mini) for creative prompt writing quality.
// ─────────────────────────────────────────────────────────────────────────────
export async function generateImprovedPrompt(
  featureType: FeatureType,
  currentPrompt: string,
  failedExamples: Array<{ inputData: unknown; outputData: string; errorModes: string[] | null; reasoning: string | null }>
): Promise<string> {
  const examplesText = failedExamples.map((ex, i) => `
### Failure Example ${i + 1}
**Error Modes:** ${(ex.errorModes || []).join(', ')}
**Evaluator Reasoning:** ${ex.reasoning || 'Not provided'}
**User Input:**
${JSON.stringify(ex.inputData, null, 2)}
**Model Output:**
${ex.outputData}
`).join('\n');

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert prompt engineer specializing in improving AI system prompts for cooking applications. Your task is to improve a system prompt by incorporating lessons learned from real failure cases. Preserve all existing rules and examples. Add clear, specific guidance that would prevent the failures shown. Ground your additions with the real examples provided.`,
      },
      {
        role: "user",
        content: `Here is the current system prompt for the "${featureType}" feature:

---
${currentPrompt}
---

Here are ${failedExamples.length} confirmed real-world failure(s) that this prompt did not prevent:

${examplesText}

Please rewrite the system prompt to address these failures. Requirements:
1. Preserve ALL existing rules, guidelines, and examples in the prompt
2. Add a new section called "## Additional Guidelines from Real Failures" 
3. In that section, add specific rules derived from the failures above, including the real examples as grounding
4. Be precise and actionable — vague guidelines don't help
5. Return only the updated prompt text, nothing else`,
      },
    ],
  });

  return response.choices[0].message.content || currentPrompt;
}

// ─────────────────────────────────────────────────────────────────────────────
// Count pending interactions — quick status check before starting a session.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPendingCount(): Promise<Record<string, number>> {
  const pending = await db
    .select()
    .from(aiInteractions)
    .where(eq(aiInteractions.evalStatus, 'pending'));

  const counts: Record<string, number> = {};
  for (const i of pending) {
    counts[i.featureType] = (counts[i.featureType] || 0) + 1;
  }
  return counts;
}
