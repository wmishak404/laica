# PD-012: Public anonymous trial and account upgrade

**Date:** 2026-05-15
**Status:** Accepted
**Decision maker:** Wilson
**Type:** Product / UX / Security / Architecture
**Scope:** Public app entry, guest usage limits, account upgrade boundary, and authenticated persistence contract
**Applies when:** Changing pre-auth entry, anonymous Firebase behavior, recipe-generation gating, durable-save rules, linked-account upgrade prompts, or Phase 5 returning-user memory behavior.
**Volatility:** Active review needed
**Review trigger:** Revisit when guest-to-link conversion, abuse/cost telemetry, or returning-user evidence shows the 5-generation cap or local-persistence contract should change.
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

## Decision

### Public entry model

- Laica allows Firebase anonymous auth as the public guest entry path.
- Google sign-in remains the upgrade path to a durable account.
- The real Firebase auth contract remains intact. This is not a backend auth bypass and not a reuse of personal browser sessions or cookies.

### Guest recipe quota

- Anonymous users receive **5 successful recipe generations** total in v1.
- The quota is shared across:
  - Chef It Up recipe generation
  - pantry recipe generation
  - Slop Bowl generation
- Only successful generation responses count against the quota.
- Validation errors, provider failures, canceled requests, and blocked requests do not count.
- After the fifth successful generation, the next new generation attempt is blocked until the user links Google.

### Guest persistence contract

- Guest progress persists on the same browser and device through normal reopen.
- Guest progress is intentionally fragile, not durable. It is lost on:
  - explicit sign-out
  - cleared site data or storage
  - browser change
  - device change
- This local persistence is a convenience contract, not an account-memory contract.

### Upgrade boundary

- Google linking is required for recipe generation **#6 and beyond**.
- Google linking is also required for any durable server-side save.
- "Save gate" means the durable-write boundary, not the same-browser local guest experience.

Durable saves include:

- pantry, profile, and settings persistence
- durable cooking sessions and history
- Phase 5 post-cook memory such as `pending_cleanup`, `taste_signal`, and related returning-user state
- future explicit "save this recipe/history" features unless a later decision says otherwise

### User-journey messaging

- The landing screen may present guest mode as "Try 5 recipes free" with Google as the secondary path.
- The guest quota should be **subtle first, stronger later**.
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

## Rationale

- A guest path helps new users discover value before trusting Laica with identity, which is especially important for a product asking people to share pantry and cooking context.
- A **5-generation cap** preserves that trust-building window without making Google linking optional forever.
- A same-browser persistence contract avoids the worst guest-mode annoyance: being forced to rescan pantry after every normal reopen.
- A linked-only durable-memory boundary keeps Phase 5 coherent. Returning-user history, cleanup, and taste memory should belong to a real account, not to a fragile anonymous browser session.
- Keeping the cap on recipe generation instead of on "full cooks" makes enforcement deterministic and easier to explain in the UI.
- Splitting the upgrade copy between "unlock more recipes" and "save your kitchen" creates clearer user moments than using one generic account-upsell everywhere.

## Alternatives considered

| Alternative | Why not chosen |
|---|---|
| Unlimited guest generation until first save | Friendlier at first, but removes most of the incentive to link Google and leaves abuse/cost exposure higher for longer |
| 3 successful generations instead of 5 | Stronger conversion pressure, but more likely to feel like a teaser rather than a real trial |
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
- Re-evaluate the 5-generation cap after real usage evidence, cost signals, and Phase 5 returning-user data exist.
