# Security Due Diligence Docs

**Agent:** codex
**Branch:** codex/security-due-diligence-docs
**Date:** 2026-05-30
**Initiative:** none
**INIT updated:** n/a

## Summary

Captured the reusable security lessons from PR #111 and PR #113 as a focused due-diligence workflow. The intent is not to create a broad security ceremony; future work should check only the surfaces it touches and add targeted automation where a repeated class of bug can be caught locally.

## Changes

- `docs/workflows/security-due-diligence.md` documents the reusable checklist, block/table severity rule, lessons from the two security PRs, automation guidance, and Replit curl checks.
- `docs/workflows/testing-and-acceptance.md` links the checklist from the source-of-truth table and Feature Impact Review.
- `docs/workflows/replit-validation-focus.md` adds security-sensitive headers, production HTML, admin routes, and provider abuse controls to the targeted Replit validation picker.

## Impact on other agents

Before implementing changes that touch auth ownership, private caching, admin data, external scripts, provider abuse limits, AI prompt inputs, or security headers, agents should consult `docs/workflows/security-due-diligence.md` and add only the smallest relevant automated test or Replit validation step.

## Open items

- No code changes are included.
- No new mandatory global audit gate is introduced.
- Future feature PRs should decide case-by-case whether a route/header/static/prompt/rate-limit regression test is warranted.

## Verification

- `git diff --check` passed.
- Replit validation is not required for this docs-only workflow update.

## Related production validation

After PR #113 was merged and published, Wilson smoke-tested `cookwithlaica.com` successfully. Covered flows: guest sign-in, first-time scans, editing after first-time setup, recipe generation, editing Pantry, adding Pantry items after cuisine selection, and live cooking.
