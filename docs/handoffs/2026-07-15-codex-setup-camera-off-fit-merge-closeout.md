# Setup camera off-state fit merge closeout

**Agent:** codex
**Date:** 2026-07-15
**Merged PR:** [#291](https://github.com/wmishak404/laica/pull/291)
**Merge commit:** `766d910b128f84213d2a79a8077100d3df4272d8`
**Merged head:** `1c03c21fef0388ece8d18ba1f1f87598b547c580`
**Branch:** `codex/setup-camera-off-fit`
**Initiative:** [INIT-001 - Mobile Refresh](../../initiatives/INIT-001-mobile-refresh.md)
**INIT updated:** yes

## Summary

PR #291 merged the setup mobile-browser camera/off-state and scroll-containment repair. The durable lesson is that first-time setup must keep one owned scroll surface: `.setup-scroll-body`, with `html`, `body`, and `#root` locked while setup is mounted, so Chrome/Replit mobile hit testing cannot drift against a hidden document scroll range under the fixed setup frame.

## Merge facts

- PR #291 merged to `main` as `766d910` on 2026-07-15.
- Source head was `1c03c21`.
- Exact-head checks passed before merge: `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL.
- Wilson's human Chrome/Replit mobile validation at runtime head `6f52420` confirmed the inert/extra railing was gone and setup buttons pressed during validation executed expected functions.
- The final `1c03c21` commit only added documentation of that human validation evidence.

## Closeout updates

- Updated INIT-001 with the PR #291 merge fact, validation summary, current resume point, validation state, and chronology entry.
- Updated the initiative registry with the PR #291 merge signal.
- Updated EFF-031 and the Effort registry with the merge commit and final evidence.

## Remaining scope

- EFF-031 is resolved.
- EFF-030 remains open for the setup cooking-skill explicit bottom Next action.
- EFF-028 and EFF-029 remain the next adjacent visual/layout follow-ups after this merge.
- Camera proportion/text composition remains outside this closeout and should continue in its separate thread/effort path.
- No production deploy or full provider/service QA was performed by this closeout.
