# INIT-002 Phase 0 — AI error telemetry docs filed

**Agent:** claude
**Branch:** `claude/elated-poincare-269ddc`
**Date:** 2026-05-07
**Initiative:** INIT-002
**INIT updated:** yes (created)

## Summary

Wilson asked for thoughts on how to implement EFFORT-019 (AI error telemetry and eval monitoring). The work is phased and crosses multiple PRs and validation passes, so it was filed as INIT-002 with the durable redaction policy locked in PD-010 before any code writes a row. This handoff covers Phase 0 (docs only). Phase 1 (code) is gated on EFFORT-018 merging.

The driving constraint from EFFORT-019: persistent failure logging must be allowlist-first and must never store raw prompts, preferences, headers, tokens, images, audio, or stack traces with bodies. Rather than relying on call-site discipline, PD-010 enforces the allowlist at the writer boundary via TypeScript — the writer's argument shape exactly matches the column allowlist, so adding a new field requires a deliberate PD-010 update.

## Changes

**Created:**
- `efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md` — the implementation epic. Mirrors the structure Wilson pasted with INIT-002 / PD-010 cross-references, working answers to the open questions, and a 2026-05-07 promotion note.
- `initiatives/INIT-002-ai-error-telemetry.md` — INIT hub mirroring INIT-001 structure. Documents Phase 0 in progress, Phase 1 blocked on EFFORT-018, and the resume point.
- `product-decisions/010-ai-error-telemetry-allowlist.md` — durable redaction policy. Allowlist (with rationale per field), explicit denylist, retention (90 days, matching mobile-refresh AI privacy), `auth_user_id` deletion behavior (FK with `ON DELETE SET NULL`), cluster→action triage table, alternatives considered, and consequences.

**Modified:**
- `initiatives/registry.md` — added INIT-002 row.
- `initiatives/README.md` — added INIT-002 to Current Initiatives.
- `efforts/README.md` — added EFFORT-019 to active read list.
- `efforts/registry.md` — added EFFORT-019 row.
- `CLAUDE.md` — added INIT-002 reference to Current active INITs and EFFORT-019 to the active Efforts list at the time.
- `AGENTS.md` — same updates as CLAUDE.md.

No source code changed in this handoff.

## Impact on other agents

**For Codex (or any agent picking up Phase 1):**
- Phase 1 cannot start until [EFFORT-018](../../efforts/effort-018-authenticated-ai-error-handling.md) merges. EFFORT-018 owns the typed-error route helper and the `classifyAiError` function; INIT-002 Phase 1 imports both. Starting earlier would put two Efforts in a merge fight over the same nine AI route catch blocks.
- The classifier was originally placed in INIT-002 Phase 0 in the planning doc but moved to Phase 1 to resolve the ownership ambiguity. EFFORT-018 either ships it directly or INIT-002 Phase 1 builds it after EFFORT-018 merges — either way, INIT-002 consumes a stable classifier rather than competing to define one.
- The PD-010 allowlist is normative for any future telemetry caller. Adding a new field requires a PD-010 amendment, not a silent schema change.
- The fire-and-forget writer pattern in `server/openai.ts` `logInteraction` is the closest existing precedent. Phase 3 mirrors its async-detached shape with added bounded-queue + circuit-breaker safety to handle 5xx storms (the Plan-agent critique flagged connection-pool starvation as the top under-weighted risk).
- `server/ai-privacy.ts` already has `redactForAiLog`, `stripPromptMarkers`, and `sanitizePromptInput`. Reuse these as defense-in-depth on any string field; do not reinvent.

**For Wilson:**
- Phase 0 docs are auto-pushable per CLAUDE.md planning-doc rules, but a PR makes them reviewable before the policy is treated as authoritative.
- The full implementation plan lives in `/Users/wilsonishak-macbookpro/.claude/plans/please-review-epic-019-and-nifty-pony.md` (local plan file, not in the repo).

## Open items

- **Phase 0 PR not yet open.** Next step is `git push -u origin claude/elated-poincare-269ddc` and `gh pr create`. The PR should be docs-only and small enough for a quick review.
- **Phase 1 gate:** EFFORT-018 has not merged. INIT-002 Phase 1 stays in `Blocked on EFFORT-018` until EFFORT-018 is on `main`.
- **Classifier ownership:** PD-010 says EFFORT-018 owns the classifier; this needs confirmation against EFFORT-018's actual implementation when it lands. If EFFORT-018 ships without a classifier, INIT-002 Phase 1 builds it from scratch.
- **Retention job (90 days):** documented as deferred operational debt in PD-010. Must land before the table sees high traffic.
- **Replit observation week (Phase 2):** plain documentation pass, not a code phase. Will add a PD-010 appendix capturing classifier gaps and field nullability once Phase 1 is on Replit for a week.

