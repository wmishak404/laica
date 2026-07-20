# Initiative Registry

Complete searchable index of Laica INITs.

Default agent workflow:

- Start here or in the relevant INIT before resuming multi-phase work.
- Treat the INIT file as authoritative if this registry drifts.
- Use live GitHub state for which PRs are currently open or merged; do not treat this registry as the authority for in-flight PR status.
- Update this registry when an INIT is created, changes status, changes active phase, or completes.

| INIT | Title | Status | Owner | Created | Current phase | Last update |
|---|---|---|---|---|---|---|
| [INIT-001](INIT-001-mobile-refresh.md) | Mobile Refresh | `In Progress` | Wilson / Codex / Claude / Replit | 2026-04-29 | Phase 4 follow-up / Phase 3.1 follow-up | 2026-07-20: production-readiness review filed EFF-032 for non-blocking first-time camera compact fit, EFF-033 for pre-production returning Settings action-dock parity, and EFF-034 for timer/Settings P2 cleanup, with committed phone-viewport screenshot evidence. |
| [INIT-002](INIT-002-ai-error-telemetry.md) | AI Error Telemetry & Eval Monitoring | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-07 | Phase 2 — Replit observation week | 2026-06-10: [#159](https://github.com/wmishak404/laica/pull/159) merged; Phase 2 Replit observation is the current resume point. |
| [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) | Anonymous Trial and Account Upgrade | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-15 | Phase 5 / later promotion follow-up planning | 2026-07-20: production-readiness follow-up recommends one outcome-driven completion message for guest-local, linked-save-success, and linked-save-failure states; only confirmed linked persistence may claim History was saved. |
| [INIT-004](INIT-004-ai-output-quality-evals.md) | AI Output Quality Evals & Prompt Improvement | `In Progress` | Wilson / Codex / Claude / Replit | 2026-06-09 | Phase 3 - eval harness | 2026-07-08: [#246](https://github.com/wmishak404/laica/pull/246) merged as `690fe2c`, adding the protected redacted eval report artifact/export path. PR #263 / `codex/init-004-step-preview-evals` implements the first `live_cooking_step_previews` offline fixture lane after PR #260 peer review and PR #264 prompt-review alignment, with deterministic schema/word-count/measurement/duplicate checks, nine synthetic provider-versus-rendered label fixtures, an opt-in uncalibrated judge-smoke runner, a static aggregate validation report, and a first Wilson-labeled human-calibration report. Wilson's eval-to-product self-improvement loop stays inside INIT-004 as planned Phase 5 rather than a separate INIT for now. |
