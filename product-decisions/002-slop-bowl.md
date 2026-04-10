# PD-002: Slop Bowl — Zero-Decision Cooking Path

**Date:** 2026-04-09
**Status:** Accepted
**Decision maker:** Wilson

## Context

Returning users with complete profiles (pantry, cooking skill, equipment, dietary restrictions) still go through 4 manual steps to get a recipe: pick time, pick cuisines, specify avoidances, then choose from 3 AI suggestions. This friction reduces repeat usage — users who already set up their pantry shouldn't have to make 4+ decisions every time they want to cook.

## Decision

Add a **"Slop Bowl"** feature — a zero-decision cooking path that auto-generates one multi-component bowl recipe based on the user's full profile and pantry. It sits alongside the existing manual meal planning flow with equal prominence.

### What defines a Slop Bowl

A Slop Bowl is always a **multi-component bowl** — different pieces from different parts of the pantry coming together in one bowl. Like build-your-own bowl restaurants, it has distinct layers:

| Component | Role | Examples |
|-----------|------|----------|
| **Base** | Foundation/bulk | Rice, grains, greens, lentils, noodles, couscous, polenta |
| **Protein** | Main substance | Chicken, steak, tofu, beans, eggs, fish, shrimp |
| **Toppings/Mix-ins** | Flavor, texture, nutrition | Roasted veggies, corn, pickled onions, cheese, avocado, herbs |
| **Sauce/Dressing** | Ties it together | Salsa, tahini, vinaigrette, hot sauce, yogurt, pesto |

The flavor direction is open — Mediterranean, Mexican, Asian, Southern, fusion, or whatever the pantry best supports.

### Key design choices

| Choice | Decision | Rationale |
|--------|----------|-----------|
| Number of recipes | 1 (not 3) | Removes decision fatigue — that's the whole point |
| Approval step | Yes — user confirms or rejects with optional feedback | Builds trust; AI course-corrects on rejection |
| Pantry refresh | Inline editing with tappable badges to remove/add | Scan may be inaccurate; quick fix before cooking |
| Missing ingredients | Shown transparently ("You'll need to grab: ...") | Honest about what's not in the pantry |
| Cooking history | Auto-read from `cookingSessions` table | Avoids repeats, varies cuisine, respects ratings |
| Prominence | Equal to manual meal planning (side-by-side cards) | Both paths remain fully accessible |
| Tone | Playful, tongue-in-cheek ("Trust the slop") | "Slop Bowl" is a trendy joke — lean into it |

### Trust through smart decisions

The system must make *good* decisions to earn trust. Key signals used:
- **Cooking history:** Avoid exact repeats within 7 days; vary cuisine from recent sessions
- **Ratings:** Highly-rated meals indicate preferred flavors (lean toward); low-rated meals indicate avoidance
- **Pantry coverage:** Maximize ingredients used, minimize additional purchases
- **Equipment constraints:** Only suggest techniques the user's kitchen supports
- **Dietary restrictions:** Strictly respected from profile

### User flow

1. Choice screen: "Slop Bowl" or "Plan your own meal" (equal prominence)
2. Pantry check: Confirm/edit ingredients (tappable badges, inline add, re-scan option)
3. Generation: AI builds one bowl recipe
4. Approval: "How does this sound?" — accept, reject with feedback, or escape to manual flow
5. Cooking: Existing `LiveCooking` flow (unchanged)

## Alternatives considered

| Alternative | Why rejected |
|-------------|-------------|
| Modify existing MealPlanning to auto-fill defaults | Adds complexity to existing component; harder to A/B test |
| Separate page/route | App uses state machine for workflow, not routes |
| Generate 3 bowls and auto-pick best | Still presents a choice; defeats the zero-decision goal |
| Slop Bowl as primary, manual as secondary | Wilson decided equal prominence — both paths matter |

## Implementation notes

- **Agent split:** Codex owns server (API + prompt), Claude owns client (UI + app integration)
- **API contract:** `POST /api/recipes/slop-bowl` — authenticated, returns single bowl with component breakdown
- **New component:** `client/src/components/cooking/slop-bowl.tsx`
- **Workflow phase:** `'slop-bowl'` added to `WorkflowPhase` union type
