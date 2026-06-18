# PD-012: Public anonymous trial and account upgrade

**Date:** 2026-05-15
**Status:** Accepted
**Decision maker:** Wilson
**Type:** Product / UX / Security / Architecture
**Scope:** Public app entry, guest usage limits, linked-account boundary, and authenticated persistence contract
**Applies when:** Changing pre-auth entry, anonymous Firebase behavior, recipe-generation gating, durable-save rules, linked-account prompts, or Phase 5 returning-user memory behavior.
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

### 2026-05-29 implementation status

PR #102 shipped the public pre-auth homepage and Firebase anonymous guest entry. PR #107 then merged the production-gate slice as `a0efc430450aa4f0e582dd7d96ebcdc187633098` after Wilson validated Replit at current PR head `72ef2f7`, including App Check enforced mode with `FIREBASE_APP_CHECK_ENFORCED=true`.

The implemented v1 gate now includes server-backed anonymous quota accounting, typed `LINKED_ACCOUNT_REQUIRED` boundaries, provider-failure quota refunds, an anonymous kill switch, IP-keyed anonymous rate limits, App Check token attachment/enforcement, session-local guest Pantry/Kitchen/Profile Settings, and auth-scoped browser/query caches so guest or prior-account state does not leak into later linked accounts.

The decision remains active because PR #126 merged only the first Phase 4 promotion/linking slice, Phase 5 returning-user memory work is still future scope, and the 10-generation cap should be revisited after real usage, abuse/cost, and recipe-quality evidence.

### 2026-06-03 conversion-history clarification

Wilson clarified that anonymous cooking history should become durable only when the user converts, not through background retro-import of every completed guest cook. The near-term account-promotion promise is therefore: sign up with Google so Laica keeps the setup and cooking work the user chooses to carry forward. Pantry, Kitchen, and Cooking Profile import are the first conversion targets; completed cook History import remains a later deliberate Phase 5/promotion design unless the user converts at an explicit save-history moment.

### 2026-06-03 Phase 4 promotion UX validation

Wilson validated the first Google promotion slice in Replit and accepted the product shape for both new Google sign-up and existing-Google credential flows. The accepted mental model is:

- a guest is still not presented as holding an account
- sign-up is a preservation path for setup work
- Start over remains available as a separate guest escape hatch
- Settings should stay concise and should not repeatedly explain browser-local storage
- the single menu-header cue `Saved on this browser` is enough for this slice
- the Google-import consent dialog should stay neutral and user-friendly; it should not say the Google account already exists in Laica or already has a Laica kitchen
- after successful linking, the planning header should confirm `Account successfully connected and signed in. Your kitchen is saved.` and keep that confirmation visible until the user moves to the next page/flow

### 2026-06-04 Phase 4 first promotion slice merged

PR #126 merged the first Google promotion slice as `8282d5193f6eeef50eeecdff9f91bd029bbcd561`. The merged implementation preserves Pantry, Kitchen, Cooking Profile, and favorite chefs through Google conversion, asks before importing browser-local setup into an existing Google credential path, keeps Sign up separate from Start over, and leaves completed guest cooks out of durable History. GitHub Actions passed Dependency Audit, Secret Scan, typecheck/build/unit, and guest E2E smoke at PR head `f2eb44d`; Wilson's Replit validation reached runtime code head `2a4ae75`.

### 2026-06-09 guest bottom-nav correction

Wilson rejected the guest-only `Save progress` bottom-nav shortcut as an unapproved durable navigation addition. Guest promotion remains available through the planning reminder and the app menu action, but the bottom nav should not add a one-function guest promotion icon unless Wilson explicitly approves that navigation change.

PR #156 merged this correction as `492b3a6808dd088c430b49649ea3c4ef4bfde0ee`. The merged behavior removes the guest-only bottom-nav shortcut while preserving the app menu and planning reminder promotion paths. The same PR also made the E2E evidence lane and signup-continuation validation nuance durable in the testing workflow and EFF-017.

## Decision

### Public entry model

- Laica allows Firebase anonymous auth as the public guest entry path.
- Google sign-in remains the path to a durable linked account.
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
- The v1 quota is counted per Firebase anonymous identity, not per durable human identity. Same-browser normal reopen should preserve the same anonymous UID and quota state, but explicit sign-out, cleared site data, another browser/device, or incognito can create a fresh anonymous UID. This is acceptable for the early public MVP because the quota is a low-friction product/conversion gate, while App Check, IP-keyed rate limits, and the kill switch are the abuse backstops. Revisit stronger identity or abuse controls only if usage/cost signals require it.

### Guest persistence contract

