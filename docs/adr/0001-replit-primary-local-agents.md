# ADR 0001: Replit-primary local agent workflow

- Status: Accepted
- Date: 2026-04-06

## Context

LAICA was built in Replit and already depends on Replit-managed runtime behavior, secrets, and database access. The team also wants to use local macOS coding agents, including Codex and Claude Code, without changing the production or deployment model.

The repository has an additional security concern: a previous `ADMIN_SECRET` value was committed in Git history. The current working tree no longer contains the literal value, and the secret was rotated in Replit after this setup work.

## Decision

- Replit remains the primary environment for runtime execution, secrets, database access, and deployment.
- GitHub is the collaboration backbone and synchronization point between Replit and local macOS tooling.
- Codex and Claude Code are approved local coding agents for planning, review, refactoring, and implementation work.
- Local development is allowed for editing, static analysis, builds, and other compile-time checks.
- Final validation for service-backed behavior remains a Replit responsibility before deployment.

## Consequences

- The team can use Codex and Claude Code locally without migrating off Replit.
- `main` remains the deployable branch and should stay clean enough to sync back into Replit.
- Database-backed and secrets-backed behavior is still verified where those services already live.
- The historical `ADMIN_SECRET` exposure has been handled operationally with a Replit secret rotation, but the old Git history should still be treated as sensitive.
