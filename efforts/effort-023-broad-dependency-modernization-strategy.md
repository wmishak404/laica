# EFF-023 - Broad dependency modernization strategy

**Status:** Deferred
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-26
**Updated:** 2026-08-12

## One-line summary

Park and later split Dependabot's broad package-update batch into intentional upgrade slices with validation sized to the runtime and UI risk.

## Context

Dependabot's latest broad npm-version batch was PR #134, which superseded the earlier PR #104 lineage. It carried a large set of package updates across runtime, frontend, testing, build, and provider SDK dependencies, including several major-version or foundation-level moves.

That scope is too broad to merge as routine dependency hygiene while active initiative work is still stabilizing guest auth, AI/speech routes, mobile-refresh cooking guidance, and local DB workflow boundaries. Narrow security maintenance should proceed separately; this Effort preserves the larger modernization work without keeping a risky mega-PR on the active merge path.

Because this repository is public, do not copy exact security-advisory details, scan output, package paths, exploitability notes, or scanner-run internals into public markdown. Authorized maintainers should use GitHub Security, Dependabot, GitHub Actions logs, and local/private scan artifacts for those specifics.

## Scope

### In scope

- Preserve the decision to close broad Dependabot batches like PR #134 instead of merging them as the upgrade unit.
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
- Blocking narrow security maintenance.
- Changing package versions without a focused compatibility review.
- Replacing Replit validation for deployment-bound auth, DB, AI, or speech behavior.

## Decisions made so far

- Narrow security maintenance should be handled separately from broad modernization batches.
- PR #134 was closed unmerged and should not be reopened as-is.
- Broad modernization should be handled as intentionally scoped branches, not a single large package update.
- Routine patch updates may remain grouped, but minor updates should open individually so provider, UI, runtime, database, and toolchain changes do not share one upgrade unit.
- A newer dependency version is not, by itself, sufficient reason to merge. Routine maintenance should have a concrete trigger: a relevant security finding, an observed bug or incompatibility, a platform deprecation or enforcement signal, or an explicitly accepted modernization/release objective.
- Passing compatibility automation establishes evidence about an update; it does not establish that taking the update now has more value than its change risk. When no concrete trigger exists, close the maintenance PR and reassess from fresh `main` when the trigger appears.

## Open questions

- Which domain should be modernized first after current INIT-003 production gates settle?
- Do provider SDK upgrades require Replit validation with real OpenAI and ElevenLabs routes before merge?

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

- PR #134 — broad npm version-update batch
- PR #147 — workflow dependency update, superseded
- PR #150 — workflow dependency replacement
- PR #103 — narrow security maintenance update
- `package.json`
- `package-lock.json`
- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
- [INIT-002 — AI Error Telemetry & Eval Monitoring](../initiatives/INIT-002-ai-error-telemetry.md)
- [INIT-003 — Anonymous Trial and Account Upgrade](../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md)
- [EFF-010 — Local database schema strategy](effort-010-local-db-schema-strategy.md)

## 2026-05-26 - Parked from open PR triage

Open PR triage after PR #105 merged found three active PRs: docs hygiene PR #101, narrow security maintenance PR #103, and broad version-update PR #104. The recommendation was to repair/replace #101, prioritize narrow security maintenance after a fresh base update and checks, and park #104 because it spans too many runtime and UI foundations for the current initiative load.

This Effort records the parked state so future agents can deliberately split or close broad dependency batches instead of rediscovering the same risk from the PR list.

## 2026-06-08 - Current repo-risk posture refreshed

The same broad modernization risk is still present, but the active Dependabot PR is now #134 rather than #104. Current open-PR posture is:

- PR #134 remains the high-risk broad npm batch and should not be merged opportunistically.
- PR #147 is a separate low-risk workflow-only dependency update that can be reviewed and merged independently if checks are clean. A Codex replacement branch should keep related workflow and wrapper version fields aligned without copying scanner-run details into public docs.

Recommended path from this point:

- treat PR #147's scope as quick hygiene
- prefer the Codex replacement branch when it includes the paired workflow-version alignment
- keep PR #134 parked
- open replacement upgrade slices from fresh `origin/main` by domain rather than trying to salvage the monolithic PR

## 2026-06-08 - Open repo-risk PRs closed

PR #150 merged as `e583c2d8a2f12fc1bb79bdc5c349cc29cdfc9c20`, replacing Dependabot PR #147 with the same workflow dependency scope plus paired version-field alignment. Required GitHub checks passed; exact scanner logs and runner artifacts should remain in GitHub Actions or security tooling rather than public markdown.

After #150 merged, PR #147 was closed as superseded and PR #134 was closed unmerged. This clears the immediate open-PR repo-risk queue while keeping the larger modernization work deferred. Future dependency modernization should start from fresh `origin/main` in scoped branches by risk domain rather than reviving #134.

