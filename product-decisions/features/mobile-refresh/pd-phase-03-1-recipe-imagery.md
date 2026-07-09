# Mobile Refresh Phase 3.1 — Design Facelift and Recipe Imagery

**Status:** In progress; merged consistency slices, Slop Bowl button alignment, accepted Ticket Pass hierarchy retry, selected Prep Tray imagery, Prep Tray ready-image fill, and checked recipe ingredient chips
**Document kind:** Feature Phase Record
**Phase owner:** Wilson
**Date:** 2026-05-05
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Builds on:** [Phase 3 Planning](pd-phase-03-planning.md)

## Goal

Take a deliberate design step back after Phase 3 functional closeout, then improve the Phase 3 look and feel while adding real recipe imagery or illustration to the Ticket Pass and Prep Tray without slowing the first recipe-suggestion reveal.

Wilson redirected the proposed "Phase 3 design drifts" Effort into this Phase 3.1 work package, then froze Phase 3 visuals so Phase 3 can close on functionality. Phase 3.1 is therefore the design facelift plus imagery pass, not a continuation of piecemeal Phase 3 visual tuning.

Phase 3.2 is split out separately for the progressive Chef It Up Added shelf / rolling staple queue. That behavior polish was not blocked by Phase 3.1, shipped first through PR #46, and is now the Chef It Up staple-check behavior that Phase 3.1 should preserve or intentionally restyle during the facelift.

Wilson's Phase 3.2 Replit review also identified a related design-consistency follow-up for the Slop Bowl pantry-check menu: Phase 3.1 should compare Slop Bowl's existing removable pantry chips/list treatment against the newer Chef It Up Phase 3.2 shelf/row style and use the Chef It Up direction as the preferred visual baseline where the surfaces overlap. This is a visual-alignment scope note only; Slop Bowl behavior remains unchanged unless Phase 3.1 explicitly revisits it.

## Phase 3 Contract

Phase 3 reserves generated-image slots now:

- Featured Ticket Pass ticket has a recipe image slot.
- Compact alternate tickets have smaller recipe image slots.
- Prep Tray has a larger recipe image slot for the selected recipe.
- Empty image slots render a designed placeholder, not a missing/broken image state.
- Phase 3 process screens do not repeat the Laica logo by default; ordinary Planning/Ticket Pass process screens stay brand-consistent through visual language rather than repeated marks.
- Current Phase 3 Planning/Ticket/Prep visuals are functional scaffolding, not the final design polish.
- Phase 3 should not receive more visual changes unless a UI issue blocks functional validation or basic usability.

## Phase 3.1 Scope

- Rework Phase 3 visual look and feel as one coherent pass, not as isolated sticker/font/color/card patches.
- Improve whitespace, card/object grammar, typography consistency, Slop Bowl humor treatment, Ticket Pass hierarchy, Prep Tray image layout, and bottom nav fit.
- Include the accepted Slop It Up planning-card title and load-time rotating supporting-copy treatment as part of the Slop Bowl humor pass.
- Remove or tighten low-value supporting copy from Planning-entry transient messages. In particular, the post-setup `Your kitchen is ready` message should not include `I'll remember this on this browser while you try Laica.`
- Review Planning-entry toast/banner persistence so success, error, and status messages do not stay pinned over the primary choice cards unless the message requires explicit user action.
- Highlight the dynamic pantry-count phrase in the Planning entry pantry status line, such as `17 pantry items`, `1 pantry item`, or future `pantry ingredients` wording variants, in the same coral used by the Planning card titles/copy emphasis. Keep the rest of the sentence neutral and do not change the empty-Pantry guard behavior.
- Review the documented Phase 3 drift inventory before deciding Phase 3.1 is visually ready.
- Mark each drift as fixed, accepted, or deferred with owner/scope before Phase 3.1 closes.
- Compare Planning entry, Chef It Up time, Cuisine, Ticket Pass, Prep Tray, Slop Bowl, and bottom nav against current docs, mockups, and Wilson's Replit feedback.
- Decide the accepted imagery direction: generated food image, custom illustration, recipe-type illustration library, or hybrid.
- Add the image-generation/fetching pipeline only after the Ticket Pass is already usable.
- Hydrate `imageUrl` into existing recipe objects when imagery is available.
- Cache generated images so refreshes and back/forward navigation do not repeatedly incur cost or latency.
- Define fallback behavior for failed generation, slow generation, moderation failures, and missing image URLs.
- Decide whether Phase 3's lightweight deterministic staple check should stay as-is, become part of a pantry-staples profile, or become a smarter AI-assisted follow-up.
- Treat [Phase 3.2](pd-phase-03-2-progressive-staples.md) as the source of truth for the richer staple-check interaction now that it has shipped.
- Align the Slop Bowl pantry-check menu visually with the newer Chef It Up Phase 3.2 chip/row direction where appropriate. Use computed-style comparison, not class-name matching alone, so chip radius, typography, icon sizing, disabled state, and remove affordances do not drift between the two flows. Preserve the latest Phase 3.2 chip-state grammar: pending additions use a coral `+` plus right-side `X`; saved pantry facts use a green checkmark only, with no visible `Saved` text inside the chip, and tapping a saved chip shows a brief Pantry Settings removal direction instead of deleting it.
- If Phase 3.1 expands herb handling, keep saved pantry labels concrete. Avoid saving grouped labels like `fresh herbs`; use explicit choices or a richer profile model that can store specificity.

## 2026-05-08 - Slop It Up Planning-Card Copy Direction

Wilson clarified that the Planning choice screen should sharpen the contrast between the two cooking paths. **Chef It Up** should stay elegant, refined, classy, and collaborative. The Slop Bowl path should feel more culturally playful, sloppy, and chaotic, but it must not imply that the generated food will be bad or low quality.

The accepted Planning card title for the Slop Bowl path is **Slop It Up**. This is a front-door label for the Planning choice card, not a global feature rename. The underlying feature remains **Slop Bowl** in flow names, recipe language, backend/API contracts, sparse-pantry guard copy, durable product docs, and other places where the app is referring to the generated bowl concept itself.

The Slop It Up card should use one approved supporting-copy line chosen at page load or refresh. It should remain stable while the page is open so the card does not animate or distract while the user is reading. The title and supporting copy should be italicized on the Slop It Up card only, giving the card a slightly different voice from Chef It Up while preserving the same planning-card title system.

```yaml
slopItUpPlanningCard:
  scope: phase-3-1
  implementationStatus: implemented
  cardTitle: "Slop It Up"
  featureNameRemains: "Slop Bowl"
  copySelection: "random-on-page-load"
  copyStability: "stable-during-mounted-session"
  typography:
    title: "same planning-card title system as Chef It Up, italic only on Slop It Up card"
    supportingCopy: "italic only on Slop It Up card"
  supportingCopyOptions:
    - "We'll turn your ingredients into a Slop Bowl."
    - "Fridge chaos, Slop Bowl incoming."
    - "We'll make a Slop Bowl from whatever's around."
    - "Let us cook up a Slop Bowl from the chaos."
  outOfScope:
    - "timed carousel"
    - "new sticker/banner system"
    - "backend/API rename"
    - "global Slop Bowl feature rename"
```

## 2026-05-14 - Kickoff Audit and Implementation Slices

Codex audited the current Phase 3 surfaces from `origin/main` at `cb0f880` before starting Phase 3.1 implementation. The audit used this phase record, INIT-001, PD-005, `design_guidelines.md`, Phase 3.2, and current code in `client/src/pages/app.tsx`, `client/src/components/cooking/meal-planning.tsx`, `client/src/components/cooking/slop-bowl.tsx`, and `client/src/index.css`.