## Verification

Phase 0 is docs-only — no runtime verification. Reviewers should confirm:

- PD-010 allowlist matches the schema in INIT-002 Phase 3 description (no field on one side missing from the other).
- EFFORT-019 cross-links to INIT-002 and PD-010 work.
- INIT-002 cross-links to EFFORT-019, EFFORT-018, EFFORT-010, and the mobile-refresh AI privacy doc work.
- `efforts/README.md`, `efforts/registry.md`, `initiatives/README.md`, `initiatives/registry.md`, `CLAUDE.md`, and `AGENTS.md` all list INIT-002 / EFFORT-019 in their active sections.
- No file under `client/`, `server/`, `shared/`, or `tests/` was modified.

After merge, the next implementation step depends on EFFORT-018's status. If EFFORT-018 is merged when the next agent picks this up, start INIT-002 Phase 1 from a fresh branch off `main`. If not, wait.

## 2026-05-07 — Follow-up: aligned to PR #40

Wilson asked to rebase from [PR #40](https://github.com/wmishak404/laica/pull/40) (Replit Validation Focus Guide). The branch was already on top of `bc242a0` from the original push, so no `git rebase` was needed. Folded the new guide into INIT-002:

- Added [`docs/workflows/replit-validation-focus.md`](../workflows/replit-validation-focus.md) to Source Docs.
- Rewrote the Validation State table so each phase's Replit step picks specific focus rows from the guide's matrix (DB schema row for Phase 3, AI provider + ElevenLabs + Secrets rows for Phase 1, etc.) and uses the guide's "Replit validation request" template in PR descriptions/handoffs.

Net effect: future Phase 1/3/4 PRs can cite specific matrix rows for Replit validation instead of re-running the full gate, which matches the targeted-validation intent of PR #40.

## 2026-05-07 — Follow-up: rebased onto PR #44, EFFORT-018 unblocks Phase 1

Wilson asked to rebase from [PR #44](https://github.com/wmishak404/laica/pull/44) (EFFORT-018 closeout). PR #43 ("Fix authenticated AI error handling") had merged in between, shipping the actual EFFORT-018 implementation, and PR #44 then closed out the epic and registered an EFFORT-019 stub at the canonical filename `efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md`.

**Rebase work:**
- Rebased branch onto `24decb2` (PR #44 merge commit).
- Resolved conflicts in `efforts/README.md` and `efforts/registry.md` by keeping main's EFFORT-018 → `Resolved` transition and replacing main's EFFORT-019 stub-registry entry with the INIT-002 / PD-010 cross-referenced version.
- Renamed the EFFORT-019 epic file from `efforts/effort-019-ai-error-telemetry.md` (my original) to `efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md` (canonical, to match the stub PR #44 created). Replaced the stub content with the INIT-002 / PD-010 cross-referenced version.
- Updated all cross-references in CLAUDE.md, AGENTS.md, INIT-002, PD-010, and this handoff to use the canonical filename.

**Phase 1 unblock and ownership clarification:**
- Flipped INIT-002 Phase 1 from `Blocked on EFFORT-018` to `Unblocked, planned`.
- Reviewed PR #43's actual diff: EFFORT-018 ships a **client-side** classifier in [`client/src/lib/rateLimitHandler.ts`](../../client/src/lib/rateLimitHandler.ts) and [`client/src/lib/queryClient.ts`](../../client/src/lib/queryClient.ts) (using `ApiRequestError`), plus **typed server-side error payloads** in [`server/routes.ts`](../../server/routes.ts) and rate-limit classification in [`server/rate-limit.ts`](../../server/rate-limit.ts). It does **not** ship a server-side classifier function.
- INIT-002 Phase 1 now owns building a server-side `classifyAiError` mirroring EFFORT-018's wider taxonomy (400/401/403/404/413/429/5xx/network) so the user-facing copy and telemetry stay aligned. Documented in INIT-002 Current Status, Source Docs, Phase Progress, Epics and Governance, and Changes Added After Initial Plan.
- Updated PD-010's `error_class` row to flag that the v0 enum may need to expand in Phase 1 to cover EFFORT-018's wider HTTP taxonomy, with the rule that any expansion lands in EFFORT-018's surface first and PD-010 amendment follows.

Net effect: the next agent picking up Phase 1 reads EFFORT-018's client-side classifier and server typed payloads as the taxonomy source, then builds a new `server/aiErrorClassifier.ts` that mirrors it. No more "blocked on EFFORT-018" gate.
