# Mobile Refresh Phase 2.1 — Setup Polish: Trust, Privacy, and Visual Conformance

**Status:** Validation Ready / Replit validation pending
**Phase owner:** Wilson
**Date:** 2026-04-29
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Source phase:** [Phase 2 setup](phase-02-setup.md)
**Mockup:** [phase-02-setup.png](../../../docs/assets/mobile-refresh/phase-02-setup.png)

## Goal

Polish the functional Phase 2 setup flow so it matches Laica's intended mobile-refresh design language, communicates trust and user control, and resolves the UI feedback found during PR #23 testing.

Phase 2.1 exists because PR #23 passed functional Replit validation but became too large to absorb another visual/interaction pass safely.

## Scope

- Combine `Upload one photo` and `Upload photos` into one clear `Upload photos` action.
- Make camera off by default. Users explicitly turn it on with a clear, accessible toggle and can turn it off again from the same control.
- Show an explicit scanning/processing animation after capture or upload while Laica analyzes results.
- Provide a real Back/escape path from setup step 1 without allowing incomplete users into cooking flows.
- Give manual entry the same visual importance as photo upload for privacy-sensitive users.
- Replace privacy-invasive pantry copy such as `Show me your pantry` with softer language. Candidate direction: `Let's take note of what you have.`
- Make Cooking Skill a one-tap single-choice step: selecting `Beginner`, `Intermediate`, or `Expert` accepts the answer and advances immediately.
- Preserve explicit continuation for multi-select steps such as Dietary Restrictions and future cuisine selection.
- Consider a first-time-user welcome/get-started page with useful introductory context similar in spirit to the pre-auth `What can you help me do?` content.
- Add the former EPIC-011 text-only scan safeguard: pantry and kitchen scans should reject text-only or text-dominant screenshots, documents, grocery lists, recipes, receipts, menus, or notes as inventory evidence.
- Keep packaging labels valid when they appear on visible physical pantry products or kitchen equipment; reject only text-only/document-like inputs with no physical objects.
- Route rejected text-only scans to clear feedback and manual entry instead of silently doing nothing.
- Bring setup screens closer to the Phase 2 mockup and mobile-refresh design language without changing the already-validated backend/data contract.
- Apply the Phase 2.1 visual conformance pass in setup only: cream/coral phone-flow shell, designed scan object, warm chips, illustrated setup states, sticky bottom actions, and `Fraunces` / `Nunito` setup typography as a documented pilot for later phases.
- Apply Wilson's 2026-04-30 Replit visual feedback before merge: remove setup's redundant top brand/section chips, use a single top progress bar, move camera controls into the camera object, improve button readability, update copy, and introduce more illustration-led setup choice icons.

## Acceptance Criteria