Current surface notes:

| Surface | Current signal | Phase 3.1 implication |
|---|---|---|
| Planning entry | Still renders the Slop path title as `Slop Bowl` with fixed supporting copy `Randomly make me something from the chaos.` The Chef It Up / Slop Bowl choice cards already carry tone-override comments and use the Phase 3 `Nunito` grammar. | First UI slice should implement the accepted `Slop It Up` planning-card title plus one stable random italic supporting line, while preserving the durable `Slop Bowl` feature name in routes, flow names, backend/API contracts, and sparse-pantry guard copy. |
| Chef It Up time + cuisine | Time labels, scrollable cuisine list, default `No preference`, and neutral process screens are present. No product mark repeats inside the process screens. | Keep in the visual-review set, but do not lead with these unless the rendered screenshot review finds new drift. |
| Chef It Up staples | Phase 3.2 Added shelf / rolling queue is the shipped baseline. Pending chips use `+` plus `X`; saved pantry facts use green check-only chips and tap-to-explain Pantry Settings copy. | Preserve behavior and chip-state grammar. Any facelift here should verify computed chip radius, typography, icon sizing, disabled state, animation, and tap targets. |
| Slop Bowl pantry check | Uses its own `slop-check-chip` / `slop-check-chip-added` treatment, visible `Added` text for manual temporary entries, and removable chips for both saved pantry entries and temporary additions. | Align visual grammar with Chef It Up where behavior overlaps, but preserve Slop Bowl's temporary-bowl behavior: removing a saved pantry chip only omits it from this bowl and must not imply deletion from saved Pantry. |
| Ticket Pass | Selection expands in place without reordering, recipe-name detail splitting is display-only, and ticket/prep image slots render placeholders or `imageUrl` when supplied. | Keep selection orientation and recipe-name contract. Facelift should review ticket object density, featured/alternate hierarchy, and image-slot placement against `phase-03-ticket-pass.png` before imagery pipeline work. |
| Prep Tray | Larger image slot exists and accepts `imageUrl`; placeholder is stable. | Real imagery can hydrate into this slot later without blocking Prep Tray access or changing layout. |
| Bottom nav | Icon-only Cook/Menu access remains neutral; no selected Cook badge is applied. | Include in screenshot review for fit with the refreshed Planning/Ticket surfaces, but current behavior matches PD-009's neutral access direction. |

Accepted implementation slices:

1. Kickoff/audit docs only: correct stale agenda references, record the current surface audit, accepted slices, and first UI slice. No runtime code in this PR.
2. Planning entry copy/title slice: change only the Slop path front-door title to **Slop It Up**, choose one approved supporting line at mount/page load, keep it stable while mounted, italicize the Slop It Up title and supporting line, and keep the underlying **Slop Bowl** feature name everywhere else.
3. Planning entry pantry-count emphasis slice: highlight only the dynamic count phrase in the status line (`17 pantry items`, `1 pantry item`, or future ingredient-wording variants) in Planning coral, keeping the sentence structure and empty-Pantry guard behavior unchanged.
4. Planning entry visual-fit slice: if the copy/title slice exposes spacing or hierarchy drift, adjust card whitespace/title/copy fit as a narrow follow-up with screenshot/computed-style evidence. Avoid adding banners, stickers, new fonts, or a new label system.
5. Pantry-confirmation visual-alignment slice: compare Chef It Up Phase 3.2 staples against Slop Bowl pantry check and align chip/row grammar where behavior overlaps. Preserve Slop Bowl behavior unless the phase record is explicitly amended.
6. Ticket Pass / Prep Tray facelift slice: refine ticket-stack density, title hierarchy, placeholder framing, and Prep Tray image layout before adding any image generation path.
7. Async imagery slice: after the Ticket Pass remains usable with placeholders, add generated or illustrated imagery hydration into existing `imageUrl` slots, with caching and non-blocking fallback for slow/failing/moderated/missing images.
8. Closeout validation slice: run the required visual review across Planning entry, Chef It Up time, Cuisine, staples, Ticket Pass, Prep Tray, Slop Bowl, and bottom nav; update the drift table with fixed/accepted/deferred status before Phase 3.1 closes.

First recommended UI slice: implement slice 2 only. It is the smallest user-visible Phase 3.1 step, has a clear accepted copy contract, does not require service-backed imagery, and creates a focused screenshot target for the broader Planning-entry facelift.

Kickoff merge signal: PR #69 merged this audit and slice plan into `main` as `d6e422e`.

## 2026-05-14 - Planning Entry Copy Slice Implemented

Codex implemented the first runtime slice on `codex/mobile-refresh-phase-3-1-planning-copy`: the Planning entry now shows **Slop It Up** as the Slop Bowl path's front-door title, selects one approved supporting line when the app component mounts, keeps that line stable while mounted, and italicizes the Slop It Up title plus supporting line. The underlying feature path, component names, route state, tests, and Slop Bowl flow language still use **Slop Bowl**.

Wilson validated the original 1-7 Replit checklist at `5412c3e3b8bbce3f3b8574be8b7ddc0b2142dc50`, then requested the small title-italic follow-up. Wilson then confirmed the latest runtime head `39e4a361fb16a22f63638759a801435a5b00715b` looks italicized and good in Replit.

Wilson also requested one deferred Planning-entry follow-up: make the dynamic pantry-count phrase in the status line (`17 pantry items`, `1 pantry item`, or future `pantry ingredients` variants) coral to match the planning emphasis color. This is now Phase 3.1 scope, but it was intentionally not implemented in the copy/title slice.

This slice intentionally did not expand into broader Phase 3.1 facelift, pantry-check alignment, Ticket Pass / Prep Tray polish, or imagery work. No local card spacing/CSS change was added because the new title is shorter than the previous `Slop Bowl` title and the approved supporting-copy options fit the existing card copy pattern. Authenticated browser visual validation remains a Replit/manual validation item before Phase 3.1 closeout.

## 2026-05-14 - Planning Pantry-Count Coral Emphasis Implemented

Codex implemented the next narrow Planning-entry slice on `codex/mobile-refresh-phase-3-1-pantry-count-coral`, stacked from PR #71's `codex/mobile-refresh-phase-3-1-planning-copy` head. The status line keeps the same sentence and empty-Pantry guard behavior, but highlights only the key pantry fact in Planning coral: `17 pantry items`, `1 pantry item`, future count-label variants, or the word `empty` in the empty-Pantry state.

The implementation adds a small `getPlanningPantryCountLabel` helper so the full status sentence and highlighted count phrase share pluralization logic, renders only the key pantry fact inside `.planning-pantry-status-emphasis`, and keeps the surrounding helper sentence neutral. This slice intentionally did not touch broader Planning card/whitespace grammar, Slop Bowl pantry-check alignment, Ticket Pass / Prep Tray, or imagery.

Wilson validated the branch in Replit at runtime SHA `ed74a18b074cfec3917788c6ce2b7255d843d513`: the empty-Pantry state now shows `empty` with the coral emphasis, and `1`, `17`, and `26` pantry ingredient count states also show correctly.

## 2026-05-14 - Slop Bowl Pantry-Check Visual Alignment Implemented

Codex implemented the Phase 3.1 pantry-confirmation visual-alignment slice on `codex/mobile-refresh-phase-3-1-slop-pantry-align`. Slop Bowl's pantry-check chips now use the Phase 3.2 pantry-confirmation icon/color grammar where behavior overlaps: saved Pantry ingredients render as green check chips with no visible `Saved` label, and manual temporary additions render as coral `+` chips with a visible `X` affordance and no visible `Added` label.

