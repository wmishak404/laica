# EFF-037 Feedback contract

**Agent:** codex
**Branch:** `codex/eff-037-feedback-contract`
**Date:** 2026-08-05
**Initiative:** none — standalone EFF-037
**INIT updated:** no
**Resolves blocked handoff:** none

## Summary

Daily Efforts hygiene found no active status or routing change that needed a separate hygiene PR before implementation. EFF-037 was the highest-priority unowned implementation slice: EFF-036 remains blocked on owner-authorized Production-app configuration review, EFF-034 already has open PR #334, and EFF-022 has adjacent open prompt/eval work. This branch aligns the Feedback modal and `/api/feedback` route on one 300-character contract, returns length-specific recovery copy, preserves the draft on server-side length rejection, and records the production-push check that must prove the custom-domain form after publish.

## Changes

- `shared/feedback.ts` defines the feedback text/current-page limits, typed length error code/message, and Zod schemas.
- `shared/schema.ts` applies the feedback-specific schemas to `insertFeedbackSchema`.
- `server/routes.ts` parses `/api/feedback` with the shared schema and returns typed `FEEDBACK_TEXT_TOO_LONG` copy for over-limit comments.
- `client/src/components/feedback/feedback-modal.tsx` uses the shared maximum, sends trimmed feedback, blocks over-limit drafts, and shows length-specific recovery copy without clearing the draft.
- `tests/unit/p0-route-contracts.test.ts` covers max and max + 1 server boundaries plus the typed error response.
- `tests/unit/feedback-modal.test.tsx` covers client boundary submit, over-limit pre-submit blocking, and server length-error draft preservation.
- `efforts/README.md`, `efforts/registry.md`, `efforts/effort-037-feedback-length-contract.md`, and `docs/production-validation-registry.md` record the In Progress implementation signal and focused production-push breadcrumb.
- `package-lock.json` has a lockfile-only audit remediation for transitive `brace-expansion`, `ip-address`, `postcss`, and `nanoid`; `package.json` is unchanged.

## Impact on other agents

- The canonical feedback comment maximum is now 300 characters in `shared/feedback.ts`; do not reintroduce route-local or modal-local feedback length literals.
- The route-level generic `shortTextSchema` remains 280 for other fields such as notes and Slop Bowl feedback; this branch deliberately only changes the Feedback submission contract.
- PR #349 owns a Dependabot `ip-address` branch, but this branch had to include the broader lockfile-only audit fix because current `npm audit --audit-level=high` also failed on `brace-expansion`.
- Broad dependency modernization remains deferred; this is a concrete audit-gate remediation tied to this PR's validation, not an EFF-023 reopening.

## Open items

- Open a PR, mark it ready, and let exact-head GitHub CI/E2E/security checks run.
- Do not merge without Wilson approval.
- Human Replit validation is not required before merge for this narrow contract fix if exact-head automation stays green; the custom-domain feedback check remains a production-push/release-batch item.
- After an authorized production publish, run the focused Feedback smoke from `docs/production-validation-registry.md`: short write, shared-boundary write, over-limit prevention/recovery, and cleanup of labeled rows if owner tooling allows it.

## Verification

- `npm ci` — passed after the lockfile-only audit remediation; reported zero vulnerabilities.
- `npx vitest run tests/unit/p0-route-contracts.test.ts tests/unit/feedback-modal.test.tsx` — passed, 2 files / 23 tests.
- `npm run check` — passed.
- `npm run test:unit` — passed, 52 files / 407 tests.
- `npm run build` — passed; emitted only existing Browserslist-age, Firebase mixed dynamic/static import, and chunk-size warnings.
- `npm audit --audit-level=high` — passed after lockfile remediation; zero vulnerabilities.
- `git diff --check` — passed after final docs.
- Replit validation: not run and not required before merge for this automation-primary lane. Production custom-domain feedback validation is deferred until the branch is merged and published.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `06259699ec837681c19fb15bced1b7053d93b249`
- Last Replit-validated at: not validated; PR-level Replit validation not required before merge, production feedback smoke deferred until authorized publish
- Notes: not stacked; open PR #334 owns EFF-034, PR #274 is adjacent to EFF-022, and EFF-036 remains owner-configuration blocked.
