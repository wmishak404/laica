# Mobile Refresh Phase 3.1 — Design Facelift and Recipe Imagery

**Status:** Planned
**Document kind:** Feature Phase Record
**Phase owner:** Wilson
**Date:** 2026-05-05
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Builds on:** [Phase 3 Planning](phase-03-planning.md)

## Goal

Take a deliberate design step back after Phase 3 functional closeout, then improve the Phase 3 look and feel while adding real recipe imagery or illustration to the Ticket Pass and Prep Tray without slowing the first recipe-suggestion reveal.

Wilson redirected the proposed "Phase 3 design drifts" epic into this Phase 3.1 work package, then froze Phase 3 visuals so Phase 3 can close on functionality. Phase 3.1 is therefore the design facelift plus imagery pass, not a continuation of piecemeal Phase 3 visual tuning.

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
- Review the documented Phase 3 drift inventory before deciding Phase 3.1 is visually ready.
- Mark each drift as fixed, accepted, or deferred with owner/scope before Phase 3.1 closes.
- Compare Planning entry, Chef It Up time, Cuisine, Ticket Pass, Prep Tray, Slop Bowl, and bottom nav against current docs, mockups, and Wilson's Replit feedback.
- Decide the accepted imagery direction: generated food image, custom illustration, recipe-type illustration library, or hybrid.
- Add the image-generation/fetching pipeline only after the Ticket Pass is already usable.
- Hydrate `imageUrl` into existing recipe objects when imagery is available.
- Cache generated images so refreshes and back/forward navigation do not repeatedly incur cost or latency.
- Define fallback behavior for failed generation, slow generation, moderation failures, and missing image URLs.

## Phase 3 Design Drift Inventory

| Drift | Why it was drift | Context/system cause | Phase 3 status | Phase 3.1 recommendation |
|---|---|---|---|---|
| Logo recreated as CSS text mark | Phase 3 used a different Laica mark than other branded pages | Docs required `Laica` casing but did not require the canonical logo asset when showing a product mark | Fixed, then superseded by brand restraint | Keep the canonical-logo rule, but avoid logos inside ordinary in-app process screens |
| Logos repeated inside Planning/Ticket Pass | Internal flows became over-branded after the first logo fix | The mockup showed a mark, but docs did not distinguish branded entry moments from ordinary process screens | Fixed | Keep product marks out of setup, planning, selection, cooking, confirmation, and settings unless explicitly branded |
| Time slider thumb missed labels | Thumb stops did not visually land on `30m`, `1hr`, `1.5hrs`, or `Got all the time` | Radix track stops and label centers used different geometry | Fixed | Validate custom control geometry against screenshots, not only state changes |
| Cuisine list looked capped at six | The user could infer only six cuisines existed | Implementation overfit the visible mockup examples as the full data set | Fixed | Treat mockups as visible slices when content naturally exceeds one screen |
| `No preference` was not default | The default path required an unnecessary tap | Docs said exclusive anchor option but not initial/default state | Fixed | Document default paths separately from option exclusivity and placement |
| Suggestion copy exposed "three" | UI surfaced the exact generation count as product language | Acceptance criteria required exactly three but did not say the count should stay hidden in copy | Fixed | Keep deterministic constraints in tests/docs; use browsing language in user-facing UI |
| Ticket Pass looked like generic cards | Suggestions did not carry the mockup's ticket-stack object language enough | Phase 3 said Ticket Pass, but not enough hard requirements for image slot, density, and hierarchy | Partially fixed; needs Replit visual review | Compare against `phase-03-ticket-pass.png` for object shape, density, featured/alternate hierarchy, and image-slot placement |
| Ticket Pass selection reordered recipes | Selecting recipe 2 or 3 made the chosen recipe jump to the featured position and moved recipe 1 into the compact list, so users lost their place | The component modeled selection as promotion to a separate featured slot instead of expanding the chosen ticket in the generated order | Fixed as a Phase 3 basic-usability exception | Phase 3.1 can revisit the ticket hierarchy, but must preserve selection orientation unless a replacement pattern is explicitly validated |
| Recipe names read like one long paragraph | AI-generated names sometimes contain a main dish plus explicit parenthetical or colon-separated detail | The schema stores one recipe-name string and the UI rendered every name as a single large heading | Fixed with conservative display-only main/supporting split when explicit detail exists | Phase 3.1 should refine title hierarchy with the broader Ticket Pass facelift while preserving the underlying recipe-name contract and avoiding invented subtitles |
| Recipe imagery disappeared | No stable place existed for future generated images to land | "Generated recipe imagery deferred" was interpreted as "no image slot needed" | Fixed with placeholders | Phase 3.1 owns real imagery, async hydration, caching, and failure fallback |
| Planning entry card/whitespace grammar still feels off | The choice cards use too much framed-card language and not enough modern app whitespace | Phase 3 iterated individual concerns instead of stepping back into one coherent facelift | Deferred to Phase 3.1 | Rework Planning entry as a whole surface, with whitespace/card grammar reviewed before implementation |
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
- Do not make image generation part of the recipe-suggestion critical path. Suggestions should remain usable before any image arrives.
- If similar drift spans beyond Phase 3.1 or crosses multiple future phases, then create a temporary drift epic. For now, this feature-phase record is the source of truth.

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
- Ticket Pass and Prep Tray image placeholders are replaced by real imagery when `imageUrl` is available.
- Placeholders remain polished and stable when imagery is unavailable or still loading.
- The layout does not shift when images hydrate.
- Image generation/fetch failures do not block recipe selection or cooking.
- Replit validation covers fast suggestion reveal, image hydration/fallback, refresh suggestions, and Prep Tray display.

## Open Questions

- Does the current Ticket Pass stack carry enough of the `phase-03-ticket-pass.png` object language, or does it need another density/shape pass before validation?
- What visual grammar should Phase 3.1 use for Planning cards and whitespace so the surface feels modern and coherent without drifting from Laica's food-native identity?
- Which imagery direction best fits Laica's speed and tone: generated recipe image, custom illustration, recipe-type illustration library, or hybrid?