The slice preserves Slop Bowl behavior. Clicking a saved Pantry ingredient still only omits it from the current bowl; it does not delete the saved Pantry item. The chip aria labels use `Omit <item> from this bowl`, and the surface adds a short helper note that removing saved pantry items here only skips them for this bowl. Manual additions remain temporary and still do not change saved Pantry.

This slice intentionally did not touch Planning card/whitespace grammar, Ticket Pass / Prep Tray, recipe generation, async imagery, or Chef It Up Phase 3.2 behavior.

## 2026-05-14 - Setup/Settings Inventory Chip State Alignment Merged

Wilson pulled the EFF-014 scan-session chip-state follow-up into the current Phase 3.1 consistency pass after reviewing returning Settings Pantry list drift against the newer Chef It Up and Slop Bowl chip grammar. PR #75 merged from `codex/mobile-refresh-phase-3-1-inventory-chip-states` as `c82433d9089ca4e9cc86b5d5e77322981333eba3` after PR #73 merged; the earlier stacked PR #74 auto-closed when the lower-stack base branch was deleted.

The accepted implementation scope is the existing first-time setup and returning Settings Pantry/Kitchen review surfaces only. Saved items use green checked chips; recently-added manual/scan items use coral `+` chips with an `X`; found-again scan matches stay in the same list as quiet green checked chips with scan outcome copy; client-only state clears on setup Continue or successful Settings save. Duplicate-like cleanup stays conservative: the UI makes latest-added variants easy to remove, but Laica does not infer semantic duplicates or auto-collapse labels.

This slice intentionally does not touch broader Planning facelift, Slop Bowl pantry-check behavior beyond the PR #73 baseline, Ticket Pass / Prep Tray, recipe generation, async imagery, or Phase 5 post-cook cleanup/rescan implementation. Phase 5 keeps ownership of its future post-cook rescan labels (`Already saved`, `Found again`, `New`).

Local validation passed for the focused unit suite, `npm run check`, `npm run build`, `git diff --check`, and a dotenvx dev-server HTTP 200 smoke on port 3000 after linking the standard worktree `.env.keys`. Wilson confirmed Replit was on validated head `1e93bf8fdcd9933dea3200e66c138c91a5c00be1` and checked the Settings Pantry minimum path: saved chips stayed green, new items appeared coral, and Save turned recent chips green. Earlier screenshots on the same branch family validated Settings Kitchen, Slop Bowl parity, and first-time setup Pantry/Kitchen review states. EFF-014 is resolved for Setup/Settings; future Phase 5 post-cook rescan labels stay in Phase 5.

## 2026-05-15 - PR #78 Abandoned; Ticket Pass Retry Constraints

PR #78 (`codex/mobile-refresh-phase-3-1-ticket-prep-polish`) attempted the remaining Ticket Pass / Prep Tray polish from fresh `origin/main`, but it did not produce an acceptable visual result and was closed unmerged. Two lessons are now durable Phase 3.1 constraints:

1. Small framing tweaks alone are not enough. The first pass still read too much like the existing centered card stack, so behavioral correctness plus micro-polish should not be mistaken for mockup conformance.
2. Overcorrection is worse than staying close to `main`. A later same-day experiment introduced fake bowl/noodle/skillet illustration placeholders and a more theatrical compact-ticket layout that broke compact readability and made the surface feel less product-ready than the stable baseline.

The next Ticket Pass attempt should therefore restart from the current `main` layout skeleton and stay much narrower:

```text
Selected #1
[ featured ticket #1 ]
[ compact ticket #2 ]
[ compact ticket #3 ]

Selected #2
[ compact ticket #1 ]
[ featured ticket #2 ]
[ compact ticket #3 ]

Selected #3
[ compact ticket #1 ]
[ compact ticket #2 ]
[ featured ticket #3 ]
```

- Preserve the stable generated order, in-place expansion, and display-only recipe-name split contract exactly as shipped.
- Preserve the current placeholder slot treatment and compact-row readability as the floor for any new work.
- Improve Ticket Pass primarily through outer composition: shared pass backing, ticket silhouette, overlap, spacing, shadow, perf/top-edge treatment, and clearer featured-vs-compact hierarchy around the existing content skeleton.
- Do not use fake illustration placeholders as a substitute for the later async/generated imagery slice.
- Do not broaden Prep Tray into a new design exploration until Ticket Pass itself is visually accepted. Prep Tray should receive only light shell/alignment work in the same pass if needed.
- Continue to treat real imagery hydration as a later separate slice into the existing `imageUrl` slots.

PR #81 merged this abandonment/retry plan into `main` as `7630d97a68a1ca4adfe5915484fbd9c397b4c406`, so future Phase 3.1 runtime branches should treat these constraints as the current baseline rather than reviving PR #78.

## 2026-06-12 - Ticket Pass Hierarchy Retry Implemented

Codex implemented the next Ticket Pass runtime slice on `codex/init-001-ticket-pass-hierarchy` from fresh `origin/main` `ca03c3c`. The branch follows the PR #81 retry constraints: it stays layout-only, keeps the existing image-slot and compact-row content skeleton, and improves ticket object language through shared pass backing, selected-ticket depth, compact-row offsets, and tighter row readability.

Behavior is intentionally unchanged. The generated recipe order stays stable, selection still expands in place, the display-only recipe-name split contract remains intact, and the selected recipe still drives the Prep Tray. Focused regression coverage now asserts those constraints when switching from ticket 1 to ticket 2 and opening the Prep Tray.

Negative scope remains explicit: no fake bowl/noodle/skillet placeholders, no real image generation or async image hydration, no Prep Tray redesign, no prompt/provider/backend changes, no Settings or navigation work, and no change to the Phase 3.2 staple-check behavior.

Initial local validation passed `npm ci`, `npx vitest run tests/unit/meal-planning.test.tsx`, `npm run check`, `npm run build`, and `git diff --check`. `npm audit --audit-level=high` initially failed on existing `@grpc/grpc-js` advisories, which PR #176 later fixed on `main`. On 2026-06-13, PR #175 was rebased onto `origin/main` `a20406a` after the dependency-audit and Settings remount merges; `npm ci`, `npm audit --audit-level=high`, focused Ticket Pass Vitest coverage, `npm run check`, `npm run build`, and `git diff --check origin/main...HEAD` passed locally.

Wilson then completed targeted Replit smoke at head `100cbd66`: logged in, followed the happy path to recipe suggestions, selected tickets 1/2/3, confirmed no reorder and in-place expansion, opened Prep Tray from the selected ticket, checked refresh suggestions, compact readability, and scroll/fit, and accepted the Ticket Pass hierarchy as good for now. GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at that same head. PR #175 squash-merged as `6510860`. The in-app Browser fixture attempt remains non-evidence because local `data:` and `file:` fixture URLs were rejected under Browser URL policy.

## 2026-05-29 - Planning Toast Copy and Persistence Follow-Up

During INIT-003 public guest validation, Wilson found that the Planning entry post-setup toast showed the heading `Your kitchen is ready` plus the supporting line `I'll remember this on this browser while you try Laica.` The supporting line adds more explanation than the moment needs and should be removed in Phase 3.1. If a success confirmation remains, keep it concise and avoid re-explaining anonymous/local browser retention in this transient UI.

The same review found that the message stayed visible over the Chef It Up / Slop It Up choice cards. Phase 3.1 should review toast/banner persistence on the Planning choice surface: success, error, and status messages should auto-dismiss or otherwise get out of the way unless they require explicit user action, and they should not sit over the primary cooking-path cards during ordinary flow.

