# Testing coverage discipline split

**Agent:** codex
**Branch:** `codex/testing-coverage-discipline`
**Date:** 2026-05-27
**Scope:** Workflow documentation

## Summary

This docs-only branch captures Wilson's requested testing discipline as reusable workflow guidance, split out from INIT-003 production-gates runtime work so the process improvement can merge independently.

The rule is: test happy paths and corner cases with as much local breadth as practical, start from documented specs, and explicitly classify what is local automated, Replit automated, Replit human validation, a Replit confidence gap, or not covered/deferred. When an app-wide pass is requested, agents must distinguish "all existing automated tests" from "all app functions mapped to documented specs."

## Changes

- `docs/workflows/testing-and-acceptance.md`
  - Adds the validation breadth discipline.
  - Requires provenance back to acceptance criteria, INITs, PDs, feature phase records, route schemas, or component contracts.
  - Requires implementation handoffs and PR descriptions to include a coverage classification.
- `docs/workflows/replit-validation-focus.md`
  - Adds a coverage-classification table to the Replit validation request template.

## Relationship to INIT-003

This was raised during INIT-003 anonymous production-gates review because that branch is a strong example: local tests can prove route/middleware behavior, but real Firebase, DB schema, App Check, Google sign-in, provider calls, vision, and speech still need Replit validation.

The runtime INIT-003 branch should reference this workflow after it merges, but the workflow change itself is not runtime scope and does not require Replit validation.

## Validation

- `git diff --check`

## Replit validation

Not required. This is docs/workflow-only and does not change runtime behavior.
