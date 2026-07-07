# Initiative Registry

Complete searchable index of Laica INITs.

Default agent workflow:

- Start here or in the relevant INIT before resuming multi-phase work.
- Treat the INIT file as authoritative if this registry drifts.
- Use live GitHub state for which PRs are currently open or merged; do not treat this registry as the authority for in-flight PR status.
- Update this registry when an INIT is created, changes status, changes active phase, or completes.

| INIT | Title | Status | Owner | Created | Current phase | Last update |
|---|---|---|---|---|---|---|
| [INIT-001](INIT-001-mobile-refresh.md) | Mobile Refresh | `In Progress` | Wilson / Codex / Claude / Replit | 2026-04-29 | Phase 4 Ready Check in progress / Phase 3.1 follow-up | 2026-07-07: `codex/init-001-phase4-ready-check` started the Phase 4 Ready Check slice after PR #256/#257; new Live Cooking step generation is user-gated, acknowledged optional missing/skipped ingredients are passed to cooking-step generation, and exact-head GitHub E2E plus release/batch Replit smoke remain validation lanes. |
| [INIT-002](INIT-002-ai-error-telemetry.md) | AI Error Telemetry & Eval Monitoring | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-07 | Phase 2 — Replit observation week | 2026-06-10: [#159](https://github.com/wmishak404/laica/pull/159) merged; Phase 2 Replit observation is the current resume point. |
| [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) | Anonymous Trial and Account Upgrade | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-15 | Phase 5 / later promotion follow-up planning | 2026-06-09: [#156](https://github.com/wmishak404/laica/pull/156) merged; later guest cook/History import still waits for Phase 5 planning. |
| [INIT-004](INIT-004-ai-output-quality-evals.md) | AI Output Quality Evals & Prompt Improvement | `In Progress` | Wilson / Codex / Claude / Replit | 2026-06-09 | Phase 3 - eval harness | 2026-06-30: [#247](https://github.com/wmishak404/laica/pull/247) merged EFF-022 transparent pantry-fallback direction as docs-only signal; runtime implementation and fallback activation threshold remain deferred after higher-priority INIT-001 work. |
