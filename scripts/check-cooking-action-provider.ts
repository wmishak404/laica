// Read-only provider canary: synthetic requests only, no action ledger writes, no executors or enrollment.
import { getCookingAssistance } from "../server/openai";
import { loadPublicEvalFixtures } from "../server/eval-fixtures";
import { bindDirectTimerRequest } from "../server/cooking-actions/policy";
import { ActionProposalProviderError } from "../server/cooking-actions/provider-error";
import { pool } from "../server/db";

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new ActionProposalProviderError("provider_key_missing");
  const fixtures = (await loadPublicEvalFixtures()).filter(f => f.surface === "cooking_action_proposal");
  let positive = 0, correct = 0, clarified = 0, forbidden = 0, forbiddenProposed = 0;
  for (const fixture of fixtures) {
    const utterance = String(fixture.request.utterance);
    const binding = bindDirectTimerRequest(utterance);
    const output = await getCookingAssistance("Synthetic recipe step: simmer gently and check texture.", utterance, { actionProposal: true });
    if (binding) {
      positive++;
      if (output.type === "timer_proposal" && output.timer?.parameters.durationSeconds === binding.durationSeconds) correct++;
      if (output.type === "clarification") clarified++;
    } else { forbidden++; if (output.type === "timer_proposal") forbiddenProposed++; }
    // Exclude free-form provider text from stdout and artifacts.
    console.log(JSON.stringify({ fixture: fixture.id, type: output.type, durationSeconds: output.timer?.parameters.durationSeconds ?? null }));
  }
  console.log(JSON.stringify({ model: "gpt-4.1-mini", promptVersion: "action-proposal-v1", policyVersion: "timer-intent-1", positive, correct, clarified, forbidden, forbiddenProposed }));
  if (correct !== positive || forbiddenProposed !== 0) process.exitCode = 1;
}
// Legacy prompt lookup can log a DB exception. Suppress payloads for this privacy-bounded diagnostic.
const originalError = console.error;
console.error = () => originalError("[action-provider-canary] dependency_diagnostic_redacted");
main().catch(error => { originalError(`[action-provider-canary] ${error instanceof ActionProposalProviderError ? error.code : "dependency_unavailable"}`); process.exitCode = 1; })
  .finally(async () => { await pool.end(); console.error = originalError; });
