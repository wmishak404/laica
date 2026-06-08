# 2026-06-08 Codex EFF-017 Public Artifact Cleanup

## Summary

Follow-up to the public-repo hygiene cleanup: the PR-facing Efforts hygiene text and the durable EFF-017 records now avoid copying exact security/config artifacts into public markdown. The useful coordination signal remains: EFF-017 is still active, the remaining work is policy/configuration/provider-scope alignment, and exact validation evidence belongs in GitHub-owned or private maintainer surfaces.

## Changes

- Updated PR #148's request comment and PR description directly on GitHub to remove detailed lane enumeration.
- Sanitized `docs/handoffs/2026-06-08-codex-efforts-hygiene-audit.md`.
- Sanitized `docs/handoffs/2026-06-05-codex-eff-017-oauth-preflight-blocked.md`.
- Sanitized `efforts/effort-017-environment-parity-and-ci-confidence.md`.
- Updated `efforts/registry.md` so the EFF-017 last signal points to the public-artifact cleanup.

## Validation

- Targeted sensitive-term search over the edited files no longer finds exact config names, run IDs, provider error strings, scanner names, or the previous detailed lane enumeration.
- `git diff --check` passed on the edited snapshot before publishing.

## Negative Scope

- No runtime code changed.
- No workflow, secret, repo setting, package, or validation policy changed.
- This does not rewrite Git history, recall notification emails, or delete GitHub Actions/security records. It reduces what is visible in current public PR text and current public docs.