## 2026-05-31 - Current moderate dependency alert parked

After PR #113 merged, GitHub still reported one moderate default-branch dependency alert. Because this repository is public, do not publish the exact advisory details, package path, or reproduction notes in public docs; use the GitHub Security/Dependabot alert UI and local private scan output when an authorized maintainer needs the specifics.

This is accepted as deferred dependency hygiene, not an urgent security blocker, because there are no high/critical findings. If someone picks this up later, prefer a narrow dependency PR with standard local checks and Replit smoke only if runtime middleware behavior changes.

## 2026-07-20 - Broad minor bundle superseded by individual upgrade lanes

Dependabot PR #305 repeated the broad-bundle failure mode with 31 nominally minor updates spanning provider SDKs, browser/E2E tooling, Radix UI primitives, Firebase, database schema tooling, routing, linting, and build packages. Its exact-head `unit` job failed during typecheck because the bundled `drizzle-zod` update introduced a Zod 3/4 type boundary, while the same PR also carried unrelated provider and UI changes. The failure is evidence that the bundle is not a reviewable or independently attributable upgrade unit.

Branch `codex/deps-bot-lane-alignment` removes the catch-all npm minor group so future minor upgrades open as individual PRs under the existing five-PR concurrency cap. The patch group remains available for routine compatible maintenance. The same branch ignores automated `@types/node` major updates because Node declarations must move with the EFF-017 runtime-alignment slice rather than ahead of the deployed runtime. PR #305 and the declarations-only PR #253 should be closed as superseded after the replacement branch is published.

This does not start the deferred provider, database, UI-foundation, or toolchain modernization work, and it does not change the validation requirements for those future slices.

## 2026-07-20 - Replit cartographer update deferred at its environment boundary

Dependabot PR #316 proposes `@replit/vite-plugin-cartographer` `0.2.0` to `0.6.0`, a pre-1.0 three-minor update. LAICA loads this plugin only when `NODE_ENV !== "production"` and `REPL_ID` is present, so the repository's local macOS and GitHub checks do not execute the changed integration path. The bot head passed install, typecheck/lint, build, unit/coverage, high/critical audit, and PR secret scan; its E2E job stopped at the known Dependabot protected-secret preflight before application setup or browser tests.

PR #316 should remain out of the merge path until a focused same-repository replacement can pair the normal exact-head gates with direct Replit development validation. That validation must start the current Replit workspace with `REPL_ID` present, confirm Vite loads cartographer `0.6.x` without initialization or transform errors, and exercise the Replit visual-editor/cartographer interaction that the plugin exists to support. This is an environment-specific toolchain defer under EFF-023, not evidence that version `0.6.0` is incompatible.

## 2026-07-21 - Preventive maintenance batch closed pending a concrete trigger

Wilson decided that dependency updates should not merge only because newer compatible versions are available. After the exact-head validation work completed, PRs #320 (`actions/setup-node`), #321 (routine npm patch group), #323 (`express-rate-limit`), #326 (unused context-menu cleanup), and #327 (Multer runtime/types alignment) were closed unmerged. Each PR records its specific deferral rationale.

The accepted distinction is:

- PR #322 was narrow remediation for a current high-severity audit gate and remains the correct example of security-triggered maintenance.
- PRs #320, #321, #323, #326, and #327 had no current high/critical finding, observed production failure, platform enforcement, or accepted release objective that outweighed taking change now.
- PR #316 remains separately deferred because its Replit-only integration path lacks the environment-specific validation required to justify the update.

Future security scans and dependency automation may open new work, but agents should reassess the then-current versions, advisories, platform requirements, and product need from fresh `origin/main`. Do not reopen or merge these historical heads merely because their earlier checks passed; their evidence becomes stale as the base and external dependency ecosystem change.

## 2026-07-28 - New audit gate triggered narrow lockfile remediation

A registry metadata update caused the high/critical dependency audit to fail on docs-only PR #344 even though that PR does not change the package graph. Wilson authorized addressing the gate before merging the viewport-priority documentation.

The remediation follows the accepted PR #322 pattern: use npm's current audit metadata to update only `package-lock.json`, keep direct dependency declarations and runtime code unchanged, and validate install, compile, build, unit, audit, and exact-head GitHub gates. The broad patch-update PR #339 remains a separate maintenance lane and is not the remediation unit. Advisory identifiers, package paths, and scanner detail remain in private/security tooling and GitHub Actions logs.

## 2026-07-28 - Audit remediation merged; broad strategy remains deferred

PR #345 merged as `6272b5d68de9269bf9f2fe85e6f90160ce595df4` from exact head `b2f9e2b7a45109ac89313bd7663175f522099985`. The merge updated the lockfile's transitive resolution without changing `package.json` or direct dependency declarations. Exact-head dependency audit, secret scan, unit/typecheck/build, and all nine schema-backed Playwright tests passed before merge.

