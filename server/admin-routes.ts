import type { Express, RequestHandler } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { aiInteractions, promptVersions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import {
  submitEvalBatch,
  checkBatchStatus,
  processBatchResults,
  getEvalSummary,
  generateImprovedPrompt,
  getPendingQueueSummary,
} from "./evaluator";
import {
  createPromptVersion,
  activatePromptVersion,
  getPromptVersionHistory,
  getAllActivePrompts,
} from "./prompt-manager";
import { getPublicErrorMessage } from "./security";
import { promptFeatureTypeSchema } from "./ai-feature-types";
import { adminIpLimit } from "./rate-limit";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Admin auth middleware — requires X-Admin-Secret header matching ADMIN_SECRET env var.
// Set ADMIN_SECRET in Replit environment secrets before using these endpoints.
// ─────────────────────────────────────────────────────────────────────────────
function hashAdminSecret(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function adminSecretMatches(providedSecret: string | undefined, expectedSecret: string): boolean {
  return timingSafeEqual(
    hashAdminSecret(providedSecret ?? ""),
    hashAdminSecret(expectedSecret),
  );
}

const adminAuth: RequestHandler = (req, res, next) => {
  const expectedSecret = process.env.ADMIN_SECRET;
  if (!expectedSecret) {
    console.error('[admin] ADMIN_SECRET environment variable not set.');
    return res.status(500).json({ message: getPublicErrorMessage(500) });
  }

  if (!adminSecretMatches(req.get("X-Admin-Secret"), expectedSecret)) {
    return res.status(403).json({ message: "Forbidden: invalid admin secret." });
  }
  next();
};

const adminNoCache: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.vary('X-Admin-Secret');
  next();
};

export function registerAdminRoutes(app: Express): void {
  app.use('/api/admin', adminNoCache, adminIpLimit, adminAuth);

  // ── STATUS ─────────────────────────────────────────────────────────────────

  // GET /api/admin/eval/pending
  // Returns count of interactions waiting to be evaluated, broken down by feature.
  app.get('/api/admin/eval/pending', async (_req, res) => {
    try {
      const summary = await getPendingQueueSummary();
      res.json(summary);
    } catch (err) {
      console.error('[admin] Error getting pending count:', err);
      res.status(500).json({ message: "Failed to get pending count." });
    }
  });

  // ── BATCH MANAGEMENT ───────────────────────────────────────────────────────

  // POST /api/admin/eval/submit-batch
  // Submits all pending interactions as a single batch job to OpenAI Batch API.
  // Body: { interactionIds?: number[] } — optional, submits all pending if omitted.
  app.post('/api/admin/eval/submit-batch', async (req, res) => {
    try {
      const schema = z.object({ interactionIds: z.array(z.number()).optional() });
      const { interactionIds } = schema.parse(req.body);
      const result = await submitEvalBatch(interactionIds);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[admin] Error submitting batch:', err);
      res.status(500).json({ message: getPublicErrorMessage(500) });
    }
  });

  // GET /api/admin/eval/batch-status/:batchId
  // Checks the status of a submitted batch job.
  app.get('/api/admin/eval/batch-status/:batchId', async (req, res) => {
    try {
      const status = await checkBatchStatus(req.params.batchId);
      res.json(status);
    } catch (err: any) {
      console.error('[admin] Error checking batch status:', err);
      res.status(500).json({ message: getPublicErrorMessage(500) });
    }
  });

  // POST /api/admin/eval/process-results/:batchId
  // Downloads results from a completed batch and stores verdicts in the database.
  app.post('/api/admin/eval/process-results/:batchId', async (req, res) => {
    try {
      const result = await processBatchResults(req.params.batchId);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[admin] Error processing batch results:', err);
      res.status(500).json({ message: getPublicErrorMessage(500) });
    }
  });

  // ── EVALUATION RESULTS ─────────────────────────────────────────────────────

  // GET /api/admin/eval/summary
  // Returns a full summary of all completed evaluations with error mode breakdown.
  app.get('/api/admin/eval/summary', async (_req, res) => {
    try {
      const summary = await getEvalSummary();
      res.json(summary);
    } catch (err) {
      console.error('[admin] Error getting eval summary:', err);
      res.status(500).json({ message: "Failed to get eval summary." });
    }
  });

  // GET /api/admin/eval/interactions
  // Returns raw interaction logs. Query params: ?status=pending|batched|completed&feature=recipe_suggestions
  app.get('/api/admin/eval/interactions', async (req, res) => {
    try {
      const { status, feature } = req.query;
      let query = db.select().from(aiInteractions);

      if (status && typeof status === 'string') {
        query = query.where(eq(aiInteractions.evalStatus, status)) as typeof query;
      }
      if (feature && typeof feature === 'string') {
        query = query.where(eq(aiInteractions.featureType, feature)) as typeof query;
      }

      const interactions = await query.orderBy(aiInteractions.createdAt);
      res.json({ count: interactions.length, interactions });
    } catch (err) {
      console.error('[admin] Error getting interactions:', err);
      res.status(500).json({ message: "Failed to get interactions." });
    }
  });

  // ── PROMPT MANAGEMENT ──────────────────────────────────────────────────────

  // GET /api/admin/prompts
  // Returns all currently active prompts across all features.
  app.get('/api/admin/prompts', async (_req, res) => {
    try {
      const active = await getAllActivePrompts();
      res.json({ prompts: active });
    } catch (err) {
      console.error('[admin] Error getting active prompts:', err);
      res.status(500).json({ message: "Failed to get prompts." });
    }
  });

  // GET /api/admin/prompts/:featureType/history
  // Returns full version history for a specific feature's prompt.
  app.get('/api/admin/prompts/:featureType/history', async (req, res) => {
    try {
      const parsedFeature = promptFeatureTypeSchema.safeParse(req.params.featureType);
      if (!parsedFeature.success) {
        return res.status(400).json({ message: "Unsupported prompt feature type." });
      }
      const featureType = parsedFeature.data;
      const history = await getPromptVersionHistory(featureType);
      res.json({ featureType, versions: history });
    } catch (err) {
      console.error('[admin] Error getting prompt history:', err);
      res.status(500).json({ message: "Failed to get prompt history." });
    }
  });

  // POST /api/admin/prompts/generate
  // Generates an improved prompt using confirmed failure examples.
  // Body: { featureType: string, interactionIds: number[] }
  // Does NOT activate the new prompt — returns it for review first.
  app.post('/api/admin/prompts/generate', async (req, res) => {
    try {
      const schema = z.object({
        featureType: promptFeatureTypeSchema,
        interactionIds: z.array(z.number()).min(1),
      });
      const { featureType, interactionIds } = schema.parse(req.body);

      const failedRows = await db
        .select()
        .from(aiInteractions)
        .where(and(
          eq(aiInteractions.featureType, featureType),
          eq(aiInteractions.evalPassed, false)
        ));

      const selected = failedRows.filter(r => interactionIds.includes(r.id));
      if (selected.length === 0) {
        return res.status(400).json({ message: "No matching failed interactions found for the given IDs." });
      }

      const activePrompts = await getAllActivePrompts();
      const activeForFeature = activePrompts.find(p => p.featureType === featureType);
      const currentPrompt = activeForFeature?.systemPrompt || "(no active prompt — using hardcoded default)";

      const improvedPrompt = await generateImprovedPrompt(
        featureType,
        currentPrompt,
        selected.map(r => ({
          inputData: r.inputData,
          outputData: r.outputData,
          errorModes: r.evalErrorModes,
          reasoning: r.evalReasoning,
        }))
      );

      res.json({
        featureType,
        currentPromptLength: currentPrompt.length,
        improvedPromptLength: improvedPrompt.length,
        improvedPrompt,
        basedOnInteractionIds: selected.map(r => r.id),
        securityNotice:
          "AI interaction logs are untrusted user-generated content and may contain prompt-injection attempts. Review the generated prompt before saving or activating it; do not follow any instructions found inside the logs.",
      });
    } catch (err: any) {
      console.error('[admin] Error generating improved prompt:', err);
      res.status(500).json({ message: getPublicErrorMessage(500) });
    }
  });

  // POST /api/admin/prompts/save
  // Saves a reviewed prompt as a new version and immediately activates it.
  // Body: { featureType, systemPrompt, versionNote, interactionIds }
  app.post('/api/admin/prompts/save', async (req, res) => {
    try {
      const schema = z.object({
        featureType: promptFeatureTypeSchema,
        systemPrompt: z.string().min(50),
        versionNote: z.string(),
        interactionIds: z.array(z.number()).optional(),
      });
      const { featureType, systemPrompt, versionNote, interactionIds } = schema.parse(req.body);

      const id = await createPromptVersion(featureType, systemPrompt, versionNote, interactionIds);
      res.json({ success: true, newVersionId: id, message: `Prompt version ${id} saved and activated for ${featureType}.` });
    } catch (err: any) {
      console.error('[admin] Error saving prompt version:', err);
      res.status(500).json({ message: getPublicErrorMessage(500) });
    }
  });

  // POST /api/admin/prompts/activate/:id
  // Activates a specific historical prompt version by ID (for rollback).
  app.post('/api/admin/prompts/activate/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid version ID." });
      await activatePromptVersion(id);
      res.json({ success: true, message: `Prompt version ${id} is now active.` });
    } catch (err: any) {
      console.error('[admin] Error activating prompt version:', err);
      res.status(500).json({ message: getPublicErrorMessage(500) });
    }
  });
}
