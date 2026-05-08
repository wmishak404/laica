# npm audit report - 2026-05-07

## Executive summary

I ran `npm audit --json` on 2026-05-07 and found **13 vulnerabilities** across the current dependency tree:

- `0` critical
- `0` high
- `5` moderate
- `8` low

The practical risk is lower than the raw count suggests because the findings collapse into **three underlying issue groups**:

1. **`drizzle-kit` tooling chain** (`drizzle-kit` -> `@esbuild-kit/esm-loader` -> `@esbuild-kit/core-utils` -> old nested `esbuild`)
2. **`firebase-admin` transitive chain** (`firebase-admin` -> Google Cloud libraries -> request/proxy helpers)
3. **Top-level `uuid` patch gap** (`firebase-admin` also depends on `uuid@11.1.0`)

The most important distinction is:

- **Runtime / production-relevant findings:** `firebase-admin` family and `uuid`
- **Developer-tooling-only findings:** `drizzle-kit` and its nested `esbuild`

That means the branch does **not** currently show any critical or high-severity package issue, but it does show a mix of:

- one **moderate runtime patch gap** worth fixing soon (`uuid`)
- several **low-severity runtime transitive issues** flowing through `firebase-admin`
- one **moderate development-tooling issue** with limited exposure unless someone is actively using the local Drizzle tooling or a vulnerable local dev server flow

## What `npm audit` actually checks

`npm audit` compares the exact installed dependency tree against the npm/GitHub advisory database. It does **not** prove the app is exploitable by itself. It flags packages that contain known security bugs and then leaves it to us to ask:

1. Is the package used in production or only in development tooling?
2. Is the vulnerable code path likely to run in this app?
3. Is a safe upgrade available without breaking behavior?

That is why the raw number `13` sounds scarier than the practical picture.

## Findings by issue group

### 1. `drizzle-kit` / nested `esbuild` chain

**Audit findings in this group**

- `drizzle-kit` - moderate
- `@esbuild-kit/esm-loader` - moderate
- `@esbuild-kit/core-utils` - moderate
- nested `esbuild@0.18.20` - moderate

**Installed path**

`drizzle-kit@0.31.10`  
`-> @esbuild-kit/esm-loader@2.6.5`  
`-> @esbuild-kit/core-utils@3.3.2`  
`-> esbuild@0.18.20`

**What the advisory means**

The flagged nested `esbuild` advisory says a website can make unexpected requests to a vulnerable development server and read responses under certain conditions. In plain English: this is mostly a **local development server trust-boundary problem**, not a typical “internet attacker can break production” issue.

**Why this matters less here**

- The vulnerable `esbuild` copy is **not** the app's top-level `esbuild`.
- The top-level package in this repo is `esbuild@0.25.12`, which is newer and not the one flagged.
- The vulnerable copy is nested inside `drizzle-kit`, which is a **database tooling package** used by developers, not a runtime dependency that serves end users.

**Practical impact**

- Low risk to production users
- Some risk to a developer machine if someone runs affected local tooling in a vulnerable scenario
- Mainly a maintenance/governance issue right now

**Remediation status**

- `npm audit fix --dry-run` did **not** offer a normal forward upgrade path.
- The audit metadata suggests `drizzle-kit@0.18.1` as a “fix”, which is older than the installed `0.31.10` and not a sensible automatic upgrade target.
- This usually means the advisory range or npm remediation metadata is awkward, incomplete, or points at a version boundary that does not map cleanly onto current releases.

**Recommendation**

- Do **not** blindly run `npm audit fix --force` here.
- Treat this as a **watchlist** item until the Drizzle toolchain publishes a clearly non-vulnerable path or until we intentionally replace/override the affected loader chain.

### 2. `firebase-admin` transitive chain

**Audit findings in this group**

- `firebase-admin` - low
- `@google-cloud/firestore` - low
- `google-gax` - low
- `@google-cloud/storage` - low
- `retry-request` - low
- `teeny-request` - low
- `http-proxy-agent` - low
- `@tootallnate/once` - low

**Installed path**

`firebase-admin@13.8.0`  
`-> @google-cloud/firestore@7.11.6`  
`-> google-gax@4.6.1`  
`-> retry-request@7.0.2`

and

`firebase-admin@13.8.0`  
`-> @google-cloud/storage@7.19.0`  
`-> teeny-request@9.0.0`  
`-> http-proxy-agent@5.0.0`  
`-> @tootallnate/once@2.0.0`

**What these advisories mean**

These are mostly **transitive** findings, meaning we did not install those packages on purpose. They came along because `firebase-admin` depends on them.

The notable one with a clear description is `@tootallnate/once`, which is flagged for **incorrect control flow scoping**. This is a low-severity bug with a low CVSS score and local prerequisites. The rest of the chain is reported because those libraries depend on each other.