- Camera starts off by default and can be toggled on/off through an accessible control.
- Upload and manual entry are peer-level alternatives, not a primary/private-secondary hierarchy.
- Upload is represented by one clear action while preserving the validated batch limits.
- Upload batches over the pantry/kitchen cap are canceled as a whole instead of partially processing the first allowed files; this applies in setup and Settings.
- Pantry and Kitchen vision scan rate-limit meters are separate so exhausting Pantry attempts does not block Kitchen/equipment validation.
- Capture/upload analysis shows an explicit scanning or processing state while results are pending.
- Pressing Back during an active Pantry or Kitchen scan cancels that scan, stops the pending state, and prevents stale scan results from adding items after the user leaves the step.
- Camera unavailable, permission-blocked, or camera-in-use paths show clear user-safe feedback and keep upload/manual alternatives available.
- Successful camera capture gives an immediate visual flash cue before analysis continues.
- Step 1 has a clear Back/escape affordance that does not bypass required setup.
- Pantry copy is privacy-aware and avoids language that implies invasive inspection.
- Pantry setup requires at least 3 ingredients before continuing and explains the requirement when the user attempts to proceed with fewer.
- Cooking Skill auto-advances after one full-row selection.
- Multi-select steps retain explicit continuation.
- Text-only ingredient screenshots do not add pantry ingredients.
- Text-only equipment screenshots do not add kitchen equipment.
- Physical pantry/kitchen photos with readable labels still detect real visible products or tools.
- Rejected text-only scans show clear feedback and offer manual entry.
- Scan failure feedback distinguishes text-only rejection, valid no-detection, rate limiting, unreadable/oversized photos, and generic service failures instead of using one ambiguous message for all paths.
- Manual entry buttons show a lightweight active state when their entry panel is open.
- Manual entries are normalized, deduped, length-clamped, and stripped of common prompt-marker sequences before being saved into setup/profile flows.
- Manual entries split on commas and also treat periods as commas for common typo recovery; other punctuation/operators are not separators.
- Setup screens visibly conform to the Phase 2 mockup direction and design-language draft.
- Setup typography is scoped to setup-only utilities and does not change global app typography.
- User-facing brand text uses `Laica`, not all-caps `LAICA`.
- Setup uses a single top progress treatment like the mockup's `1/5` bar instead of a `Laica setup` chip plus `Step X of 5` and section labels.
- Pantry scan uses the heading `Start with pantry staples.`
- Welcome uses the heading `Yes, Chef!` and keeps the supporting copy to one sentence.
- The pantry/kitchen camera object uses iPhone-like in-frame controls: large circular capture button centered at the bottom of the viewfinder, camera on/off icon at bottom left, and scanning tips at bottom right as a small in-context overlay.
- `Upload photos` and `Enter manually` labels are readable on a phone and consistent across pantry/kitchen setup.
- Manual pantry placeholder cycles among generic staple examples with at least three ingredients on each setup mount/page refresh, while staying stable during the current setup flow; the visible note tells users pantry items can be separated by commas.
- Kitchen scan keeps the Step 1 interaction model but shifts some accents toward gray/silver and light wood beige so it feels more utilitarian and tool-native than pantry.
- Cooking Skill uses `How comfortable are you with cooking?` and `You will get guidance based on this. You can change this later.`
- Cooking Skill and Dietary Restrictions use relevant multicolor illustrations rather than monochrome coral-only icons.
- `No restrictions` is isolated and visually distinguished from the other dietary options.
- Confirmation keeps its current page structure, while its icons should stay consistent with the accepted illustration direction.
- Replit validation is rerun at the latest Phase 2.1 runtime head before merge.

## Validation Checklist

Phase 2.1 is visually accepted by Wilson as of the latest setup review. Merge readiness now depends on validating the implemented behavior at the latest branch head in Replit and recording the validated commit SHA.

### Local Gates

- `npm run check`
- `npm run build`
- Focused Vitest coverage:
  - `tests/unit/equipment-vision-prompts.test.ts`
  - `tests/unit/vision-analysis-result.test.ts`
  - `tests/unit/vision-result.test.ts`
  - `tests/unit/entry-parsing.test.ts`
  - `tests/unit/rate-limit.test.ts`
  - `tests/unit/native-camera.test.tsx`
  - `tests/unit/user-profiling.test.tsx`

### Replit Prerequisites

- Replit has fetched the latest `codex/mobile-refresh-phase-2-1-setup-polish` branch head.
- Validator is signed in with Google.
- Test with a first-time or reset profile user so setup starts from Welcome.
- Test Settings upload behavior with an already completed profile.
- Record `Last Replit-validated at: <commit-sha>` in the PR description and handoff after validation passes.

### Replit Acceptance Checklist

