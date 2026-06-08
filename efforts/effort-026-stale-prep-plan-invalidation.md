# EFF-026 - Stale prep plan invalidation after pantry changes

**Status:** In Progress
**Owner:** Wilson / Codex / Claude
**Created:** 2026-06-08
**Updated:** 2026-06-08

## One-line summary

Invalidate or confirm active recipe, prep tray, and cooking plan state when pantry/profile/kitchen changes make the plan's ingredient basis stale.

## Context

During the Replit/prod-push smoke after prior PRs fixed active cooking/session restore behavior, Wilson observed that a recipe/prep tray session lingered from a previous pantry state. The stale prep tray showed "Keto Chicken & Mushroom Miso Soup" using the previous pantry ingredient set. Wilson then returned to Settings/Pantry, refreshed or changed pantry ingredients, and saved a new pantry state containing only:

- rice
- eggs
- spinach

After that save, the old prep tray/session still lingered and remained accessible even though it was based on the old pantry contents.

This appears consistent with the current active plan/session persistence behavior added for Live Cooking reliability, but product-wise it is wrong. Prep trays or active recipe plans should not silently survive pantry/profile/kitchen changes that invalidate their ingredient basis.

This intersects [`EFF-025`](effort-025-settings-unsaved-inventory-reminder.md) because both involve Settings Pantry/Kitchen save and change behavior, but this Effort is separate: EFF-025 covers unsaved-change visibility before Save, while EFF-026 covers invalidating already-generated planning/cooking state after inventory or profile changes are saved.

## Scope

### In scope

- Detect when pantry ingredient changes materially invalidate the selected prep tray, active recipe plan, generated cooking steps, or active cooking session cache.
- Clear stale active recipe/prep/cooking plan state after relevant Settings saves, or force regeneration/explicit confirmation before the user can proceed.
- Cover both guest and linked users because both can save Settings pantry state and both can hold active plan/session state.
- Consider whether kitchen equipment or cooking profile changes should use the same invalidation rule when they affect generated recommendations or step context.
- Preserve intentional history behavior: completed cooking history should remain available where appropriate, but should not be confused with an active stale plan.
- Add focused regression coverage for the chosen invalidation behavior where practical.

### Out of scope

- Not blocking PR #146 or the current production CSP push.
- Not yet reproduced exhaustively across every guest, linked, refresh, and navigation path.
- No app code fix in the branch that creates this Effort.
- No change to recipe prompt quality, recommendation criteria, or cuisine selection.
- No change to the explicit Settings save model except where future implementation chooses how stale plan invalidation hooks into a successful save.
- No broad rewrite of planning, Live Cooking, or session persistence architecture unless investigation proves a smaller fix cannot protect the user.

## Observed behavior

- A prep tray/recipe plan generated from an older pantry state lingered after the pantry was changed and saved.
- The stale tray remained accessible after the pantry was reduced to only rice, eggs, and spinach.
- The visible stale recipe was "Keto Chicken & Mushroom Miso Soup", which did not reflect the new saved pantry basis.
- The behavior followed prior active cooking/session restore fixes, so the suspected issue is not a failed restore; it is missing invalidation when upstream user inventory/profile inputs change.

## Expected behavior

- If a user changes pantry ingredients after viewing or generating a prep tray/recipe plan, the app should invalidate or clear stale active recipe/prep/cooking plan state, or force regeneration/confirmation.
- The user should not be able to proceed with a stale recipe generated from a materially different pantry state without seeing and accepting that mismatch.
- The behavior should be consistent for guest and linked users.
- Hard refreshes after a pantry change should not resurrect the stale active plan or stale generated step tray.

## Suspected impacted state

- Active cooking plan restore state in `client/src/pages/app.tsx`.
- Prep tray selected recipe or planning-choice state.
- Generated cooking steps/session cache in Live Cooking.
- Durable linked-user cooking session start/restore behavior when a stale active plan survives across auth/profile reloads.
- Guest-scoped session-local plan persistence.

## Likely investigation areas

- `client/src/pages/app.tsx`, especially selected recipe, active cooking plan persistence, and restore/clear paths.
- Planning and recipe selection state that owns the prep tray before Live Cooking starts.
- Settings pantry save flow and any shared Pantry/Kitchen inventory save handlers.
- Live Cooking/session cache invalidation, including generated steps and durable session id restore.
- Any persisted keying strategy that could include a pantry/profile/kitchen fingerprint to detect invalidation instead of clearing too broadly.

## Decisions made so far

- This is a product correctness issue rather than a blocker for the current production CSP push.
- The current restore behavior is valuable for reconnect/refresh reliability, so the future fix should add invalidation boundaries instead of removing restore wholesale.
- Pantry changes are the minimum required invalidation trigger based on the observed bug.
- Kitchen equipment and cooking profile changes are likely related, but the exact materiality rule needs investigation.

## Open questions

- What counts as a material pantry change: any add/delete/reset/save, only saved changes, or only changes that alter ingredients used by the active recipe?
- Should the app clear stale active plans automatically, show a confirmation, or keep the stale plan only as non-actionable history?
- Should invalidation use a pantry/profile/kitchen fingerprint stored with the plan, or direct clear-on-save hooks from Settings?
- How should the rule handle linked-user history entries versus in-progress active cooking sessions?
- Does the same stale-plan risk occur when kitchen equipment or profile constraints change after a recipe is generated?

## Agent checklist

Read EFF-026 before starting any of the following:

