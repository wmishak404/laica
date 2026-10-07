# INIT-005 Phase 1 closeout blocked by dependency audit

**Agent:** Codex
**Branch:** `codex/init-005-phase1-merge-closeout`
**Date:** 2026-10-07
**Initiative:** [INIT-005](../../initiatives/INIT-005-agentic-cooking-actions.md)
**INIT updated:** yes — closeout blocker and resume point
**Status:** Blocked for closeout merge; Phase 1 implementation is already merged

## Summary

Wilson approved #369, which merged as `96ec567a6f55639473d3209376fa180b2dd1f924` from reviewed head `e56cc6dd70e7c7569e82bc8057cecd79fe7a265b`. The required documentation closeout is pushed as [PR #371](https://github.com/wmishak404/laica/pull/371). A fresh dependency audit on its first head `0ec3b67e1792716abf04e3517dec135f69d0b70b` failed even though functional CI passed. Do not merge the closeout or claim release readiness until this gate is addressed. No production publish or pilot activation occurred.

## Evidence and cause

- Failure: [audit run 37674459512](https://github.com/wmishak404/laica/actions/runs/37674459512), job `npm-audit`, `npm audit --audit-level=high`, exit 1: 23 dependency entries (11 moderate, 11 high, 1 critical).
- High/critical roots reported: `@fastify/busboy`, `@grpc/grpc-js`, `brace-expansion`, `braces`, `node-forge`, `proxy-addr` (critical), and `source-map-js`; additional entries include dependent packages. Do not interpret package counts as distinct exploitable production vulnerabilities.
- `braces` was reported as no fix available. Local dependency-path inspection shows Tailwind 3 -> chokidar/micromatch -> braces. The audit also reports no fix for moderate `postcss-selector-parser`. This requires current advisory/compatibility review before choosing replacement, migration or another justified resolution; no suppression is approved.
- Other observed paths: Express -> proxy-addr; Firebase Admin -> busboy/node-forge; Firebase/Firestore -> grpc-js; lint tooling -> brace-expansion; CSS/test tooling -> source-map-js. Reachability and production exposure were not established by this audit.
- Verified with JSON field comparison and Git: `dependencies`, `devDependencies`, `overrides`, and `package-lock.json` are unchanged from pre-foundation base `45bd7e79`. #369 only adds a package script. This is current audit evidence for the existing graph, not a new package regression introduced by the foundation or closeout.
- Functional [CI run 37674459177](https://github.com/wmishak404/laica/actions/runs/37674459177) passed typecheck/lint/build, 465 unit tests/coverage and all 13 E2E tests, with schema health and successful Neon cleanup. This does not overrule the failed security gate. Subsequent blocker-doc head evidence is recorded in #371's body.

## Changes

Recorded the blocker in the INIT resume point, initiative registry, EFF-017/registry, production registry and the merge-closeout handoff. No packages, CI settings, thresholds, runtime code, secrets or deployments were changed to make the gate pass.

## Ownership and smallest next actions

Owner: Codex next work session; Wilson owns consequential dependency/security choices and approval of the remediation code PR.

1. Read current dependency workflow/PDs and fresh main, then inspect existing Dependabot PR #370 (brace-expansion) and #361 (qs) before creating overlapping work. PR #360 is GitHub Actions-only. None of these PRs is approved for merge by the #369 instruction.
2. Reproduce the current full and production-only audits and inspect dependency paths/advisories. Prepare the smallest compatible remediation separately from this docs branch. Do not blindly use `npm audit fix --force`, relax the threshold, or apply unreviewed major migrations. If the no-fix branch requires a security exception or architecture/major dependency decision, provide Wilson a concrete options review.
3. Run relevant boundary checks plus exact-head full CI/E2E on the remediation. Obtain the required code/dependency merge approval.
4. Once remediated main lands, rebase #371 onto fresh `origin/main`, push with lease, rerun all required checks and resolve reviews. The original #369 instruction carries to this fact-only closeout after its gates pass.
5. Continue Phase 2 from merged main using the [closeout handoff](2026-10-07-codex-init-005-phase1-merge-closeout.md) and master plan; audit the still-open #334 timer and #281 step-schema overlaps before client changes. This is a merge/security gate prerequisite, not a new product phase.

## Verification and negative scope

The audit is a registry-based package finding, not a penetration test or proof of exploitability. No claim about production compromise, deployed version, or network exposure is made. The foundation's earlier Replit checks remain dated evidence at `e56cc6dd`; no new Replit validation was performed. All timer execution/speech/mobile/pilot acceptance remains Phase 2 scope. This report and the closeout are pushed to origin so the next session can resume without chat-only context.
