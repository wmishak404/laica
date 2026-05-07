# INIT-002 Phase 0 — AI error telemetry docs filed

**Agent:** claude
**Branch:** `claude/elated-poincare-269ddc`
**Date:** 2026-05-07
**Initiative:** INIT-002
**INIT updated:** yes (created)

## Summary

Wilson asked for thoughts on how to implement EPIC-019 (AI error telemetry and eval monitoring). The work is phased and crosses multiple PRs and validation passes, so it was filed as INIT-002 with the durable redaction policy locked in PD-010 before any code writes a row. This handoff covers Phase 0 (docs only). Phase 1 (code) is gated on EPIC-018 merging.

The driving constraint from EPIC-019: persistent failure logging must be allowlist-first and must never store raw prompts, preferences, headers, tokens, images, audio, or stack traces with bodies. Rather than relying on call-site discipline, PD-010 enforces the allowlist at the writer boundary via TypeScript — the writer's argument shape exactly matches the column allowlist, so adding a new field requires a deliberate PD-010 update.

## Changes

**Created:**
- `epics/019-ai-error-telemetry-and-eval-monitoring.md` — the implementation epic. Mirrors the structure Wilson pasted with INIT-002 / PD-010 cross-references, working answers to the open questions, and a 2026-05-07 promotion note.
- `initiatives/INIT-002-ai-error-telemetry.md` — INIT hub mirroring INIT-001 structure. Documents Phase 0 in progress, Phase 1 blocked on EPIC-018, and the resume point.
- `product-decisions/010-ai-error-telemetry-allowlist.md` — durable redaction policy. Allowlist (with rationale per field), explicit denylist, retention (90 days, matching mobile-refresh AI privacy), `auth_user_id` deletion behavior (FK with `ON DELETE SET NULL`), cluster→action triage table, alternatives considered, and consequences.

**Modified:**
- `initiatives/registry.md` — added INIT-002 row.
- `initiatives/README.md` — added INIT-002 to Current Initiatives.
- `epics/README.md` — added EPIC-019 to active read list.
- `epics/registry.md` — added EPIC-019 row.
- `CLAUDE.md` — added INIT-002 reference to Current active INITs and EPIC-019 to active epics list.
- `AGENTS.md` — same updates as CLAUDE.md.

No source code changed in this handoff.

## Impact on other agents

**For Codex (or any agent picking up Phase 1):**
- Phase 1 cannot start until [EPIC-018](../../epics/018-authenticated-ai-error-handling.md) merges. EPIC-018 owns the typed-error route helper and the `classifyAiError` function; INIT-002 Phase 1 imports both. Starting earlier would put two epics in a merge fight over the same nine AI route catch blocks.
- The classifier was originally placed in INIT-002 Phase 0 in the planning doc but moved to Phase 1 to resolve the ownership ambiguity. EPIC-018 either ships it directly or INIT-002 Phase 1 builds it after EPIC-018 merges — either way, INIT-002 consumes a stable classifier rather than competing to define one.
- The PD-010 allowlist is normative for any future telemetry caller. Adding a new field requires a PD-010 amendment, not a silent schema change.
- The fire-and-forget writer pattern in `server/openai.ts` `logInteraction` is the closest existing precedent. Phase 3 mirrors its async-detached shape with added bounded-queue + circuit-breaker safety to handle 5xx storms (the Plan-agent critique flagged connection-pool starvation as the top under-weighted risk).
- `server/ai-privacy.ts` already has `redactForAiLog`, `stripPromptMarkers`, and `sanitizePromptInput`. Reuse these as defense-in-depth on any string field; do not reinvent.

**For Wilson:**
- Phase 0 docs are auto-pushable per CLAUDE.md planning-doc rules, but a PR makes them reviewable before the policy is treated as authoritative.
- The full implementation plan lives in `/Users/wilsonishak-macbookpro/.claude/plans/please-review-epic-019-and-nifty-pony.md` (local plan file, not in the repo).

## Open items

- **Phase 0 PR not yet open.** Next step is `git push -u origin claude/elated-poincare-269ddc` and `gh pr create`. The PR should be docs-only and small enough for a quick review.
- **Phase 1 gate:** EPIC-018 has not merged. INIT-002 Phase 1 stays in `Blocked on EPIC-018` until EPIC-018 is on `main`.
- **Classifier ownership:** PD-010 says EPIC-018 owns the classifier; this needs confirmation against EPIC-018's actual implementation when it lands. If EPIC-018 ships without a classifier, INIT-002 Phase 1 builds it from scratch.
- **Retention job (90 days):** documented as deferred operational debt in PD-010. Must land before the table sees high traffic.
- **Replit observation week (Phase 2):** plain documentation pass, not a code phase. Will add a PD-010 appendix capturing classifier gaps and field nullability once Phase 1 is on Replit for a week.

## Verification

Phase 0 is docs-only — no runtime verification. Reviewers should confirm:

- PD-010 allowlist matches the schema in INIT-002 Phase 3 description (no field on one side missing from the other).
- EPIC-019 cross-links to INIT-002 and PD-010 work.
- INIT-002 cross-links to EPIC-019, EPIC-018, EPIC-010, and the mobile-refresh AI privacy doc work.
- `epics/README.md`, `epics/registry.md`, `initiatives/README.md`, `initiatives/registry.md`, `CLAUDE.md`, and `AGENTS.md` all list INIT-002 / EPIC-019 in their active sections.
- No file under `client/`, `server/`, `shared/`, or `tests/` was modified.

After merge, the next implementation step depends on EPIC-018's status. If EPIC-018 is merged when the next agent picks this up, start INIT-002 Phase 1 from a fresh branch off `main`. If not, wait.

## 2026-05-07 — Follow-up: aligned to PR #40

Wilson asked to rebase from [PR #40](https://github.com/wmishak404/laica/pull/40) (Replit Validation Focus Guide). The branch was already on top of `bc242a0` from the original push, so no `git rebase` was needed. Folded the new guide into INIT-002:

- Added [`docs/workflows/replit-validation-focus.md`](../workflows/replit-validation-focus.md) to Source Docs.
- Rewrote the Validation State table so each phase's Replit step picks specific focus rows from the guide's matrix (DB schema row for Phase 3, AI provider + ElevenLabs + Secrets rows for Phase 1, etc.) and uses the guide's "Replit validation request" template in PR descriptions/handoffs.

Net effect: future Phase 1/3/4 PRs can cite specific matrix rows for Replit validation instead of re-running the full gate, which matches the targeted-validation intent of PR #40.
