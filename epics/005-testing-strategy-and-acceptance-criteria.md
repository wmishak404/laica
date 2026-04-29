# EPIC-005 — App-wide testing strategy and acceptance criteria workflow

**Status:** Open
**Owner:** Wilson (product direction) / Codex (doc capture) / Claude (workflow review)
**Created:** 2026-04-17
**Updated:** 2026-04-28

## One-line summary

Define a consistent app-wide testing strategy so feature work is validated before merge with a shared bar for local checks, service-backed checks, acceptance criteria, and how results are recorded.

## Context — why this exists

Captured from Wilson during localhost review on 2026-04-17:

> How should test these features going forward instead of pushing? Lets make an epic discussing the test strategy, acceptance criterias and all throughout the app when we make changes.

Today the repo has pieces of a validation workflow, but not one clearly unified system:

- `AGENTS.md` defines **Local checks** (`npm ci`, `npm run check`, `npm run build`) and a **Replit validation gate** for deployment-bound work
- The repo has a small `tests/` directory with Playwright and Vitest files
- `package.json` does **not** expose standard `test`, `test:unit`, or `test:e2e` scripts
- Feature acceptance criteria often live ad hoc inside handoffs or phase notes rather than in one predictable place

This means the project has validation ingredients, but not yet a durable policy for:

- what every change must prove before merge
- when local validation is enough
- when Replit or service-backed validation is mandatory
- where acceptance criteria should be written
- how agents should report what was actually tested

### Current implementation (evidence)

#### Repo-level workflow docs

- `AGENTS.md`
  - documents local checks: `npm ci`, `npm run check`, `npm run build`
  - documents a Replit validation gate for deployment-bound changes:
    - Firebase sign-in
    - recipe suggestion flows
    - cooking-session persistence
    - feedback writes
    - ElevenLabs-backed speech routes
- `docs/adr/0001-replit-primary-local-agents.md`
  - allows local compile/build checks
  - keeps Replit as the authoritative validation environment for service-backed flows

#### Current automated test surface

- `tests/e2e/cooking-workflow.test.ts`
  - contains Playwright coverage ideas and mocks, but reads partly as a template/scaffold rather than a trusted required gate
- `tests/unit/voice-recording.test.ts`
  - covers a narrow voice-recording logic slice
- `tests/setup.ts`
  - sets up mocks for Firebase, OpenAI, and ElevenLabs in test runs

#### Current script surface

In `package.json`, the repo currently exposes:

- `dev`
- `build`
- `start`
- `check`
- `db:push`

There is no shared script contract such as:

- `test`
- `test:unit`
- `test:e2e`
- `test:smoke`

#### Current feature-validation pattern

Recent handoffs repeatedly mention:

- local `npm run check`
- local `npm run build`
- manual Replit validation for real service-backed flows

But the exact acceptance criteria vary per handoff, and there is no single cross-cutting doc that tells agents how to decide the minimum sufficient test plan for a given kind of change.

**Interpretation:** the repo has validation practices, but not yet a stable testing governance system. The gap is process clarity and coverage strategy, not just missing test files.

## Scope

### In scope

- Define the default testing pyramid / strategy for this app:
  - static checks
  - unit/integration tests
  - E2E or smoke flows
  - manual Replit validation
- Define what categories of changes require which level of validation
- Define where feature acceptance criteria should live during planning and implementation
- Define what must appear in handoffs / PR summaries about verification
- Decide whether the repo should expose standard test scripts in `package.json`
- Clarify local-vs-Replit testing boundaries for auth, database, AI, and speech flows
- Define a lightweight acceptance-criteria format reusable across features

### Out of scope

- Writing the entire missing test suite in this planning pass
- Replacing Replit as the deployment-bound validation environment
- Designing a full enterprise QA organization/process
- Mandating 100% automation for every app behavior

## Decisions made so far

- **Pushing should not be the first meaningful test step** — there should be a more explicit validation pass before code is considered ready
- **Acceptance criteria need a durable home** — not only scattered comments in agent chat
- **The strategy should apply across the app**, not just to one feature or one agent
- **Service-backed flows still matter** — purely local compile/build success is not enough for auth/DB/AI/speech changes

## Open questions

### 1. What is the minimum bar for every code change?

Candidate default:

- `npm run check`
- `npm run build`
- change-specific manual verification notes

Question:

- Is that the universal floor, or should some doc-only / planning-only changes be exempt?

### 2. What categories of changes require which validation layers?

Potential buckets:

- docs-only
- pure UI/layout changes
- client logic changes
- shared-schema/server-contract changes
- auth/database/AI/speech changes
- navigation / onboarding / core-user-flow changes

Question:

- What validation matrix should map these buckets to local checks, automated tests, localhost manual tests, and Replit validation?

### 3. Where should acceptance criteria live?

Current candidates:

- epic file
- feature phase note in `product-decisions/features/...`
- implementation handoff
- PR description

Question:

- What is the canonical source during planning, and what is the required carry-forward format during implementation?

### 4. What should the automated test strategy be in practice?

