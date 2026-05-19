# CodeQL rate-limit remediation

**Agent:** codex  
**Branch:** `codex/security-rate-limit-codeql`  
**Date:** 2026-05-18  
**Initiative:** none  
**INIT updated:** n/a

## Summary

Followed the completed GitHub guardrail setup by addressing the first high-severity CodeQL alert cluster now visible in the Security tab: `js/missing-rate-limiting`. The branch adds a CodeQL-modeled Express rate limiter as a broad API/page guardrail while keeping LAICA's existing per-feature AI, speech, recipe, feedback, and vision quota controls intact.

## Changes

- `package.json` / `package-lock.json` — add `express-rate-limit`, the standard Express middleware modeled by CodeQL's missing-rate-limiting query.
- `server/rate-limit.ts` — export standard 15-minute API and app/page request limiters with a shared `RATE_LIMITED` response body and env overrides.
- `server/routes.ts` — apply the API limiter before registered `/api` routes, then keep existing narrower feature-specific limiters for expensive AI and speech routes.
- `server/vite.ts` — apply the app/page limiter before development Vite middleware and production static/fallback serving so file-system-backed handlers are rate-limited.
- `server/index.ts` — set `trust proxy` to one hop for Replit/proxy-aware client IP handling by `express-rate-limit`.

## Impact on other agents

Future backend routes should keep using the existing domain-specific rate limiters for expensive operations, but this branch adds a baseline limiter for CodeQL coverage and accidental unbounded route additions. Do not re-enable CodeQL as a required status check unless docs-only/process PR behavior has been tested; the current hard merge gates remain `npm-audit` and `trufflehog_pr`.

## Open items

- CodeQL closure is expected to be verified by GitHub Actions on the PR and/or after merge in GitHub Security → Code scanning.
- Replit runtime validation was not run locally because this is middleware/security behavior; perform a quick Replit smoke test before deployment if desired.
- Existing npm audit output still contains only low/moderate advisories (`@tootallnate/once`, `esbuild` via transitive tooling); no high/critical dependency advisories remain.

## Verification

- `npm run check`
- `npm run build`
- `npx vitest run tests/unit/rate-limit.test.ts`
- `npm audit --audit-level=high`
- `git diff --check`
