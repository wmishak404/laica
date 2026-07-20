# EFF-033 returning Settings inventory action dock

**Agent:** codex
**Branch:** `codex/eff-033-settings-action-dock`
**Date:** 2026-07-20
**Initiative:** [INIT-001 - Mobile Refresh](../../initiatives/INIT-001-mobile-refresh.md)
**INIT updated:** yes
**Resolves blocked handoff:** none
**Draft PR:** [#325](https://github.com/wmishak404/laica/pull/325)

## Summary

EFF-033's runtime fix is implemented and mobile-validated: returning Settings Pantry and Tools now share one bounded inventory scroller followed by an opaque, in-flow Settings/Save dock above Cook/Menu navigation. This removes the content-and-dock geometry collision that previously sent a visible `Enter manually` center-point hit to `Save pantry`; the fix does not depend on raising z-index or making the old overlay more opaque.

The durable lesson added to Phase 2.2 is structural. A returning inventory action dock must own reserved layout space, and its scroll viewport must end at the dock's top edge. Setup containment is the reference principle, while setup and returning Settings keep distinct top-level flows. Draft PR #325 remains unmerged pending Wilson's review; exact final-head GitHub gates are live PR evidence after the final docs push.

## Stack / base status

- Base refreshed: yes, to the exact user-requested production-readiness branch head.
- Current implementation base: `codex/production-readiness-2026-07-17` at `08fa856d028c00f577f4e6dd3492efa8c00639de`.
- PR target: `main` at PR-open base `4775ce5fc8c0a4bd6dd5148c8e329eb5f0211038`; the PR intentionally includes the two production-readiness documentation commits that introduced EFF-033.
- Runtime implementation commit: `af603822855be23e790769f77969dace803aabd4`.
- Last Replit-validated at: `af603822855be23e790769f77969dace803aabd4` for the runtime change; the final follow-up docs head requires a short exact-head resync/recheck before review.
- Replit Agent: not used. Replit was updated through the direct shell and inspected through the workspace preview.

## Bug investigation evidence

Observed before implementation:

- The existing `390x844` reproduction measured `Enter manually` at `706.58–762.58px`, the sticky `.returning-actions` rail at `689.41–768px`, and `Save pantry` at `704–752px`.
- `elementFromPoint()` at the visible manual-entry center returned `Save pantry`.
- Source inspection showed `.returning-actions` was `position: sticky`, `z-index: 20`, and began its background gradient at 42% cream opacity, while first-time setup placed `.setup-bottom-bar` in flow after `.setup-scroll-body`.
- The reported issue was therefore a content-geometry and surface-containment defect, not only a bottom-nav or paint-order defect.

Before evidence:

- [Wilson-supplied Pantry overlay](../assets/mobile-refresh/2026-07-20-wilson-returning-settings-pantry-overlay.png)
- [Codex `390x844` Pantry reproduction](../assets/mobile-refresh/2026-07-20-codex-returning-settings-pantry-overlay-390x844.jpg)

## Changes

- `client/src/components/cooking/user-settings.tsx`
  - wraps returning inventory content in `.returning-inventory-scroll`
  - renders `.returning-inventory-actions` as a sibling after the scroller for both Pantry and Tools
  - scopes the bounded Settings shell only to the inventory section, leaving the Settings hub and Cooking Profile action behavior unchanged
- `client/src/index.css`
  - bounds returning Kitchen Inventory above the existing bottom-nav clearance
  - gives the inventory panel a single flex-owned `overflow-y: auto` region
  - overrides only the inventory action dock to `position: relative`, `z-index: auto`, and an opaque cream surface
- `tests/e2e/helpers/inventory-action-dock.ts`
  - asserts scroller/dock/nav geometry, opaque computed surface, 44px minimum targets, and `elementFromPoint()` ownership
  - probes the focused manual-entry field after a 280px viewport-height reduction as an automated virtual-keyboard/resized-viewport analogue
- `tests/e2e/cooking-workflow.test.ts`
  - adds guest Pantry/Tools coverage at exact `390x844` and `412x915`, including clean/dirty state and save behavior
- `tests/e2e/linked-dev-auth.test.ts`
  - adds the same geometry/hit contract to the existing linked Pantry/Tools persistence flow
- `tests/unit/setup-button-css.test.ts` and `tests/unit/user-settings-scan-policy.test.tsx`
  - guard the bounded scroller, in-flow opaque dock, and sibling DOM containment contract
- EFF-033, INIT-001, the Phase 2.2 record, Efforts read list, production-validation registry, screenshots, and this handoff carry the implementation and validation signal.

## Replit mobile evidence

Target: Replit workspace preview at runtime head `af603822855be23e790769f77969dace803aabd4`. Chrome's controlled tab reported `devicePixelRatio: 0.8`, so the linked pass used compensated outer overrides and recorded the app-reported viewport. The separate guest pass used exact in-app viewport overrides. Both modes loaded the new EFF-033 test IDs and shared layout.

| Mode / section | App viewport | Scroll bottom / dock top | Dock bottom / nav top | Center-point hit result |
|---|---:|---:|---:|---|
| Linked Pantry, 31-item long list | `390x844` | `668.916 / 668.916` | `747.129 / 787.129` | active camera toggle, upload, manual, Settings, and Save owned their centers |
| Linked Tools, long list | `412x915` | `740.166 / 740.166` | `818.379 / 858.379` | active camera toggle, upload, manual, Settings, and Save owned their centers |
| Guest Pantry, 3 items | `390x844` | `668.406 / 668.406` | `747 / 787` | upload, manual, Settings, and Save owned their centers |
| Guest Tools, empty list | `412x915` | `739.406 / 739.406` | `818 / 858` | active camera toggle, upload, manual, Settings, and Save owned their centers |

Additional observations:

- The computed dock surface was opaque `rgb(255, 248, 235)` with `linear-gradient(rgb(255, 248, 235), rgb(253, 238, 217))`; computed position was `relative` and z-index was `auto`.
- Active controls measured `48–64px` high. The center of intentionally disabled Capture does not accept pointer events while the camera is off, so camera hit evidence uses the active 56px Turn-on control.
- Clean and reversible dirty Pantry/Tools states passed in guest and linked modes. Dirty reminders scrolled to the end of the owned content region and stopped at the dock edge; Save-changes center hits remained owned by Save.
- Linked test items were removed before leaving each section, and no temporary validation item was persisted.
- With Pantry input focused at `390x564`, the input ended at `259.36px`, before the dock at `385.72px`; with Tools input focused at `412x635`, the input ended at `294.98px`, before the dock at `456.97px`. Exact guest probes produced the same ordering. This proves resize response but is not a claim that desktop emulation can summon a physical iOS/Android software keyboard.
- Clean Pantry -> Tools switching passed. Existing deterministic Settings tests cover dirty switch/Back leave prompts; the browser pass did not invoke a native confirm because the controller's earlier signed-in native-dialog session was unstable.
- No warning/error browser logs appeared in either the linked or guest validation tab.

After evidence:

- [Linked Pantry after-state at `390x844`](../assets/mobile-refresh/2026-07-20-codex-eff-033-after-linked-pantry-390x844.jpg)
- [Linked Tools after-state at `412x915`](../assets/mobile-refresh/2026-07-20-codex-eff-033-after-linked-tools-412x915.jpg)

## Verification

| Evidence | Provenance | Result | What it proves | Negative scope / limit |
|---|---|---|---|---|
| Dependency install | `npm ci` from base `08fa856d` | Passed; 1,053 packages installed | Lockfile installs locally | GitHub reported inherited high-severity advisories on the default branch; no dependency change is included here |
| Focused deterministic tests | `npx vitest run tests/unit/setup-button-css.test.ts tests/unit/user-settings-scan-policy.test.tsx` | 2 files / 17 tests passed | CSS and shared Pantry/Tools DOM/behavior contracts | No browser geometry |
| Full unit suite | `npm run test:unit` | 50 files / 390 tests passed | Existing component/helper behavior, including Settings dirty/leave behavior | No live provider or Replit seam |
| Static checks | `npm run check` | Passed | TypeScript and client lint | No runtime layout proof |
| Production build | `npm run build` | Passed | Vite client and bundled server compile | Does not prove deployed snapshot |
| Dependency audit | `npm audit --audit-level=high` | Failed on the newly disclosed high-severity default-branch advisory; draft PR #322 owns the lockfile-only remediation | This branch did not introduce or modify dependencies | Do not duplicate PR #322 or treat the audit as an EFF-033 code failure; rebase after PR #322 merges and rerun |
| E2E discovery | `npx playwright test --list --project=chromium` | 9 tests discovered, including new guest and linked dock coverage | Playwright compiles and registers the new cases | Does not execute them |
| Focused local guest E2E attempt | dotenvx Playwright against local server | Blocked before Settings: anonymous Firebase auth never reached `Get started` | Confirms the local failure is an auth/environment precondition, not dock evidence | Not counted as a layout pass |
| Replit workspace mobile lane | direct Replit shell + guest/linked browser passes at runtime head `af603822` | Passed as detailed above | Real Replit origin, auth modes, rendered geometry, computed styles, scrolling, resized focused input, nav clearance, and hit targets | No camera permission/capture, upload/provider call, production deployment, or custom-domain publish |
| Exact final-head GitHub gates | PR #325 | Pending after the final docs/evidence push | Required shared CI, disposable DB, full guest E2E, audit, secret scan, and code analysis as configured | Live PR is authoritative; a docs commit cannot contain its own post-push result |

## Impact on other agents

- Keep Pantry and Tools on `renderInventorySection`; do not fork separate layout paths.
- Inventory content belongs inside `.returning-inventory-scroll`; inventory actions belong after it as `.returning-inventory-actions`.
- Do not fix future overlap by increasing dock z-index, restoring translucency, or adding per-control bottom padding. Compare the scroller bottom, dock top, dock bottom, and nav top first.
- EFF-033 remains `In Progress` until PR #325 merges. The merge owner must perform the normal Effort closeout from fresh `main`: mark it Resolved, remove it from the active read list, update the Effort registry/INIT/phase record as warranted, and push a merge-closeout handoff.

## Open items

- Wait for all required GitHub checks on the final pushed PR #325 head, especially `e2e_guest_smoke`; record the exact SHA/results in the PR rather than claiming a pre-push pass.
- PR #322 carries the already-validated default-branch audit remediation. If it merges before PR #325 is reviewed, rebase PR #325 onto fresh `origin/main`, preserve the EFF-033 changes, rerun exact-head gates, and revalidate the Replit mobile fingerprint because any new commit makes prior validation stale.
- Resync the final docs/evidence head into Replit and repeat the focused geometry fingerprint so `Last Replit-validated at` is not stale.
- Wilson must explicitly approve merge. This task does not grant merge or production-publish authority.
- Production is still blocked independently by the INIT-003 Guest Finish honesty correction and the exact-head release mobile-matrix rerun. EFF-032 and EFF-034 remain deferred/out of scope.

## Negative scope

No bottom-nav item/order/visibility change; no provider, scan, camera, upload, manual-entry, inventory semantic, prompt, API, schema, persistence, auth, first-time setup, timer, Settings-hub blank-tail, History, Live Cooking, or Guest Finish change.