- Guest progress persists on the same browser and device through normal reopen.
- Guest Pantry, Kitchen, and Cooking Profile Settings remain editable during the guest session so a returning guest can inspect, add, and remove the local setup data Laica is using for later Chef It Up attempts.
- Guest Settings writes are browser-local session/profile updates only; they must not call durable profile/settings APIs while the Firebase user is anonymous.
- Browser-local guest state and client caches that affect profile, pantry, planning, cooking, or history must be scoped by auth mode and Firebase/user identity. A guest's cuisine/time selections, planning drafts, local cooking resume state, or profile cache must not appear after Google sign-in or account switching on the same browser.
- Guest progress is intentionally fragile, not durable. It is lost on:
  - explicit sign-out
  - cleared site data or storage
  - browser change
  - device change
- This local persistence is a convenience contract, not an account-memory contract.

### Linked-account boundary

- Google linking is required for recipe generation **#11 and beyond**.
- Google linking is also required for any durable server-side save.
- "Save gate" means the durable-write boundary, not the same-browser local guest experience.
- Runtime/API terminology should use `LINKED_ACCOUNT_REQUIRED`, not `UPGRADE_REQUIRED`, for this boundary. Reserve "upgrade" language for future paid-tier work.

Durable saves include:

- server-side pantry, profile, and settings persistence
- durable cooking sessions and history
- Phase 5 post-cook memory such as `pending_cleanup`, `taste_signal`, and related returning-user state
- future explicit "save this recipe/history" features unless a later decision says otherwise
- future Saved recipe bookmarks unless a later decision explicitly keeps them browser-local for guests

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
- The linked-account prompt depends on the trigger:
  - recipe-cap moment: **unlock more recipes**
  - durable-save moment: **sign in or create an account to save your ingredients and profile**
- The promotion prompt should depend on the user's moment:
  - regular guest menu/planning reminder: sign-up or save-progress copy that emphasizes preserving Pantry, Kitchen, and Cooking Profile
  - guest reset/abandon moment: a separate **Start over** action, not hidden behind sign-up
  - Google credential-in-use/import moment: neutral copy that asks to save the current setup to Google and promises no overwrite if anything is already saved
  - successful conversion moment: inline confirmation in the planning header that persists until the user moves to the next page/flow, not only a transient toast

### Security contract

- The server derives guest-vs-linked mode from verified Firebase token claims, never from client-declared state.
- The client must not treat Firebase anonymous auth state as sufficient to enter the protected app. Anonymous entry is accepted only after the backend `/api/auth/session` gate confirms the session, so kill-switch, App Check, and quota/session policy stay server-authoritative.
- Public anonymous auth requires Firebase App Check before production enablement.
- Anonymous auth must be guarded by:
  - a server-side kill switch
  - anonymous traffic keyed by IP for user-scoped rate limits
  - a Chef It Up recipe-generation burst limit that defaults to 20 requests per 30 minutes, plus the existing day cap
  - the existing protected-route bearer-token verification contract
- The recipe burst limit should not interrupt normal validation of the 10-successful-generation guest quota; if it fires, user copy should follow the server `Retry-After` horizon rather than saying "a few minutes" for a long wait.
- Provider-capacity failures such as OpenAI `insufficient_quota` are not guest quota exhaustion. They should be typed separately, refund any reserved anonymous recipe slot, and use copy that points to Laica-side AI capacity rather than asking the guest to link Google.
- Anonymous sign-in alone must not create a durable `auth_users` row.
- Placeholder empty-string email values must not be used as a substitute for missing identity data.

### Phase 5 returning-user rule

- Anonymous users do **not** create durable post-cook history, pending cleanup, taste memory, or next-meal retention state in v1.
- Phase 5 remains a linked-account memory surface.
- Anonymous cooking may continue locally on the same browser/device, but it does not become durable returning-user state until the user links Google and chooses what to carry forward.
- Completed anonymous post-cook history is not bulk- or background-retro-imported into durable history in v1.
- A future conversion moment may let the user explicitly save the current guest cook, or a small selected set of guest cook state, into durable History after Google linking. That path must be designed as user-consented promotion/import work, not an automatic side effect of anonymous sign-in or normal Google sign-in.
- Future Saved recipe bookmarks are also a durable memory decision point. If guest Saved support is considered, it must be designed explicitly as either same-browser local convenience or user-consented linked-account import, not inferred from transient planning-session recovery.

### Measurement and automation boundary

- Product analytics for guest-to-link conversion, cap friction, and returning-user behavior is intentionally separate from this decision and should be tracked in its own follow-up work.
- Environment-parity and browser-smoke automation remain under [EFF-017](../efforts/effort-017-environment-parity-and-ci-confidence.md). Guest auth can reduce browser-auth friction later, but it does not replace linked-account validation in Replit.
- Anonymous entry creates a first-party browser automation path for the guest happy path: agents can start from `Start cooking now`, receive a real Firebase anonymous session, and exercise setup/recipe/cooking-guide flows without depending on a Google provider popup. This is a validation and developer-productivity benefit of the product direction, not a separate auth harness.
- This automation benefit must not be overread. Google sign-in, linked-user profile upsert, linked-user history/cooking persistence, and linked-save behavior still require explicit linked-account validation in Replit.

