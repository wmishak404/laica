# Slop Bowl Phase 1 — Product Direction

**Status:** Accepted
**Phase owner:** Wilson
**Date:** 2026-04-09

## Goal

Define what Slop Bowl is for users before locking the API and UI contracts.

## Decisions

- Slop Bowl is a zero-decision meal path for returning users with completed profiles.
- Generation returns exactly one recipe, not three.
- The recipe is always a multi-component bowl with a base, protein, toppings or mix-ins, and sauce or dressing.
- The system should maximize pantry usage, minimize extra shopping, and respect dietary restrictions and available equipment.
- The user still gets an approval step and may reject with optional feedback.
- Slop Bowl and manual meal planning should have equal visual weight in the product.

## Source decisions

- [PD-002](../../002-slop-bowl.md)

## Carry-forward notes for later phases

- The product intent is stable, but the exact instruction handoff into cooking remains an implementation-alignment question for phase 2.
- UI layout details should stay responsive; the decision is equal prominence, not a fixed desktop-style arrangement.