This is intentionally not part of INIT-003 production-gates behavior. INIT-003 still owns guest/linked data boundaries and public access controls; Phase 3.1 owns this copy and interaction polish.

## 2026-06-15 - Planning Toast Cleanup Implemented

Codex implemented the narrow Planning toast cleanup in PR #184, which merged as `e8ca055`. Guest setup-complete and returning guest profile-complete now share a title-only `Your kitchen is ready` toast with a 2.5-second duration. The toast no longer repeats browser/local retention language, so the Planning choice screen gets a quick confirmation without re-explaining guest persistence over the Chef It Up / Slop It Up cards.

This slice intentionally does not change guest profile persistence, linked-account promotion, the empty-Pantry action toast, linked-user profile update toasts, Planning card layout, Ticket Pass, Prep Tray, Slop Bowl, navigation, provider calls, schema, or backend behavior. Focused unit coverage asserts the concise guest setup-complete toast and local validation passed before PR handoff. Wilson explicitly approved handling the dependency-audit remediation in PR #184, so the merge includes a lockfile-only audit fix for patched `ws`, `vite`, `protobufjs`, `form-data`, and Babel resolutions without changing the product behavior. GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at final branch head `a87d303` before merge.

## 2026-06-16 - Async Recipe Preview Imagery Implemented

Codex implemented the Phase 3.1 recipe imagery pipeline on `codex/init-001-recipe-preview-images`. The runtime path keeps first-time recipe text generation on the critical path and moves imagery into a resolver: `/api/recipes/pantry` still returns exactly three recipes first, MealPlanning can enter Ticket Pass with existing placeholders, and the client then calls `POST /api/recipe-images/resolve` with only structured recipe data.

Fairness rule: Ticket Pass and Prep Tray use the existing `imageUrl` contract, but MealPlanning strips partial legacy image sets and only applies resolver URLs when all three current recipe suggestions have approved images. If one or two images are ready, if one image fails, if the resolver is disabled/unconfigured, or if polling stops before completion, all three suggestions remain placeholder-only for that batch. Refresh Suggestions has an additional UX rule: when the user already has an image-backed Ticket Pass, keep the current tickets visible behind the existing `Finding recipes...` state while the replacement set is prepared, then swap to the new set with all three images together when ready. If image prep fails or times out, the refresh falls back deliberately instead of letting images pop in much later.

Server policy:

- `shared/schema.ts` now defines `recipe_image_cache` metadata: opaque cache key, normalized recipe fingerprint, provider/model/quality/output size/style version, status, object key, image URL, MIME type, accuracy result, failure reason, and timestamps.
- Cache fingerprints are strict: normalized title, cuisine/flavor direction, and sorted core pantry ingredients. V1 does not use broad cuisine-level or dish-family fuzzy matching. A cached image is eligible only when the generated recipe title and core ingredients match the cached fingerprint.
- Object keys are opaque hashes under `recipe-images/<styleVersion>/<cacheKey>.png`; recipe names, Firebase IDs, emails, raw prompts, and user profile details are not stored in object keys or sent to the image provider.
- Generated image bytes are stored in Replit App Storage through `@replit/object-storage`, not Postgres or the local filesystem. The client receives a same-origin opaque route (`/api/recipe-images/:cacheKey`) that streams the ready object and sets public immutable cache headers.
- Runtime generation is off until explicitly enabled with `RECIPE_IMAGE_GENERATION_ENABLED=true`. Cache hits can still be served while generation is disabled, which supports a pre-generated library rollout before live generation.
- The default runtime provider is OpenAI `gpt-image-2`, `quality=low`, square `1024x1024` output, and compressed JPEG output (`RECIPE_IMAGE_OUTPUT_FORMAT=jpeg`, default compression `70`) because the image slot is thumbnail-sized and latency matters more than PNG fidelity. Gemini/Nano Banana remains a future provider flag (`RECIPE_IMAGE_PROVIDER=gemini`) and returns unavailable in this v1 implementation.
- Each generated image is judged before approval. The judge compares image content against recipe title, core ingredients, optional ingredients, overview, and dish form, and rejects wrong proteins, wrong form, missing key ingredients, dominant optional ingredients, visible text/brands, or safety/dietary contradictions.
- Abuse controls distinguish status polling from generation starts. The global API limit still covers repeated resolver requests, but the smaller recipe-image IP/user hour budget is consumed only when a cache miss or stale pending row is about to start or restart generation. This keeps polling from exhausting the generation budget while preserving cost protection for new image work.

Pre-generated library path:

- `scripts/recipe-image-cache-fixtures.json` lists curated/common recipe fingerprints.
- `scripts/seed-recipe-image-cache.ts` computes the same strict cache keys/object keys and upserts ready cache rows only after the approved object already exists in App Storage.
- The seed path deliberately does not create fake ready rows or use recipe names in object keys.

Related Effort: EFF-022 remains related but unchanged. This work does not alter recipe suggestion prompts, cuisine preference packaging, cuisine picker behavior, or recipe-output eval rubrics.

Validation status:

- Local checks passed at PR #192 head `ab6b951`: `npm run check`, focused `npx vitest run tests/unit/recipe-images.test.ts tests/unit/recipe-image-route.test.ts tests/unit/meal-planning.test.tsx`, full `npm run test:unit`, `npm run build`, and `npm audit --audit-level=high`.
- Provider-light Playwright coverage was added for complete-set image reveal in `tests/e2e/cooking-workflow.test.ts`. A 2026-06-17 local workflow follow-up pinned `@dotenvx/dotenvx` in the repo and replaced ad hoc local `npx @dotenvx/dotenvx` commands with `npm run env:run -- ...`, removing the runtime package-fetch-while-secrets-are-decrypted blocker.
- Local provider-light Playwright was not executed because this thread did not have a disposable `LAICA_LOCAL_SANDBOX_DATABASE_URL`; the default decrypted `.env` DB failed `db:health` with known stale-schema drift and was not schema-pushed from the worktree.
- GitHub CI on PR #192 passed `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL at head `ab6b951`. The CI `e2e_guest_smoke` lane created a schema-only Neon branch, applied schema, ran `db:health`, and ran the provider-light Playwright suite, including complete-set recipe-image reveal.
- Replit validation on 2026-06-17 applied the `recipe_image_cache` schema through the Replit-authoritative path, passed `db:health`, and confirmed App Storage with upload/download/delete smoke using the configured `REPLIT_APP_STORAGE_BUCKET_ID`.
- Replit live provider smoke generated one three-recipe set for `Hearty Leek, Beef & Spinach Rice Bowl`, `Curry Braised Tofu & Vegetables`, and `Kimchi & Dashi Hotpot / Kimchi Nabe` using OpenAI `gpt-image-2`, `quality=low`, `1024x1024`, `phase-3-1-v1`. The three cache rows were `ready`, had object keys and image URLs, and had judge scores `0.9`, `0.85`, and `0.9` with no failure reasons. Cache row timing showed creation at `2026-06-17T19:42:01Z` and generated timestamps around `19:42:28Z`, `19:42:52Z`, and `19:43:21Z`, so the original sequential path's slowest approved image took about 80 seconds from row creation.
- That live timing exposed two gaps: the original six 2-second polls stopped before the third approved image was ready, and Wilson's later Refresh Suggestions smoke showed that even technically correct late image pop-in feels wrong. PR #192 now parallelizes the three image generation/judge jobs, defaults to compressed JPEG output, keeps restored/fresh background hydration to six checks at 10-second spacing, gates Refresh replacement so the old image-backed tickets stay visible while the new set gets approved images, and avoids charging pending polls against the smaller recipe-image generation limit.
- Replit exact-head validation at runtime SHA `76b998d` confirmed cached all-or-none image reveal in Ticket Pass and selected-image loading in Prep Tray. The three visible images matched the recipe titles and core visual ingredients closely enough for v1 smoke: beef/spinach/rice bowl, tofu/vegetable curry-style bowl, and kimchi/dashi hotpot-style bowl. No partial image set was shown during pending state.
- Replit selected-image validation on 2026-06-18 at PR head `9e62f0f` confirmed the pivoted user-visible runtime: non-secret Replit Configurations loaded for image generation, `POST /api/recipe-images/selected/resolve` no longer returned `disabled`, Prep Tray showed the subtle pending spinner while polling, an approved selected recipe image appeared in Prep Tray, and returning to Ticket Pass kept all three recipe choices placeholder-only. Resuming Chef It Up after the app returned to the main menu restored the same suggestions and still kept Ticket Pass placeholder-only. A separate reset/remount to the main menu was observed during this smoke; session restore recovered the flow, and PR #201 later resolved the direct active-flow restoration follow-up unless the behavior reproduces as an imagery-specific blocker.
- Cost note: the live smoke generated three low-quality OpenAI images, so estimated image-generation cost is about `$0.015-$0.018` before small prompt/judge token cost, using the 2026-06-16 pricing assumptions recorded for this phase.
- Negative scope: the original live provider smoke validated schema/storage/provider/cache loading at `76b998d`, while the exact-head selected-image smoke validated the pivoted runtime at `9e62f0f`. A second paid live three-image generation was intentionally not rerun because Ticket Pass no longer hydrates generated images in the user-visible decision moment. The Replit Preview wrapper previously showed its own "Start application artifact crashed" state because validation used a manually launched flagged server; the direct `.replit.dev` app was the validated surface. Production publish, broad recipe-image accuracy evals, Gemini/Nano Banana comparison, and direct active-flow reload restoration remained out of scope for PR #192; PR #201 later resolved the Chef It Up / MealPlanning restoration slice.
- Merge closeout: PR #192 passed final GitHub CI at head `a1a9690` and squash-merged into `main` as `efd1f88` on 2026-06-18. No additional Replit selected-image smoke is needed unless runtime files change after `9e62f0f`; Gemini benchmark evidence is required only before changing the provider default away from OpenAI.

