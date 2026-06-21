# Security Due Diligence Workflow

## Operating Principles

Follow [operating-principles.md](operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

This workflow captures the reusable security lessons from the May 2026 Replit scan fixes without turning every feature into a broad audit.

## Plain-English Rule

When a change touches auth, user-owned data, provider spend, admin data, AI prompt inputs, response caching, or production HTML/security headers, do a focused security pass for that surface and add the smallest test or Replit check that would catch the same class of bug next time.

Do not chase a zero-findings target. Block merge for critical/high production-reachable issues and for medium issues that expose user data, auth/session material, admin data, or paid-provider abuse at scale. Table low, speculative, dev-only, or stale findings unless they fit naturally into the current change. Low-risk hardening patches may be batched so related security fixes can share one targeted release/Replit validation pass.

Because the repository is public, do not publish exact unresolved dependency advisory details, package paths, exploit notes, reproduction steps, raw scanner output, vulnerable-route evidence, provider-console diagnostics, full CI/ruleset API payloads, secret-presence matrices, or private auth/OAuth configuration values in public docs, PR bodies, pushed handoffs, or public GitHub Actions logs. Keep that detail in private/local working artifacts such as `$CODEX_HOME/private/laica/`, `.codex/private/` when a worktree permits it, `$CODEX_HOME/automations/security/report-YYYY-MM-DD.md`, `$CODEX_HOME/automations/security/last_scan.json`, local untracked notes, GitHub Security/Dependabot, or maintainer-only settings pages. Public GitHub text should stay at the coordination level: severity bucket, sanitized remediation theme, affected validation lane, decision, owner, validation status, and merge recommendation. If a public PR or handoff needs to mention security work, say what changed and how it was validated without teaching the unresolved weakness.

## Focus Areas

Use this checklist only for surfaces touched by the branch.

| If the change touches... | Check for... | Preferred coverage |
|---|---|---|
| User settings, profile, pantry, sessions, feedback, or saved app state | Caller-supplied IDs must not override the authenticated Firebase UID; reads/writes must be scoped to the owner | Unit test with a malicious `authUserId` or owner field in the body and an authenticated different user |
| Authenticated audio, generated content, admin JSON, or private API responses | Private responses must not be publicly cacheable; authenticated variants should include the relevant `Vary` header | Route/header unit test; human Replit `curl -i` before merge only when the risk lane requires live header proof, otherwise defer to release/batch validation |
| `client/index.html`, CSP, external scripts, analytics, embeds, or production HTML | Avoid third-party scripts with signed-in page access unless explicitly accepted; CSP must match the real production allowlist | Static test/assertion over HTML and CSP headers |
| AI, speech, vision, recipe generation, or other paid-provider routes | Abuse limits must be server-side and shared across production instances when running on autoscale; client limits are UX only | Unit test for the limiter contract and either accepted automated provider/Replit canary evidence or targeted human Replit smoke before release |
| AI logs, eval data, feedback, transcripts, or user text flowing into prompts | Treat logged/user content as untrusted data; neutralize prompt markers and tell prompt-writing models not to obey examples | Unit test for prompt construction/sanitization when practical; admin workflow smoke when provider-backed |
| `/api/admin/*` routes or admin tooling | Require admin auth, do not cache sensitive responses, avoid leaking secrets or raw user payloads | Header/auth unit test and Replit `curl` with/without `X-Admin-Secret` |
| DB schema that supports security controls | Schema must be applied in the Replit-authoritative DB before relying on the control | `npm run db:push` in Replit plus a smoke that exercises the control |
| Dependency changes or security scan output | Confirm no critical/high production dependency issue; keep moderate/low findings in monitored maintenance unless exploitable | `npm audit --omit=dev` or CI audit result in PR/handoff |

## Lessons From PR #111 and PR #113

- Server-derived identity must win over request-body identity. Pass authenticated ownership separately from client-supplied payload fields.
- Authenticated generated media is private user content. Default sensitive generated responses to private/no-store caching with the relevant `Vary` header.
- Production HTML should load only production-required scripts and origins. Development helpers and domains stay out of production CSP.
- Admin data should not be cacheable. PR #113 added `Cache-Control: no-store`, `Pragma: no-cache`, `Expires: 0`, and `Vary: X-Admin-Secret` across admin routes.
- Autoscale requires shared abuse controls for provider routes. Use durable server-side guardrails where provider spend or process scale matters.
- AI interaction logs are untrusted prompt material. PR #113 hardened admin prompt generation so failure examples are treated as data, not instructions.

## Automation Guidance

When a future feature touches one of the focus areas, prefer adding a targeted regression test over adding broad security-process work:

- Add route unit tests for owner scoping, malicious owner fields, and auth-required behavior.
- Add response-header tests for cache-sensitive authenticated or admin routes.
- Add static tests for production HTML and CSP when external scripts or security headers change.
- Add limiter tests for provider routes, including image-count or multi-request accounting where relevant.
- Add prompt-construction tests when user/logged content is repackaged for an AI prompt.

If the behavior depends on Replit-only services, real Firebase Google sign-in, Replit deployment secrets, production DB schema, ElevenLabs, OpenAI, or autoscale behavior, record the missing live-service proof instead of pretending local mocks fully prove it. That proof can be human Replit validation, accepted automated Replit-environment CI, a provider canary, or a deferred release-batch check depending on the risk lane in [`testing-and-acceptance.md`](testing-and-acceptance.md).

## Secret Rotation After Exposure

When a secret is exposed, suspected exposed, or rotated because a command, shell log, screenshot, CI log, provider console, or chat may have revealed it, the closeout must include an environment-propagation reminder. Do not stop after rotating the key in the place where the exposure was noticed.

For provider keys such as OpenAI, ElevenLabs, Firebase service credentials, storage credentials, and admin secrets:

- Rotate or revoke the exposed credential in the provider console or owning secret manager.
- Remind Wilson to update every active runtime that consumes the secret: Replit workspace secrets, Replit Deployment/production secrets, GitHub Actions/CI secrets, dotenvx encrypted local `.env` when applicable, and any private automation environment.
- Use masked checks only. Print `set` / `MISSING` for named variables or a non-secret rotation label/date from private notes; never print secret values, prefixes, suffixes, token lengths, or full process environments.
- Rerun the smallest live-provider smoke for each affected deployed environment. A dev/Replit workspace pass does not prove production Deployment picked up the rotated key.
- Record the affected secret name, environments checked or still needing human update, validation performed, and remaining production retest in the PR/handoff. Keep private values, provider console screenshots, and exact diagnostics out of public docs.

The 2026-06-21 production vision-scan failure is the reference lesson: Replit dev recognized the oyster photo with the current OpenAI key, but production returned `/api/vision/analyze` `500` after an earlier key rotation was not propagated to the production Deployment environment.

## Low-Risk Security Patch Batching

For low-risk security hardening, prefer a small PR risk note over a standalone process document:

- **Risk lane:** automation-primary or batched release validation.
- **Why low risk:** narrow route/header/input boundary, no schema/dependency/client contract change, and representative route tests exist.
- **Evidence:** exact local/GitHub checks and the test files/assertions that cover the boundary.
- **Deferred release check:** the smallest human or automated Replit check to run with the next security/release batch.
- **Future-bug breadcrumb:** the likely symptom/surface to inspect first if the enhancement causes a regression.

Do not publish detailed scanner output or vulnerability breadcrumbs in this note. Keep it at the remediation/validation level.

## Replit Checks To Reuse

Use these as examples, substituting the current port/domain and route:

```bash
curl -s "http://127.0.0.1:5000/" \
  | rg -n "replit-dev-banner|replit\\.com/public/js/replit-dev-banner" \
  || echo "OK: no Replit dev banner script found"

curl -i -H "X-Admin-Secret: $ADMIN_SECRET" \
  "http://127.0.0.1:5000/api/admin/eval/pending" \
  | sed -n '1,40p'
```

Expected admin response headers for sensitive admin data:

- `Cache-Control: no-store, max-age=0`
- `Pragma: no-cache`
- `Expires: 0`
- `Vary: X-Admin-Secret`

Before a production publish, validate merged `main` in the Replit workspace first. After publishing, repeat only the checks needed to confirm the production deployment picked up the new artifact.
