# Tailwind 4 audit remediation and validation timing update

**Agent:** Codex
**Branch:** `codex/tailwind-4-audit-remediation`
**Date:** 2026-10-08
**Initiative:** [INIT-005](../../initiatives/INIT-005-agentic-cooking-actions.md)
**INIT updated:** yes — migration preparation decision, browser floor and dependency-first resume; #371 retains the detailed Phase 1 merge closeout
**Resolves blocked handoff:** docs/handoffs/2026-10-07-codex-init-005-compatible-audit-remediation-blocked.md
**Status:** Prepared candidate for review; final-source and exact-head check status is authoritative in the migration PR body and linked runs; no merge authorized

## Summary

Wilson selected the separate Tailwind 4 migration on 2026-10-08 after the compatible slice in #372 left the audit blocked. The combined candidate now passes the unchanged high/critical audit gate without a force upgrade or exception. Existing colors, typography, radii, authored specificity and motion are preserved. This resolves the preparation decision and candidate dependency path; main, #372 and #371 remain unmerged until the applicable checks and explicit code/dependency approval are complete.

Wilson then updated the LAICA harness rule: defer Replit shell/browser validation to full regression or release regression rather than individual PR preparation or merge readiness. Only an explicit Wilson request moves it earlier. The required full automated exact-head CI/E2E gate remains independent and unchanged; running it does not itself trigger Replit. Replit-only behavior remains explicitly unvalidated. Publishing, pilot activation and Replit Agent use still require explicit approval.

## Changes

- `package.json` / lock: Tailwind and its Vite integration 4.3.3, class merging 3.7.0, and exact animation replacement 1.3.5. Remove the old animation/unused typography plugin and obsolete PostCSS/Autoprefixer integration. Other runtime declarations, Express major, overrides and audit policy remain unchanged from #372.
- Client styles: split authored app rules into `app-components.css`, imported into the native utilities layer before generated utilities. Retain selector specificity and utility-wins-ties order. Keep brand HSL variables, used Tailwind 3 palette values, font stacks, exact rem line heights, radius aliases, touch hover treatment and existing preflight appearance/affordances.
- Existing TSX classes: map old shadow/blur/radius/outline scales and CSS-variable syntax, and retain sRGB gradient interpolation. Use explicit transform for modal/camera centering and select/toast animation offsets; individual translate would otherwise add to transform keyframes. Use gap for Ready Check/toasts and local margins for camera/profile/grocery siblings to retain their prior layout. Preserve the observed 150ms dialog animation separately from its 200ms transition and the exact legacy toast-close focus ring color (explicit RGBA avoids WebKit color-mix rounding); avoid introducing the previously undefined dormant OTP caret animation.
- Separate fixture-browser lane: actual App/screens/shared components with test-only Firebase and API/provider fixtures; Vite only, no DB or live credentials. Existing service-backed Playwright remains the required full regression lane.
- Harness rule: align AGENTS, CLAUDE, ADR-0001, testing flow/diagram/risk lanes, Replit focus/templates and primary-local runbook, security due diligence, merge authority, handoff conventions and environment map. Preserve all approval, security, schema and production-smoke registration rules.
- INIT, EFF-023 and design guidelines record Wilson's decision and Safari 16.4+, Chrome 111+, Firefox 128+ floor. EFF-023 remains Deferred; this is a narrow audit trigger. Production registry carries focused next-regression checks and the future-bug breadcrumb.

## Stack / base status

- Base refreshed: yes; `origin/main` remains `96ec567a6f55639473d3209376fa180b2dd1f924`.
- PR base: #372 / `codex/init-005-audit-remediation` at `c611b903ddff1833175ac67226b121d78f0f3c18`. The migration diff is separate; its tested dependency graph includes the compatible slice. No lower-stack merge has occurred.
- Last Replit-validated at: none for this migration.
- Replit validation: deferred to full/release regression; Replit-only behavior unvalidated, per Wilson's 2026-10-08 instruction.
- Preserve the original `/Users/wilsonishak-macbookpro/src/laica` checkout and its pre-existing encrypted `.env` modification. This work uses an isolated branch/worktree.