- **App shell:** authenticated pages do not show the old persistent top header; account/profile/feedback/sign-out access is available through the menu surface.
- **Welcome:** first-time setup starts on `Yes, Chef!`, has no `Kitchen warm-up` eyebrow, and `Get started` enters pantry setup.
- **Back/escape:** Back from Pantry returns to Welcome; incomplete users cannot use Back/menu paths to enter Planning.
- **Scan cancellation:** starting a Kitchen upload/capture, then pressing Back, cancels the active scan; returning to Kitchen should not keep showing a stale processing state or add stale results.
- **Progress/chrome:** setup uses one top progress treatment; Pantry shows `1/5`, Kitchen shows `2/5`, and both keep coral progress.
- **Pantry visual/copy:** Pantry uses `Start with pantry staples.`, warm setup typography, readable `Upload photos` / `Enter manually` actions, and no technical helper sublabels.
- **Pantry minimum:** tapping `Next` with fewer than 3 pantry ingredients keeps the user on Pantry and shows `There's gotta be more in your pantry! Please have at least 3 ingredients to proceed.`
- **Camera opt-in:** Pantry and Kitchen camera previews start off; turning camera on starts a live preview, turning it off stops tracks, permission denial leaves upload/manual alternatives available.
- **Camera errors:** camera unavailable, permission denied, and camera-in-use paths show clear `Camera issue` feedback and leave upload/manual entry usable.
- **Capture feedback:** camera capture briefly flashes the preview so the user can tell the shot was taken before scan processing starts.
- **Camera controls:** camera on/off and tips controls are smaller translucent circles with large icons; capture is a blank shutter; tips use a non-flashlight help icon and open an in-context overlay.
- **Pantry upload:** uploading 1-8 supported pantry photos processes normally and shows scanning/processing state; selecting 9 or more cancels the whole batch and adds/scans nothing.
- **Kitchen upload:** uploading 1-6 supported kitchen photos processes normally and shows scanning/processing state; selecting 7 or more cancels the whole batch and adds/scans nothing.
- **Scan abuse meters:** hitting the Pantry scan-limit path does not block Kitchen/equipment scans; hitting the Kitchen scan-limit path does not block Pantry scans.
- **Settings upload:** the same fail-closed upload cap behavior applies in Settings for pantry and kitchen photo uploads.
- **Manual entry:** comma-separated pantry and kitchen manual entries create separate chips; missing spaces after commas still split; periods also split common mistakes such as `ground beef. mayo. rice`; the Pantry manual panel visibly notes comma separation.
- **Pantry placeholder rotation:** Pantry manual examples cycle across setup mounts/page refreshes among staple sets such as raw chicken/broccoli/spaghetti, parmesan/sumac/chili crisp, and hummus/eggs/rice; the example stays stable while the user remains in the current setup flow.
- **Manual active state:** tapping `Enter manually` lightly shades that action while the manual-entry panel is open, on both Pantry and Kitchen.
- **No-detection feedback:** valid pantry/kitchen photos with no detectable inventory produce clear no-detection feedback instead of ending silently.
- **Text-only rejection:** screenshots, documents, grocery lists, receipts, menus, recipes, and notes are rejected for pantry and kitchen scans, add nothing, and route the user toward manual entry.
- **Scan error taxonomy:** repeated scans/rate limits show a scan-limit message; unreadable/oversized images show photo-specific guidance; these paths do not add partial batch results after a fatal batch error.
- **Physical photo allowance:** physical pantry products and kitchen tools with readable packaging/labels are still accepted when visible objects are present.
- **Kitchen visual treatment:** Kitchen keeps the shared Pantry interaction model while using gray/silver and light wood accents for equipment-specific controls and chips.
- **Cooking Skill:** `Beginner`, `Intermediate`, and `Expert` selections save and auto-advance immediately.
- **Dietary Restrictions:** `No restrictions` is isolated and visually distinct; multi-select choices keep explicit `Next` continuation.
- **Confirmation:** Step 5 keeps the accepted visual direction, summarizes saved setup data, and `Finish setup` transitions to Planning.
- **Contracts:** `/api/vision/analyze` input remains unchanged, response additions remain backward-compatible, and no DB schema changes are introduced.

### Merge Acceptance

- All local gates pass at the branch head being validated.
- Replit validation passes at the same commit SHA.
- The PR description and latest handoff record `Last Replit-validated at: <commit-sha>`.
- Any later commit after that SHA makes validation stale and requires a fresh Replit pass before merge.

## Epic Interactions

