# EPIC-007 — Vision scan should explicitly say when nothing was detected

**Status:** Open
**Owner:** Wilson (product direction) / Codex (doc capture) / Claude (future implementation review)
**Created:** 2026-04-27
**Updated:** 2026-04-28

## One-line summary

Preserve the “valid zero-result scan should tell the user something” gap as a small follow-up discovered during equipment-scan validation, so it is not forgotten while EPIC-006 continues.

## Context — why this exists

During local fixture testing for equipment vision, several negative-control images correctly returned empty detection arrays: luggage-only photos, living-room photos, and other scenes with no kitchen equipment. That is useful model behavior, but it exposed a smaller UI follow-up: some scan surfaces explicitly say nothing was found, while others end silently.

### Current implementation (evidence)

- `client/src/components/cooking/user-settings.tsx` already shows explicit toast feedback for zero-result scans:
  - pantry: `No ingredients detected`
  - kitchen: `No equipment detected`
- `client/src/components/cooking/user-profiling.tsx` is inconsistent:
  - pantry single-image flow shows an alert for zero results
  - kitchen single-image flow only mutates state when equipment is found and otherwise ends silently
  - multi-image upload flow for both pantry and kitchen only updates state when results exist and otherwise ends silently

The result is a small but real UX gap: a user can take a valid photo that genuinely contains no equipment and the app may close the camera with no explanation, making it unclear whether the scan failed or simply found nothing.

## Scope

### In scope

- Capturing the zero-result feedback gap so it stays visible during ongoing and future equipment-scan validation
- Recording which scan surfaces already communicate zero-result outcomes and which still end silently
- Preserving the default direction that pantry and kitchen zero-result scans should eventually give explicit feedback
- Keeping the follow-up tied to the current equipment-scan validation context rather than broadening it into a larger UX initiative

### Out of scope

- Implementing the UI change in this filing pass
- Changing the vision model itself
- Choosing the final toast / alert / inline pattern now
- Broad scan-feedback redesign or wider onboarding UX cleanup

## Decisions made so far

- This should be tracked separately from EPIC-006 so the no-detection feedback gap is not lost inside model-quality work.
- The current behavior gap is real even when the model is behaving correctly.
- Zero-result scans should be considered a valid outcome, not an error.

## Open questions

### 1. What is the canonical feedback pattern?

This filing pass does not decide the final UI pattern. The default future lean is to reuse lightweight explicit messaging already present in `user-settings.tsx` rather than inventing a new interaction.

### 2. Should pantry and kitchen copy eventually stay parallel?

Default lean:

- `No ingredients detected`
- `No equipment detected`

Exact copy can be finalized later when implementation starts.

### 3. How much of this should be revisited when EPIC-006 validation continues?

Default lean: use this epic as a reminder during future equipment-scan validation runs and only expand it if repeated testing shows the silent-zero-result behavior is materially confusing in practice.

## Agent checklist — when to read or reopen this epic

Read EPIC-007 before starting any of the following:

- [ ] Editing image-scan result messaging in `client/src/components/cooking/user-settings.tsx`
- [ ] Editing image-scan result messaging in `client/src/components/cooking/user-profiling.tsx`
- [ ] Changing what happens after `/api/vision/analyze` returns empty arrays
- [ ] Defining acceptance criteria for zero-result pantry or equipment scans during future validation work

When this epic gains new signal, update it with a dated chronology section and cite whether the work conforms to or expands this reminder/backlog direction.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. The accepted follow-up implementation explicitly communicates zero-result outcomes on the pantry and kitchen scan surfaces that currently end silently.
2. At least one known negative-control image is used to verify that a valid empty scan produces clear user feedback.
3. A handoff or product note records the chosen UX pattern so future validation work does not rediscover the same gap.

## Linked artifacts

- `client/src/components/cooking/user-settings.tsx`
- `client/src/components/cooking/user-profiling.tsx`
- `epics/006-equipment-vision-exclusions.md`

## Chronology — how we got here

### 2026-04-27 — Epic created from live negative-control testing

While validating equipment-vision fixes with living-room and luggage-only photos, the model correctly returned empty arrays for several scans. That surfaced a separate UI follow-up: some scan flows clearly say “No equipment detected,” while others silently finish with no explanation. Wilson asked to capture this as a small backlog epic so it remains visible while EPIC-006 continues, rather than disappearing behind model-quality work.

### 2026-04-28 — Mobile refresh makes zero-result scan feedback an acceptance criterion

Phase 2 setup and Phase 5 post-cook rescan both require explicit no-detection feedback. This conforms to the epic direction and broadens the expected implementation surface from current onboarding/settings scans to the new camera-first scan and cleanup-rescan flows.

### 2026-04-29 — Phase 2 setup scan now treats empty results as a valid outcome

The Phase 2 setup branch (`codex/mobile-refresh-phase-2-setup`) routes the new pantry and kitchen setup scan surfaces through explicit `No ingredients detected` / `No equipment detected` toast feedback instead of ending silently. The same branch keeps Settings scan feedback explicit. Remaining validation before resolving this epic: authenticated Replit smoke with at least one negative-control pantry/kitchen image.