## Verification and test impact

**Value claim:** remove the audit prerequisite without changing the accepted mobile presentation or lowering the gate.

Change-specific working-tree comparison passes all 12 core cases (72 screenshot/computed checkpoints) across Chromium 143.0.7499.4 and WebKit 26.0 at `390x844` and `412x915`. Settings/Profile, setup, Planning/Ready Check, paused timer/Ask failure and dark/shared controls match. Sixteen rendered motion cases also pass across those projects; the final matrix adds keyboard focus-ring proof to the toast cases. Record the full 28-case baseline/migration replay at the committed source in the PR body, with final SHA and harness hash. Source provenance is the immutable #372 head `c611b903ddff1833175ac67226b121d78f0f3c18` for Tailwind 3 and the migration review head. Bounds must remain within 1 CSS pixel, typography/dimensions/painted colors and wrapped lines must match, horizontal overflow must stay within 1 pixel, and screenshot differences must stay below 0.5% at threshold 0.1. Request/error and source/browser metadata are attached by the [fixture harness](../../tests/visual/README.md). A baseline self-replay passes; absent-baseline comparison fails without auto-recording. Fixtures do not prove real auth, DB persistence, provider quality, microphone/camera hardware, speech or Replit. Current engines do not independently prove every minimum browser version.

Local automated checks: Node `24.14.1`, npm `11.11.0`; clean `npm ci`, `npm run check`, `npm run build`, 58 unit files / 468 tests with coverage, and 27 public eval fixtures pass. Existing mixed-import and chunk-size build warnings remain. Full and production `npm audit --audit-level=high` gates pass, each with seven moderate, zero high and zero critical entries locally. Raw unresolved advisory details remain in private local investigation artifacts/security tooling rather than public docs.

Exact-head GitHub proof is recorded in the PR body after the final push: required install/check/build/unit/coverage and schema-backed guest/linked/ledger E2E with schema health and Neon cleanup, dependency audit, secret scan and applicable CodeQL. Read the live final-head result there; pending, skipped, failed or stale results are not passes. Visual fixture comparisons are change-specific evidence and do not replace that full gate.

## Deferred full/release regression

At the selected exact merged batch, use direct Replit shell/UI with no Agent to confirm Linux install/build, real font loading, mobile setup/Settings action rails and scrolling, Planning/Ready Check card spacing, active timer/Ask controls, shared dialog/select/menu/toast/camera motion and representative dark/focus/disabled states. Preserve the primary checkout and preview; record SHA and viewport. Real auth/provider/speech cases remain in the production registry's regression scope. No Replit or production validation is claimed by this candidate.

## Impact on other agents and exact resume

1. Review the separate migration PR and #372 composition; explicit approval is needed before any code/dependency merge. Merge the migration into #372 only after approval and required evidence, refresh #372 and rerun its new exact-head gate, then merge the combined remediation into main under the approved scope. Do not merge a failing audit or weaken its threshold.
2. Keep Dependabot #370/#361 intact until the approved replacement lands; no merge authority is added for them. #370's compatible resolution is already in #372; #361's unapproved major scope is not copied.
3. Refresh `codex/init-005-phase1-merge-closeout` (#371) from remediated fresh main, reconcile its INIT/registry facts with the new dependency and harness timing notes, push with lease, rerun checks/review threads and complete the authorized mechanical closeout. Phase 1 #369 remains already merged; do not recreate it.
4. Then start Phase 2 from fresh main in an isolated branch. Repeat the live #334/#281 audit; neither is assumed merged or authorized. Follow the accepted single timer controller/binding/application protection/receipt plan and the targeted versus full regression matrix in the prior handoff/master plan. Keep pilot defaults disabled.
5. Replit validation waits until full/release regression under the new harness rule. EFF-036 remains a separate production-readiness concern. Obtain explicit approval before publishing, pilot activation or Replit Agent use.