## 2026-06-17 - Prep Tray Selected-Image Pivot and Gemini Benchmark Path

Wilson's Replit follow-up showed that even after the all-or-none fairness rule, live three-image generation still sets the wrong user expectation when images arrive 80-120 seconds after recipe suggestions. Phase 3.1 now treats Ticket Pass as a fast, fair decision surface and Prep Tray imagery as a selected-recipe enhancement.

Runtime rule:

- Ticket Pass always renders intentional placeholders. MealPlanning strips any `imageUrl` values from `/api/recipes/pantry`, does not call the image resolver while showing the three choices, and Refresh Suggestions swaps to the next text set without waiting for imagery.
- Prep Tray starts selected-recipe image hydration only after the user opens the tray. It calls `POST /api/recipe-images/selected/resolve` for one structured recipe and shows a subtle spinner inside the placeholder while the preview is still being prepared.
- Approved selected-recipe images stay local to the Prep Tray session. Returning to Ticket Pass must keep all three choices placeholder-only so one generated image does not reveal implementation weakness or visually favor the selected recipe. Reopening the same Prep Tray in the same session may reuse its selected image without calling the resolver again.
- Cooking is never blocked by imagery. The user can start cooking immediately; starting cooking, backing out, refreshing recipes, or unmounting the flow cancels the visible polling session and carries the selected meal as-is. Server-side generation/cache fill may still finish for a later visit.
- The existing three-image resolver remains available for cache seeding and benchmark comparison, but it is no longer part of the user-visible Ticket Pass decision moment.

Deferred UX follow-up: Wilson's Replit review of an approved selected image found the centered thumbnail treatment wastes much of the Prep Tray hero box. PR #192 should not expand into this layout change, but its closeout should file or route a future Effort/phase follow-up to evaluate a fuller hero image crop that uses the whole image area without harming recipe readability or layout stability.

Deferred UX follow-up: Wilson also requested a future pending-state copy treatment inside the Prep Tray image placeholder, under or near the spinner, similar in spirit to Slop Bowl loading copy. Candidate lines should be short, rotate while pending, and fit as one compact line inside the image box without awkward wrapping or overflow. Example tone seeds: `Imagining the first bite`, `Previewing your dinner`, `Warming up the appetite`, and `Sketching the plate`.

Provider and benchmark updates:

- `RECIPE_IMAGE_PROVIDER=gemini` is now implemented through a narrow REST wrapper using `GEMINI_API_KEY`; no Gemini SDK dependency was added.
- Gemini defaults to `gemini-3.1-flash-image` with 512 square output when provider-specific defaults are used. `gemini-2.5-flash-image` remains a benchmark candidate. `gemini-3.5-flash-image` should only be tested if the API model list confirms that exact image model ID.
- OpenAI remains the default provider. Gemini is a Replit benchmark candidate, not a production default, until selected-image runs are fast enough for the non-blocking Prep Tray preview with acceptable accuracy.
- `accuracy_result` now carries image-generation, judge, upload, and total timing metadata for approved/rejected rows so benchmark runs can record latency without adding a new table.
- `npm run benchmark:recipe-images -- --provider=gemini --model=gemini-3.1-flash-image --output-size=512` runs the selected-image benchmark first and can also run the legacy three-image batch as informational comparison. Use `--batch=false` to skip the batch path.

Validation update:

- Focused local coverage now asserts placeholder-only Ticket Pass behavior, selected Prep Tray image hydration, stale/canceled selected-image polling, selected resolver auth/rate-limit handling, and Gemini request/response parsing.
- Local checks for the selected-image pivot passed `npx vitest run tests/unit/recipe-images.test.ts tests/unit/recipe-image-route.test.ts tests/unit/meal-planning.test.tsx`, full `npm run test:unit`, `npm run check`, `npm run build`, and `git diff --check`.
- Targeted local Playwright was attempted on 2026-06-17 with dotenvx and an alternate port, but the flow failed before image-specific assertions because the decrypted local DB was missing `anonymous_recipe_usage`. The server returned `relation "anonymous_recipe_usage" does not exist`, so guest setup never reached the Ticket Pass / Prep Tray steps. This remains environment-parity negative scope, not selected-image evidence.
- Replit selected-image smoke passed at `9e62f0f` with OpenAI as the default provider: Ticket Pass remained placeholder-only, Prep Tray hydrated one selected image, and returning to Ticket Pass did not surface the generated image. Gemini/OpenAI benchmark runs remain deferred provider-comparison evidence, not a PR #192 merge blocker unless the runtime default changes.
- PR #192 merged as `efd1f88` on 2026-06-18. The accepted v1 runtime is OpenAI default, Ticket Pass placeholder-only, selected Prep Tray imagery only, and non-blocking cooking. Resume Gemini benchmarking under INIT-001 Phase 3.1 before any provider-default change.
- Replit post-merge validation on 2026-06-19 at `main` head `7274a62` confirmed the selected-image route after a full server restart: unauthenticated `POST /api/recipe-images/selected/resolve` returned JSON `401` instead of the Vite HTML shell, authenticated Prep Tray requests progressed from `pending` to `ready`, and the generated `Leek, Carrot, and Tofu Stir Fry Over Rice` image matched the title/core ingredients closely enough for smoke. Wilson also validated: leaving Prep Tray while generation was pending and returning later can use the completed cached image, Ticket Pass still stays placeholder-only after returning, Refresh Suggestions does not call the image resolver on Ticket Pass, hard refresh with cached/generated images does not hydrate Ticket Pass, `Cook this` remains available while imagery is pending, reopening the same selected recipe reuses the generated image without another resolver call, and extensive testing eventually hit `429 RATE_LIMITED` with the spinner stopped at that terminal state.

