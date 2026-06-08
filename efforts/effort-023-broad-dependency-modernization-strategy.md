# EFF-023 - Broad dependency modernization strategy

**Status:** Deferred
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-26
**Updated:** 2026-06-08

## One-line summary

Park and later split Dependabot's broad 85-package version-update batch into intentional upgrade slices with validation sized to the runtime and UI risk.

## Context

Dependabot's current broad npm-version batch is PR #134, which supersedes the earlier PR #104 lineage. It carries 85 package updates across runtime, frontend, testing, build, and provider SDK dependencies. The batch includes major-version or foundation-level moves such as Express 5, React 19, Tailwind 4, TypeScript 6, Vite 8, Vitest 4, OpenAI SDK 6, ElevenLabs SDK updates, Neon driver updates, Radix primitives, date-fns 4, and related type packages.

That scope is too broad to merge as routine dependency hygiene while active initiative work is still stabilizing guest auth, AI/speech routes, mobile-refresh cooking guidance, and local DB workflow boundaries. The narrow security update in PR #103 should proceed separately; this Effort preserves the larger modernization work without keeping a risky mega-PR on the active merge path.

## Scope

### In scope

- Decide whether to close, recreate, or split Dependabot PR #134.
- Group upgrades into small, reviewable slices by risk domain:
  - server runtime and Express middleware
  - AI and speech provider SDKs
  - React/UI primitives and Tailwind styling foundation
  - build/test/toolchain packages
  - database/client packages
- Define validation expectations for each slice, including local checks and any Replit/provider-backed smoke needed.
- Track compatibility risks that affect INIT-001, INIT-002, INIT-003, EFF-010, and UI governance.

### Out of scope

- Merging PR #134 as a single batch.
- Blocking the narrow security dependency fix in PR #103.
- Changing package versions without a focused compatibility review.
- Replacing Replit validation for deployment-bound auth, DB, AI, or speech behavior.

## Decisions made so far

- PR #103 is the current dependency priority because it addresses a narrow runtime dependency security path.
- PR #134 should be parked rather than merged as-is.
- Broad modernization should be handled as intentionally scoped branches, not a single 85-package update.

## Open questions

- Should PR #134 be closed immediately after this Effort lands, or left open only until Dependabot can recreate smaller grouped PRs?
- Should the small workflow-only bump PR #147 be merged immediately as low-risk hygiene while PR #134 stays parked?
- Which domain should be modernized first after current INIT-003 production gates settle?
- Do provider SDK upgrades require Replit validation with real OpenAI and ElevenLabs routes before merge?
- Should Dependabot grouping rules be changed so future version-update batches arrive in smaller risk domains?

## Agent checklist

Read this Effort before starting any of the following:

- [ ] Updating major frontend framework, Tailwind, Radix, or React package versions.
- [ ] Updating Express, middleware, route handling, auth/session, or rate-limit dependencies.
- [ ] Updating OpenAI, ElevenLabs, Anthropic, Firebase, or Neon SDK packages.
- [ ] Updating TypeScript, Vite, Vitest, Playwright, jsdom, ESLint, or test-environment packages.
- [ ] Recreating, rebasing, closing, or replacing Dependabot PR #134.
- [ ] Changing Dependabot grouping for npm version updates.

## Resolution criteria

This Effort is `Resolved` when all of the following are true:

1. PR #134 is closed, superseded, or split into scoped replacement PRs.
2. Upgrade group boundaries and validation expectations are documented in PRs, handoffs, or Dependabot configuration.
3. Any merged major/foundation upgrades pass `npm ci`, `npm run check`, `npm run build`, relevant focused tests, and required Replit/provider-backed validation.
4. INIT/Effort docs that depend on upgraded runtime behavior are updated only when the upgrade changes their assumptions.
5. The Effort registry records the final modernization path and closeout signal.

## Linked artifacts

- PR #134 — `chore(deps): bump the npm-version-updates group across 1 directory with 85 updates`
- PR #147 — `chore(deps): bump the github-actions-version-updates group with 2 updates`
- PR #103 — narrow runtime dependency security update
- `package.json`
- `package-lock.json`
- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
- [INIT-002 — AI Error Telemetry & Eval Monitoring](../initiatives/INIT-002-ai-error-telemetry.md)
- [INIT-003 — Anonymous Trial and Account Upgrade](../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md)
- [EFF-010 — Local database schema strategy](effort-010-local-db-schema-strategy.md)

## 2026-05-26 - Parked from open PR triage

Open PR triage after PR #105 merged found three active PRs: docs hygiene PR #101, narrow security dependency PR #103, and broad version-update PR #104. The recommendation was to repair/replace #101, prioritize #103 after a fresh base update and checks, and park #104 because it spans too many runtime and UI foundations for the current initiative load.

This Effort records the parked state so future agents can deliberately split or close #104 instead of rediscovering the same risk from the PR list.

## 2026-06-08 - Current repo-risk posture refreshed

The same broad modernization risk is still present, but the active Dependabot PR is now #134 rather than #104. Current open-PR posture is:

- PR #134 remains the high-risk broad npm batch and should not be merged opportunistically.
- PR #147 is a separate low-risk workflow-only bump (`actions/upload-artifact` and `trufflehog`) that can be reviewed and merged independently if checks are clean.

Recommended path from this point:

- treat PR #147 as quick hygiene
- keep PR #134 parked
- open replacement upgrade slices from fresh `origin/main` by domain rather than trying to salvage the monolithic PR

## 2026-05-31 - Current moderate dependency alert parked

After PR #113 merged, GitHub still reported one moderate default-branch dependency alert. Because this repository is public, do not publish the exact advisory details, package path, or reproduction notes in public docs; use the GitHub Security/Dependabot alert UI and local `npm audit --omit=dev` output when an authorized maintainer needs the specifics.

This is accepted as deferred dependency hygiene, not an urgent security blocker, because there are no high/critical findings. If someone picks this up later, prefer a narrow dependency PR with `npm ci`, `npm run check`, `npm run build`, `npm audit --omit=dev`, and Replit smoke only if runtime middleware behavior changes.
