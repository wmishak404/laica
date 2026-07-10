# Initiative Registry

Complete searchable index of Laica INITs.

Default agent workflow:

- Start here or in the relevant INIT before resuming multi-phase work.
- Treat the INIT file as authoritative if this registry drifts.
- Use live GitHub state for which PRs are currently open or merged; do not treat this registry as the authority for in-flight PR status.
- Update this registry when an INIT is created, changes status, changes active phase, or completes.

| INIT | Title | Status | Owner | Created | Current phase | Last update |
|---|---|---|---|---|---|---|
| [INIT-001](INIT-001-mobile-refresh.md) | Mobile Refresh | `In Progress` | Wilson / Codex / Claude / Replit | 2026-04-29 | Phase 4 follow-up / Phase 3.1 follow-up | 2026-07-09: [PR #275](https://github.com/wmishak404/laica/pull/275) / branch `codex/init-001-assistance-inline-failure` implements the next Phase 4 assistance-failure slice after [#269](https://github.com/wmishak404/laica/pull/269). Live Cooking now keeps the current step visible and shows a separate warm voice-help retry panel only for non-recipe-changing technical failure states in `Ask a question`: microphone capture, transcription, usage-limit/rate-limit, empty-answer, or assistance-route service/network failures. Successful Ask-a-question step adaptation remains future R&D, not this slice. Local focused Live Cooking Vitest, full unit, check, build, audit, and diff-check pass; exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL, and Analyze checks passed on PR #275. Full provider schema shape and Phase 5 cleanup remain planned. |
| [INIT-002](INIT-002-ai-error-telemetry.md) | AI Error Telemetry & Eval Monitoring | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-07 | Phase 2 — Replit observation week | 2026-06-10: [#159](https://github.com/wmishak404/laica/pull/159) merged; Phase 2 Replit observation is the current resume point. |
| [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) | Anonymous Trial and Account Upgrade | `In Progress` | Wilson / Codex / Claude / Replit | 2026-05-15 | Phase 5 / later promotion follow-up planning | 2026-06-09: [#156](https://github.com/wmishak404/laica/pull/156) merged; later guest cook/History import still waits for Phase 5 planning. |
| [INIT-004](INIT-004-ai-output-quality-evals.md) | AI Output Quality Evals & Prompt Improvement | `In Progress` | Wilson / Codex / Claude / Replit | 2026-06-09 | Phase 3 - eval harness | 2026-07-08: [#246](https://github.com/wmishak404/laica/pull/246) merged as `690fe2c`, adding the protected redacted eval report artifact/export path. PR #263 / `codex/init-004-step-preview-evals` implements the first `live_cooking_step_previews` offline fixture lane after PR #260 peer review and PR #264 prompt-review alignment, with deterministic schema/word-count/measurement/duplicate checks, nine synthetic provider-versus-rendered label fixtures, an opt-in uncalibrated judge-smoke runner, a static aggregate validation report, and a first Wilson-labeled human-calibration report. Wilson's eval-to-product self-improvement loop stays inside INIT-004 as planned Phase 5 rather than a separate INIT for now. |
