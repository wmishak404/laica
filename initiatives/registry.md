# Initiative Registry

Complete searchable index of Laica INITs.

Default agent workflow:

- Start here or in the relevant INIT before resuming multi-phase work.
- Treat the INIT file as authoritative if this registry drifts.
- Update this registry when an INIT is created, changes status, changes active phase, or completes.

| INIT | Title | Status | Owner | Created | Current phase | Active PRs | Last signal |
|---|---|---|---|---|---|---|---|
| [INIT-001](INIT-001-mobile-refresh.md) | Mobile Refresh | `In Progress` | Wilson / Codex / Claude / Replit | 2026-04-29 | Phase 3.1 / Phase 4 planning | None | PR #81 merged the PR #78 abandonment plan as `7630d97`; PR #78 remains closed unmerged after failing Ticket Pass visual acceptance. Phase 3.1 consistency slices are merged (PR #71 Planning Slop It Up + pantry emphasis; PR #73 Slop Bowl pantry-check chip alignment; PR #75 Setup/Settings inventory chip states; EFF-014 resolved). Next attempt should restart from `main` with a narrower Ticket Pass layout-only brief, preserve the current image-slot/compact-row baseline, and keep async imagery separate. |
| [INIT-002](INIT-002-ai-error-telemetry.md) | AI Error Telemetry & Eval Monitoring | `Planning` | Wilson / Codex / Claude / Replit | 2026-05-07 | Phase 1 — stdout logger + 9 routes (next) | None | EFF-019 closed as a standalone Effort; active telemetry implementation now lives in INIT-002, PD-010, and the AI error workflow. Phase 1 owns server-side classifier + stdout logger |
| [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) | Anonymous Trial and Account Upgrade | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-15 | Phase 3 — public pre-auth homepage and client guest entry | None | Runtime branch `codex/init-003-preauth-homepage` implements the A+C hybrid public homepage, `Let's cook!` anonymous entry, `/api/auth/session` adoption, and browser-local guest profile persistence; production enablement still waits on quota, App Check, and upgrade boundaries |