Future automated coverage candidates from the 2026-06-19 Replit smoke:

- Selected-image route returns JSON for API requests after current-main restart, not Vite HTML fallback.
- Selected Prep Tray image progresses `pending` to `ready` and renders the approved image.
- Leaving Prep Tray before generation completes and returning later can display the completed cached image.
- Ticket Pass remains placeholder-only after Prep Tray image completion, Back navigation, Refresh Suggestions, and hard refresh with cached images available.
- Refresh Suggestions does not call either image resolver on Ticket Pass.
- `Cook this` remains non-blocking while selected imagery is pending.
- Reopening the same selected Prep Tray recipe reuses the generated/session image without another selected resolver call.
- Selected resolver `429 RATE_LIMITED` is terminal for the visible spinner and leaves the placeholder quietly.

## 2026-06-20 - Prep Tray Image Fill Slice Implemented

Codex implemented the narrow Prep Tray visual-alignment follow-up on `codex/prep-tray-image-fill`. The branch preserves the PR #192 selected-image runtime contract: Ticket Pass remains placeholder-only, Prep Tray still resolves only the selected recipe image, pending imagery stays non-blocking, and leaving/refreshing/cooking still stops the visible polling session.

The UI change is intentionally scoped to the Prep Tray hero. `MealPlanning` now exposes the selected image state on `.planning-prep-hero`; when the state is `ready`, the prep image slot stretches to the full upper hero panel and the `<img>` keeps `object-fit: cover`. Placeholder and pending states keep the existing centered designed slot and spinner so the loading/fallback treatment does not become a giant empty panel.

Validation:

- `npm ci`
- `npx vitest run tests/unit/meal-planning.test.tsx`
- `npm run check`
- `npm run build`
- `git diff --check`
- Database-free rendered-CSS Chromium geometry check against the built CSS: ready Prep Tray hero and image slot both measured `390 x 152` with `object-fit: cover`.
- Wilson Replit visual smoke on 2026-06-21 at `fb14852bc50a7028a011d24b9135109e0bc0f151` accepted the primary visual ask: the ready selected recipe image fills the upper Prep Tray panel above the recipe details, with the details and Cook CTA still readable below.

Targeted local Playwright was attempted with `CI=true PORT=5012 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5012 npm run env:run -- npx playwright test tests/e2e/cooking-workflow.test.ts --project=chromium -g "selected recipe preview imagery"`. The first sandboxed run failed before the app started because `tsx` could not create its IPC socket. The escalated rerun started the app but still failed before image-specific assertions because the decrypted local DB lacks `anonymous_recipe_usage`; guest setup never reached Ticket Pass or Prep Tray. No shared local schema push was run. The added Playwright assertion remains useful for CI/sandbox DB lanes because it checks the ready Prep Tray image slot bounds against the hero bounds.

Negative scope: no resolver, provider, schema, prompt, Ticket Pass, navigation, cooking, or ingredient-chip behavior changes.

Merge closeout: PR #208 passed final GitHub CI at head `3835caf` and squash-merged into `main` as `3c73dda` on 2026-06-21. Wilson's Replit visual acceptance at `fb14852` remains the primary visual signal for the user-visible ask; no runtime files changed after that acceptance except the tested rebase/CI head.

## 2026-06-05 - Slop Bowl Generated-Result Button Typography Aligned

PR #141 aligned Slop Bowl generated-result and feedback action buttons with the adjacent Chef It Up recipe-suggestion controls. The root cause was two-part drift: Slop Bowl generated-result screens were not wrapped in `.planning-screen`, and their approval/feedback actions used local `py-3 text-lg` sizing without the Planning action-button `h-12`, `rounded-xl`, `font-extrabold` contract.

The merged fix adds the Planning typography wrapper to Slop Bowl, updates approval and feedback buttons to the shared Planning control grammar, tightens the small pantry-check `Add` button weight, and adds focused regression coverage for the generated-result button classes. Wilson visually confirmed the Replit comparison at pre-rebase head `9d30177`; after rebasing over docs-only `main` commit `b040952`, focused local checks and GitHub CI passed at PR head `8f11990`, and PR #141 merged as `2145407`.

Future Slop Bowl button work should compare rendered controls against adjacent Chef It Up Planning surfaces by computed style and screenshot review. Matching class names alone is not enough when a surface can miss the shared root wrapper or carry local utility overrides.

## 2026-06-24 / 2026-06-29 - Ingredient Chip Unification Merged

Codex implemented the Phase 3.1 ingredient-chip consistency slice on `codex/init-001-ingredient-chip-unification`, and PR #234 merged it as `bc9290c` on 2026-06-29. Ticket Pass `Uses` chips and Prep Tray `Use these` chips now use a shared checked pantry-fact treatment for known recipe ingredients: green saved-pantry styling, a check icon, heavier chip weight, and overflow-safe chip text. Optional extras remain visually separate as optional text/chips, so users can still distinguish ingredients Laica knows they have from nonessential additions.

This slice intentionally does not change recipe generation, prompt wording, provider/image behavior, Ticket Pass order, Prep Tray layout, saved Pantry data, pending staple chips, navigation, cooking, schema, or backend behavior.

## 2026-07-08 - Mobile Browser Type-Fit Direction

Wilson clarified from mobile browser screenshots that the Chef It Up setup/time, recipe-suggestion, Prep Tray, setup scanner, and Slop Bowl menu issue is viewport fit inside browser chrome, not the accepted object proportions. The preferred fix is to shrink oversized typography and use the visible browser viewport on the affected interactable app surfaces instead of repositioning content or changing the ticket/prep composition.

Guardrails for the `codex/mobile-browser-type-fit` slice:

- Preserve the accepted PR #175 Ticket Pass stack and PR #208 Prep Tray proportions.
- Scope type shrink and short-viewport sizing to the MealPlanning runtime surfaces: Chef It Up time/cuisine/staples, Ticket Pass, and Prep Tray.
- Include the first-time setup pantry/tools scanner only for browser-fit sizing/typography; do not treat that as a broader Setup redesign.
- Include Slop Bowl menu-like surfaces, using Slop Bowl-specific wrappers rather than shared `.planning-screen` overrides.
- Do not change Live Cooking active-phase typography or layout; Wilson called its mobile browser viewport good and it remains the Phase 4 baseline.
- Do not change the Live Cooking preparing/loading guide surface; Wilson's 2026-07-08 screenshot confirmed it fits the browser viewport well.
- Do not shrink the Menu drawer. Its current font size is readable and does not take up too much browser viewport.
- Avoid collateral changes to landing/demo tickets unless separate validation evidence identifies those surfaces as browser-fit regressions.

## Phase 3 Design Drift Inventory

