# EFF-033 returning Settings inventory action dock

**Agent:** codex
**Branch:** `codex/eff-033-settings-action-dock`
**Date:** 2026-07-20
**Initiative:** [INIT-001 - Mobile Refresh](../../initiatives/INIT-001-mobile-refresh.md)
**INIT updated:** yes
**Resolves blocked handoff:** none
**PR:** [#325](https://github.com/wmishak404/laica/pull/325) — ready for review, not merge-authorized

## Summary

EFF-033's corrected runtime fix is implemented and mobile-validated: returning Settings Pantry and Tools now keep one bounded inventory scroller inside the centered content shell while an opaque, in-flow Settings/Save dock is owned directly by the fixed page, spans the viewport, and meets Cook/Menu navigation with no spacer band. This removes the content-and-dock collision and the first pass's panel-contained, 40px-gap visual mismatch without depending on z-index.

The durable lesson added to Phase 2.2 is structural and hierarchical. A returning inventory action dock must own reserved layout space at the page layer, not inherit the inventory card's width or radius; its bottom must equal the bottom nav's top, and its content scroller must still end before the dock. Setup containment is the reference principle, while setup and returning Settings keep distinct top-level flows. Wilson accepted the corrected visual result on 2026-07-21. The rebased review head passed the repaired all-nine gate and refreshed Replit geometry lane; PR #325 remains unmerged only because explicit merge approval is still required. The prior 8/9 gate was caused by the added ninth browser context exhausting the Playwright Vite server's broad app-asset limiter, not by a linked auth/planning runtime regression; merged PR #330 provides the E2E-only capacity correction.

## Stack / base status

- Requested implementation starting point: `codex/production-readiness-2026-07-17` at `08fa856d028c00f577f4e6dd3492efa8c00639de`.
- Rebased onto current `origin/main` after PRs #322, #319, and #329: `cbeae19d2c29b111c8bf9e4b37a834844e465b4d`.
- Finalization rebase target after PRs #328 and #330: `origin/main` `1c40069ee4a497decd8ac67158f8b832616a8398`.
- The PR intentionally retains the two production-readiness documentation commits that introduced EFF-033.
- Rebased initial containment commit: `d8bde7bafa54c7b2c97755e599e38ec3e5b3eb6d`.
- Rebased corrected page-level runtime commits: `16a668ecd4e6a68a30c8d20418f5e61c01343266` and `afdcac6e130d6b03afb01189adf8dc4557dd8090`.
- Last Replit-validated review head before this evidence-only handoff update: `e85f8b328b11dd82dbf65a53b2ce0d0847e5277c`; the final handoff commit requires the short exact-head resync recorded in the live PR.
- Replit Agent: not used. Replit was updated through the direct shell and inspected through the workspace preview.

## Bug investigation evidence

Observed before implementation:

- The existing `390x844` reproduction measured `Enter manually` at `706.58–762.58px`, the sticky `.returning-actions` rail at `689.41–768px`, and `Save pantry` at `704–752px`.
- `elementFromPoint()` at the visible manual-entry center returned `Save pantry`.
- Source inspection showed `.returning-actions` was `position: sticky`, `z-index: 20`, and began its background gradient at 42% cream opacity, while first-time setup placed `.setup-bottom-bar` in flow after `.setup-scroll-body`.
- The reported issue was therefore a content-geometry and surface-containment defect, not only a bottom-nav or paint-order defect.
- Wilson's 2026-07-21 review showed the first fix still failed visual hierarchy: the dock remained inside the centered rounded panel and left a permanent `40px` band above Cook/Menu. Existing committed first-pass screenshots and rendered geometry corroborated the new report.

Before evidence:

- [Wilson-supplied Pantry overlay](../assets/mobile-refresh/2026-07-20-wilson-returning-settings-pantry-overlay.png)
- [Codex `390x844` Pantry reproduction](../assets/mobile-refresh/2026-07-20-codex-returning-settings-pantry-overlay-390x844.jpg)

## Changes

- `client/src/components/cooking/user-settings.tsx`
  - wraps returning inventory content in `.returning-inventory-scroll`
  - renders `.returning-inventory-actions` outside `.returning-settings-shell` as a direct child of the inventory page for both Pantry and Tools
  - preserves `returning-setup-anchor` on the new rail so shared button tokens and specificity remain valid
  - scopes the bounded Settings shell only to the inventory section, leaving the Settings hub and Cooking Profile action behavior unchanged
- `client/src/index.css`
  - bounds returning Kitchen Inventory to the shared rendered app-nav height
  - gives the inventory panel a single flex-owned `overflow-y: auto` region
  - makes the inventory action dock a full-width page flex child with a centered inner grid, `position: relative`, `z-index: auto`, and an opaque cream surface
- `tests/e2e/helpers/inventory-action-dock.ts`
  - asserts scroller/dock/nav geometry, direct page ownership, viewport-wide bounds, zero dock/nav gap, opaque computed surface, 44px minimum targets, and `elementFromPoint()` ownership
  - probes the focused manual-entry field after a 280px viewport-height reduction as an automated virtual-keyboard/resized-viewport analogue
- `tests/e2e/cooking-workflow.test.ts`
  - adds guest Pantry/Tools coverage at exact `390x844` and `412x915`, including clean/dirty state and save behavior
- `tests/e2e/linked-dev-auth.test.ts`
  - adds the same geometry/hit contract to the existing linked Pantry/Tools persistence flow
- `tests/unit/setup-button-css.test.ts` and `tests/unit/user-settings-scan-policy.test.tsx`
  - guard the bounded scroller, in-flow opaque dock, and sibling DOM containment contract
- EFF-033, INIT-001, the Phase 2.2 record, Efforts read list, production-validation registry, screenshots, and this handoff carry the implementation and validation signal.

## Initial contained-dock Replit evidence (superseded geometry)

Target: Replit workspace preview at runtime head `af603822855be23e790769f77969dace803aabd4`. Chrome's controlled tab reported `devicePixelRatio: 0.8`, so the linked pass used compensated outer overrides and recorded the app-reported viewport. The separate guest pass used exact in-app viewport overrides. Both modes loaded the new EFF-033 test IDs and shared layout.

This pass remains useful for the original overlap/opacity regression, but Wilson's 2026-07-21 review rejected its panel-level placement and `40px` dock/nav gap. It is not final visual acceptance; the corrected page-level evidence below supersedes those geometry claims.

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
- [Corrected page-level Pantry at `390x844`](../assets/mobile-refresh/2026-07-21-codex-eff-033-page-dock-pantry-390x844.jpg)
- [Corrected page-level Tools at `412x915`](../assets/mobile-refresh/2026-07-21-codex-eff-033-page-dock-tools-412x915.jpg)
- [Finalization Pantry at `390x844`](../assets/mobile-refresh/2026-07-21-codex-eff-033-final-head-pantry-390x844.jpg)
- [Finalization Tools at `412x915`](../assets/mobile-refresh/2026-07-21-codex-eff-033-final-head-tools-412x915.jpg)
- [Direct-shell Replit review-head fingerprint](../assets/mobile-refresh/2026-07-21-codex-eff-033-final-head-replit-sha.jpg)

## 2026-07-21 corrected page-level Replit evidence

Wilson rejected the initial in-panel implementation because it did not match FTUE's page-owned rail and wasted `40px` above bottom navigation. The correction was verified through the direct Replit shell and browser without Replit Agent at runtime head `3a42ad6b0deef46b59457e5a505adc617292146c`.

| Mode / section | App viewport | Dock horizontal bounds | Dock bottom / nav top | Result |
|---|---:|---:|---:|---|
| Returning session-local Pantry | `390x844` | `0 / 390` | `786.758 / 786.758` | direct page child; opaque cream rail; coral Save; 48px Settings/Save centers owned |
| Returning session-local Tools | `412x915` | `0 / 412.5` rendered | `858.008 / 858.008` | direct page child; opaque cream rail; metal Save; camera/upload/manual/Settings/Save centers owned |

The bounded scroller still ended before the rail (`16.621px` separation from the rounded content panel), so content was neither covered nor hit-intercepted. At reduced `412x635`, the focused Tools input ended at `465.293px`, before dock top `499.795px`, and the dock remained flush to nav. This pass proves the shared returning/session-local surface; exact-head CI owns the linked persistence mode and full regression lane.

## 2026-07-21 rebased finalization evidence

PR #325 rebased once onto `origin/main` `1c40069ee4a497decd8ac67158f8b832616a8398`. Direct-shell Replit loaded detached review head `e85f8b328b11dd82dbf65a53b2ce0d0847e5277c`, restarted the configured application without Replit Agent, and repeated the mobile fingerprint.

| Surface | App viewport | Scroller / dock / nav geometry | Surface and hit evidence |
|---|---:|---|---|
| Returning Pantry | `390x844` | scroll bottom `691.924`; dock `708.545–786.758`; nav top `786.758`; horizontal `0–390` | direct page child; opaque `rgb(255, 248, 235)` plus cream gradient; camera, upload, manual, Settings, and Save centers owned; target heights `48–56px` |
| Returning Tools | `412x915` | scroll bottom `763.174`; dock `779.795–858.008`; nav top `858.008`; horizontal `0–412.5` | direct page child; same opaque surface; camera, upload, manual, Settings, and Save centers owned; target heights `48–56px` |

Both scrollers reached their real maximum and retained a `16.621px` content-panel separation before the dock; `elementFromPoint()` immediately inside each scroller remained owned by scroller content rather than the dock. With the Pantry field focused at `390x564`, input bottom `272.168` remained before dock top `428.545`; with the Tools field focused at `412x635`, input bottom `307.793` remained before dock top `499.795`. In both reduced viewports the dock bottom still equaled nav top and the input center remained owned. This browser session represented the available returning/session-local surface; the combined schema-backed CI lane exercised guest and linked-account save/persistence paths.

## Verification

| Evidence | Provenance | Result | What it proves | Negative scope / limit |
|---|---|---|---|---|
| Dependency install | `npm ci` from base `08fa856d` | Passed; 1,053 packages installed | Lockfile installs locally | GitHub reported inherited high-severity advisories on the default branch; no dependency change is included here |
| Focused deterministic tests | `npx vitest run tests/unit/setup-button-css.test.ts tests/unit/user-settings-scan-policy.test.tsx` | 2 files / 17 tests passed | CSS and shared Pantry/Tools DOM/behavior contracts | No browser geometry |
| Full unit suite | `npm run test:unit` | 50 files / 390 tests passed | Existing component/helper behavior, including Settings dirty/leave behavior | No live provider or Replit seam |
| Static checks | `npm run check` | Passed | TypeScript and client lint | No runtime layout proof |
| Production build | `npm run build` | Passed | Vite client and bundled server compile | Does not prove deployed snapshot |
| Dependency audit | `npm audit --audit-level=high` after rebase onto `cbeae19d` | Passed; remaining findings are one low and one moderate advisory | Merged PR #322 removed the prior high-severity gate blocker | No dependency change is introduced by EFF-033 |
| E2E discovery | `npx playwright test --list --project=chromium` | 9 tests discovered, including new guest and linked dock coverage | Playwright compiles and registers the new cases | Does not execute them |
| Focused local guest E2E attempt | dotenvx Playwright against local server | Blocked before Settings: anonymous Firebase auth never reached `Get started` | Confirms the local failure is an auth/environment precondition, not dock evidence | Not counted as a layout pass |
| Replit workspace mobile lane | direct Replit shell + guest/linked browser passes at runtime head `af603822` | Passed as detailed above | Real Replit origin, auth modes, rendered geometry, computed styles, scrolling, resized focused input, nav clearance, and hit targets | No camera permission/capture, upload/provider call, production deployment, or custom-domain publish |
| Corrected Replit page-level mobile lane | direct Replit shell + session-local returning browser pass at rebased review head `2e314fb0` | Passed at `390x844`, `412x915`, and focused-input `412x635` | Exact viewport-wide page ownership, zero dock/nav gap, computed button styles, hit targets, and reduced-viewport clearance after current-main rebase | No camera permission/capture, upload/provider call, production deployment, or custom-domain publish |
| Historical pre-harness-correction GitHub gate | PR #325 / [run `29861211868`](https://github.com/wmishak404/laica/actions/runs/29861211868) | Unit/typecheck/build/coverage, audit, secret scan, and CodeQL passed; full schema-backed Chromium ran 9 tests with 8 passed | Both EFF-033 guest and linked dock cases executed successfully | Added ninth context exhausted the broad Vite/app-asset limit: module/navigation `429` responses caused the last test's reload/first-render timeouts; this run is causal evidence, not current merge evidence |
| Rebased local gate | review head `e85f8b32`: `npm ci`; check; build; full/focused Vitest; high audit; diff check; Playwright discovery | Passed: 1,053 packages; 51 files / 397 tests; focused 4 files / 35 tests; only one low and one moderate advisory; 9 Chromium tests discovered | Rebase integration, shared Settings CSS/DOM contract, limiter guard, compilation, and test registration | Local Playwright execution was not used as merge evidence |
| Repaired exact-head GitHub gate | PR #325 / [run `29865935383`](https://github.com/wmishak404/laica/actions/runs/29865935383) at `e85f8b32` | Combined schema-backed Chromium reported `Running 9 tests using 1 worker` and `9 passed (51.9s)`; unit, audit, secret scan, and CodeQL also passed | Guest and linked paths, including both EFF-033 dock cases, executed under the merged E2E-only limiter repair | No live provider, production deployment, or custom-domain evidence |
| Rebased Replit mobile lane | direct Replit shell + controlled Chrome at `e85f8b32` | Passed exact app-reported `390x844`, `412x915`, `390x564`, and `412x635` geometry, opacity, scrolling, and hit fingerprints | Real Replit-origin page ownership, zero nav gap, reserved scroll space, reduced viewport response, and intended active actions | Available returning/session-local state only; linked persistence is covered by the exact-head combined CI lane; no camera permission/capture or upload/provider call |

## Impact on other agents

- Keep Pantry and Tools on `renderInventorySection`; do not fork separate layout paths.
- Inventory content belongs inside `.returning-inventory-scroll`; inventory actions belong outside the centered `.returning-settings-shell` as a direct page child with a centered `.returning-inventory-actions-inner` grid.
- Do not fix future overlap by increasing dock z-index, restoring translucency, or adding per-control bottom padding. Compare the scroller bottom, dock top, viewport-wide dock bounds, direct page parent, dock bottom, and nav top first.
- EFF-033 remains `In Progress` until PR #325 merges. The merge owner must perform the normal Effort closeout from fresh `main`: mark it Resolved, remove it from the active read list, update the Effort registry/INIT/phase record as warranted, and push a merge-closeout handoff.

## Open items

- After this evidence-only handoff commit is pushed, resync that final SHA into Replit and repeat the compact geometry/hit fingerprint; record the resulting exact-head SHA in the live PR under the repository's stale-validation policy.
- Wilson must explicitly approve merge. This task does not grant merge or production-publish authority.
- Production is still blocked independently by the INIT-003 Guest Finish honesty correction and the exact-head release mobile-matrix rerun. EFF-032 and EFF-034 remain deferred/out of scope.

## Negative scope

No bottom-nav item/order/visibility change; no provider, scan, camera, upload, manual-entry, inventory semantic, prompt, API, schema, persistence, auth, first-time setup, timer, Settings-hub blank-tail, History, Live Cooking, or Guest Finish change.

## 2026-07-21 harness root-cause correction and finalization rebase

The earlier handoff incorrectly called the final linked-browser timeout unrelated to EFF-033. Investigation connected it to this branch's test impact: adding the ninth Playwright case added a fresh Vite cold load, one cold load produced 112 localhost responses, the eighth began receiving module `429` responses, and the ninth navigation received `429`. The linked test's initial reload timeout and retry failure before first render were therefore downstream symptoms of the shared 1,000-request app-asset bucket. PR #330 merged an E2E-only bypass guarded against production, retained the API and user/provider limits, and added immediate unexpected-`429` diagnostics.

EFF-033 then rebased once onto `origin/main` `1c40069ee4a497decd8ac67158f8b832616a8398`, preserving both the merged diagnostic wrapper and the inventory geometry helper. The rebased tree passed `npm ci` (1,053 packages), `npm run check`, `npm run build`, full `npm run test:unit` (51 files / 397 tests), focused Settings plus limiter Vitest (4 files / 35 tests), `npm audit --audit-level=high` with only one low and one moderate advisory remaining, `git diff --check`, and nine-test Chromium discovery. Pushed review head `e85f8b328b11dd82dbf65a53b2ce0d0847e5277c` then passed GitHub run `29865935383`, whose combined schema-backed lane executed and passed all nine Playwright tests, plus unit, audit, secret scan, and CodeQL. The same review head passed refreshed direct-shell Replit geometry, opacity, scrolling, reduced-viewport, and hit evidence at the compact iPhone/Pixel sizes. Because this pushed handoff and its screenshots form a later evidence-only commit, the live PR must record the final SHA's short Replit resync and its own all-nine gate before merge readiness is claimed.
