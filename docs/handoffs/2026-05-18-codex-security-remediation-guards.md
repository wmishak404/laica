# Security remediation guardrails (Critical + High)

**Agent:** codex  
**Branch:** `codex/security-remediation-guards`  
**Date:** 2026-05-18

## Summary

Implemented the “Critical + High” remediation items that can be done in-repo without repo-admin console access:

1. Removed tracked history-rewrite artifacts (`.git-rewrite/`) and prevented reintroduction.
2. Added GitHub automation to block new secret leaks and to gate dependency regressions at **high/critical** severity.
3. Added Dependabot and CodeQL so the repo has ongoing, automated security hygiene.
4. Added a dated secret-scan report template so Wilson can run a *full git-history* scan in a networked environment and commit the evidence.

## Changes

- Repo hygiene
  - Removed tracked `.git-rewrite/` directory (was checked into git).
  - Added `.git-rewrite/` to `.gitignore`.
- GitHub automation
  - `.github/workflows/secret-scan.yml` — TruffleHog PR secret scan (`--only-verified --fail`) using PR base/head SHAs.
  - `.github/workflows/dependency-audit.yml` — `npm ci` + `npm audit --audit-level=high` on PRs and pushes to `main`.
  - `.github/workflows/codeql.yml` — CodeQL scanning for `javascript-typescript` on PRs, pushes to `main`, and a weekly schedule.
  - `.github/dependabot.yml` — weekly updates for npm + GitHub Actions (grouped).
- Evidence template
  - `docs/security/secret-scan-2026-05-18.md` — template for a full-history TruffleHog/GitLeaks scan report (intentionally not “completed”).

## What still needs Wilson (repo admin / secret owner)

These items are intentionally **not** done in this branch because they require secrets or GitHub repo admin settings:

1. **Run a full-history secret scan** in a networked environment (TruffleHog or GitLeaks) and fill in `docs/security/secret-scan-2026-05-18.md`.
2. **If any verified secret is found** (even in old history), rotate it immediately (OpenAI, ElevenLabs, Neon DB, Firebase service account keys, `ADMIN_SECRET`, `SESSION_SECRET`, dotenvx keypair if private key exposure is suspected).
3. Enable GitHub settings:
   - Secret scanning alerts
   - Push protection
4. Add branch protection for `main` requiring:
   - “Secret Scan (TruffleHog)”
   - “Dependency Audit (High/Critical)”
   - “CodeQL”

## Verification

Local-only checks performed:

- `git status` clean after removing `.git-rewrite/` and updating `.gitignore`.

Deferred to GitHub Actions (once pushed) for authoritative verification:

- PR secret scanning (TruffleHog)
- Dependency gate (`npm audit --audit-level=high`)
- CodeQL results in GitHub Security tab

## Notes / rationale

- The `.git-rewrite/` directory being tracked is a high-signal “history rewrite happened” artifact and can include backup refs / maps; removing it reduces both risk and optics.
- Dependency gating is intentionally limited to **high/critical** severities to avoid blocking merges on known moderate/low dev-toolchain advisories that require upstream fixes.
