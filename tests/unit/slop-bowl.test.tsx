/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSlopBowlRecipe } from '@/lib/openai';
import SlopBowl from '../../client/src/components/cooking/slop-bowl';

vi.mock('@/lib/openai', () => ({
  fetchSlopBowlRecipe: vi.fn(),
  SLOP_BOWL_TOO_FEW_INGREDIENTS: 'SLOP_BOWL_TOO_FEW_INGREDIENTS',
}));

vi.mock('@/lib/rateLimitHandler', () => ({
  handleAiRequestError: vi.fn(),
}));

const baseProfile = {
  cookingSkill: 'intermediate',
  dietaryRestrictions: ['No restrictions'],
  pantryIngredients: ['rice', 'eggs', 'beans'],
  kitchenEquipment: ['skillet'],
  favoriteChefs: [],
};

const generatedRecipe = {
  recipeName: 'Savory Ground Lamb & Veggie Bowl',
  description: 'Look what your pantry had hiding in it',
  cookTime: 40,
  difficulty: 'Medium',
  cuisine: 'Middle Eastern-Inspired',
  pantryIngredientsUsed: ['rice', 'eggs', 'beans'],
  additionalIngredientsNeeded: ['lemon'],
  overview: 'A warm pantry bowl',
  instructions: ['Cook the rice', 'Top with everything else'],
  isFusion: false,
  pantryMatch: 90,
};

function renderSlopBowl() {
  const onMealSelected = vi.fn();
  const onBackToPlanning = vi.fn();
  const onEditPantry = vi.fn();

  render(
    <SlopBowl
      userProfile={baseProfile}
      planningTimeAvailable="30"
      onMealSelected={onMealSelected}
      onBackToPlanning={onBackToPlanning}
      onEditPantry={onEditPantry}
    />
  );

  return { onMealSelected, onBackToPlanning, onEditPantry };
}

describe('SlopBowl pantry check visual grammar', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders saved pantry ingredients as green check chips that can be omitted from this bowl', () => {
    renderSlopBowl();

    expect(screen.getByText(/one more check/i).closest('.slop-bowl-screen')).toBeTruthy();
    expect(screen.getByText(/one more check/i).closest('.slop-bowl-menu-screen')).toBeTruthy();

    const riceChip = screen.getByRole('button', { name: /omit rice from this bowl/i });

    expect(riceChip.className).toContain('slop-check-chip-saved');
    expect(riceChip.querySelector('.slop-check-chip-status')).toBeTruthy();
    expect(riceChip.querySelector('.slop-check-chip-remove-icon')).toBeTruthy();
    expect(screen.queryByText(/^saved$/i)).toBeNull();
    expect(screen.queryByText(/^added$/i)).toBeNull();
    expect(screen.getByText('Removing saved pantry items here only skips them for this bowl.')).toBeTruthy();

    fireEvent.click(riceChip);

    expect(screen.queryByRole('button', { name: /omit rice from this bowl/i })).toBeNull();
    expect(screen.getByRole('button', { name: /omit eggs from this bowl/i })).toBeTruthy();
  });

  it('renders manual temporary additions as coral plus chips with visible remove affordances', () => {
    renderSlopBowl();

    fireEvent.change(screen.getByPlaceholderText(/add rice, mayo, eggs/i), {
      target: { value: 'mayo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    const mayoChip = screen.getByRole('button', { name: /remove temporary mayo from this bowl/i });

    expect(mayoChip.className).toContain('slop-check-chip-added');
    expect(mayoChip.querySelector('.slop-check-chip-status')).toBeTruthy();
    expect(mayoChip.querySelector('.slop-check-chip-remove-icon')).toBeTruthy();
    expect(screen.queryByText(/^added$/i)).toBeNull();
    expect(screen.getByText("Temporary additions won't change your saved pantry.")).toBeTruthy();
  });

  it('keeps generated suggestion action buttons on the planning button typography contract', async () => {
    vi.mocked(fetchSlopBowlRecipe).mockResolvedValue({ recipe: generatedRecipe });
    renderSlopBowl();

    fireEvent.click(screen.getByRole('button', { name: /make my bowl/i }));

    const acceptButton = await screen.findByRole('button', { name: /let's cook this/i });
    const rejectButton = screen.getByRole('button', { name: /try something else/i });
    const planInsteadButton = screen.getByRole('button', { name: /plan your own meal instead/i });

    expect(screen.getByText(/we made you a thing/i).closest('.slop-bowl-approval-screen')).toBeTruthy();
    expect(planInsteadButton.closest('.slop-approval-actions')).toBeTruthy();

    for (const button of [acceptButton, rejectButton, planInsteadButton]) {
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('rounded-xl');
      expect(button.className).toContain('font-extrabold');
    }

    fireEvent.click(rejectButton);

    const recommendButton = screen.getByRole('button', { name: /recommend another bowl/i });
    const surpriseButton = screen.getByRole('button', { name: /skip and just surprise me/i });

    for (const button of [recommendButton, surpriseButton]) {
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('rounded-xl');
      expect(button.className).toContain('font-extrabold');
    }
  });
});