- EPIC-001: New setup typography and visual utilities must remain scoped and documented as a pilot rather than a silent global primitive/font change.
- EPIC-004: Single-choice setup rows may auto-advance; multi-select screens retain explicit continuation.
- EPIC-005: Phase 2.1 needs fresh validation because it changes runtime UI after the PR #23 Replit pass; the checklist above is the phase-level acceptance record.
- EPIC-007: Pantry and Kitchen scans must show explicit no-detection feedback for valid zero-result photos.
- EPIC-009: Comma-separated manual entry behavior must remain consistent for setup pantry/kitchen entries; Phase 2.1 also accepts periods as typo recovery for manual entry only.
- EPIC-010: Phase 2.1 must not add DB schema changes or reopen the validated Phase 2 data contract.
- EPIC-011 / PR #24: The standalone text-only scan safeguard epic is superseded by this Phase 2.1 scope.
- EPIC-012: Phase 2.1 is the accepted setup visual-conformance pilot, pending final Replit functional validation.

## Out Of Scope

- Reopening the Phase 2 backend contract.
- Building OCR import for grocery lists, recipes, receipts, screenshots, or typed inventories.
- Dropping the legacy `weekly_time` DB column.
- Redesigning the Phase 3 Planning entry screen, except where a first-time welcome handoff touches setup-to-planning transition copy.

## 2026-04-30 Replit Visual Feedback

Wilson reviewed the visual conformance pass in Replit and accepted the overall direction but requested another setup polish iteration before merge:

- **All app pages:** remove the persistent header from the app; users should access account info, sign-out, and profile through the bottom menu/account surface.
- **Brand casing:** use `Laica` in user-facing text instead of all-caps `LAICA`.
- **Setup chrome:** remove the redundant `Laica setup`, `Step X of 5`, and section-label chips; use that space for a single top progress bar like the mockup.
- **Welcome:** change `Let's set up your kitchen.` to `Yes, Chef!`; keep supporting copy to one sentence by removing `Then Laica can stop guessing.`
- **Step 1 Pantry:** move the camera on/off control into the camera view; make capture a large centered circle like iPhone camera UI; place camera mute/on-off at bottom left; place scanning tips at bottom right as a small transparent popover/overlay; enlarge `Upload photos` and `Enter manually`; use generic pantry manual examples.
- **Step 2 Kitchen:** keep the same component behavior as Pantry but make the page feel more utilitarian by replacing some coral accents with gray/silver and light wood beige.
- **Step 3 Cooking Skill:** change heading to `How comfortable are you with cooking?`; change helper copy to `You will get guidance based on this. You can change this later.`; replace monochrome coral icons with relevant multicolor illustrations closer to the mockup.
- **Step 4 Dietary Restrictions:** use relevant multicolor dietary illustrations; isolate and visually distinguish `No restrictions` as the default-style choice.
- **Step 5 Confirmation:** current page direction is accepted; preserve it while aligning icon treatment with the new illustration direction.

## 2026-04-30 Implementation Note

Codex implemented the Replit visual feedback on `codex/mobile-refresh-phase-2-1-setup-polish` after the docs capture:

- The authenticated `/app` shell no longer renders its fixed top header, and legacy page-level `Header` imports were removed from the remaining app pages.
- Setup now uses one top progress bar/count instead of separate `Laica setup`, `Step X of 5`, and section-label chips.
- Welcome copy now opens with `Yes, Chef!` and uses one supporting sentence.
- Pantry now uses `Start with pantry staples.` and a generic manual placeholder.
- The setup camera variant now places camera on/off, circular capture, and scanning tips inside the camera viewfinder.
- Kitchen uses the same component pattern with a more utilitarian gray/silver and light wood accent pass.
- Upload/manual labels were enlarged for phone readability.
- Cooking Skill copy was updated and skill/dietary rows use multicolor illustration tokens.
- `No restrictions` is isolated as a distinct default-style dietary choice.
- Confirmation keeps its accepted structure while aligning row icons with the illustration token direction.

Local checks passed; Replit validation at the implementation head is still required before merge.

## 2026-04-30 Follow-up Replit Polish

Wilson's next Replit pass kept the overall direction and requested a narrower polish update before merge:

- **General:** keep the persistent header removed, but retain a menu affordance somewhere for account, feedback, and sign-out access.
- **Step 1 Pantry:** replace `Tell me what you have.` with a friendlier, less privacy-invasive heading of six words or fewer. The current implementation uses `Start with pantry staples.`
- **Camera controls:** make the camera on/off and scanning tips controls visible but not opaque primary CTAs; use smaller translucent circles with larger icons. Scanning tips should not use a lightbulb/lamp icon because that suggests flashlight behavior.
- **Upload/manual actions:** remove technical helper labels such as `Up to 8 at once`, `Up to 6 at once`, and `Comma-separated works`; keep the main action labels large and readable.
- **Step 2 Kitchen:** push gray/silver accents further, especially for `Save equipment` and kitchen-list chips/items, while preserving the shared scan/manual/upload behavior.

## 2026-04-30 Follow-up Implementation Note

Codex implemented that follow-up polish locally on `codex/mobile-refresh-phase-2-1-setup-polish`:

- Added a setup-scoped account menu slot in the setup frame and a persistent `Menu` item in the post-setup bottom nav, without restoring the top header or allowing incomplete users into Planning.
- Removed the `Kitchen warm-up` eyebrow from the Welcome page so `Yes, Chef!` is the first welcome copy users see.
- Updated the Pantry heading to `Start with pantry staples.`
- Revised the in-camera controls to use smaller translucent circles with larger camera/tips icons, removed the camera glyph from the capture shutter, changed tips to a help-circle icon, and kept controls inside the viewfinder.
- Removed the small technical helper lines below `Upload photos` and `Enter manually`.
- Extended Kitchen's gray/silver and light-wood treatment to secondary action icons, manual save, input border, and list chips/remove controls while keeping the setup progress bar coral across steps for consistency.

Local check, focused Vitest, and build passed after the code changes; Replit validation at the latest branch head is still required before merge.

## 2026-04-30 Upload Limit Behavior

Wilson's functionality testing clarified that partial batch processing is confusing: if a user selects more than the pantry or kitchen photo limit, processing only the first allowed photos leaves them guessing which pantry/kitchen angles were actually scanned.

Accepted behavior:

- Pantry still caps setup uploads at 8 photos per batch.
- Kitchen still caps setup uploads at 6 photos per batch.
- Selecting more than the cap cancels the whole batch, shows the limit message, and does not send any selected photo for analysis.
- The same fail-closed rule applies to setup and Settings so users do not have to learn different upload behavior later.
- Users can then reselect a smaller, intentional batch.

## 2026-04-30 Visual Acceptance Checkpoint

Wilson confirmed the Phase 2.1 setup design now looks great after the visual conformance, menu/camera-control, welcome-copy, Kitchen-accent, and upload-limit passes.

Accepted durable visual direction for setup:

- Setup-scoped `Fraunces` display type and `Nunito` UI/body type remain the Phase 2.1 pilot direction.
- Welcome starts directly with `Yes, Chef!`.
- Setup uses the warm cream/coral phone-flow treatment and one top progress bar.
- Pantry and Kitchen share the same scan/manual/upload component model.
- Kitchen can use gray/silver and light wood accents for equipment-specific actions and chips, but setup progress stays coral across steps.
- Camera controls live inside the scan object, with translucent utility controls and a blank capture shutter.
- Manual entry remains visually peer-level with photo upload.

No further visual polish is required before Phase 2.1 validation unless Replit testing finds a regression.

## 2026-04-30 Functional Validation Feedback

Wilson's Phase 2.1 functional testing of items 1-14 surfaced a few scan-state and feedback issues before the remaining validation items:

- Pressing Back during a Kitchen scan looked like a cancellation but the scan continued in the background; returning to Kitchen could still show processing or receive stale results.
- The generic batch error `Some photos could not be scanned. Review what was added, then try the missed angle again.` was too ambiguous, especially when testing text-only rejection and repeated uploads.
- Repeated uploads of a clear physical equipment image, such as `equipment2.png`, can surface transport or rate-limit failures that should not be confused with text-only rejection or no-detection.
- Camera failure paths needed clearer review: unsupported camera, permission denial, and camera-in-use should all explain the issue while preserving upload/manual paths.
- Camera capture needed a small success cue before scan processing.
- Manual-entry toggles needed a lightweight active visual state.
- Manual-entry prompt-injection precautions should be explicit in docs.