- [ ] Changing Settings Pantry/Kitchen save, reset, add, delete, or scan behavior.
- [ ] Changing recipe planning, prep tray, selected recipe, or Start Cooking behavior.
- [ ] Changing active cooking plan restore state in `client/src/pages/app.tsx`.
- [ ] Changing generated steps/session cache persistence or invalidation in Live Cooking.
- [ ] Changing guest or linked session restore behavior after profile reload, hard refresh, or auth refresh.
- [ ] Adding tests around pantry changes after recipe generation or active cooking restore.

## Resolution criteria

This Effort is `Resolved` when all of the following are true:

1. A saved pantry change after viewing/generating a prep tray cannot silently leave an actionable stale recipe plan in place.
2. Guest and linked user flows both clear, invalidate, or explicitly confirm stale active plans after relevant inventory/profile changes.
3. Hard refresh after a pantry change does not restore a stale active plan or stale generated step tray.
4. Generated steps/session cache behavior remains reliable for legitimate refresh/reconnect restores that have not been invalidated.
5. Completed cooking history remains correct and intentionally separate from active stale plan state.
6. Focused tests cover pantry add/delete/reset/save after viewing a prep tray and at least one refresh/restore case.
7. Replit validation covers guest and linked paths through pantry change, prep tray/recipe generation, hard refresh, and stale-plan/history behavior.

## Suggested future validation

- Guest flow: generate/view prep tray, change pantry through add/delete/reset/save, confirm stale active plan is cleared or gated, then regenerate.
- Linked flow: repeat the same sequence after Google sign-in and profile persistence.
- Pantry add, delete, reset, and save after viewing a prep tray.
- Hard refresh after pantry changes to ensure stale active plan/session cache is not restored.
- Live Cooking refresh for a still-valid plan to ensure the PR #144 reliability behavior remains intact.
- History review after invalidation to ensure completed sessions remain correct and stale active plans do not create misleading history entries.

## Linked artifacts

- PR #146: <https://github.com/wmishak404/laica/pull/146>
- PR #146 merge commit: `ba924d6ad0f7ef0906d967a25ecb95fd7319da88`
- [`EFF-025: Settings unsaved inventory reminder`](effort-025-settings-unsaved-inventory-reminder.md)
- [`PR #144 merge closeout`](../docs/handoffs/2026-06-06-codex-pr-144-merge-closeout.md)
- [`Chef It Up Live Cooking reliability handoff`](../docs/handoffs/2026-06-05-codex-cooking-steps-context-schema.md)

## 2026-06-08 - Created from prod-push smoke stale prep tray observation

Wilson observed a stale prep tray/recipe plan remaining actionable after the saved pantry state changed materially. Created this Effort so future Settings, planning, and Live Cooking work can add an explicit invalidation rule without blocking PR #146 or the current production CSP push.

## 2026-06-08 - Implementation branch adds profile-basis invalidation

Branch `codex/deferred-stale-prep-plan-effort` pivoted from docs-only tracking into the first implementation pass after Wilson asked Codex to tackle the bug here. The branch adds a shared normalized planning-profile fingerprint and uses it to reject stale active cooking plans, Chef It Up planning sessions, and Live Cooking generated-step caches when saved pantry/kitchen/profile inputs no longer match the profile basis that produced the plan.

The branch also makes successful linked Settings saves notify the parent app after their API mutation, so the parent clears scoped active recipe/planning/cooking caches immediately instead of waiting for a hard refresh or profile-query refetch. Guest Settings saves already went through the parent callback; the same invalidation path now applies there.

Local validation completed:

- `npx vitest run tests/unit/planning-choice.test.tsx tests/unit/meal-planning.test.tsx tests/unit/live-cooking-guest-session.test.tsx` passed: 3 files, 37 tests.
- `npm run check` passed.
- `npm run build` passed with existing non-blocking Browserslist age, Firebase dynamic/static import, and chunk-size warnings.

Remaining before marking this Effort `Resolved`:

- Replit validation for guest and linked flows.
- Pantry add/delete/reset/save after viewing a prep tray.
- Hard refresh after pantry changes.
- Confirmation that valid unchanged-profile Live Cooking refresh remains reliable in the Replit runtime.
- History review to confirm completed sessions remain distinct from invalidated active plans.

## 2026-06-08 - Wilson Replit validation signal at `3180c17`

Wilson reported Replit validation on branch `codex/deferred-stale-prep-plan-effort` at head `3180c17bd6c8cb4309ce7354559102005a0c8464`.

Observed passing behavior:

- Guest flow did not resume a previous stale session.
- Signed-in flow did not resume a previous stale session.
- Changing the pantry mid-prep-tray decision did not restore the previous stale prep tray/session.
- History did not record the prep-tray decision as a cooking session until cooking actually started.

Evidence provenance: Wilson-reported Replit UI smoke in chat on 2026-06-08.

Remaining narrow validation before marking this Effort `Resolved`:

- Explicit hard refresh after pantry changes.
- Explicit unchanged-profile Live Cooking refresh to confirm the PR #144 restore path still holds in Replit.
- Pantry reset/delete/add variants if they were not covered by the mid-prep-tray pantry change.

## 2026-06-08 - Wilson Replit hard-refresh validation

Wilson reported that the Replit hard-refresh test passed after generating/viewing a prep tray from old pantry contents, changing/saving Pantry to new contents, and refreshing the app.

Observed passing behavior:

- After the pantry save and browser hard refresh, the old prep tray/session did not come back.

Evidence provenance: Wilson-reported Replit UI smoke in chat on 2026-06-08.

Remaining narrow validation before marking this Effort `Resolved`:

- Explicit unchanged-profile Live Cooking refresh to confirm the PR #144 restore path still holds in Replit.
- Pantry reset/delete/add variants if Wilson's mid-prep-tray pantry changes did not cover those exact saved-change paths.
