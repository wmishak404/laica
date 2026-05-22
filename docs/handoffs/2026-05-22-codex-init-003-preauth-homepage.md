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

Wilson accepted **Plan B** after this implementation: use the pre-auth homepage as the public entry point and ship a clean guest MVP before full INIT-001 Phase 4 or Phase 5. Plan B does not change the linked-account boundary for durable cooking memory, History, cleanup, taste signals, or retention.

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
  - added Plan B public homepage + clean guest MVP launch path, Replit validation gates, and explicit non-goals
  - recorded branch and validation status
- [INIT-001](../../initiatives/INIT-001-mobile-refresh.md)
  - added Plan B sequencing: public homepage/guest MVP can ship before Phase 4, while Phase 5 remains after Phase 4
- [Mobile Refresh Phase 4](../../product-decisions/features/mobile-refresh/pd-phase-04-cooking.md)
  - recorded that landing-page cooking-guidance promises are fulfilled later by Phase 4 and that guest Finish must not silently create durable history
- [Mobile Refresh Phase 5](../../product-decisions/features/mobile-refresh/pd-phase-05-post-cook.md)
  - recorded that Plan B does not pull cleanup/retention forward and anonymous completion state is not retro-imported into durable history in v1
- [Mobile Refresh phase README](../../product-decisions/features/mobile-refresh/README.md)
  - added Plan B to the default sequence and preserved Phase 4-before-Phase 5 as the hard dependency
- [Initiative registry](../../initiatives/registry.md)
  - INIT-003 now points at this runtime branch, Phase 3 work, and Plan B guest-MVP signal
- [PD-012](../../product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md)
  - landing copy guidance now avoids numeric guest quota language and uses simple guest-entry framing

## PR Summary Notes

- Pre-auth homepage change: A+C hybrid homepage, `Let's cook!` anonymous entry, Google as linked-account path, no landing-page numeric quota language, and removed stale `/website`/old homepage path.
- Deferred INIT-003 gates: Replit auth smoke, anonymous quota enforcement, anonymous kill switch, anonymous rate-limit identity, Firebase App Check posture, and full upgrade-to-save boundary.
- Phase 4 follow-up: linked users get durable cooking guidance/history; guests must see a local-only or link-Google boundary before any completion path that would imply saved history.
- Phase 5 follow-up: cleanup, taste memory, next-meal seed, History retention, share/cook-again memory, and anonymous-to-linked retro-import remain out of guest MVP v1.

## Validation

- `npm ci`
- `git diff --check`
- `npx vitest run tests/unit/firebase-auth.test.ts tests/unit/auth-session-route.test.ts tests/unit/planning-choice.test.tsx`
- `npm run check`
- `npm run build`
- In-app browser visual checks against local `http://127.0.0.1:3000/`:
  - desktop 1280x720: no horizontal overflow, headline and both CTAs visible/enabled
  - mobile 390x844: no horizontal overflow, CTAs stacked/enabled, scan caption no longer overlaps pantry chips
- Plan B docs follow-up: `git diff --check`

Known build warnings only:

- Browserslist data is stale.
- Existing Firebase dynamic/static import chunk warning.
- Existing bundle-size warning above 500 kB.

## Not Yet Validated

- Replit auth smoke is still required before merge/deploy:
  - `Let's cook!` starts real anonymous Firebase entry in the Replit runtime
  - Google sign-in still upserts/routes correctly
  - guest setup persists across same-browser reopen
  - guests reach recipe ideas without durable server saves
  - linked-user cooking/history flows still work
- Quota enforcement, App Check, anonymous kill switch, anonymous rate-limit identity, and full upgrade-to-save boundary are still future INIT-003 gates before public guest enablement.

## Resume Point

Open a PR for `codex/init-003-preauth-homepage`, then run targeted Replit validation for the landing/auth entry surfaces and guest recipe-idea path. Do not treat this branch as production-ready guest launch until the Plan B gates above are implemented or explicitly confirmed.
