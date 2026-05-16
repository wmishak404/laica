# Initiative Registry

Complete searchable index of Laica INITs.

Default agent workflow:

- Start here or in the relevant INIT before resuming multi-phase work.
- Treat the INIT file as authoritative if this registry drifts.
- Update this registry when an INIT is created, changes status, changes active phase, or completes.

| INIT | Title | Status | Owner | Created | Current phase | Active PRs | Last signal |
|---|---|---|---|---|---|---|---|
| [INIT-001](INIT-001-mobile-refresh.md) | Mobile Refresh | `In Progress` | Wilson / Codex / Claude / Replit | 2026-04-29 | Phase 3.1 / Phase 4 planning | None | PR #78 was closed unmerged after failing Ticket Pass visual acceptance. The next Phase 3.1 attempt should restart from `main` with a narrower Ticket Pass layout-only brief, preserve the current image-slot/compact-row baseline, and keep async imagery separate |
| [INIT-002](INIT-002-ai-error-telemetry.md) | AI Error Telemetry & Eval Monitoring | `Planning` | Wilson / Codex / Claude / Replit | 2026-05-07 | Phase 1 — stdout logger + 9 routes (next) | None | EFF-019 closed as a standalone Effort; active telemetry implementation now lives in INIT-002, PD-010, and the AI error workflow. Phase 1 owns server-side classifier + stdout logger |
| [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) | Anonymous Trial and Account Upgrade | `Planning` | Wilson / Codex / Claude / Replit | 2026-05-15 | Phase 0 — docs baseline and external prerequisites | None | Docs-only branch `codex/init-003-anonymous-trial-docs` records the accepted guest model: 5 successful anonymous recipe generations, same-browser persistence, Google required for recipe `#6+` and durable saves, and linked-only Phase 5 memory |