| Drift | Why it was drift | Context/system cause | Phase 3 status | Phase 3.1 recommendation |
|---|---|---|---|---|
| Logo recreated as CSS text mark | Phase 3 used a different Laica mark than other branded pages | Docs required `Laica` casing but did not require the canonical logo asset when showing a product mark | Fixed, then superseded by brand restraint | Keep the canonical-logo rule, but avoid logos inside ordinary in-app process screens |
| Logos repeated inside Planning/Ticket Pass | Internal flows became over-branded after the first logo fix | The mockup showed a mark, but docs did not distinguish branded entry moments from ordinary process screens | Fixed | Keep product marks out of setup, planning, selection, cooking, confirmation, and settings unless explicitly branded |
| Time slider thumb missed labels | Thumb stops did not visually land on `30m`, `1hr`, `1.5hrs`, or `Got all the time` | Radix track stops and label centers used different geometry | Fixed | Validate custom control geometry against screenshots, not only state changes |
| Cuisine list looked capped at six | The user could infer only six cuisines existed | Implementation overfit the visible mockup examples as the full data set | Fixed | Treat mockups as visible slices when content naturally exceeds one screen |
| `No preference` was not default | The default path required an unnecessary tap | Docs said exclusive anchor option but not initial/default state | Fixed | Document default paths separately from option exclusivity and placement |
| Suggestion copy exposed "three" | UI surfaced the exact generation count as product language | Acceptance criteria required exactly three but did not say the count should stay hidden in copy | Fixed | Keep deterministic constraints in tests/docs; use browsing language in user-facing UI |
| Ticket Pass looked like generic cards | Suggestions did not carry the mockup's ticket-stack object language enough | Phase 3 said Ticket Pass, but not enough hard requirements for image slot, density, hierarchy, or what must remain readable in the compact rows | Accepted for now in PR #175 after PR #78 was abandoned; the narrower layout-only retry merged as `6510860` | Treat the connected pass stack as the current accepted Ticket Pass hierarchy baseline. Future work should not reopen hierarchy-only changes without new regression evidence; continue to preserve image-slot and compact-row readability while moving to Prep Tray alignment, ingredient chips, or async imagery |
| Ticket Pass selection reordered recipes | Selecting recipe 2 or 3 made the chosen recipe jump to the featured position and moved recipe 1 into the compact list, so users lost their place | The component modeled selection as promotion to a separate featured slot instead of expanding the chosen ticket in the generated order | Fixed as a Phase 3 basic-usability exception | Phase 3.1 can revisit the ticket hierarchy, but must preserve selection orientation unless a replacement pattern is explicitly validated |
| Recipe names read like one long paragraph | AI-generated names sometimes contain a main dish plus explicit parenthetical or colon-separated detail | The schema stores one recipe-name string and the UI rendered every name as a single large heading | Fixed with conservative display-only main/supporting split when explicit detail exists | Phase 3.1 should refine title hierarchy with the broader Ticket Pass facelift while preserving the underlying recipe-name contract and avoiding invented subtitles |
| Cuisine-selected recipes overuse optional ingredients | Suggestions felt like they were completing a cuisine with missing staples instead of cooking from the pantry | Older recipe prompt language prioritized cuisine correction and allowed missing ingredients to complete a cuisine | Fixed with Phase 3 staple check, prompt balance, and optional cleanup; needs Replit validation | Decide whether the staple check needs richer UI, pantry confidence, or a pantry-staples profile in Phase 3.1 |
| Staple check can feel capped at four | The first Phase 3 staple check shows only four missing-staple rows, so users cannot keep confirming useful staples after selecting one | Phase 3 optimized for narrow functional correctness and did not yet include a progressive selected shelf | Split to Phase 3.2 | Phase 3.1 should preserve or restyle the Phase 3.2 Added shelf / rolling queue rather than returning to the capped four-row behavior |
| Slop Bowl pantry-check visuals may drift from Chef It Up staple-check visuals | Slop Bowl already has removable pantry chips/list context, while Chef It Up Phase 3.2 now has the preferred Added shelf / large row / visible remove-affordance direction | The related pantry-confirmation surfaces were built in different passes and should not silently diverge during the facelift | Fixed in the Slop Bowl pantry-check alignment slice | Keep the shared visual grammar: manual temporary additions are coral with `+` + `X`; saved Pantry ingredients are green check chips with no visible `Saved` text. Preserve Slop Bowl's behavior distinction: removing a saved Pantry ingredient only omits it from the current bowl and must not imply deletion from saved Pantry |
| Slop Bowl generated-result buttons used a different font/weight than adjacent recipe-suggestion buttons | After Slop Bowl generated a bowl, its `Let's cook this!`, `Try something else`, and plan-your-own-meal controls looked less like the Chef It Up suggestion actions directly next to them in the product journey | The generated-result surface missed the shared Planning root wrapper and carried local button sizing/typography utilities, so matching nearby component names did not produce matching computed styles | Fixed in PR #141 | Keep Slop Bowl generated-result and feedback actions under the Planning wrapper and preserve the `h-12`, `rounded-xl`, `font-extrabold` button contract used by Chef It Up recipe suggestions. Validate with visual comparison and computed-style review, not class-name matching alone |
| Ingredient chip style differs across pantry and recipe menus | Pantry scan/review chips use a bolder green checked pantry-fact style, while Ticket Pass `Uses` chips are lighter outline pills even though they represent the same known kitchen ingredients | Ingredient chips were implemented in separate components and phases instead of through one shared pantry-fact chip treatment | Merged in PR #234 as `bc9290c` | Keep known recipe ingredient chips on Ticket Pass and Prep Tray aligned to the checked pantry-fact style. Preserve the existing coral `+` + `X` treatment for pending/removable additions and keep optional extras visually distinct from known pantry facts |
| Planning, setup, and Slop Bowl type overfill the mobile browser viewport | In mobile Chrome/Safari wrapper screenshots, Chef It Up time selection, setup scanner, Ticket Pass, Prep Tray, and Slop Bowl menu text stayed proportionally attractive but too large for the visible browser viewport, forcing users to scroll around browser chrome and bottom controls | Phase 3.1 validated these surfaces mostly in app-like/full viewport contexts, while browser chrome reduces usable height and `100vh` can exceed the actually visible browser area | In progress in `codex/mobile-browser-type-fit` | Prefer scoped `svh` sizing plus font-size/control reductions on MealPlanning headings, the time selector, ticket labels, chips, Prep Tray body copy, setup scanner text/camera controls, and Slop Bowl menu text/chips over repositioning or changing accepted proportions. Keep Live Cooking preparing/active surfaces and Menu drawer typography unchanged unless Wilson separately reopens them |
| Recipe imagery disappeared | No stable place existed for future generated images to land | "Generated recipe imagery deferred" was interpreted as "no image slot needed" | Fixed with placeholders | Phase 3.1 still owns real imagery, async hydration, caching, and failure fallback. Do not treat custom fake placeholder illustrations as a substitute for this later slice |
| Prep Tray selected image underuses the hero box | Approved selected-recipe images render as a small centered crop inside a much larger Prep Tray image area, making the top of the card feel like wasted space | Phase 3 reserved a stable placeholder/image slot, and PR #192 focused on generation timing, cache correctness, and non-blocking hydration rather than final hero-image composition | Fixed in PR #208 | Preserve the ready-state full-hero crop for approved selected images while keeping pending/placeholder states centered and polished. Verify responsive rendered bounds in CI/Replit because jsdom cannot prove this visual geometry |
| Prep Tray image pending state has no appetite-building copy | The spinner communicates work is happening, but the empty placeholder still feels a little mechanical while the selected image is being generated | PR #192 kept the pending state lightweight and avoided adding more UI scope while resolver timing and fairness behavior were still being validated | Deferred for future Effort/phase follow-up after PR #192 | Add short rotating pending copy under or near the spinner, similar to Slop Bowl loading copy, with one-line length constraints and responsive checks so copy never overflows the image box |
| Planning entry card/whitespace grammar still feels off | The choice cards use too much framed-card language and not enough modern app whitespace | Phase 3 iterated individual concerns instead of stepping back into one coherent facelift | Deferred to Phase 3.1 | Rework Planning entry as a whole surface, with whitespace/card grammar reviewed before implementation |
| Planning entry setup toast is too wordy and sticky | The post-setup `Your kitchen is ready` toast repeats anonymous/local retention explanation and stays over the primary Chef It Up / Slop It Up choice cards | INIT-003 added local guest-session semantics, but the transient Planning-entry confirmation inherited explanatory copy and persistence that belong in durable settings/onboarding context, not over the main choice surface | Implemented in PR #184; audit remediation included by Wilson approval | Preserve the title-only 2.5-second `Your kitchen is ready` toast for guest setup/profile completion. Broader Planning success/error/status messages should still avoid covering the primary cards unless action is required |
| Planning pantry-count status lacks emphasis | The dynamic inventory fact in `Right now I see 17 pantry items we can work with.` and the empty-Pantry state read like the surrounding helper sentence, even though they are the most useful status details | Phase 3 added the empty-Pantry blocker/status line for behavior, then deferred final visual treatment to Phase 3.1 | Fixed in the pantry-count coral slice | Keep only the key pantry fact (`17 pantry items`, `1 pantry item`, future `pantry ingredients` wording variants, or `empty`) in Planning coral. Keep the rest of the status sentence neutral and preserve empty-Pantry guard behavior |
| Bottom nav showed Cook as selected status | Planning made the chef icon read like a current-state badge | Active tab logic conflicted with PD-009's neutral access-surface direction | Fixed | Bottom nav stays neutral; screen content communicates process status |
| Slop Bowl sticker/banner drift | `LESS BRAIN POWER` / `NO RULES` / `MAKE GOOD SLOP` kept feeling like extra design pasted onto the card | The implementation kept solving label feedback by adding new label treatments instead of returning to the mockup's simpler card grammar | Fixed by removing the rotating label/banner from the choice card | Do not add a new label system unless the mockup explicitly needs it; let humor live in copy and art first |
| Planning typography hierarchy split | The page headline, `Chef It Up` / `Slop Bowl` card titles, and short taglines felt like unrelated app surfaces | Design guidance allowed mood-based font swaps and treated individual complaints as permission to change the type system | Fixed by resetting Phase 3 Planning to the generated mockup's `Nunito`-led type grammar | Preserve the mockup's type grammar first; use size, weight, shade, and layout before introducing another font |
| Slop Bowl art became too vanilla | Clean bowl art lost the joke/slang identity | Token cleanup and simplification preserved structure but weakened humor context | Fixed, pending visual review | Slop Bowl should remain messy/scrappy/funny while still using tokens |