## Phase 4 Promotion Acceptance Criteria

Future validation of the first anonymous-to-Google promotion slice should prove:

- Guest setup remains editable and persistent on the same browser before conversion.
- Guest menu/header copy reinforces browser-local progress without implying a durable anonymous account.
- Settings menu/screen/toast copy stays concise; do not repeat `this browser` on every Settings surface.
- Guest users have both a preservation action (`Sign up` / save progress) and an abandon action (`Start over`).
- Guest promotion can appear in the app menu and planning reminder, but not as a guest-only bottom-nav shortcut without explicit Wilson approval.
- Canceling or closing the Google popup uses calm cancel copy rather than a failure tone and must not leave the UI stuck in a busy state. Firebase may take a few seconds to report popup closure; avoid brittle window-focus heuristics unless the delay becomes a blocker.
- New Google sign-up preserves Pantry, Kitchen, Cooking Profile, and favorite chefs after refresh.
- Existing Google credential/import flow asks before importing the browser setup.
- Import merge behavior does not silently overwrite existing linked setup: keep existing cooking skill when present, merge list fields, and merge dietary restrictions without letting guest `No restrictions` erase specific linked restrictions.
- After successful linking, the planning header shows `Account successfully connected and signed in. Your kitchen is saved.` and the message survives auth/profile refresh churn until the user leaves the planning choice.
- Completed anonymous cooks do not automatically appear in durable History after conversion.
- Firebase Auth deletion and Laica database deletion are tested as separate concepts when resetting Replit validation accounts; deleting `auth_users` rows alone does not guarantee Firebase will treat a Google credential as new.

## Rationale

- A guest path helps new users discover value before trusting Laica with identity, which is especially important for a product asking people to share pantry and cooking context.
- A **10-generation cap** preserves that trust-building window without making Google linking optional forever.
- The larger cap gives new users room to regenerate, iterate, or recover from early recipe misses. Because Laica is still young, some rejected generations are product quality misses on Laica's side, not user indecision; the guest policy should leave enough room for that.
- A same-browser persistence contract avoids the worst guest-mode annoyance: being forced to rescan pantry after every normal reopen.
- A linked-only durable-memory boundary keeps Phase 5 coherent. Returning-user history, cleanup, and taste memory should belong to a real account, not to a fragile anonymous browser session.
- Conversion-gated durability protects the user's effort without turning every anonymous cook into a long-lived migration obligation. The product should nudge users to create an account before or at a durable save moment, then save only the setup/cook state they choose to carry forward.
- Keeping the cap on recipe generation instead of on "full cooks" makes enforcement deterministic and easier to explain in the UI.
- Splitting the linked-account copy between "unlock more recipes" and "sign in or create an account to save your ingredients and profile" creates clearer user moments than using one generic account prompt everywhere, while reserving "upgrade" language for later paid-tier work.
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
- Guest mode now has two explicit linked-account triggers:
  - generation cap
  - durable-save boundary
- Phase 1 auth assumptions from [INIT-001](../initiatives/INIT-001-mobile-refresh.md) become historical baseline, not the final public-entry policy.
- Phase 5 implementation must respect the linked-only durable-memory boundary from day one.
- Runtime implementation now has the core production gates from PR #107: provider-aware auth session metadata, anonymous-safe quota accounting, local guest-state namespacing, typed linked-account-required responses for durable-write routes, App Check posture, and anonymous kill switch/rate-limit controls.
- Runtime implementation now has the first Google promotion slice from PR #126: guest setup preservation through Google conversion, neutral consent before importing into an existing Google credential path, separate Sign up and Start over actions, and no automatic completed-cook History import.
- Public runtime configuration still matters. App Check must stay registered for the target public domain, `VITE_FIREBASE_APP_CHECK_SITE_KEY` must be present client-side, `FIREBASE_APP_CHECK_ENFORCED=true` must be set when anonymous public access is enabled, and `anonymous_recipe_usage` must exist in the target database.

## Open follow-ups

- Keep target-runtime App Check configured/enforced for public anonymous access and revalidate if the public domain, Firebase App Check app, or Replit/deployment secret setup changes.
- Keep future promotion expansion explicit and user-consented, especially any current-cook or selected-cook History import after Google linking.
- After INIT-001 Phase 5 is implemented and validated, reopen INIT-003 Phase 5/later-promotion planning to decide whether the merged History/cleanup/taste/retention semantics justify an explicit guest current-cook or selected-cook import path.
- Keep Phase 5 durable History, cleanup memory, taste memory, next-meal retention, and durable cooking-session memory linked-account only unless a later INIT-003 phase changes that boundary. Do not add automatic bulk guest-History import as part of the first Google promotion slice.
- File separate analytics work for guest-to-link and returning-user measurement rather than expanding this PD into a measurement plan.
- Re-evaluate the 10-generation cap after real usage evidence, cost signals, early-generation quality evidence, and Phase 5 returning-user data exist.
