# Live Cooking warm surface polish

**Agent:** codex  
**Branch:** `codex/init-001-live-cooking-warm-polish`  
**Date:** 2026-07-07  
**Initiative:** INIT-001  
**INIT updated:** yes  
**Resolves blocked handoff:** none

## Summary

This branch continues INIT-001 Phase 4 from the merged PR #260 cockpit baseline and addresses Wilson's explicit visual finding that the active cooking white background was functional, not final. Ready Check, preparing/recovery, the sticky active step, step-preview rail, cue cards, caption box, and bottom command bar now share a scoped warm `live-cooking-ui` focus-mode surface that visually relates to the setup/planning coral/rust language while preserving the compact hands-busy cockpit. A follow-up prompt tightening in the same PR captures Wilson's Replit step-preview findings for plural labels (`Prep Leeks`, not `Prep Leek`) and final garnish/serve labels (`Garnish` / `Garnish & Serve`, not stale `Cook Vegetables`).

The slice is mostly visual with a narrow cooking-step prompt refinement. It preserves PR #191 speech arbitration, PR #236 recovery/Finish honesty, PR #256 invalid-step validation, PR #258 Ready Check gating, and PR #260 compact cockpit/action-label behavior. It does not change route contracts, provider response schema, durable cooking-session schema, Finish/History semantics, assistance failure handling, durable navigation, formal INIT-004 eval work, full timer redesign, or Phase 5 cleanup.

## Changes

- `client/src/index.css`
  - Adds scoped `live-cooking-ui` cooking tokens for cream, coral, rust, teal, herb, butter, ink, and card edges.
  - Adds semantic warm-surface classes for loading/recovery cards, Ready Check rows, sticky step card, preview cards, timer pill, cue cards, caption box, and command bar.
  - Scopes selectors as `.live-cooking-ui .live-cooking-*` so rendered styles beat shadcn `Card` default `bg-card` / `border` utilities.
- `client/src/components/cooking/live-cooking.tsx`
  - Applies the warm scoped classes to Ready Check, loading/recovery, active cockpit, step preview states, cue cards, captions, and bottom command bar.
  - Keeps the existing control layout and behavior intact.
- `tests/unit/live-cooking-guest-session.test.tsx`
  - Extends the focused cockpit regression to assert the warm root/screen, step card, guidance panel, preview card, and command bar classes.
- `tests/unit/cooking-steps-prompt.test.ts`
  - Adds prompt-composition coverage proving the cooking-step prompt now asks for plural ingredient agreement and final garnish/serve labels instead of stale generic labels.
- `server/openai.ts`
  - Tightens the Live Cooking step-preview prompt for `actionLabel` grammar: preserve plural ingredient wording and use garnish/serve labels for final off-heat finishing steps.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Records the warm-surface branch, the prompt-tightening follow-up, guardrails, evidence, and remaining negative scope.
- `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md`
  - Record this branch as the active Phase 4 visual follow-up and update the resume point.

## Impact on other agents

Treat PR #260 as the behavior baseline and this branch as the warm visual layer plus a narrow provider-prompt tightening on top. 2026-07-13 superseded-context note: this handoff predates PR #269 and PR #275. Current timer baseline keeps timers explicit-start and visible together but removed minimize/collapse after Wilson found it displaced pause/reset; current assistance-failure baseline is PR #275's separate voice-help status for narrow Ask-a-question technical failures. INIT-004 step-preview eval work remains separate; align its fixtures with the new prompt expectations, but do not fold eval fixtures or judge calibration into this runtime branch unless Wilson explicitly redirects.

PD-005 / `design_guidelines.md` interaction: conforms. The branch uses tokenized CSS variables and a wrapper-specificity guardrail rather than raw hex or unscoped primitive overrides. No durable navigation changes were made.

Blocked handoff scan found only unrelated blockers:

- `docs/handoffs/2026-06-05-codex-eff-017-oauth-preflight-blocked.md`
- `docs/handoffs/2026-06-21-codex-prod-vision-scan-investigation-blocked.md`

## Verification

Value claim: cooks get the same compact hands-busy Live Cooking cockpit from PR #260, but it no longer drops into a stark white surface after the warmer setup/planning flow. The current action, previews, cues, captions, and bottom controls remain reachable in the tested mobile viewport.

Evidence:

- `npm ci` passed and reported 0 vulnerabilities.
- Initial `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` failed before app code because this fresh worktree lacked `node_modules`; rerun after `npm ci` passed.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 1 file, 31 tests.
- `npx vitest run tests/unit/cooking-steps-prompt.test.ts tests/unit/live-cooking-guest-session.test.tsx` passed after prompt tightening: 2 files, 32 tests.
- `npm run check` passed: TypeScript plus UI lint.
- `npm run build` passed. Existing warnings remained: stale Browserslist data, Firebase dynamic/static import chunk warning, and large bundle warning.
- Local dev server boot via `PORT=3000 npm run env:run -- npm run dev` required sandbox escalation because `tsx` IPC hit `EPERM` inside the sandbox. The approved rerun served on port 3000.
- Provider-light mobile Playwright visual/computed-style smoke passed at `390x844` after stubbing `/api/auth/session`, `/api/recipes/pantry`, `/api/cooking/steps`, `/api/cooking/assistance`, and speech/image routes.
- Screenshots:
  - `/tmp/laica-live-cooking-ready-warm-polish-clean.png`
  - `/tmp/laica-live-cooking-active-warm-polish-clean.png`
- Computed-style evidence from the visual smoke:
  - root background: `linear-gradient(rgb(255, 249, 240), rgb(252, 239, 222))`
  - step-card background: warm white/cream gradient
  - active preview: coral background and border
  - command bar visible
  - font family: `Nunito, "Source Sans Pro", system-ui, sans-serif`
  - active page viewport `390x844`, `scrollHeight: 844`

Evidence limits:

- The Playwright smoke stubbed `/api/auth/session` because the decrypted local DB still lacks the `anonymous_recipe_usage` table and returns 500 during guest auth. This is the known local DB drift / EFF-017 lane, not a branch behavior change.
- Provider routes, speech synthesis, and microphone access were stubbed; the smoke does not prove live AI/audio quality.
- Human Replit validation is deferred to release/batch validation unless Wilson asks for PR-level mobile visual acceptance.
- The prompt-composition test proves prompt text only; it does not prove provider output quality. The separate INIT-004 eval lane should add fixtures for the plural-label and final-garnish failure modes.
- GitHub exact-head `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL need to rerun after the prompt-tightening commit is pushed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `3d33239ef34d58dbe9251561f2fbd80cb893f037`
- Last Replit-validated at: not yet validated
- Human Replit validation: deferred to release/batch validation
- Notes: Started after PR #260 merged as `72df557` and PR #262 closeout merged as `3d33239`; no lower stacked branch remains unmerged for this slice.