Current reality:

- a few tests exist
- test scripts are not wired into `package.json`
- local checks today are compile/build-first

Question:

- Should the repo standardize on scripts like `npm run test:unit` / `npm run test:e2e` / `npm run test`?
- Which high-value journeys deserve stable smoke tests first?

### 5. How do we handle service-backed features?

Important unstable surfaces include:

- Firebase auth
- Neon / DB persistence
- OpenAI-backed generation
- ElevenLabs-backed speech

Question:

- What can be trusted locally with mocks or local secrets, and what must still be proven in Replit before merge?

### 6. How should verification be recorded?

Desired outcome:

- every implementation handoff and PR clearly states:
  - what was run
  - what passed
  - what was manually checked
  - what was not tested
  - what still requires Replit or human validation

Question:

- Do we want a standard verification template/checklist for all future handoffs and PRs?

## Agent checklist — when to read this epic

Read EPIC-005 before starting any of the following:

- [ ] Planning or implementing a feature that changes a core user flow
- [ ] Deciding what verification is "enough" before merge
- [ ] Adding or reorganizing test scripts in `package.json`
- [ ] Creating new Playwright/Vitest coverage intended to become part of the standard workflow
- [ ] Writing feature acceptance criteria for a new implementation branch
- [ ] Updating `AGENTS.md`, handoff conventions, or PR verification expectations

When one of these applies, cite EPIC-005 in the handoff and note how the work interacts with it (conforms / defers / adds new signal). If the work establishes a new repeatable verification pattern, append a dated note here.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. A durable repo-level testing strategy exists, with clear local-vs-Replit boundaries
2. The project has a documented validation matrix for common change types
3. The canonical location and carry-forward format for feature acceptance criteria is defined
4. Verification expectations for handoffs / PRs are standardized
5. If adopted, standard test scripts are wired into `package.json` and documented
6. This epic has a final `## YYYY-MM-DD — Resolved` section pointing to the accepted product decision / workflow doc

## Linked artifacts

- `AGENTS.md` — local checks and Replit validation gate
- `docs/adr/0001-replit-primary-local-agents.md` — local vs Replit workflow
- `package.json` — current script surface, notably missing standard test scripts
- `tests/e2e/cooking-workflow.test.ts` — current Playwright surface
- `tests/unit/voice-recording.test.ts` — current Vitest surface
- `tests/setup.ts` — current mock/test setup

## Chronology — how we got here

### 2026-04-17 — Epic created

After getting localhost running again with the encrypted dotenv setup, Wilson asked for a better app-wide testing workflow so feature changes can be validated deliberately before code is merely pushed around. This epic records that ask as a cross-cutting governance track, separate from any one feature branch.

### 2026-04-27 — Epic closeout expectation clarified

The equipment-vision branch merged code that satisfied EPIC-006 in practice, but the epic docs remained active until a separate cleanup pass caught the drift. That adds a useful workflow signal: when a merged PR satisfies an epic's resolution criteria, the repo still needs a short docs closeout pass from fresh `main` to flip the epic status, update `epics/README.md` and `epics/registry.md`, append a final resolution note, and push a handoff. `AGENTS.md` and `CLAUDE.md` now call that out explicitly so merge-ready feature work and epic bookkeeping do not drift apart again.

### 2026-04-28 — Mobile refresh adopts phase-level acceptance criteria

The mobile-refresh records in `product-decisions/features/mobile-refresh/` include explicit acceptance criteria for Phase 0 through Phase 5 plus cross-phase AI privacy/abuse rules. This does not resolve the app-wide testing strategy, but it gives implementation agents a concrete merge-readiness checklist for this feature and preserves the Replit validation gate.

### 2026-04-29 — Phase 2 exposes authenticated smoke automation gap

PR #23 validation showed that deterministic Replit checks can pass while authenticated UI smoke still depends on a human completing Google sign-in. Wilson and Codex agreed not to bypass Google auth for Phase 2. The planned mobile-refresh [dev-test harness](../product-decisions/features/mobile-refresh/dev-test-harness.md) records the preferred future direction: dev-only Firebase custom-token auth, deterministic test users, and hybrid fixture/live-service smoke. This is new evidence for the testing strategy, not a resolution of this epic.

### 2026-04-29 — Phase 2 exposes visual acceptance gap

Wilson's PR #23 walkthrough also showed that a deterministic green run can still miss a core acceptance problem: the setup behavior was present, but the visuals were not close enough to the approved mobile-refresh mockup and the camera step did not offer an obvious Back/escape path. Future phase acceptance should include a visual comparison against linked mockups for the primary screens, and any behavior-first/visual-later split must be documented before validation begins. This adds testing-strategy evidence, not a resolution.

## Next steps when work resumes

1. Open a dedicated planning window for test strategy / acceptance-criteria workflow design
2. Draft a validation matrix by change type
3. Decide the canonical home for acceptance criteria and required verification notes
4. Decide whether to standardize `package.json` test scripts
5. Promote the accepted workflow to a durable product decision or workflow doc and resolve this epic
