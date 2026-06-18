# Initiative Registry

Complete searchable index of Laica INITs.

Default agent workflow:

- Start here or in the relevant INIT before resuming multi-phase work.
- Treat the INIT file as authoritative if this registry drifts.
- Update this registry when an INIT is created, changes status, changes active phase, or completes.

| INIT | Title | Status | Owner | Created | Current phase | Active PRs | Last signal |
|---|---|---|---|---|---|---|---|
| [INIT-001](INIT-001-mobile-refresh.md) | Mobile Refresh | `In Progress` | Wilson / Codex / Claude / Replit | 2026-04-29 | Phase 3.1 follow-up / Phase 4 planning | None | PR #192 merged as `efd1f88`: Ticket Pass stays placeholder-only, Prep Tray hydrates one selected recipe image with non-blocking polling, OpenAI remains the default provider, Gemini benchmarking remains a Phase 3.1 provider-comparison follow-up, and EFF-027 owns active-flow reload resilience. |
| [INIT-002](INIT-002-ai-error-telemetry.md) | AI Error Telemetry & Eval Monitoring | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-07 | Phase 2 — Replit observation week | None | PR #159 merged as `382ebd0` on 2026-06-10, shipping request IDs, a server-side classifier/logger, and 9 AI route catch blocks with no DB persistence. Final head `76b5361` passed local checks, GitHub unit/E2E/security, and direct Replit shell/browser validation without Replit Agent. Next: observe real Replit AI/speech/secrets behavior before Phase 3 schema work. |
| [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) | Anonymous Trial and Account Upgrade | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-15 | Phase 5 / later promotion follow-up planning | None | PR #156 merged the guest bottom-nav correction as `492b3a6`: the unapproved `Save progress` shortcut is removed while menu/planning promotion paths remain. The first Phase 4 promotion slice remains merged via PR #126 (`8282d51`), and future guest cook/History import still waits for Phase 5/later promotion planning after INIT-001 Phase 5. |
| [INIT-004](INIT-004-ai-output-quality-evals.md) | AI Output Quality Evals & Prompt Improvement | `In Progress` | Wilson / Codex / Claude / Replit | 2026-06-09 | Phase 3 - eval harness | [#198](https://github.com/wmishak404/laica/pull/198) draft | Draft PR #198 adds three public synthetic cooking-step user-expectation fixtures for raw beef doneness, chicken doneness, and missing-lid alternatives; cuisine-fit cases remain deferred to avoid deciding EFF-022 fallback behavior. |
