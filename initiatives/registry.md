# Initiative Registry

Complete searchable index of Laica INITs.

Default agent workflow:

- Start here or in the relevant INIT before resuming multi-phase work.
- Treat the INIT file as authoritative if this registry drifts.
- Update this registry when an INIT is created, changes status, changes active phase, or completes.

| INIT | Title | Status | Owner | Created | Current phase | Active PRs | Last signal |
|---|---|---|---|---|---|---|---|
| [INIT-001](INIT-001-mobile-refresh.md) | Mobile Refresh | `In Progress` | Wilson / Codex / Claude / Replit | 2026-04-29 | Phase 3.1 / Phase 4 planning | None | PR #141 merged Slop Bowl generated-result button typography alignment as `2145407` after Wilson Replit visual confirmation and post-rebase local/CI checks. Earlier Phase 3.1 consistency slices remain merged (PR #71 Planning Slop It Up + pantry emphasis; PR #73 Slop Bowl pantry-check chip alignment; PR #75 Setup/Settings inventory chip states; EFF-014 resolved) and PR #81 keeps the narrower Ticket Pass retry brief after PR #78 was closed unmerged. Next runtime attempt should start from fresh `main`, preserve the current image-slot/compact-row baseline and Slop Bowl/Chef It Up button contract, and keep async imagery separate. |
| [INIT-002](INIT-002-ai-error-telemetry.md) | AI Error Telemetry & Eval Monitoring | `Planning` | Wilson / Codex / Claude / Replit | 2026-05-07 | Phase 1 — stdout logger + 9 routes (next) | None | EFF-019 closed as a standalone Effort; active telemetry implementation now lives in INIT-002, PD-010, and the AI error workflow. Phase 1 owns server-side classifier + stdout logger |
| [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) | Anonymous Trial and Account Upgrade | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-15 | Phase 5 / later promotion follow-up planning | None | PR #156 merged the guest bottom-nav correction as `492b3a6`: the unapproved `Save progress` shortcut is removed while menu/planning promotion paths remain. The first Phase 4 promotion slice remains merged via PR #126 (`8282d51`), and future guest cook/History import still waits for Phase 5/later promotion planning after INIT-001 Phase 5. |
| [INIT-004](INIT-004-ai-output-quality-evals.md) | AI Output Quality Evals & Prompt Improvement | `Planning` | Wilson / Codex / Claude / Replit | 2026-06-09 | Phase 1 - surface and data audit (next) | None | PR #160 merged as `680e26e`, filing the focused INIT hub, canonical `docs/workflows/evaluations.md` discipline, durable `docs/evals/` registry/intake records, and INIT-002 boundary. Wilson plans to continue INIT-002 implementation first, then resume INIT-004 implementation from Phase 1. |