## Recommendations

- Treat Phase 3.1 as the deliberate design facelift and imagery pass after Phase 3 functional validation, not as more Phase 3 visual iteration.
- Do one explicit Replit visual review of the drift surfaces before Phase 3.1 closeout: Planning entry, Time, Cuisine, Ticket Pass, Prep Tray, Slop Bowl, and bottom nav.
- If a new drift is found during Phase 3.1, add it to the table above before deciding whether to patch, accept, or defer.
- Review nearby mobile-refresh surfaces for typography drift: page titles, card titles, short hero-card taglines, body copy, chips, banners, and CTAs should preserve the generated mockup's type grammar instead of swapping fonts by mood.
- Plan the facelift before implementing: choose the visual grammar first, then patch the UI. Do not solve the facelift through isolated local tweaks.
- Keep a hard split between Phase 3 placeholders and Phase 3.1 real imagery: Phase 3 reserves stable slots; Phase 3.1 decides/generates/hydrates images.
- Treat PR #78 as a negative reference, not a half-finished base branch. PR #175 is now the accepted Ticket Pass hierarchy baseline: preserve its connected pass stack, current image-slot and compact-row skeleton, and stable in-place selection unless new validation evidence shows a regression.
- Keep a hard split between shipped Phase 3.2 behavior polish and Phase 3.1 facelift work: Phase 3.1 decides how the Added shelf / rolling queue should look in the facelift without reverting its behavior contract.
- Use the Chef It Up Phase 3.2 Added shelf/chip/row treatment as the preferred pantry-confirmation visual direction when reviewing Slop Bowl pantry-check consistency, while keeping Slop Bowl's existing behavior unless Phase 3.1 explicitly changes it. The latest accepted chip distinction is: pending/removable equals coral plus + X; persisted pantry fact equals green check only, with tap-to-explain inline direction for removal in Pantry Settings.
- Do not make image generation part of the recipe-suggestion critical path. Suggestions should remain usable before any image arrives.
- Use the current stable `main` Ticket Pass as the readability baseline during review. If a new pass makes the compact rows, title fit, or time/difficulty scanability worse than `main`, stop and correct that before claiming mockup progress.
- If similar drift spans beyond Phase 3.1 or crosses multiple future phases, then create a temporary drift Effort. For now, this feature-phase record is the source of truth.

## Speed Requirement

Recipe suggestions must appear as soon as the recipe response is ready. Image generation must be async/cached and must not block:

- viewing recipe suggestions
- selecting a ticket
- opening Prep Tray
- starting Cook mode

## Acceptance Criteria

- Every known Phase 3 drift row is marked fixed, accepted, or deferred with owner/scope.
- Phase 3.1 visual review covers Planning entry, Chef It Up time, Cuisine, Ticket Pass, Prep Tray, Slop Bowl, and bottom nav against current docs/mockups and current Phase 3 screenshots.
- Phase 3.1 docs record the accepted facelift direction before implementation starts.
- Planning entry shows italicized **Slop It Up** for the Slop Bowl choice with one approved italic supporting line, while Chef It Up remains unchanged in its refined, collaborative register.
- Planning entry highlights only the key pantry fact in the status line with Planning coral while preserving empty-Pantry guard behavior.
- Planning entry setup-ready confirmation is concise, title-only, and auto-dismisses quickly instead of repeating local/browser-retention copy over the choice cards.
- Slop Bowl pantry-check chips align with the Chef It Up Phase 3.2 pantry-confirmation grammar where behavior overlaps, while preserving Slop Bowl's omit-from-this-bowl behavior for saved Pantry items.
- Actual app ingredient-list chips align to the bolder checked pantry-fact style across scan/review menus, Ticket Pass `Uses`, and related recipe surfaces when they represent known saved/detected ingredients.
- Any future Ticket Pass retry preserves at least the current `main` compact-row readability and image-slot stability while making the selected ticket feel more like a shared ticket-pass object rather than a generic featured card.
- Ticket Pass and Prep Tray image placeholders are replaced by real imagery when `imageUrl` is available.
- Ready Prep Tray selected images fill the upper hero panel above the recipe details instead of rendering as a smaller centered thumbnail.
- Placeholders remain polished and stable when imagery is unavailable or still loading.
- The layout does not shift when images hydrate.
- Image generation/fetch failures do not block recipe selection or cooking.
- Replit validation covers fast suggestion reveal, image hydration/fallback, refresh suggestions, and Prep Tray display.

## Open Questions

- Does the accepted PR #175 Ticket Pass hierarchy need only light adjacent Prep Tray alignment, or should the next Phase 3.1 visual slice move elsewhere first?
- What visual grammar should Phase 3.1 use for Planning cards and whitespace so the surface feels modern and coherent without drifting from Laica's food-native identity?
- Which imagery direction best fits Laica's speed and tone: generated recipe image, custom illustration, recipe-type illustration library, or hybrid?
