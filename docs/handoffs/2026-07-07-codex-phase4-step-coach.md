# Phase 4 Live Cooking Cockpit

**Agent:** codex
**Branch:** codex/init-001-phase4-step-coach
**Date:** 2026-07-07
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This branch advances INIT-001 Phase 4 from the merged Ready Check baseline into the first active cooking refresh. Live Cooking keeps the existing speech, recovery, invalid-step, and Ready Check generation behavior, but Wilson's 2026-07-07 UX review revised the story from a named feed into a compact hands-busy cooking cockpit: Ready Check uses one `Start cooking` action, the current instruction is the sticky action headline, step progress shows action-forward dot-node previews, routine `minor` badges are removed, cues stay compact, captions are opt-in behind a CC toggle, Repeat/Ask a question/mute are taller bottom controls, and the guide requests a screen wake lock when supported.

Wilson's Replit QA pass then added two refinements: the plain white Live Cooking background is functional but not final visual design, and paragraph-like provider instructions are not acceptable as the mobile step headline. Follow-up QA clarified the step-preview bar needs its own quality bar: labels should usually be 2-4 words, stretch to 5 only when meaning requires it, avoid measurements, fit the small card, avoid repeats, and read as plain English quick-recall cards for someone cooking. This branch now includes a narrow prompt/client refinement for atomic cookable steps and optional `actionLabel` values, plus fallback rendering that separates remaining multi-sentence instructions into detail lines under a short action headline.

The slice remains narrow. It does not change route contracts, durable session schema, assistance failure handling, durable navigation, Finish/History semantics, or Phase 5 cleanup state. It only makes the existing timer presentation more compact/optional, adds best-effort browser wake-lock handling during active cooking, and adjusts cooking-step generation/display toward glanceable actions.

Formal step-preview/action-label eval work is intentionally deferred to a separate INIT-004 lane for auditability. This branch adds a coordination brief at `docs/handoffs/2026-07-07-codex-live-cooking-step-preview-eval-brief.md`; it does not add eval fixtures, eval criteria, or a new eval surface.

## Changes

- `client/src/components/cooking/live-cooking.tsx`
  - Replaces the old dark centered active-cooking layout with a tokenized focus-mode surface.
  - Collapses Ready Check to one `Start cooking` action while still passing acknowledged missing/skipped ingredients into generation.
  - Pins the current action in a sticky top panel with `Step X of N` and a horizontal action-forward dot-node step preview strip.
  - Accepts optional provider `actionLabel` values for the current-step headline and rail; older/saved steps derive labels locally.
  - Normalizes known bad provider labels from Wilson QA (`Bring 4 Cups`, `Push Vegetables Side`, `Add Cold Cooked`, `Heat Oil Butter`) and derives clearer rice/fried-rice milestones such as `Add Cold Rice`, `Season Fried Rice`, and `Serve Fried Rice`.
  - Rejects provider labels that are too long, measurement-driven, or duplicated where a derived label can better distinguish the step.
  - Splits paragraph-like multi-sentence instructions into numbered detail lines beneath the short action headline.
  - Removes routine `minor` status chips from the current-step panel.
  - Keeps `Look for`, `Pro tip`, and `Avoid` guidance compact beneath the current step without naming it as a separate feed.
  - Makes transcript text opt-in via a compact CC toggle; a hidden transcript node remains for accessibility/test fidelity while the visual transcript is off.
  - Moves Repeat, Ask a question, and audio mute into a taller sticky bottom command bar with Ask a question centered.
  - Requests a best-effort screen wake lock while the live guide is active and releases it on page hide/exit.
  - Brings the preparing-guide and step-recovery panels onto the same tokenized surface while preserving Retry/basic-backup/Back behavior.
- `tests/unit/live-cooking-guest-session.test.tsx`
  - Adds deterministic coverage that the cockpit renders the sticky current-step panel, compact cue guidance, step preview strip, opt-in captions, action-label headline/detail rendering, known bad label normalization, fried-rice label derivation, and existing Live Cooking guest/session/recovery baselines after Ready Check.
- `tests/e2e/cooking-workflow.test.ts`
  - Extends the guest cooking smoke to expect the step-guidance panel, step preview strip, hidden-by-default captions, and bottom `Ask a question` control after Live Cooking starts.
- `server/openai.ts`
  - Adds the atomic Live Cooking step rule to the cooking-step prompt path and asks for short, non-repeated, plain-English `actionLabel` values such as `Boil Water`, `Prep Leek`, `Cook Leek & Spinach`, `Push Vegetables Aside`, and `Add Cold Rice`.
- `server/ai-response-schemas.ts`, `client/src/lib/openai.ts`, `client/src/hooks/useCookingSession.ts`
  - Records `actionLabel` as an optional passthrough field without requiring a schema migration or changing route shape.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Records Wilson's 2026-07-07 UX correction, the revised cockpit acceptance criteria, source baselines, negative scope, and validation expectations.
- `initiatives/INIT-001-mobile-refresh.md`
  - Updates Phase 4 status, branch table, and current resume point for the compact cockpit branch.
