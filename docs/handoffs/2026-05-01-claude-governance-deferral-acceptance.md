# Claude Accepts Governance Closeout Ownership

**Agent:** claude
**Branch:** claude/mystifying-hertz-7c2418
**Date:** 2026-05-01
**Initiative:** INIT-001
**INIT updated:** no — coordination response only; no initiative state change.

## Summary

Acknowledging Codex's deferral handoff at [docs/handoffs/2026-05-01-codex-phase-2-2-governance-deferral.md](2026-05-01-codex-phase-2-2-governance-deferral.md). Agreed: Phase 2.2 lands as-is at `24a4be019ebcc86960d32a4d99e5e70e51012178`; EPIC-001 / EPIC-012 graduation is deferred. Claude accepts ownership of the future governance closeout on a dedicated branch.

This handoff exists to (a) close the coordination loop with an explicit acceptance, (b) record the trigger conditions for opening the closeout branch, and (c) flag one risk Codex's handoff did not address — the volatile `/private/tmp/...` location of the WIP backup.

## Decision recap

- Phase 2.2 merges first, validated in Replit at `24a4be019ebcc86960d32a4d99e5e70e51012178`, on its own branch (`codex/mobile-refresh-phase-2-2-settings-history`).
- The deferral handoff branch (`codex/phase-2-2-governance-deferral-handoff`) merges separately as a small docs-only follow-up — it adds only commits `6ae10f7` and `89a326b` on top of Phase 2.2.
- EPIC-001 and EPIC-012 stay active. The 2026-05-01 dated entries Codex added to both epics on the Phase 2.2 branch (specificity drift, computed-style comparison rule, returning-Settings alignment, scoped-class reuse failure mode) are the latest signal and should not be flipped to "Resolved" in this cycle.
- The future governance closeout will run on a dedicated planning branch — `claude/ui-governance-closeout` — branched from fresh `origin/main` after Phase 2.2 merges.

## Trigger conditions for the closeout branch

Claude opens `claude/ui-governance-closeout` when at least one of the following holds:

1. **Phase 3 design-system evidence lands.** Specifically: whether `Fraunces / Nunito` setup typography globalizes, whether the coral / teal / yellow palette holds outside setup, and whether the camera-frame / progress-bar / chip-state patterns transfer to non-setup surfaces. Phase 3 alone may be enough; Phase 4-5 evidence makes the closeout sturdier.
2. **Wilson explicitly asks** Claude to run the closeout regardless of further phase evidence.
3. **EPIC-001 acquires a shipped enforcement mechanism on `main`** (lint rule, PR-template requirement, or equivalent). At that point the rubric is stable enough to freeze in `PD-005`.

The closeout will not start mid-phase. It will only run from clean `main` so the cross-reference updates (AGENTS / CLAUDE / INIT-001 / `epics/README.md` / `epics/registry.md` / `product-decisions/README.md`) can land as a single coordinated architectural-doc PR — the closeout pattern PD-007 already documents.

## What the closeout will produce

When triggered, the closeout branch produces:

- A candidate `product-decisions/005-ui-governance.md` carrying EPIC-001's 4 require/recommend rules, primitive lock order, tone-override surface taxonomy, coexistence rule, rollout model, and the 10-item agent checklist (now 11 with Codex's 2026-05-01 scoped-class addition).
- A rewrite or supersedence plan for root `design_guidelines.md` — either absorbing the accepted parts of `product-decisions/features/mobile-refresh/design-language.md`, or marking the root file as superseded by a new top-level design-language PD.
- A decision on EPIC-012's seven open identity questions — either resolved into the new artifact or split into narrower active epics with explicit ownership.
- Resolution banners on `epics/001-ui-governance.md` and `epics/012-laica-design-language.md` with dated pointers to the new PD and design-language artifact.
- A coordinated update to AGENTS.md, CLAUDE.md, INIT-001, and the epic / PD index files in the same PR. No partial migration — partial migration leaves agents reading dead links.

## Risk note — Codex's local WIP backup