This completed the concrete security-gate trigger without reopening broad modernization. PR #339 and other routine update proposals remain separate, current-need-based decisions; do not infer merge readiness for them from PR #345.

## 2026-08-11 - Dependabot queue resolved without untriggered upgrades

The six open Dependabot PRs were reviewed against current `main` at `2ef2b62163c0fada0fc858fdd10442e3a573cda4`, their exact-head GitHub workflow evidence, and the trigger-driven maintenance rule above. All six were closed unmerged:

- PR #338 changed the TruffleHog action wrapper to `3.96.0` but left both explicit scanner-version inputs on `3.95.9`. Its successful scan therefore did not validate scanner `3.96.0`; a future triggered replacement must align both fields.
- PR #352's patch wave passed install, typecheck/lint, build, unit/coverage, dependency audit, and secret scan, but it bundled 17 Radix UI primitives with `ws` and Node declarations without a current security, defect, platform, or accepted modernization trigger.
- PRs #340 and #341 passed the same non-E2E compatibility lanes for their focused Radix Avatar and Checkbox updates, but both had become conflicted with current `main` and neither had a concrete maintenance trigger. Their affected live surfaces are profile/avatar rendering and cooking/grocery checkbox interactions.
- PR #342 was not a valid standalone Zod 4 upgrade: `npm ci` failed because the current OpenAI SDK requires the Zod 3 peer range. Zod remains a coordinated schema/provider modernization boundary rather than a package-only update.
- PR #343 installed cleanly but failed TypeScript because `client/src/components/ui/calendar.tsx` still uses react-day-picker v8 class and component keys. A future upgrade requires a focused calendar-wrapper migration and interaction evidence.

For PRs #338, #340, #341, and #352, the red CI result came only from the known Dependabot protected-secret preflight, before DB setup, install, or Playwright in the E2E job. That is missing E2E evidence rather than proof of a dependency regression. PRs #342 and #343 had independent deterministic failures in the unit lane in addition to the same protected-secret boundary.

After the close actions, live GitHub search reported zero open Dependabot PRs. No dependency, lockfile, application, workflow, schema, runtime, or deployment file changed as part of this closeout. Future work should start from fresh `origin/main` and use the smallest triggered slice rather than reopening these historical heads.

## 2026-08-11 - Security maintenance lane narrowed and repaired

Branch `codex/dependency-security-lane-2026-08-11` follows the queue review with a focused security-automation replacement:

- npm Dependabot version updates are disabled with `open-pull-requests-limit: 0`, while security updates remain enabled and are grouped separately for production and development dependencies. GitHub documents that this setting disables version-update PRs without changing the separate security-update limit: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#open-pull-requests-limit
- GitHub Actions version updates remain enabled because action/scanner releases can be security-relevant, but routine updates receive a 14-day cooldown. Dependabot security updates bypass cooldown: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#cooldown
- TruffleHog moves from `3.95.9` to `3.96.0` with both action wrappers pinned to the release's full signed commit `6f3c981e7b77f235fd2702dd74af25fc4b72bf11` and both explicit scanner-image inputs aligned. The upstream release labels a dependency security update, providing the concrete trigger that closed PR #338's incomplete proposal lacked: https://github.com/trufflesecurity/trufflehog/releases/tag/v3.96.0
- A daily high/critical npm audit checks the current lockfile even when no PR or push occurs, and a unit guard makes future wrapper-SHA/image-version drift or regression to a movable action tag fail deterministically.

This does not reactivate broad package modernization. Zod 4, react-day-picker 10, Radix maintenance, provider SDK upgrades, and other routine npm version changes remain separate, trigger-driven slices with validation sized to their actual compatibility surface.

## 2026-08-12 - Security maintenance lane merged; broad strategy remains deferred

PR #354 merged as `12840c571a00ba77c2ed4cb8752b7b4ad29c72e8` from exact validated head `c71d6f42a5607b2a70e616657f74d5bb7c163054`. Required CI, daily/manual dependency-audit workflow validation, immutable TruffleHog secret scanning, and both CodeQL analyses passed before merge.

The accepted security-only posture is now on `main`: npm version-update PRs are disabled while Dependabot security updates remain enabled; GitHub Actions security and cooled patch/minor maintenance remain enabled; TruffleHog is aligned on the triggered `3.96.0` security release with an immutable action SHA; and the high/critical lockfile audit runs daily. The first default-branch Dependabot evaluation remains the operational confirmation of the new configuration. Broad modernization remains `Deferred`; this merge does not authorize Zod 4, react-day-picker 10, Radix, provider SDK, or other untriggered upgrades.
