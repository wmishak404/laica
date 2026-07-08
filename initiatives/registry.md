# Initiative Registry

Complete searchable index of Laica INITs.

Default agent workflow:

- Start here or in the relevant INIT before resuming multi-phase work.
- Treat the INIT file as authoritative if this registry drifts.
- Use live GitHub state for which PRs are currently open or merged; do not treat this registry as the authority for in-flight PR status.
- Update this registry when an INIT is created, changes status, changes active phase, or completes.

| INIT | Title | Status | Owner | Created | Current phase | Last update |
|---|---|---|---|---|---|---|
| [INIT-001](INIT-001-mobile-refresh.md) | Mobile Refresh | `In Progress` | Wilson / Codex / Claude / Replit | 2026-04-29 | Phase 4 follow-up / Phase 3.1 follow-up | 2026-07-07: [#264](https://github.com/wmishak404/laica/pull/264) merged as `fc07c1b`, moving the compact Live Cooking cockpit onto a warm focus-mode surface and tightening the step-preview prompt for plural prep labels plus final garnish/serve labels after Wilson's Replit examples. Local focused tests, prompt coverage, check/build, diff check, provider-light mobile visual/computed-style smoke, and exact-head GitHub `unit`, `e2e_guest_smoke`, dependency audit, and secret scan passed at `a180b32`; Wilson's Replit pass was light skim only, with full human regression deferred to production/release-batch validation. Full timer redesign, full provider schema shape, and Phase 5 cleanup remain planned. |
| [INIT-002](INIT-002-ai-error-telemetry.md) | AI Error Telemetry & Eval Monitoring | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-07 | Phase 2 — Replit observation week | 2026-06-10: [#159](https://github.com/wmishak404/laica/pull/159) merged; Phase 2 Replit observation is the current resume point. |
| [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) | Anonymous Trial and Account Upgrade | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-15 | Phase 5 / later promotion follow-up planning | 2026-06-09: [#156](https://github.com/wmishak404/laica/pull/156) merged; later guest cook/History import still waits for Phase 5 planning. |
| [INIT-004](INIT-004-ai-output-quality-evals.md) | AI Output Quality Evals & Prompt Improvement | `In Progress` | Wilson / Codex / Claude / Replit | 2026-06-09 | Phase 3 - eval harness | 2026-07-08: [#246](https://github.com/wmishak404/laica/pull/246) merged as `690fe2c`, adding the protected redacted eval report artifact/export path with row-first Markdown, criterion aggregates, Judge Metrics, and Provider Input Inventory. |
