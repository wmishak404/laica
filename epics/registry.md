# Epic Registry

Complete searchable index of Laica epics, including active and resolved history.

Default agent workflow:

- Start with [`README.md`](README.md) for the status model and active epic read list.
- Open this registry only when historical context is directly relevant or a task references a resolved/deferred epic.
- Treat the `Status` field inside each epic file as authoritative if this registry ever drifts.

Durable workflow decision: [`PD-007`](../product-decisions/007-epic-status-and-registry-workflow.md).

| # | Title | Status | Owner | Created | Resolved/deferred | Last signal |
|---|---|---|---|---|---|---|
| [001](001-ui-governance.md) | UI Consistency & Design Governance | `Open` | Wilson / Codex / Claude | 2026-04-16 |  | Parked until Slop Bowl ships |
| [002](002-home-getstarted-routing.md) | Home / Get Started routing & Home-Cook nav consolidation | `Resolved` | Wilson / Claude / Codex | 2026-04-16 | 2026-04-28 | Returning-user routing fixed; earlier Home/Cook split in [`PD-006`](../product-decisions/006-home-and-cook-remain-separate.md) superseded by mobile refresh [`PD-009`](../product-decisions/009-mobile-refresh-navigation.md) |
| [003](003-slop-bowl-pantry-quick-actions.md) | Slop Bowl pantry-check quick actions | `Resolved` | Wilson / Claude / Codex | 2026-04-16 | 2026-04-17 | Inline pantry add/remove implemented and validated |
| [004](004-selection-controls-tap-targets.md) | Selection controls should be full-row tap targets | `Open` | Wilson / Claude / Codex | 2026-04-17 |  | Awaiting implementation |
| [005](005-testing-strategy-and-acceptance-criteria.md) | App-wide testing strategy and acceptance criteria workflow | `Open` | Wilson / Codex / Claude | 2026-04-17 |  | Phase 2.1 merge added docs-only-after-validation precedent |
| [006](006-equipment-vision-exclusions.md) | Tighten equipment vision prompts to exclude non-kitchen items | `Resolved` | Wilson / Codex / Claude | 2026-04-22 | 2026-04-27 | Prompt tightening, narrow equipment filter, and fixture validation merged via PR #17 |
| [007](007-vision-scan-no-detection-feedback.md) | Vision scan should explicitly say when nothing was detected | `Open` | Wilson / Codex / Claude | 2026-04-27 |  | Phase 2.1 merged explicit scan outcome feedback; still needs named negative-control validation to resolve |
| [008](008-slop-bowl-sparse-pantry-guard.md) | Slop Bowl sparse-pantry guard | `Resolved` | Wilson / Codex / Claude | 2026-04-27 | 2026-04-27 | Replit flow validated; route-contract test covers typed 422 bypass guard |
| [009](009-consistent-comma-separated-ingredient-entry.md) | Consistent comma-separated ingredient entry | `Open` | Wilson / Codex / Claude | 2026-04-27 |  | Filed from Slop Bowl localhost testing |
| [010](010-local-db-schema-strategy.md) | Local database schema strategy | `Open` | Wilson / Codex / Claude | 2026-04-27 |  | Filed from local Neon schema drift during Slop Bowl validation |
| [012](012-laica-design-language.md) | LAICA Design Language & Visual Identity | `In Progress` | Wilson / Codex / Claude | 2026-04-29 |  | Phase 2.1 setup visual pilot merged via PR #27 |
| [013](013-pantry-manual-entry-spell-correction.md) | Pantry manual-entry spell correction | `Open` | Wilson / Codex / Claude | 2026-04-30 |  | Filed from Phase 2.1 manual-entry validation follow-up; future pantry-only conservative autocorrect with rare/stylized term preservation |
| [014](014-scan-session-diff-and-duplicate-refinement.md) | Scan session diff and duplicate refinement | `Open` | Wilson / Codex / Claude | 2026-04-30 |  | Filed from Phase 2.1 mobile validation; future latest-scan chip indicators and duplicate-like inventory cleanup |
