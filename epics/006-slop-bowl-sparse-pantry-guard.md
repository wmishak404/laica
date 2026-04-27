# EPIC-006 — Slop Bowl sparse-pantry guard

**Status:** Resolved
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-27
**Updated:** 2026-04-27

## One-line summary

When a Slop Bowl pantry-check list has fewer than 3 distinct ingredients, Laica should pause and help the user add more bowl-building items instead of calling recipe generation and surfacing a generic service-error toast.

## Context — why this exists

Wilson surfaced a Slop Bowl failure during pantry-check validation: a list with only two ingredients made the flow return to the pantry-check screen and show the destructive toast:

> Service Temporarily Unavailable
> Please try again in a moment. If the issue persists, you may have reached the demo limit.

Investigation on 2026-04-27 found two overlapping issues:

- `POST /api/recipes/slop-bowl` only blocks an empty pantry. A sparse pantry with 1-2 ingredients still calls OpenAI.
- Slop Bowl client generation uses generic demo/API error handling, so any server/model/schema failure becomes the broad service-unavailable toast.

Wilson chose the product behavior: ask for more ingredients and gently prompt the user to think of other things they might have to construct a bowl.

## Scope

### In scope

- Block Slop Bowl generation when the effective pantry list has fewer than 3 distinct non-empty ingredients.
- Show inline pantry-check guidance for sparse lists instead of a service-error toast.
- Keep the guidance friendly and additive, with examples like a base, vegetable, sauce, seasoning, egg, cheese, beans, or leftovers.
- Add a matching server-side guard that returns a typed validation error before OpenAI is called.
- Preserve true API/service failures on the existing generic error path.

### Out of scope

- Designing a full pantry quality scoring system.
- Auto-suggesting ingredients from inventory history.
- Changing saved pantry semantics from EPIC-003; Slop Bowl quick edits remain ephemeral unless made through profile settings.
- Reworking the generic demo/rate-limit handler across the whole app.

## Decisions made so far

- **Minimum viable Slop Bowl input is 3 distinct ingredients.** The count is based on trimmed, case-insensitive names after applying the pantry-check override.
- **Sparse pantry is a user-correctable state, not a service failure.** It should render inline on the pantry-check screen and should not show the generic destructive toast.
- **Client and server both enforce the guard.** The client prevents normal UI submissions; the server protects direct API calls and stale clients.
- **Typed API error:** `POST /api/recipes/slop-bowl` returns HTTP `422` with `code: "SLOP_BOWL_TOO_FEW_INGREDIENTS"` when the effective pantry has fewer than 3 ingredients.

## Open questions

- Should future Slop Bowl versions suggest personalized additions based on dietary restrictions, pantry history, or common staples?
- Should the generic API handler eventually support typed domain errors across all AI routes?
- Should model-generation failures get a Slop Bowl-specific retry message instead of the existing generic service-unavailable toast?

## Agent checklist — when to read this epic

Read EPIC-006 before starting any of the following:

- [ ] Modifying `client/src/components/cooking/slop-bowl.tsx` pantry-check, generation, or error handling behavior
- [ ] Changing `POST /api/recipes/slop-bowl` validation or request/response semantics
- [ ] Changing `client/src/lib/openai.ts` Slop Bowl error handling
- [ ] Defining Slop Bowl acceptance criteria or verification for sparse pantry states

When this applies, also cite EPIC-005 because sparse-pantry behavior is part of core cooking-flow acceptance criteria.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. The Slop Bowl pantry-check screen blocks generation with 0, 1, or 2 distinct ingredients.
2. The 1-2 ingredient state shows inline helper copy prompting the user to add more likely bowl builders.
3. No generic service-unavailable toast appears for the sparse-pantry state.
4. Direct API calls with fewer than 3 distinct ingredients return `422` and `SLOP_BOWL_TOO_FEW_INGREDIENTS`.
5. Local checks (`npm run check`, `npm run build`) pass, and manual verification is recorded in a handoff.

## Linked artifacts

- `client/src/components/cooking/slop-bowl.tsx`
- `client/src/lib/openai.ts`
- `server/routes.ts`
- `product-decisions/008-optional-context-and-local-validation-boundaries.md`
- `epics/003-slop-bowl-pantry-quick-actions.md`
- `epics/005-testing-strategy-and-acceptance-criteria.md`

## 2026-04-27 — Implementation pass

Codex implemented the first sparse-pantry guard pass on `codex/slop-bowl-sparse-pantry-guard`:

- Client pantry-check now treats fewer than 3 distinct ingredients as not ready for generation.
- The 1-2 ingredient state shows inline helper copy with examples of likely bowl builders.
- Slop Bowl generation now preserves typed API error details and handles `SLOP_BOWL_TOO_FEW_INGREDIENTS` inline instead of routing it through the generic service-unavailable toast.
- The server route now returns HTTP `422` with `code: "SLOP_BOWL_TOO_FEW_INGREDIENTS"` before calling OpenAI when the effective pantry has fewer than 3 distinct ingredients.

Local verification passed with `npm run check` and `npm run build`. Replit/manual service-backed validation remains before this epic should be marked `Resolved`.

The local-vs-production fallback policy that came out of this work is now captured in `product-decisions/008-optional-context-and-local-validation-boundaries.md`.

## 2026-04-27 — Replit validation signal

Wilson validated the main authenticated Replit flow on `codex/slop-bowl-sparse-pantry-guard`:

- The original 2-ingredient Slop Bowl case showed the sparse-pantry helper instead of the generic service-unavailable toast.
- Adding a third ingredient allowed generation to continue.
- Replit logs showed `POST /api/recipes/slop-bowl 200`.
- No `[user-profile] Recent cooking sessions unavailable` or `[slop-bowl] Recent cooking sessions unavailable` warnings appeared in the Replit logs.
- Accepting the generated recipe and entering cooking worked; cooking steps loaded successfully.

The remaining strict API-specific check, if needed before marking this epic resolved, is a direct authenticated call with fewer than 3 ingredients returning `422` and `SLOP_BOWL_TOO_FEW_INGREDIENTS`.

## 2026-04-27 — Resolved

Codex added an automated route-contract test in `tests/unit/slop-bowl-route.test.ts` covering the bypass case directly:

- `POST /api/recipes/slop-bowl` with `pantryOverride: ["ground beef patties", "buns"]` returns HTTP `422`.
- The response body includes `code: "SLOP_BOWL_TOO_FEW_INGREDIENTS"`.
- The route returns before recent-history lookup or OpenAI generation.
- Duplicate/case/whitespace variants are counted as distinct ingredients only after trimming and lowercasing.

Verification passed:

- `npx vitest run tests/unit/slop-bowl-route.test.ts`
- `npm run check`
- `npm run build`

EPIC-006 is resolved. Future Slop Bowl pantry-entry improvements should use EPIC-007, and local DB strategy work should use EPIC-008.
