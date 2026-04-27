# EPIC-007 — Vision scan should explicitly say when nothing was detected

**Status:** Open
**Owner:** Wilson (product direction) / Codex (doc capture) / Claude (future implementation review)
**Created:** 2026-04-27
**Updated:** 2026-04-27

## One-line summary

When a pantry or kitchen image scan legitimately finds nothing, the UI should explicitly tell the user that no ingredients or equipment were detected instead of silently doing nothing.

## Context — why this exists

During local fixture testing for equipment vision, several negative-control images correctly returned empty detection arrays: luggage-only photos, living-room photos, and other scenes with no kitchen equipment. That is useful model behavior, but the user experience is inconsistent across scan surfaces.

### Current implementation (evidence)

- `client/src/components/cooking/user-settings.tsx` already shows explicit toast feedback for zero-result scans:
  - pantry: `No ingredients detected`
  - kitchen: `No equipment detected`
- `client/src/components/cooking/user-profiling.tsx` is inconsistent:
  - pantry single-image flow shows an alert for zero results
  - kitchen single-image flow only mutates state when equipment is found and otherwise ends silently
  - multi-image upload flow for both pantry and kitchen only updates state when results exist and otherwise ends silently
- `client/src/components/cooking/user-profiling.tsx` also mixes browser `alert(...)` calls with quieter toast-based messaging used elsewhere, so the same user action can feel abrupt on one screen and silent on another.

The result is a UX gap: a user can take a valid photo of a living room or an empty/non-kitchen scene and the app may simply close the camera with no explanation, leaving them to guess whether the scan failed, hung, or succeeded with zero matches.

## Scope

### In scope

- Defining the expected UI feedback when a vision scan returns zero ingredients and/or zero equipment
- Normalizing that feedback across the pantry and kitchen scan flows
- Covering single-image camera capture, HEIC conversion paths, and multi-image upload flows
- Deciding whether zero-result feedback should use toasts, inline status, alerts, or a combination
- Capturing the copy standard for this case (for example: “No equipment detected” with a short next-step hint)

### Out of scope

- Changing the vision model itself
- Changing the detection taxonomy for ingredients or equipment
- Reworking successful scan UX beyond what is necessary to keep feedback consistent
- Broader redesign of the onboarding/profile flow

## Decisions made so far

- This should be tracked as a UI workflow epic, not folded into EPIC-006. EPIC-006 is about what the model should return; this issue is about how the app explains a valid empty result.
- The current behavior gap is real even when the model is behaving correctly.
- Zero-result scans should be considered a first-class outcome, not an error path.

## Open questions

### 1. What is the canonical feedback pattern?

Candidate options:

- toast only
- inline status near the scan controls
- both toast + inline confirmation for zero-result scans

Default lean: use the same lightweight toast pattern already present in `user-settings.tsx`, then consider inline reinforcement later if users still miss it.

### 2. Should pantry and kitchen copy be parallel?

Likely yes:

- `No ingredients detected`
- `No equipment detected`

Each should include a short next-step hint such as “Try a clearer photo or add items manually.”

### 3. What should happen for multi-image uploads where some images detect items and some do not?

Candidate options:

- only show aggregate success if at least one item was found
- show a mixed-result message that acknowledges some images produced no detections
- show per-image results only if the UX can support it cleanly

Default lean: keep the first pass simple and only require explicit feedback for the all-empty case.

## Agent checklist — when to read or reopen this epic

Read EPIC-007 before starting any of the following:

- [ ] Editing image-scan result messaging in `client/src/components/cooking/user-profiling.tsx`
- [ ] Editing image-scan result messaging in `client/src/components/cooking/user-settings.tsx`
- [ ] Changing what happens after `/api/vision/analyze` returns empty arrays
- [ ] Normalizing toast vs alert behavior for pantry or kitchen scan flows
- [ ] Adding tests or acceptance criteria for zero-result image scans

When this epic gains new signal, update it with a dated chronology section and cite whether the work conforms to or expands this UI-feedback direction.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. All supported pantry and kitchen scan surfaces explicitly communicate when zero items were detected.
2. The equipment and pantry flows no longer have silent no-op endings for valid zero-result scans.
3. The chosen feedback pattern is consistent enough across `user-settings` and `user-profiling` to avoid user confusion.
4. Verification includes at least one known negative-control image where the scan correctly returns nothing and the UI clearly says so.
5. A handoff or product note documents the final UX choice and any remaining tradeoffs.

## Linked artifacts

- `client/src/components/cooking/user-settings.tsx`
- `client/src/components/cooking/user-profiling.tsx`
- `client/src/lib/openai.ts`
- `epics/006-equipment-vision-exclusions.md`

## Chronology — how we got here

### 2026-04-27 — Epic created from live negative-control testing

While validating equipment-vision fixes with living-room and luggage-only photos, the model correctly returned empty arrays for several scans. That surfaced a separate UI issue: some scan flows clearly say “No equipment detected,” while others silently finish with no explanation. Wilson asked to capture that UX gap as its own epic so it can be resolved intentionally instead of disappearing behind model-quality work.
