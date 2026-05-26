# PD-012: Public anonymous trial and account upgrade

**Date:** 2026-05-15
**Status:** Accepted
**Decision maker:** Wilson
**Type:** Product / UX / Security / Architecture
**Scope:** Public app entry, guest usage limits, account upgrade boundary, and authenticated persistence contract
**Applies when:** Changing pre-auth entry, anonymous Firebase behavior, recipe-generation gating, durable-save rules, linked-account upgrade prompts, or Phase 5 returning-user memory behavior.
**Volatility:** Active review needed
**Review trigger:** Revisit when guest-to-link conversion, abuse/cost telemetry, early-generation quality evidence, or returning-user behavior shows the 10-generation cap or local-persistence contract should change.
**Related Initiatives:** [INIT-003 — Anonymous Trial and Account Upgrade](../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md), [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Related Efforts:** [EFF-017](../efforts/effort-017-environment-parity-and-ci-confidence.md)

## Context

[INIT-001](../initiatives/INIT-001-mobile-refresh.md) Phase 1 shipped a Google-only authenticated entry and removed the old demo-era landing behavior. That flow is clean, but it still asks users to hand over identity before they have learned whether Laica is worth trusting. Wilson wants a guest path that lets people experience the product first, while still preserving the real production auth contract: the client signs into Firebase, protected API calls carry Firebase bearer tokens, and the server verifies them with Firebase Admin.

During planning, the direction changed twice in meaningful ways:

- The work began as a dev-only auth-harness discussion and then widened into a real product decision for public anonymous entry.
- The product direction temporarily moved to "unlimited until save," but that removed most of the incentive to ever link Google while still keeping the engineering and abuse-control cost of a true guest mode.

The final decision therefore needs to balance three forces at once:

- lower-friction trust building for first-time users
- a clear and honest reason to link Google later
- a security and cost posture that does not make anonymous traffic effectively unlimited

Phase 5 of [INIT-001](../initiatives/INIT-001-mobile-refresh.md) is especially relevant because it owns durable history, pending cleanup, taste signal, and the returning-user memory loop. This decision therefore sets the guest boundary for those post-cook surfaces too.

### 2026-05-24 cap revision

Wilson revised the anonymous quota from 5 to 10 successful recipe generations. The reason is not only generosity; it is a cleaner first-use mental model and a better fit for an early product.

The cap increased to 10 because:

- New users should have enough room to get into a real cooking flow before account creation becomes the next step.
- A recipe generation can miss because the user changes their mind, wants to iterate, or rejects the direction after seeing it.
- A recipe generation can also miss because Laica is still young and may produce something that does not fit the user's taste, pantry, or expectations. Those misses are partly on the product, so the guest policy should leave room for them before asking for Google.
- The cap should still protect cost and abuse, but the user-facing story should remain "start cooking now" rather than "you are in a small trial."

## Decision

### Public entry model

- Laica allows Firebase anonymous auth as the public guest entry path.
- Google sign-in remains the upgrade path to a durable account.
- The real Firebase auth contract remains intact. This is not a backend auth bypass and not a reuse of personal browser sessions or cookies.

### Guest recipe quota

- Anonymous users receive **10 successful recipe generations** total in v1.
- The quota is shared across:
  - Chef It Up recipe generation
  - pantry recipe generation
  - Slop Bowl generation
- Only successful generation responses count against the quota.
- Validation errors, provider failures, canceled requests, and blocked requests do not count.
- After the tenth successful generation, the next new generation attempt is blocked until the user links Google.

### Guest persistence contract

- Guest progress persists on the same browser and device through normal reopen.
- Guest progress is intentionally fragile, not durable. It is lost on:
  - explicit sign-out
  - cleared site data or storage
  - browser change
  - device change
- This local persistence is a convenience contract, not an account-memory contract.

### Upgrade boundary

- Google linking is required for recipe generation **#11 and beyond**.
- Google linking is also required for any durable server-side save.
- "Save gate" means the durable-write boundary, not the same-browser local guest experience.

Durable saves include:

- pantry, profile, and settings persistence
- durable cooking sessions and history
- Phase 5 post-cook memory such as `pending_cleanup`, `taste_signal`, and related returning-user state
- future explicit "save this recipe/history" features unless a later decision says otherwise

### User-journey messaging

- The landing screen should present guest mode as a simple action such as **"Start cooking now"** with Google as the linked-account path.
- The landing proof area should stay grounded in product truth: scan and recipe-picking visuals may mirror existing setup/planning UI, while live-guidance visuals should remain illustrative until the final cooking guide UI exists.
- Static or generated landing imagery should default to a **slightly cartoony consumer-packaged domestic style** when it is explaining a real product flow. The image should feel like a warm home kitchen, but front-page ingredients should be approachable grocery items, not raw meat or food-magazine staging.
- Pantry-scan imagery should suggest Laica organizing ordinary kitchen inputs without making the page feel dirty or chaotic: keep the background clean, place ingredients with natural uneven spacing instead of a perfect catalog line, and let the app-rendered scan/list UI carry the organization story.
- Pantry-scan examples may include image-embedded generic labels when the label clarifies packaged ingredients, such as `BEEF PATTIES` or `BBQ SAUCE`. Leave obvious loose or transparent-container ingredients, such as rice and eggs, visually identifiable but unlabeled when possible so the page signals that Laica can infer ingredients without printed text.
- Beef or similar proteins on public entry surfaces should appear as consumer packaging with an appetizing cooked-product illustration or generic package art, not bare raw meat and not raw meat under plastic wrap.
- Generated images should avoid real brand logos, real trade dress, people, and exact trademarked packaging. Use fictional grocery packaging that gives the user the idea of products like boxed patties without copying Costco/Kirkland, Bubba, or another brand.
- Product UI, progress dots, scan frames, and recipe-card structure should remain app-rendered whenever possible so interaction and layout stay inspectable and maintainable.
- Live-guidance proof should not rely on numbered overlays on a food image. Until Phase 4 settles the final cooking guide, use a lightweight app-rendered panel with step, progress, checklist, and tip elements to communicate guided cooking.
- Recipe and cooking-guidance imagery should stay plausible as home cooking from those packaged ingredients. Use appetizing but ordinary bowls, pans, counters, and kitchen lighting rather than restaurant plating, fantasy illustration, or unsupported cuisine-promise visuals. If the same ingredient packaging appears across scan and guidance slides, keep its label style consistent.
- The landing screen should not advertise the numeric guest quota; first-touch copy should focus on what Laica helps people do.
- The 10-generation cap is an internal product and abuse-control boundary, not the primary marketing message.
- The guest quota should be **quiet first, stronger later**.
- Remaining quota becomes more prominent as the guest approaches `2`, `1`, and `0` remaining generations.
- The upgrade message depends on the trigger:
  - recipe-cap moment: **unlock more recipes**
  - durable-save moment: **save your kitchen**

### Security contract

- The server derives guest-vs-linked mode from verified Firebase token claims, never from client-declared state.
- Public anonymous auth requires Firebase App Check before production enablement.
- Anonymous auth must be guarded by:
  - a server-side kill switch
  - anonymous traffic keyed by IP for user-scoped rate limits
  - the existing protected-route bearer-token verification contract
- Anonymous sign-in alone must not create a durable `auth_users` row.
- Placeholder empty-string email values must not be used as a substitute for missing identity data.

### Phase 5 returning-user rule

- Anonymous users do **not** create durable post-cook history, pending cleanup, taste memory, or next-meal retention state in v1.
- Phase 5 remains a linked-account memory surface.
- Anonymous cooking may continue locally on the same browser/device, but it does not become durable returning-user state until the user links Google.
- Completed anonymous post-cook history is not retro-imported into durable history in v1.

### Measurement and automation boundary

- Product analytics for guest-to-link conversion, cap friction, and returning-user behavior is intentionally separate from this decision and should be tracked in its own follow-up work.
- Environment-parity and browser-smoke automation remain under [EFF-017](../efforts/effort-017-environment-parity-and-ci-confidence.md). Guest auth can reduce browser-auth friction later, but it does not replace linked-account validation in Replit.
- Anonymous entry creates a first-party browser automation path for the guest happy path: agents can start from `Start cooking now`, receive a real Firebase anonymous session, and exercise setup/recipe/cooking-guide flows without depending on a Google provider popup. This is a validation and developer-productivity benefit of the product direction, not a separate auth harness.
- This automation benefit must not be overread. Google sign-in, linked-user profile upsert, linked-user history/cooking persistence, and upgrade-to-save behavior still require explicit linked-account validation in Replit.

## Rationale

- A guest path helps new users discover value before trusting Laica with identity, which is especially important for a product asking people to share pantry and cooking context.
- A **10-generation cap** preserves that trust-building window without making Google linking optional forever.
- The larger cap gives new users room to regenerate, iterate, or recover from early recipe misses. Because Laica is still young, some rejected generations are product quality misses on Laica's side, not user indecision; the guest policy should leave enough room for that.
- A same-browser persistence contract avoids the worst guest-mode annoyance: being forced to rescan pantry after every normal reopen.
- A linked-only durable-memory boundary keeps Phase 5 coherent. Returning-user history, cleanup, and taste memory should belong to a real account, not to a fragile anonymous browser session.
- Keeping the cap on recipe generation instead of on "full cooks" makes enforcement deterministic and easier to explain in the UI.
- Splitting the upgrade copy between "unlock more recipes" and "save your kitchen" creates clearer user moments than using one generic account-upsell everywhere.
- The same guest path that improves first-use trust also improves automation confidence: it lets browser tests exercise more of the real product surface without fragile third-party auth popups, while still keeping linked-account behavior on the real Google/Firebase validation path.

## Alternatives considered

| Alternative | Why not chosen |
|---|---|
| Unlimited guest generation until first save | Friendlier at first, but removes most of the incentive to link Google and leaves abuse/cost exposure higher for longer |
| 5 successful generations instead of 10 | Simpler and cheaper, but too tight for iteration if early recipe quality, pantry fit, or taste alignment misses |
| 3 successful generations instead of 10 | Stronger conversion pressure, but more likely to feel like a teaser rather than a real trial |
| 1 full cook then link | Easier to market, harder to count cleanly, and riskier if the first generated recipe misses the user's taste |
| Keep Google-only public entry | Simplest technically, but keeps the same first-use trust problem that motivated the change |
| Durable anonymous accounts with server-backed history | Too close to a full account system without the commitment or recovery guarantees of a linked identity |
| Backend auth-bypass or personal-session reuse for testing | Rejected because it would weaken or sidestep the production auth contract |

## Consequences

- A new cross-cutting initiative, [INIT-003](../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md), is the active implementation home for this work.
- Guest mode now has two explicit upgrade triggers:
  - generation cap
  - durable-save boundary
- Phase 1 auth assumptions from [INIT-001](../initiatives/INIT-001-mobile-refresh.md) become historical baseline, not the final public-entry policy.
- Phase 5 implementation must respect the linked-only durable-memory boundary from day one.
- Runtime implementation will need:
  - a provider-aware auth session contract
  - anonymous-safe quota accounting
  - local guest-state namespacing and cleanup
  - typed upgrade-required responses for durable-write routes

## Open follow-ups

- Land the Phase 0 docs baseline in [INIT-003](../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md) and then start runtime work from fresh `origin/main`.
- Add Firebase App Check before enabling public anonymous auth in production.
- File separate analytics work for guest-to-link and returning-user measurement rather than expanding this PD into a measurement plan.
- Re-evaluate the 10-generation cap after real usage evidence, cost signals, early-generation quality evidence, and Phase 5 returning-user data exist.