Codex's deferral handoff records that the governance-graduation WIP is backed up to:

- `/private/tmp/laica-governance-graduation-wip-2026-05-01.patch`
- `/private/tmp/laica-governance-pd-005-wip-2026-05-01.md`

`/private/tmp` on macOS is volatile — it can be cleared on system reboot, by periodic cleanup tasks, or by macOS itself under disk pressure. If that draft PD-005 has signal worth carrying forward into the future closeout, it should not live there. Recommendations, in order of preference:

1. **Commit the WIP to a separate `codex/governance-pd-005-draft` branch** with a `Status: DRAFT — DO NOT MERGE` banner at the top of the file. Push to `origin`. Discoverable by future-Claude when the closeout starts.
2. **Move the files to a non-volatile location** (e.g. `~/Documents/laica-archive/2026-05-01-governance-wip/`) and write a follow-up handoff noting the path.
3. **Confirm explicitly in a follow-up handoff that the WIP is not worth preserving** — at which point the future closeout starts from scratch using the EPIC-001 / EPIC-012 source material.

Option 1 is the cleanest because it survives machine swaps and is visible to any agent. Option 3 is fine if the WIP is too speculative to anchor on. Option 2 is acceptable but creates a single-machine dependency.

This is the only flag I'd raise on the deferral handoff. Otherwise the coordination is sound.

## Phase 2.2 — not blocked

Confirmed via `git log origin/main..origin/codex/mobile-refresh-phase-2-2-settings-history` and `git log origin/main..origin/codex/phase-2-2-governance-deferral-handoff`:

- Phase 2.2 product head: `24a4be019ebcc86960d32a4d99e5e70e51012178`.
- The deferral handoff branch is built on top of Phase 2.2; its only new content is two doc-only commits (`6ae10f7`, `89a326b`).
- This Claude acceptance handoff is on `claude/mystifying-hertz-7c2418` and modifies only `docs/handoffs/`.
- None of the three branches modify product code paths that block Phase 2.2 validation.

## Impact on other agents

- **Codex:** continues Phase 2.2 Replit validation and any Phase 3 planning. If Phase 3 surfaces produce new design-language signal, append dated evidence to the active EPIC-001 / EPIC-012 files (per the "Documentation foundation rule" Codex added to AGENTS / CLAUDE on the Phase 2.2 branch). Disposition the `/private/tmp` WIP per the Risk note above.
- **Wilson:** when ready to graduate, ping Claude with the trigger condition that landed (Phase 3 evidence, explicit request, or shipped enforcement mechanism). Until then, no governance work expected.
- **Future Claude session:** open `claude/ui-governance-closeout` from fresh `main` only when one of the trigger conditions above holds. Read this handoff and Codex's deferral handoff first; read the most recent dated entries in EPIC-001 and EPIC-012 second.

## Open items

- Phase 2.2 Replit validation (Wilson).
- Codex disposition of `/private/tmp/...` WIP backup (see Risk note).
- Future closeout branch — not opened in this cycle.

## Verification

- `git fetch origin && git log --oneline origin/main..origin/codex/mobile-refresh-phase-2-2-settings-history` — confirms Phase 2.2 head is `24a4be0`.
- `git log --oneline origin/main..origin/codex/phase-2-2-governance-deferral-handoff` — confirms the deferral branch adds only `6ae10f7` and `89a326b` on top of Phase 2.2.
- `git diff --name-only origin/main...HEAD` on `claude/mystifying-hertz-7c2418` — should show only this handoff file (`docs/handoffs/2026-05-01-claude-governance-deferral-acceptance.md`).
- No runtime validation required — handoff-only branch.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `6541e91e15b80030655d83ca4e9413fd0d2491e9`
- Last Replit-validated at: not applicable (handoff-only)
- Notes: Independent of Codex's Phase 2.2 and deferral-handoff branches. This handoff does not need stacking against either; it merges as its own small docs PR or directly to main per the planning-doc auto-push rule in CLAUDE.md.
