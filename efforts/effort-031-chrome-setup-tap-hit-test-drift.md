# EFF-031 - Chrome setup tap hit-test drift

**Status:** Resolved
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-14
**Updated:** 2026-07-14
**Linked Initiatives:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## One-line summary

Chrome mobile-browser setup tap drift was fixed by locking the outer document/root scroll while setup owns the visible scroll surface.

## Context

During validation of the INIT-001 browser-viewport setup work, Wilson confirmed that the setup bottom-rail dead-space issue appeared solved, but then hit an intermittent Chrome-only tap/hit-test problem:

- On a first-time setup run, tapping items sometimes did not select the exact row/button tapped.
- After eventually reaching the `You are ready` page, the `Back` button could become untappable.
- Refreshing the browser returned to the setup page and the same controls worked normally.
- Restarting the setup flow made the problem reproducible again at least once.
- DuckDuckGo on the same phone did not reproduce the issue.

This makes the issue non-negligible even though it is intermittent: Chrome may be retaining or misapplying visual viewport, scroll, fixed-position, sticky, transform, or overlay state after step transitions.

This Effort was intentionally separate from the immediate scroll-containment repair and from the separate camera-proportion thread `019f5f00-e389-7873-af20-a47a3ff66da3`.

## Scope

### In scope

- Reproduce or instrument the Chrome mobile-browser tap mismatch during first-time setup.
- Audit setup surfaces for invisible overlays, stale fixed/sticky layers, pointer-event interception, transformed scroll containers, and visual-viewport/document-scroll offset drift.
- Verify that Pantry, Tools, cooking skill, dietary restrictions, and `You are ready` Back/Finish controls receive taps on the element visibly under the finger.
- Preserve the accepted scroll-containment rule: setup pages should stop at the Back/Next rail and should not regain the inert blank bottom tail.
- Add focused regression coverage where practical, such as DOM hit-target assertions, Playwright mobile viewport checks, or a small event-target instrumentation helper used only in tests.
- Validate on Chrome mobile browser or a Chrome-equivalent Replit preview path before claiming resolution.

### Out of scope

- Camera preview proportions, camera-off copy composition, or camera visual redesign.
- Adding the cooking-skill bottom `Next` action; see [EFF-030](effort-030-setup-skill-next-action.md).
- Reworking the full setup visual system, fonts, or Phase 2 setup information architecture.
- Treating DuckDuckGo success as sufficient proof that Chrome is fixed.

## Decisions made so far

- The rail dead-space issue is considered solved enough to move on; this Effort tracks the separate tap/hit-test bug.
- Wilson will continue doing phone-browser QA, but the implementation should not rely on desktop Chrome/Replit visual checks for final UX acceptance.
- Refresh clearing the issue is important evidence and should be preserved in investigation notes.

## Open questions

None remaining for this Effort. The accepted mitigation is documented below; future camera proportion and cooking-skill Next-action follow-ups remain in EFF-029 and EFF-030.

## Agent checklist

Read this Effort before:

- Changing first-time setup scroll containment, fixed-position setup shells, sticky/floating action rails, or setup page transitions.
- Debugging Chrome-only mobile-browser tap behavior in setup.
- Claiming INIT-001 browser-fit setup QA is complete.

When investigating:

- Record exact branch/SHA, browser, phone/browser chrome state, and whether the page was freshly loaded or resumed from setup draft.
- Capture observed facts separately from inference.
- Check for overlay/pointer-event blockers before changing tap handlers.
- Keep any mitigation narrow and reversible.

## Resolution criteria

This Effort is `Resolved` when:

1. Chrome mobile-browser setup taps reliably target the visible row/button across Pantry, Tools, cooking skill, dietary restrictions, and `You are ready` Back/Finish after a fresh setup run and after refresh/resume.
2. The root cause or accepted mitigation is documented.
3. Focused automated coverage or a documented reason for manual-only coverage is attached.
4. Human Chrome mobile-browser validation passes on the exact branch/head, or an accepted release-batch validation deferral is recorded with the exact remaining checks.
5. The setup bottom-rail scroll-containment fix remains intact.

## 2026-07-14 - Created from Chrome mobile setup QA

Wilson reported intermittent Chrome-only first-time setup tap mismatch after the bottom-rail dead-space fix: taps could select the wrong visible item or stop working on `You are ready`, while a browser refresh restored correct behavior and DuckDuckGo did not reproduce it.

## 2026-07-14 - Reproduced again with primary-button tap-state symptom

Wilson reproduced the wrong-location tap behavior again in Chrome/Replit browser setup. The report also surfaced a separate but adjacent annoyance: primary setup action buttons such as `Save ingredients` and `Next` can turn their text from white to black when tapped. Current inference was that the black text was a sticky mobile interaction state from the shared `ghost` button variant's hover/focus text color leaking through the setup primary button class. The primary-button text-state issue was patched narrowly in PR #291; the broader wrong-target tap drift remained pending until the later document-scroll-lock validation below.

## 2026-07-14 - Outer document scroll identified as likely tap-offset cause

Wilson reproduced the tap mismatch with a more specific pattern: when the setup page's right-side scrollbar/rail was at the bottom with visible extra range below the Back/Next rail, taps on `Skip tools` / `Next` registered only when pressing noticeably above the visual button. Scrolling the rail back to the top made buttons register normally again, and the bad offset could carry into the next setup page. Current inference is that the fixed setup frame and browser document/root scroll range were both alive, causing mobile Chrome/Replit hit testing to disagree with the visible setup frame after the outer scroll moved.

PR #291 then added a setup-mounted document/root scroll lock: `html`, `body`, and `#root` are constrained to `100dvh` with overflow hidden while `UserProfiling` is mounted, and `.setup-scroll-body` remains the only intended scroll surface. Focused unit coverage verifies the lock/restoration contract. At that point this narrowed the likely root cause but still required Wilson's Chrome mobile/Replit validation at the exact patched head before closeout.

## 2026-07-14 - Resolved by setup document scroll lock

Wilson loaded PR #291 head `6f52420` to Replit and confirmed the finding solved the Chrome/Replit mobile tap-offset issue. The accepted root cause/mitigation is that the fixed setup frame and the outer document/root scroll range were both active; after the browser had scrolled the hidden outer range, Chrome hit testing could disagree with the visible Back/Next rail. `UserProfiling` now locks `html`, `body`, and `#root` to `100dvh` with overflow hidden while setup is mounted, leaving `.setup-scroll-body` as the only setup scroll surface.

Resolution evidence:

- Human Chrome/Replit mobile validation passed at `6f52420` for the reported wrong-location setup tap behavior.
- Wilson observed that the inert/extra page railing was gone and that the setup buttons pressed during the validation path executed their expected functions, including the bottom Back/Next-style actions and row selections.
- Focused coverage in `tests/unit/user-profiling.test.tsx` verifies the setup document-scroll lock is applied and restored.
- `tests/unit/setup-button-css.test.ts` guards the adjacent primary-button sticky tap-state text color issue.
- The accepted setup rail rule remains: setup pages should stop at the Back/Next rail and must not expose inert bottom scroll space under the rail.

## 2026-07-15 - Merge closeout

PR #291 merged into `main` as `766d910` from final head `1c03c21`. The final merge retained the accepted mitigation and the documented human validation: Wilson observed the inert/extra railing was gone and setup buttons pressed during validation executed their expected functions. This Effort remains resolved; EFF-030 was later resolved by PR #296, and camera-proportion work remains outside this Effort.
