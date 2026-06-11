# Profile setup draft restore

**Agent:** codex
**Branch:** codex/setup-tools-privacy-copy
**Date:** 2026-06-10
**Initiative:** INIT-003
**INIT updated:** no — this preserves the accepted same-browser guest setup direction without changing INIT phase status or product policy.

## Summary
The profile setup flow now survives React remounts and Replit Preview iframe refreshes while a user is adding Pantry or Tools entries. This does not prove Replit has a timeout hard-refresh; investigation found no setup-specific timeout or `window.location` reload rule. The confirmed gap was that in-progress setup state lived only inside `UserProfiling`, so any remount returned the user to `Yes, Chef!`. A Chrome smoke in Replit then showed Preview refresh recreates the iframe and loses `sessionStorage`, so the draft now uses scoped browser-local storage instead.

## Changes
- `client/src/components/cooking/user-profiling.tsx` adds a scoped browser-local setup draft for current step, Pantry/Tools lists, manual input text, and manual-entry open state.
- `client/src/components/cooking/user-profiling.tsx` clears the draft once setup finishes and intentionally does not persist camera/image data or scan controller state.
- `client/src/pages/app.tsx` passes the current guest/linked planning scope into `UserProfiling` and keys the setup component by that scope.
- `client/src/pages/app.tsx` explicitly clears the setup draft when a guest uses Start Over, before signing out.
- `tests/unit/user-profiling.test.tsx` adds a regression test that first failed on current code, then passed after the draft restore behavior was implemented.
- `tests/unit/planning-choice.test.tsx` adds a Start Over contract test that clears the in-progress setup draft for the current guest scope.
- `tests/e2e/cooking-workflow.test.ts` updates the guest setup helper to expect the new optional Tools intro and click `Skip tools`.

## Impact on other agents
- Treat setup reset reports carefully: this patch fixes the confirmed remount/refresh data-loss path, but it does not prove or disprove an external Replit preview reload source.
- Future setup state additions should decide explicitly whether they belong in the browser-local draft; do not store image payloads, camera permission state, or provider responses there.

## Open items
- Replit visual validation still needs one final pass after the browser-local draft change is pulled into Replit.
- If the preview still jumps back to the welcome screen after this patch, investigate Replit/Vite/HMR or auth-session transitions as the reload source rather than setup-local state loss.

## Verification
- `npx vitest run tests/unit/user-profiling.test.tsx -t "restores in-progress setup"` failed before the implementation by returning to `Yes, Chef!`.
- `npx vitest run tests/unit/user-profiling.test.tsx -t "restores in-progress setup"` passed after implementation.
- `npx vitest run tests/unit/planning-choice.test.tsx -t "clears the in-progress setup draft"` passed.
- `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/planning-choice.test.tsx` passed: 2 files / 36 tests.
- `npm run check` passed.
- `npm run build` passed with existing Vite warnings about Browserslist data, Firebase dynamic/static import chunking, and large chunk size.
- `git diff --check` passed.
- GitHub `e2e_guest_smoke` failed at `6ce49b3` because the E2E helper still expected the Tools scanner immediately after Pantry. The helper was updated to target the accepted optional Tools intro; PR #171 later refines that heading to `Any kitchen tools to add?`.
- Chrome/Replit smoke before the browser-local draft change: Pantry → Tools manual entry worked, but Preview refresh returned to `Yes, Chef!` because the iframe recreated storage. This is the evidence for switching setup draft storage from `sessionStorage` to scoped `localStorage`.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `2abccc7a88ac`
- Last Replit-validated at: not yet validated after this follow-up commit
- Notes: PR #170 remains open; this follow-up should be pulled into Replit before the next visual validation pass.
