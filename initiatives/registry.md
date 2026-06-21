# Initiative Registry

Complete searchable index of Laica INITs.

Default agent workflow:

- Start here or in the relevant INIT before resuming multi-phase work.
- Treat the INIT file as authoritative if this registry drifts.
- Update this registry when an INIT is created, changes status, changes active phase, or completes.

| INIT | Title | Status | Owner | Created | Current phase | Active PRs | Last signal |
|---|---|---|---|---|---|---|---|
| [INIT-001](INIT-001-mobile-refresh.md) | Mobile Refresh | `In Progress` | Wilson / Codex / Claude / Replit | 2026-04-29 | Phase 3.1 follow-up / Phase 4 planning | None | PR #208 merged as `3c73dda`: approved selected-recipe images now fill the Prep Tray upper hero panel while pending/placeholder states remain centered; Wilson accepted the primary Replit visual ask at `fb14852`, and exact-head GitHub `unit` / `e2e_guest_smoke` passed at `3835caf`. PR #201 remains the Chef It Up / MealPlanning reload restoration baseline, PR #192 remains the selected-image runtime baseline, and PR #191 remains the Live Cooking speech arbitration baseline. |
| [INIT-002](INIT-002-ai-error-telemetry.md) | AI Error Telemetry & Eval Monitoring | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-07 | Phase 2 — Replit observation week | None | PR #159 merged as `382ebd0` on 2026-06-10, shipping request IDs, a server-side classifier/logger, and 9 AI route catch blocks with no DB persistence. Final head `76b5361` passed local checks, GitHub unit/E2E/security, and direct Replit shell/browser validation without Replit Agent. Next: observe real Replit AI/speech/secrets behavior before Phase 3 schema work. |
| [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) | Anonymous Trial and Account Upgrade | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-15 | Phase 5 / later promotion follow-up planning | None | PR #156 merged the guest bottom-nav correction as `492b3a6`: the unapproved `Save progress` shortcut is removed while menu/planning promotion paths remain. The first Phase 4 promotion slice remains merged via PR #126 (`8282d51`), and future guest cook/History import still waits for Phase 5/later promotion planning after INIT-001 Phase 5. |
| [INIT-004](INIT-004-ai-output-quality-evals.md) | AI Output Quality Evals & Prompt Improvement | `In Progress` | Wilson / Codex / Claude / Replit | 2026-06-09 | Phase 3 - eval harness | None | PR #205 merged as `762488e` after PR #191: public pantry-recipes fixture coverage now includes dietary compliance, pantry grounding / optional extras, and beginner skill fit, with no prompt, provider, schema, runtime, private-fixture, daily-report, or EFF-022 product-rule change. |
