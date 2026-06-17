# Initiative Registry

Complete searchable index of Laica INITs.

Default agent workflow:

- Start here or in the relevant INIT before resuming multi-phase work.
- Treat the INIT file as authoritative if this registry drifts.
- Update this registry when an INIT is created, changes status, changes active phase, or completes.

| INIT | Title | Status | Owner | Created | Current phase | Active PRs | Last signal |
|---|---|---|---|---|---|---|---|
| [INIT-001](INIT-001-mobile-refresh.md) | Mobile Refresh | `In Progress` | Wilson / Codex / Claude / Replit | 2026-04-29 | Phase 3.1 follow-up / Phase 4 speech arbitration slice | [#191](https://github.com/wmishak404/laica/pull/191) draft | PR #201 merged as `d37a4df`: Chef It Up / MealPlanning reload restoration now recovers valid active Ticket Pass and Prep Tray sessions within 15 minutes while explicit Back suppresses stale restore. PR #192 imagery behavior remains accepted: Ticket Pass placeholder-only, Prep Tray selected image, OpenAI default, and Gemini benchmarking deferred before any provider-default change. PR #191 is draft for existing Live Cooking speech arbitration after implementing Back/Finish/unmount exit cleanup and seeding the full speech-action matrix before merge readiness. |
| [INIT-002](INIT-002-ai-error-telemetry.md) | AI Error Telemetry & Eval Monitoring | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-07 | Phase 2 — Replit observation week | None | PR #159 merged as `382ebd0` on 2026-06-10, shipping request IDs, a server-side classifier/logger, and 9 AI route catch blocks with no DB persistence. Final head `76b5361` passed local checks, GitHub unit/E2E/security, and direct Replit shell/browser validation without Replit Agent. Next: observe real Replit AI/speech/secrets behavior before Phase 3 schema work. |
| [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) | Anonymous Trial and Account Upgrade | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-15 | Phase 5 / later promotion follow-up planning | None | PR #156 merged the guest bottom-nav correction as `492b3a6`: the unapproved `Save progress` shortcut is removed while menu/planning promotion paths remain. The first Phase 4 promotion slice remains merged via PR #126 (`8282d51`), and future guest cook/History import still waits for Phase 5/later promotion planning after INIT-001 Phase 5. |
| [INIT-004](INIT-004-ai-output-quality-evals.md) | AI Output Quality Evals & Prompt Improvement | `In Progress` | Wilson / Codex / Claude / Replit | 2026-06-09 | Phase 3 - eval harness | None | PR #200 merged as `bb5604f`: public fixture validation now has `npm run eval:fixtures` as a focused evidence lane. Next Phase 3 candidates are the next small target-set batch, `pantry_recipes` provenance work, and later calibrated narrow judges. |
