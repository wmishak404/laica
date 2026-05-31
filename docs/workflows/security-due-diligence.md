# Security Due Diligence Workflow

## Operating Principles

Follow [operating-principles.md](operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

This workflow captures the reusable security lessons from the May 2026 Replit scan fixes without turning every feature into a broad audit.

## Plain-English Rule

When a change touches auth, user-owned data, provider spend, admin data, AI prompt inputs, response caching, or production HTML/security headers, do a focused security pass for that surface and add the smallest test or Replit check that would catch the same class of bug next time.

Do not chase a zero-findings target. Block merge for critical/high production-reachable issues and for medium issues that expose user data, auth/session material, admin data, or paid-provider abuse at scale. Table low, speculative, dev-only, or stale findings unless they fit naturally into the current change.

Because the repository is public, avoid publishing exact unresolved dependency advisory details, package paths, exploit notes, or reproduction steps for moderate/low findings in public docs, PR bodies, or handoffs. Keep those specifics in GitHub Security/Dependabot, private scan output, or the authorized local audit output; public docs may record the severity bucket, decision, owner, and future validation plan.

## Focus Areas

Use this checklist only for surfaces touched by the branch.

| If the change touches... | Check for... | Preferred coverage |
|---|---|---|
| User settings, profile, pantry, sessions, feedback, or saved app state | Caller-supplied IDs must not override the authenticated Firebase UID; reads/writes must be scoped to the owner | Unit test with a malicious `authUserId` or owner field in the body and an authenticated different user |
| Authenticated audio, generated content, admin JSON, or private API responses | Private responses must not be publicly cacheable; authenticated variants should include the relevant `Vary` header | Route/header unit test plus Replit `curl -i` for deployment-bound endpoints |
| `client/index.html`, CSP, external scripts, analytics, embeds, or production HTML | Avoid third-party scripts with signed-in page access unless explicitly accepted; CSP must match the real production allowlist | Static test/assertion over HTML and CSP headers |
| AI, speech, vision, recipe generation, or other paid-provider routes | Abuse limits must be server-side and shared across production instances when running on autoscale; client limits are UX only | Unit test for the limiter contract and Replit smoke for real provider calls |
| AI logs, eval data, feedback, transcripts, or user text flowing into prompts | Treat logged/user content as untrusted data; neutralize prompt markers and tell prompt-writing models not to obey examples | Unit test for prompt construction/sanitization when practical; admin workflow smoke when provider-backed |
| `/api/admin/*` routes or admin tooling | Require admin auth, do not cache sensitive responses, avoid leaking secrets or raw user payloads | Header/auth unit test and Replit `curl` with/without `X-Admin-Secret` |
| DB schema that supports security controls | Schema must be applied in the Replit-authoritative DB before relying on the control | `npm run db:push` in Replit plus a smoke that exercises the control |
| Dependency changes or security scan output | Confirm no critical/high production dependency issue; keep moderate/low findings in monitored maintenance unless exploitable | `npm audit --omit=dev` or CI audit result in PR/handoff |

## Lessons From PR #111 and PR #113

- Server-derived identity must win over request-body identity. PR #111 fixed settings updates by stripping `authUserId` from the body and passing the authenticated UID separately.
- Authenticated generated audio is private user content. PR #111 changed speech synthesis from year-long public caching to `private, no-store` with `Vary: Authorization`.
- Production HTML should not load Replit dev scripts. PR #113 removed the Replit dev banner script and removed `replit.com` from the production script allowlist.
- Admin data should not be cacheable. PR #113 added `Cache-Control: no-store`, `Pragma: no-cache`, `Expires: 0`, and `Vary: X-Admin-Secret` across admin routes.
- Autoscale makes per-process abuse limits soft. PR #113 added database-backed rate-limit buckets for production provider routes.
- AI interaction logs are untrusted prompt material. PR #113 hardened admin prompt generation so failure examples are treated as data, not instructions.

## Automation Guidance

When a future feature touches one of the focus areas, prefer adding a targeted regression test over adding broad security-process work:

- Add route unit tests for owner scoping, malicious owner fields, and auth-required behavior.
- Add response-header tests for cache-sensitive authenticated or admin routes.
- Add static tests for production HTML and CSP when external scripts or security headers change.
- Add limiter tests for provider routes, including image-count or multi-request accounting where relevant.
- Add prompt-construction tests when user/logged content is repackaged for an AI prompt.

If the behavior depends on Replit-only services, real Firebase Google sign-in, Replit deployment secrets, production DB schema, ElevenLabs, OpenAI, or autoscale behavior, record it as Replit validation instead of pretending local mocks fully prove it.

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
