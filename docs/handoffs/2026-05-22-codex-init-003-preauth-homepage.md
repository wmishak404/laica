# INIT-003 pre-auth homepage and guest-entry slice

**Agent:** Codex  
**Date:** 2026-05-22  
**Branch:** `codex/init-003-preauth-homepage`  
**Base SHA:** `3394057926b400364d7a221e73a1b5bbe4eaac0c` (`origin/main` at branch creation)  
**Initiative:** [INIT-003 — Anonymous Trial and Account Upgrade](../../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md)  
**INIT updated:** Yes  
**Last Replit-validated at:** not yet validated

## Summary

Implemented the Phase 3 public guest-entry slice for INIT-003: the pre-auth page now explains Laica before asking for Google identity, the public CTA is `Let's cook!`, and that CTA is wired to Firebase anonymous sign-in rather than a fake demo path. This is intentionally still a narrow client/session slice; production guest launch remains blocked on quota accounting, App Check, kill-switch/rate-limit hardening, and upgrade/save boundaries.

## Product / UX Changes

- Replaced the minimal signed-out landing screen with the A+C hybrid homepage direction:
  - hero: `Cook from what you already have.`
  - primary CTA: `Let's cook!`
  - secondary CTA: `Continue with Google`
  - proof sections for pantry scan, recipe ideas, and cooking guidance
- Added restrained motion with existing `framer-motion` and CSS only:
  - first-load reveal
  - pantry chip pop-in
  - finite scan-frame pulse
  - proof-card entrance
  - tactile button press states
  - `prefers-reduced-motion` disables the scan pulse
- Removed the stale authenticated `/website` route and deleted the orphaned old homepage component tree so there is only one public landing path.
- Kept numeric quota copy off the landing page; PD-012 now explicitly says quota language belongs later in usage moments.

## Runtime Changes

- Added `FirebaseAuthService.signInAsGuest()` via Firebase anonymous auth.
- Added anonymous-aware session handling:
  - client `useAuth()` now reads `/api/auth/session`
  - server `GET /api/auth/session` returns linked or anonymous session metadata
  - anonymous sessions do not create durable user rows
  - `/api/auth/google` rejects anonymous/emailless Firebase tokens
- Added browser-local guest profile persistence keyed by anonymous Firebase UID.
- Kept linked-only surfaces guarded for this slice:
  - guest Settings and History menu buttons are disabled
  - guest Slop It Up is blocked with an upgrade/save-memory toast
  - guest empty-pantry recovery returns to setup instead of linked-account settings

## Docs Updated

- [INIT-003](../../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md)
  - status/current phase moved to Phase 3 public pre-auth homepage and client guest entry
  - recorded the soft-sequence override with hard production gates
  - recorded branch and validation status
- [Initiative registry](../../initiatives/registry.md)
  - INIT-003 now points at this runtime branch and Phase 3 work
- [PD-012](../../product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md)
  - landing copy guidance now avoids numeric guest quota language and uses simple guest-entry framing

## Validation

- `npm ci`
- `git diff --check`
- `npx vitest run tests/unit/firebase-auth.test.ts tests/unit/auth-session-route.test.ts tests/unit/planning-choice.test.tsx`
- `npm run check`
- `npm run build`
- In-app browser visual checks against local `http://127.0.0.1:3000/`:
  - desktop 1280x720: no horizontal overflow, headline and both CTAs visible/enabled
  - mobile 390x844: no horizontal overflow, CTAs stacked/enabled, scan caption no longer overlaps pantry chips

Known build warnings only:

- Browserslist data is stale.
- Existing Firebase dynamic/static import chunk warning.
- Existing bundle-size warning above 500 kB.

## Not Yet Validated

- Replit auth smoke is still required before merge/deploy:
  - `Let's cook!` starts real anonymous Firebase entry in the Replit runtime
  - Google sign-in still upserts/routes correctly
  - guest setup persists across same-browser reopen
- Quota enforcement, App Check, anonymous kill switch, anonymous rate-limit identity, and full upgrade-to-save boundary are still future INIT-003 phases.

## Resume Point

Open a PR for `codex/init-003-preauth-homepage`, then run targeted Replit validation for the landing/auth entry surfaces. Do not treat this branch as production-ready guest launch; it is the visual/client/session foundation for the remaining INIT-003 runtime phases.
