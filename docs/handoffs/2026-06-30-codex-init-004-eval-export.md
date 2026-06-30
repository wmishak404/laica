# INIT-004 Eval Report Export

**Agent:** codex
**Branch:** `codex/init-004-eval-export`
**Date:** 2026-06-30
**Initiative:** INIT-004
**INIT updated:** yes

## Summary

This branch gives operators a portable eval-summary artifact without making raw AI interaction payloads easier to spread. The new admin-only report path exports completed eval summaries as JSON or Markdown, preserving feature-level and prompt-version-level signal while omitting raw request and model-response payloads.

The user/operator value is safer eval review: future PRs, handoffs, and release notes can cite measured eval totals, failure clusters, and prompt-version provenance without copying sensitive or unreviewed raw examples.

## Architecture Triage

Fresh evidence gathered before choosing work:

- Fetched `origin/main`; current base was `f9909af`.
- Open PRs: #244 (`codex/security-admin-transcription-hardening`) is open, green, and owned by the security automation lane; #242 (`codex/production-validation-registry`) is draft/behind and owned elsewhere. Neither was touched.
- INIT-001 current resume point has remaining Phase 3.1 provider benchmark/visual-review choices and Phase 4 future redesign work, both higher product/Replit judgment than this automation's small-slice target.
- INIT-002 remains in Phase 2 Replit observation; Phase 3 DB/admin telemetry work should not start before observation evidence.
- INIT-003 remains later Phase 5/promotion planning and waits on INIT-001 Phase 5 semantics.
- INIT-004 had no active open PR and explicitly listed a small report artifact/export path using the PR #232 summary fields as a bounded Phase 3 candidate.
- EFF-022 is adjacent, but cuisine fallback remains a product decision. This branch only adds reporting infrastructure that future EFF-022 work can use.

Decision: INIT-004 report export was the clear best milestone because it is documented, unowned, builds on the latest merged eval-summary architecture, and avoids provider calls, schema, prompt changes, private fixtures, Replit validation, secrets, and EFF-022 product-rule decisions.

## What Changed

- `server/evaluator.ts`
  - Adds typed report artifact structures.
  - Adds `buildEvalReportArtifact()` to turn completed eval summaries into a redacted, sorted report payload.
  - Adds `formatEvalReportArtifactMarkdown()` for compact Markdown evidence.
- `server/admin-routes.ts`
  - Adds `GET /api/admin/eval/report?format=json|markdown`.
  - Keeps the endpoint behind existing admin auth and no-cache headers.
  - Returns Markdown as an attachment-style `text/markdown` response.
- `tests/unit/evaluator.test.ts`
  - Covers redaction, sorting, evidence limits, and Markdown formatting.
- `tests/unit/admin-cache-headers.test.ts`
  - Covers route wiring, Markdown content type, attachment filename, and no-cache behavior.
- Durable docs
  - INIT-004, initiative registry, eval README/registry, EFF-022, Effort registry.

## Value Claim / Evidence / Limits

**Value claim:** Operators can move eval reporting evidence between PRs, handoffs, and review notes with lower privacy risk and clearer provenance.

**Evidence:** The focused unit tests prove the artifact excludes raw payload values, carries feature and prompt-version summaries, includes evidence limits, and is served through the admin-only route with non-cache headers.

**Evidence limits:** This branch does not run provider judges, submit or process eval batches, create daily reports, ingest private fixtures, change prompts, change DB schema, expose user UI, or resolve cuisine fallback behavior.

## Validation

Completed before PR creation:

- `npm ci` passed; installed dependencies and reported `found 0 vulnerabilities`.
- `npx vitest run tests/unit/evaluator.test.ts tests/unit/admin-cache-headers.test.ts` passed: 2 files / 9 tests.
- Initial `npm run eval:fixtures` failed because the local sandbox blocked `tsx` from opening its IPC pipe under `/var/folders/.../T/tsx-501/*.pipe` (`listen EPERM`). The same command passed after narrow sandbox escalation: 10 public fixtures validated.
- `npm run test:unit` passed: 45 files / 333 tests.
- `npm run check` passed: TypeScript plus UI lint.
- `npm audit --audit-level=high` passed: `found 0 vulnerabilities`.
- `npm run build` passed with existing Browserslist/Firebase dynamic-import/chunk-size warnings.
- `git diff --check origin/main...HEAD` passed.

Pending after PR opens:

- GitHub exact-head required checks.

## Replit Validation

Risk lane: automation-primary.

Human Replit validation is not required before merge for this slice because it is admin/reporting plumbing over already-stored eval summary rows, with focused unit coverage and no provider, prompt, schema, auth contract, deployment, user-facing UI, private fixture, or live runtime generation behavior change.

## Resume Point

Finish validation, open the PR, apply `codex` and `codex-automation` labels, and update this handoff plus the PR body with exact final-head evidence. After this branch is reviewed/merged, the next INIT-004 Phase 3 candidates remain narrow LLM-judge work after labels/checks, non-duplicative fixtures for accepted label gaps, or additional small reporting increments that still avoid live providers and prompt changes.