**Why this matters more than the Drizzle issue**

- `firebase-admin` is a **production dependency**
- It participates in backend auth/admin flows
- Even low-severity findings deserve attention when they sit in production server code

**Why this is still not an emergency**

- All findings in this chain are **low severity**
- The advisories do not indicate a direct remote critical compromise path for this app
- The issues sit inside mature Google/Firebase support libraries, not in custom app code

**Remediation status**

`npm audit fix --dry-run` proposed:

- `firebase-admin 13.8.0 -> 13.9.0`
- `@tootallnate/once 2.0.0 -> 2.0.1`

This is useful because it shows at least part of the chain has a normal patch/minor update route.

**Recommendation**

- Plan a small follow-up dependency PR that upgrades `firebase-admin` to the newest compatible patch/minor and refreshes the lockfile.
- Re-run `npm audit` after that change to see which transitive findings disappear.
- This is a good “fix soon, low urgency” item.

### 3. `uuid@11.1.0`

**Audit finding**

- `uuid` - moderate

**Installed path**

The repo currently includes:

- `firebase-admin@13.8.0 -> uuid@11.1.0`

There are also older `uuid@9.0.1` and `uuid@8.3.2` copies in the tree, but the audit specifically flags the `11.0.0 - 11.1.0` range.

**What the advisory means**

The advisory says `uuid` is missing a **buffer bounds check** for v3/v5/v6 UUID generation when a caller provides a buffer manually.

In plain English:

- “bounds check” means “make sure the code does not write past the memory space it was supposed to use”
- missing that check can cause crashes or incorrect memory writes in certain use cases
- the risky path only matters if code calls those UUID functions with the optional `buf` argument

**Why this matters**

- It is the only **moderate-severity issue in a production dependency chain** that has a clean patch path.
- Even if the exact risky API path is not obviously used by our app, leaving an easy patch undone is not a good habit.

**Remediation status**

`npm audit fix --dry-run` proposed:

- `uuid 11.1.0 -> 11.1.1`

That is a narrow patch update and the safest remediation candidate in the current report.

**Recommendation**

- Upgrade the lockfile to pick up `uuid@11.1.1`.
- Prefer doing this together with the `firebase-admin` refresh because they are related in the installed tree.

## Risk ranking for this repo

### Priority 1 - fix soon

**`uuid` patch gap**

- Why: moderate severity, production dependency chain, patch release available
- User impact if exploited: likely stability/correctness risk in a narrow API path rather than account takeover
- Difficulty: low

### Priority 2 - tidy in the next dependency maintenance pass

**`firebase-admin` transitive low-severity chain**

- Why: production dependency, but only low severity findings
- User impact if exploited: low and indirect based on the current advisory set
- Difficulty: low to medium depending on lockfile churn

### Priority 3 - monitor, do not force blindly

**`drizzle-kit` / nested `esbuild` chain**

- Why: moderate severity but dev-tooling scoped
- User impact if exploited: mainly a developer-machine / local-tooling concern
- Difficulty: uncertain because `npm audit` does not present a trustworthy forward fix

## Why the audit output can be misleading

There are two common traps in raw audit output:

### Trap 1: counting findings instead of root causes

The report says `13 vulnerabilities`, but most of them are duplicate symptoms of a few upstream package chains. This is why grouping by root cause is more useful than reading the list top to bottom.

### Trap 2: assuming “moderate” always means urgent

Severity is only one input. Exposure matters just as much.

- A **moderate dev-tooling issue** may be less urgent than a **low production-runtime issue**
- A package can be vulnerable without the app exposing the vulnerable code path in practice

## What I would do next

### Safe next remediation PR

1. Upgrade `firebase-admin` to the latest compatible release
2. Refresh the lockfile so `uuid@11.1.1` is picked up
3. Re-run `npm audit`
4. Compare the new findings against this report

### What I would not do

- I would **not** run `npm audit fix --force` without review
- I would **not** downgrade `drizzle-kit` to `0.18.1` just because the audit metadata mentions it
- I would **not** treat this report as proof of a live breach or immediate production compromise

## Commands run

```bash
git switch -c codex/security-npm-audit-report
npm audit --json
npm ls drizzle-kit @esbuild-kit/esm-loader @esbuild-kit/core-utils esbuild firebase-admin @google-cloud/firestore @google-cloud/storage google-gax retry-request teeny-request http-proxy-agent @tootallnate/once uuid --all
npm audit fix --dry-run --json
```

## Validation limits

- This branch is **report-only**. I did not modify dependencies or application code.
- I attempted follow-up package registry lookups to confirm latest published versions, but those lookups did not complete in this environment, so the report only relies on successful `npm audit` / `npm ls` evidence.
- Because there were no code changes beyond documentation, I did not run app build/test commands for this branch.