- `initiatives/registry.md`
  - Updates the INIT-001 index summary to point to the current Phase 4 visual slice.
- `client/src/index.css`
  - Adds a `live-cooking-ui` font hook so Live Cooking inherits the Nunito tone used by earlier Laica setup/planning surfaces.
- `docs/handoffs/2026-07-07-codex-live-cooking-step-preview-eval-brief.md`
  - Captures the separate INIT-004 eval follow-up so the step-preview quality examples do not get mixed into recipe-generation or broad cooking-instruction evals.

## Impact on other agents

Treat PR #191 speech arbitration, PR #236 recovery/Finish, PR #256 invalid-step validation, PR #258 Ready Check generation gating, and this branch's compact Live Cooking cockpit/atomic-step rule as the intended Phase 4 baseline if this PR merges. Full timer redesign and warm active-cooking background polish should follow after this slice unless Wilson reprioritizes.

For eval work, do not add the formal step-preview/action-label corpus inside this PR. A parallel INIT-004 agent should start from the separate eval brief, likely create a distinct `live_cooking_step_previews` or `cooking_step_previews` surface/fixture family, and coordinate findings back to this Phase 4 thread or successor handoff.

The implementation conforms to PD-005 and `design_guidelines.md` for focus-mode cooking: tokenized colors, shadcn Button variants instead of custom button color overrides, large readable step text, visible Back, and no durable navigation changes. Wilson explicitly noted the current plain white background does not yet match the warmer coral/rust character of other Laica surfaces; that is documented future visual polish, not final acceptance.

Blocked handoff scan found only unrelated blockers:

- `docs/handoffs/2026-06-05-codex-eff-017-oauth-preflight-blocked.md`
- `docs/handoffs/2026-06-21-codex-prod-vision-scan-investigation-blocked.md`

## Open items

- Exact-head GitHub CI/E2E/security checks are required after the branch is pushed.
- Local Playwright E2E was not run because this worktree lacks `.env.keys` and a configured `LAICA_LOCAL_SANDBOX_DATABASE_URL`; use the GitHub `e2e_guest_smoke` lane for merge-gate E2E evidence.
- Human Replit validation is deferred to the next production/release batch unless Wilson asks for PR-level mobile visual validation. The batch should smoke Ready Check single `Start cooking` -> generated atomic steps -> sticky action headline and detail lines -> action-forward step-preview rail -> compact cues -> CC caption toggle -> bottom Repeat/Ask a question/mute controls -> optional timer -> Back/Finish cleanup.

## Verification

Value claim: cooks get a calmer, more glanceable mobile guide that fits the hands-busy moment: the Ready Check start does not imply product trouble, the current action stays primary, wordy provider output is broken into readable detail lines, the route through the recipe is visible with useful action labels, captions do not crowd the default view, core voice/audio controls stay at thumb reach, and the phone is less likely to sleep mid-step.

Evidence:

- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx tests/unit/provider-boundary-happy-paths.test.ts tests/unit/eval-fixtures.test.ts` passed: 3 files, 53 tests. This covers the revised compact cockpit assertion, the `Boil Water` action-forward preview case, `Push Vegetables Aside`, `Add Cold Rice`, `Season Fried Rice`, known bad provider-label normalization, the `Cook Leek & Spinach` action-label/detail-line and no-label fallback cases, existing Live Cooking guest/session/recovery/speech baselines, cooking-step route boundary passthrough with optional `actionLabel` data, and the unchanged eval fixture foundation after deferring formal step-preview eval work.
- `npm run test:unit` passed: 45 files, 346 tests.
- `npm run check` passed: TypeScript and UI lint.
- `npm run build` passed. Existing warnings remained: stale Browserslist data, Firebase dynamic/static import chunk warning, and large bundle warning.
- `git diff --check` passed on the final working-tree diff.

Evidence limits:

- Unit tests mock providers and do not prove real ElevenLabs/browser audio output.
- Local build does not prove mobile visual ergonomics on an actual phone.
- Formal step-preview/action-label eval fixtures are deferred to the separate INIT-004 lane documented in `docs/handoffs/2026-07-07-codex-live-cooking-step-preview-eval-brief.md`.
- `npm run eval:fixtures` is not claimed as evidence for this PR; a local attempt hit `tsx` IPC sandbox `EPERM`, and the PR no longer changes eval fixtures or eval criteria.
- Local Playwright E2E has not been re-run after the UX revision in this worktree because the required local secrets/sandbox database are absent; rely on GitHub exact-head `e2e_guest_smoke` unless a local/release validation lane is explicitly set up.
- GitHub exact-head `unit`, `e2e_guest_smoke`, security checks, and any PR review findings must be refreshed after the revised branch is pushed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `263eec5fc14e0923807e2a040d46125846fd1152`
- Last Replit-validated at: not yet validated
- Notes: started from fresh `origin/main` after PR #258 merged as `496731c` and PR #259 closeout merged as `263eec5`. No lower stacked branch remains unmerged for this slice.
