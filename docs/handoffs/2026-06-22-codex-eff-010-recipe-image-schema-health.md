# EFF-010 recipe image schema health

**Agent:** codex
**Branch:** codex/efforts-hygiene-2026-06-22
**Date:** 2026-06-22
**Initiative:** INIT-001 mobile refresh adjacency
**INIT updated:** yes

## Summary

Today's Efforts hygiene found the active Effort set still valid: EFF-010, EFF-017, EFF-022, and EFF-025 remain standalone active work. The implementation slice advances EFF-010 by adding the merged `recipe_image_cache` table to the `db:health` drift tripwire, so selected-image cache schema drift fails before DB-backed browser validation can be mistaken for a UI or provider bug.

## Changes

- `scripts/db-schema-health.ts`
  Adds `recipe_image_cache` to the required schema-health table list.
- `efforts/effort-010-local-db-schema-strategy.md`
  Records the new schema-health signal and keeps the broader local DB ownership / `db:push` permission questions open.
- `efforts/registry.md`
  Refreshes EFF-010's searchable last signal to the schema-health update.
- `initiatives/INIT-001-mobile-refresh.md`
  Time-qualifies stale chronology wording so the older EFF-013/EFF-014 active-state note cannot be read as current status after both were resolved.
- `docs/handoffs/2026-06-22-codex-eff-010-recipe-image-schema-health.md`
  Records this hygiene and implementation pass.

## Hygiene result

- Active read list and agent mirrors agree: EFF-010, EFF-017, EFF-022, and EFF-025.
- EFF-027 is resolved and absent from the active read list after PR #204 merged.
- At original audit time, open PR #218 owned the EFF-017 Dependabot/update-lane slice, so this branch did not touch that domain. PR #218 has since merged, and this branch remains scoped to EFF-010.
- EFF-022 remains blocked on the selected-cuisine fallback product rule before prompt/product behavior can change.
- EFF-025 remains a Settings UX implementation candidate, but it is less of a cross-effort dependency than DB schema health today.
- Blocked handoffs were reviewed. The old EFF-017 OAuth preflight blocker has later EFF-017 follow-up signal, and the production vision-scan blocker is operational/production-secret work outside this branch.

## Effort implementation choice

EFF-010 was selected because `recipe_image_cache` is now merged runtime schema through INIT-001 recipe imagery work, but `db:health` still checked only older drift vectors. That creates a clear, PR-sized, cross-cutting validation improvement with no product decision, schema mutation, or Replit-side action required.

## Impact on other agents

Agents debugging selected-image, Prep Tray, or recipe-image cache behavior should now treat a missing `recipe_image_cache` table as schema drift when `db:health` fails. Do not run `npm run db:push` against the default decrypted `.env` database to fix it; use GitHub's schema-only Neon E2E lane or the guarded local diagnostics sandbox with an explicit disposable database.

## Open items

- EFF-010 remains open for the larger local DB ownership model, routine worktree `DATABASE_URL` policy, `.env.keys` provisioning workflow, and allowed `db:push` boundary.
- This branch does not change Replit deployment secrets, production OpenAI key state, provider canaries, or EFF-017 validation authority.

## Verification

Local verification:

- `npm run check` passed.
- `npm run build` passed with the existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.

Merge-refresh verification on 2026-06-23 after rebasing onto `89ce14ff169ff9a2a721a615b42cd46c28fc1bf0`:

- `npm ci` passed.
- `git diff --check` passed.
- `npm run check` passed.
- `npm run build` passed with the same existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.

`npm run db:health` is not expected to pass against the default decrypted local `.env` database if it still has known schema drift. The meaningful DB-backed merge evidence should come from GitHub `e2e_guest_smoke`, which provisions a schema-only Neon branch, applies the current Drizzle schema, runs `db:health`, runs Playwright, and cleans up.

## Stack / base status

- Base refreshed: yes; rebased for merge review on 2026-06-23
- Current base: `origin/main` at `89ce14ff169ff9a2a721a615b42cd46c28fc1bf0`
- Last Replit-validated at: not applicable; this is schema-health/docs hygiene and no human Replit validation is required before review
- Notes: started from fresh `origin/main` on 2026-06-22, then rebased after PRs #218, #219, #226, #227, #228, and #229 merged.