Accepted implementation response:

- Setup scans now use abortable request controllers and scan run IDs. Back cancels the active Pantry/Kitchen scan and stale results are ignored.
- Fatal batch failures no longer apply partial detected results after the error; users get a clearer reason and can retry intentionally.
- Text-only/document-like rejection still uses the rejection-specific manual-entry guidance; rate-limit, oversized/unreadable image, auth, and generic service failures each get distinct copy.
- Camera unavailable/blocked paths now emit clear toast messages through `Camera issue` and keep alternatives visible.
- Setup camera capture briefly flashes the viewfinder after a frame is captured.
- Manual-entry action buttons use `aria-pressed` plus an active visual state while open.
- Manual entries share the normalized comma-separated parser, clamp labels to 64 characters, dedupe entries, and strip common prompt-marker sequences client-side; server prompt paths also sanitize prompt-marker sequences before model use.

## 2026-04-30 Test Results Follow-up

Wilson reported the latest Replit test pass as passing except for constrained/unavailable cases:

- Tests 8a and 8c could not be tested; 8b passed.
- Test 20 passed for Pantry abuse/rate-limit behavior, but the shared meter then blocked Kitchen/equipment scans. Accepted follow-up: split vision scan rate-limit keys by Pantry and Kitchen.
- Test 16 found that `ground beef. mayo. rice` was treated as one ingredient. Accepted follow-up: periods count as separators for manual-entry typo recovery, while other symbols/operators do not.
- Test 16 also requested a visible note that pantry items can be separated by commas.
- Test 21 could not be completed because Test 20 exhausted the shared scan meter.

Implemented response:

- `/api/vision/analyze` remains the same endpoint and body contract, but client calls now include `X-Laica-Scan-Type: pantry|kitchen`; server vision rate-limit keys include that scan context.
- Setup and Settings both send the scan context for pantry and kitchen scan calls.
- Manual entry now splits on commas and periods, handles missing spaces after commas, and keeps the existing normalize/dedupe/64-character clamp behavior.
- Pantry setup now requires at least 3 ingredients before continuing and shows `There's gotta be more in your pantry! Please have at least 3 ingredients to proceed.` when the user tries to continue with fewer.
- Pantry manual entry now includes a visible comma-separation note and cycles through more varied staple placeholders.

### Test 19 Placeholder Rotation Clarification

Wilson found that the placeholder could remain stuck on `parmesan, sumac, chili crisp` across refresh and re-login because the implementation used random selection instead of a guaranteed rotation.

Accepted behavior:

- Pantry manual placeholder examples cycle deterministically across setup component mounts using local browser storage.
- Page refresh or a login/remount that shows setup advances to the next example.
- Opening/closing manual entry or moving between setup steps keeps the current example stable.
- If browser storage is unavailable, the first placeholder is used as a safe fallback.

Recommended reduced next Replit test plan:

- Pull the latest branch head and restart Replit so the in-memory old shared rate-limit bucket is cleared.
- Re-test Test 16 only around manual entry: comma without spaces, periods as separators, visible comma note, at least-3 pantry guard, and 3+ ingredients proceeding to Kitchen.
- Re-test Test 19 by refreshing or remounting setup and confirming the Pantry manual placeholder advances, while staying stable within the current setup flow.
- Re-test Test 20 by hitting the Pantry scan-limit path, then confirm Kitchen/equipment scans are not blocked by the Pantry meter.
- Re-test Test 21 after the restart/rate-limit split using `equipment2.png` or another physical equipment photo.
- Spot-check no regressions on upload caps and text-only rejection only if they are touched by the above path.
- Do not repeat visually accepted setup screens, Cooking Skill auto-advance, Dietary explicit continuation, or header/menu visual checks unless Replit shows a regression.

Non-gating follow-up:

- Toast dismissal currently supports the existing right-swipe gesture. Multi-direction dismissal for left/up swipes is deferred as a shared toast primitive follow-up, not a Phase 2.1 merge gate; down swipe should remain non-dismissive if implemented later.
