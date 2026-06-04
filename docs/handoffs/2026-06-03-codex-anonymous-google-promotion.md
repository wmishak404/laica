# Anonymous Google promotion implementation

**Agent:** codex
**Branch:** `codex/anonymous-google-promotion`
**Date:** 2026-06-03
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

This branch implements the first Phase 4 account-promotion slice for INIT-003: guests are framed as using browser-local progress, not as holding an anonymous account, with sign-up/save-progress CTAs for preservation and a separate start-over escape hatch. Google conversion preserves the same-browser Pantry, Kitchen, and Cooking Profile setup when the user converts, asks before switching into a Google sign-in and importing browser setup, and deliberately leaves completed anonymous cooks out of durable History in this phase.

## Changes

- `client/src/pages/app.tsx` adds the guest sign-up/save-progress CTA, separate guest Start over action, Google link flow, neutral Google-import confirmation dialog, popup-cancel handling, guest-to-linked profile import for Pantry/Kitchen/Cooking Profile/favorite chefs, and a session-backed inline post-link confirmation in the planning header that clears when the user moves to the next page/flow.
- `client/src/lib/firebase.ts` adds Firebase helpers for linking an anonymous user with Google, extracting the existing-account Google credential from Firebase errors, and signing in with that credential after consent.
- `client/src/components/cooking/user-settings.tsx`, `client/src/components/cooking/live-cooking.tsx`, `client/src/lib/rateLimitHandler.ts`, and `server/routes.ts` update guest-facing copy away from anonymous-account framing while keeping Settings copy concise and avoiding repeated "this browser" reminders.
- `tests/setup.ts` extends the Firebase auth mock for link/sign-in credential flows.
- `tests/unit/planning-choice.test.tsx`, `tests/unit/user-settings-scan-policy.test.tsx`, `tests/unit/live-cooking-guest-session.test.tsx`, `tests/unit/anonymous-production-gates-route.test.ts`, and `tests/unit/ai-error-handling.test.tsx` cover the new copy, direct guest promotion/import path, session-backed inline post-link confirmation, credential-in-use consent path, popup-cancel path, and no-silent-overwrite merge helper.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md` now points the current Phase 4 resume state at this branch and records the active implementation scope.
- `efforts/effort-024-guest-privacy-trust-messaging.md` records the first restrained browser-local copy pass and Wilson's Replit copy feedback without resolving the Effort.

## Impact on other agents

Keep the mental model stable: a guest is not a durable account, and the first conversion promise is "you do not lose the pantry/kitchen/profile work you already did." Do not add background retro-import of completed anonymous cooks into durable History in this slice. If Phase 5 later wants guest cook promotion, it should be explicit, user-consented, and designed around History/cleanup/taste semantics.

Existing Google accounts are consent-gated. The current merge policy fills blank durable profile fields and unions list data; it does not silently overwrite existing linked pantry, kitchen, dietary restrictions, favorite chefs, or cooking skill.

Firebase Auth state is separate from the Laica `auth_users` table. If a Replit reset deletes Postgres rows but leaves Firebase Authentication users in place, Firebase can still return `auth/credential-already-in-use`; the UI should not expose that distinction and now asks neutrally whether to save the setup to Google.

Wilson's Replit validation accepted the current product shape at runtime head `e2231be`: new Google sign-up and existing Google credential/import flows both looked good, Settings copy worked after removing repeated "this browser" language, and the neutral Google-import dialog was friendly enough for a brand-new-feeling account path.

## Open items

- Replit validation should continue from the latest pushed commit. Wilson confirmed guest mental-model surfaces, same-browser setup persistence, new-account promotion, existing-credential import consent, linked profile writes, and the accepted wording at runtime head `e2231be`; remaining checks are the session-backed inline confirmation linger, guest History non-import, quota `#11` copy, popup-cancel tactile feel if not already rechecked, and a final branch-head refresh after subsequent commits.
- Browser smoke was not completed locally. The dev server reported `serving on port 3000`, but localhost refused connections, and the Playwright attempt was blocked by the local sandbox when its configured web server tried to create a `tsx` IPC pipe. Treat local browser evidence as unavailable for this branch.
- Durable History import for completed anonymous cooks remains explicitly deferred.
- Email/password account creation remains out of scope; this branch keeps Google as the durable account path.

## Verification

- `npx vitest run tests/unit/planning-choice.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/live-cooking-guest-session.test.tsx tests/unit/firebase-auth-client.test.tsx tests/unit/anonymous-production-gates-route.test.ts tests/unit/ai-error-handling.test.tsx` — passed, 6 files / 55 tests.
- `npm run check` — passed.
- `npm run build` — passed. Existing warnings remained: stale Browserslist data, Firebase static/dynamic import chunk warning, and an oversized client chunk.
- `git diff --check` — passed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `ab6cc77378ddc8e35b50a7423c8266773b772862`
- Last Replit-validated at: `e2231be7bdcfe672d176d838f15ae04a5dd961ad` for the account-promotion runtime paths described above
- Notes: branch was rebased onto current `origin/main` after PR #123/#124 landed. The earlier conversion-history docs decision is included in the stack as the lower commit on this branch. This handoff/docs update lands after the runtime validation SHA, so refresh Replit on the latest branch head before merge.
