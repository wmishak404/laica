# PD-008: Optional context and local validation boundaries

**Date:** 2026-04-27
**Status:** Accepted
**Decision maker:** Wilson

## Context

During Slop Bowl localhost validation, a sparse-pantry bug and a local database schema drift surfaced at the same time:

- The product bug: Slop Bowl tried to generate from too few ingredients and could fall into a confusing generic service-error toast.
- The local-environment bug: local Neon was missing current schema objects, including `cooking_sessions.recipe_snapshot` and `ai_interactions`, so optional history/eval reads or writes could fail even when the core Slop Bowl behavior was otherwise valid.

This raised a broader question: what should be treated as durable product behavior, what should exist to make local validation workable, and what should fail loudly because production correctness depends on it?

## Decision

Use this policy for optional context and local-vs-production validation:

1. **Core product preconditions should be explicit product behavior.**
   - Example: Slop Bowl needs enough distinct ingredients to generate a useful bowl.
   - These checks should run in both local and production environments.
   - They should produce friendly, actionable UI instead of generic service failures.

2. **Optional personalization context should degrade gracefully.**
   - Recent cooking history can improve Slop Bowl, but it is not required to generate a usable recipe.
   - If optional history reads fail, the feature should continue without that context and log a warning.
   - This is acceptable in production as graceful degradation, not only a local workaround.

3. **Non-critical observability/eval writes should never block the user flow.**
   - Eval/audit logging should be fire-and-forget when the user-facing feature can succeed without it.
   - Logging failures should be visible to developers/operators, but should not convert a successful recipe generation into a failed user request.

4. **Local schema drift remains a separate environment problem.**
   - Graceful degradation can unblock feature testing, but it is not a substitute for keeping local databases aligned with the app schema.
   - Local database setup/sync strategy should be tracked separately from feature implementation.

5. **Production failures should be visible even when user experience degrades gracefully.**
   - If optional context fails in production, the user may proceed, but logs/monitoring should make the failure detectable.
   - Do not silently swallow failures for required data, auth, recipe generation, persistence, or safety-critical paths.

## Rationale

- Users should not see scary service errors for correctable product states like "you need more ingredients."
- A feature should not become unusable just because optional context such as recent history is unavailable.
- Local validation should stay productive without requiring every unrelated service and schema to be perfect.
- Production should still surface infrastructure or migration problems through logs/monitoring rather than hiding them completely.
- This policy keeps graceful degradation intentional instead of ad hoc.

## Required vs optional examples

| Surface | Required? | Behavior |
|---|---|---|
| Firebase auth for authenticated routes | Required | Fail the request if missing/invalid |
| User profile for Slop Bowl | Required | Fail with an actionable error if unavailable |
| Minimum viable Slop Bowl pantry input | Required product precondition | Block generation with inline guidance |
| Recent cooking sessions for Slop Bowl variety | Optional | Continue with `recentMeals: []` and warn |
| Recent sessions on profile display | Optional display context | Return profile with `recentSessions: []` and warn |
| OpenAI recipe generation | Required for generation | Fail the request if unavailable |
| AI interaction/eval logging | Optional observability | Warn, but do not fail the user request |
| Cooking-session persistence | Required when starting/saving cooking | Fail if persistence cannot complete |

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Fail every request when any DB read fails | Makes local validation brittle and blocks users on non-critical context |
| Make graceful fallback local-only | Reduces local/prod drift, but keeps production unnecessarily fragile for optional context |
| Ignore local schema drift because Replit is primary | Slows down local agent work and causes feature bugs to get mixed with environment bugs |
| Run database pushes automatically from agents | Too risky without explicit environment ownership and migration policy |

## Consequences

- Slop Bowl's sparse-pantry guard is permanent product behavior, not a local-only patch.
- Slop Bowl and profile recent-session reads may be best-effort, with warnings when history cannot be loaded.
- Local Neon schema drift still needs its own workflow/epic/product decision if the project wants reliable full local validation.
- Future code should clearly separate required dependencies from optional context before deciding whether to fail or degrade.
- Handoffs and PRs should note when a feature intentionally degrades without optional context, and cite this PD when relevant.

## Linked artifacts

- [`PD-002: Slop Bowl`](002-slop-bowl.md)
- [`EPIC-005: App-wide testing strategy and acceptance criteria workflow`](../epics/005-testing-strategy-and-acceptance-criteria.md)
- [`EPIC-006: Slop Bowl sparse-pantry guard`](../epics/006-slop-bowl-sparse-pantry-guard.md)
- [`EPIC-008: Local database schema strategy`](../epics/008-local-db-schema-strategy.md)
- [`docs/handoffs/2026-04-27-codex-slop-bowl-sparse-pantry-guard.md`](../docs/handoffs/2026-04-27-codex-slop-bowl-sparse-pantry-guard.md)
