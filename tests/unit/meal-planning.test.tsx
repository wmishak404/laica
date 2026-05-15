/**
 * @vitest-environment jsdom
 */

import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MealPlanning from '../../client/src/components/cooking/meal-planning';
import { mergeUniqueEntries } from '../../client/src/lib/entryParsing';

const fetchPantryRecipesMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/openai', () => ({
  fetchPantryRecipes: fetchPantryRecipesMock,
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: toastMock,
  useToast: () => ({ toast: toastMock }),
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

const recipeResponse = {
  recipes: [
    {
      recipeName: 'Pantry Rice Bowl',
      description: 'A simple bowl built around rice and eggs.',
      cookTime: 30,
      difficulty: 'Easy',
      cuisine: 'Pantry-first',
      pantryMatch: 95,
      pantryIngredientsUsed: ['rice', 'eggs'],
      additionalIngredientsNeeded: [],
      isFusion: false,
    },
    {
      recipeName: 'Spinach Egg Skillet',
      description: 'Eggs and greens in one warm skillet.',
      cookTime: 20,
      difficulty: 'Easy',
      cuisine: 'Pantry-first',
      pantryMatch: 90,
      pantryIngredientsUsed: ['eggs', 'spinach'],
      additionalIngredientsNeeded: ['lemon'],
      isFusion: false,
    },
    {
      recipeName: 'Rice Frittata',
      description: 'A quick frittata with leftover rice.',
      cookTime: 35,
      difficulty: 'Medium',
      cuisine: 'Pantry-first',
      pantryMatch: 88,
      pantryIngredientsUsed: ['rice', 'eggs', 'spinach'],
      additionalIngredientsNeeded: [],
      isFusion: false,
    },
  ],
};

interface RenderMealPlanningOptions {
  savePantryIngredients?: boolean;
  initialProfile?: {
    cookingSkill: string;
    dietaryRestrictions: string[];
    pantryIngredients: string[];
    kitchenEquipment: string[];
    favoriteChefs: string[];
  };
  onEditPantry?: () => void;
}

function renderMealPlanning({ savePantryIngredients = true, initialProfile, onEditPantry }: RenderMealPlanningOptions = {}) {
  const onMealSelected = vi.fn();
  const onPantryIngredientsAdded = vi.fn(async (ingredients: string[]) => true);

  function Harness() {
    const [profile, setProfile] = useState(initialProfile ?? {
      cookingSkill: 'Intermediate',
      dietaryRestrictions: [] as string[],
      pantryIngredients: ['rice', 'eggs', 'spinach'],
      kitchenEquipment: ['skillet'],
      favoriteChefs: [] as string[],
    });

    onPantryIngredientsAdded.mockImplementation(async (ingredients: string[]) => {
      if (savePantryIngredients) {
        setProfile((previousProfile) => ({
          ...previousProfile,
          pantryIngredients: mergeUniqueEntries(previousProfile.pantryIngredients, ingredients),
        }));
      }

      return savePantryIngredients;
    });

    return (
      <MealPlanning
        userProfile={profile}
        initialTimeAvailable="30"
        onPlanningTimeChange={vi.fn()}
        onPantryIngredientsAdded={onPantryIngredientsAdded}
        onMealSelected={onMealSelected}
        onEditPantry={onEditPantry}
        onBackToProfile={vi.fn()}
      />
    );
  }

  render(<Harness />);

  return { onMealSelected, onPantryIngredientsAdded };
}

function advanceToCuisine() {
  fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
  expect(screen.getByRole('heading', { name: /what sounds good/i })).toBeTruthy();
}

function advanceToStaples() {
  advanceToCuisine();
  fireEvent.click(screen.getByRole('button', { name: /mexican/i }));
  fireEvent.click(screen.getByRole('button', { name: /mediterranean/i }));
  fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

  expect(screen.getByRole('heading', { name: /anything else around/i })).toBeTruthy();
  expect(screen.getByText(/we'll save additions when you view suggestions/i)).toBeTruthy();
}

function getStapleRows() {
  return screen.getByRole('group', { name: /pantry staple options/i });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('MealPlanning recipe generation locking', () => {
  it('blocks pantry-based recipes when a returning profile has an empty pantry', () => {
    const onEditPantry = vi.fn();
    renderMealPlanning({
      initialProfile: {
        cookingSkill: 'Intermediate',
        dietaryRestrictions: ['No restrictions'],
        pantryIngredients: [],
        kitchenEquipment: ['skillet'],
        favoriteChefs: [],
      },
      onEditPantry,
    });

    advanceToStaples();
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    expect(fetchPantryRecipesMock).not.toHaveBeenCalled();
    const toastCall = toastMock.mock.calls[toastMock.mock.calls.length - 1]?.[0];
    expect(toastCall).toEqual(expect.objectContaining({
      title: 'Your pantry is empty',
      description: 'Add or scan pantry items before I can suggest recipes.',
      variant: 'destructive',
    }));
    expect(toastCall.action).toBeTruthy();
  });

  it('moves selected staples to Added and reveals the next ranked missing staples', () => {
    renderMealPlanning();

    advanceToStaples();

    let rows = getStapleRows();
    expect(within(rows).getByRole('button', { name: /^tortillas$/i })).toBeTruthy();
    expect(within(rows).getByRole('button', { name: /^olive oil$/i })).toBeTruthy();
    expect(within(rows).getByRole('button', { name: /^lime$/i })).toBeTruthy();
    expect(within(rows).getByRole('button', { name: /^cilantro$/i })).toBeTruthy();

    fireEvent.click(within(rows).getByRole('button', { name: /^tortillas$/i }));
    rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^olive oil$/i }));

    const added = screen.getByRole('group', { name: /added pantry staples/i });
    const tortillasChip = within(added).getByRole('button', { name: /remove tortillas from added/i });
    expect(tortillasChip).toBeTruthy();
    expect(tortillasChip.querySelectorAll('svg').length).toBe(2);
    expect(tortillasChip.querySelector('.planning-added-chip-add')).toBeTruthy();
    expect(within(added).getByRole('button', { name: /remove olive oil from added/i })).toBeTruthy();

    rows = getStapleRows();
    expect(within(rows).queryByRole('button', { name: /^tortillas$/i })).toBeNull();
    expect(within(rows).queryByRole('button', { name: /^olive oil$/i })).toBeNull();
    expect(within(rows).getByRole('button', { name: /^lime$/i })).toBeTruthy();
    expect(within(rows).getByRole('button', { name: /^cilantro$/i })).toBeTruthy();
    expect(within(rows).getByRole('button', { name: /^cumin$/i })).toBeTruthy();
    expect(within(rows).getByRole('button', { name: /^lemon$/i })).toBeTruthy();
  });

  it('lets Added chips undo the selection and restores queue order', () => {
    renderMealPlanning();

    advanceToStaples();

    let rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^tortillas$/i }));
    rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^olive oil$/i }));

    fireEvent.click(screen.getByRole('button', { name: /remove tortillas from added/i }));

    const added = screen.getByRole('group', { name: /added pantry staples/i });
    expect(within(added).queryByRole('button', { name: /remove tortillas from added/i })).toBeNull();
    expect(within(added).getByRole('button', { name: /remove olive oil from added/i })).toBeTruthy();

    rows = getStapleRows();
    expect(within(rows).getByRole('button', { name: /^tortillas$/i })).toBeTruthy();
    expect(within(rows).getByRole('button', { name: /^lime$/i })).toBeTruthy();
    expect(within(rows).getByRole('button', { name: /^cilantro$/i })).toBeTruthy();
    expect(within(rows).getByRole('button', { name: /^cumin$/i })).toBeTruthy();
    expect(within(rows).queryByRole('button', { name: /^lemon$/i })).toBeNull();
  });

  it('discards pending Added staples on Back before recipe suggestions are requested', () => {
    const { onPantryIngredientsAdded } = renderMealPlanning();

    advanceToStaples();

    let rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^tortillas$/i }));
    rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^olive oil$/i }));

    fireEvent.click(screen.getByRole('button', { name: /back to cuisines/i }));

    expect(onPantryIngredientsAdded).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /what sounds good/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    expect(screen.queryByRole('group', { name: /added pantry staples/i })).toBeNull();
    rows = getStapleRows();
    expect(within(rows).getByRole('button', { name: /^tortillas$/i })).toBeTruthy();
    expect(within(rows).getByRole('button', { name: /^olive oil$/i })).toBeTruthy();
  });

  it('submits all Added staples and only marks seen unselected staples as unconfirmed', async () => {
    const recipesDeferred = createDeferred<typeof recipeResponse>();
    fetchPantryRecipesMock.mockReturnValue(recipesDeferred.promise);
    const { onPantryIngredientsAdded } = renderMealPlanning();

    advanceToStaples();

    let rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^tortillas$/i }));
    rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^olive oil$/i }));
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    await waitFor(() => {
      expect(onPantryIngredientsAdded).toHaveBeenCalledWith(['tortillas', 'olive oil']);
      expect(fetchPantryRecipesMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchPantryRecipesMock.mock.calls[0][0]).toEqual(expect.arrayContaining(['tortillas', 'olive oil']));
    expect(fetchPantryRecipesMock.mock.calls[0][1]).toContain('Confirmed staples: tortillas, olive oil');
    expect(fetchPantryRecipesMock.mock.calls[0][1]).toContain('Unconfirmed staples: lime, cilantro, cumin, lemon; do not assume');
    expect(fetchPantryRecipesMock.mock.calls[0][1]).not.toContain('feta');
    expect(fetchPantryRecipesMock.mock.calls[0][1]).not.toContain('parsley');
  });

  it('marks saved Added staples and does not save them again when returning to staples', async () => {
    const recipesDeferred = createDeferred<typeof recipeResponse>();
    fetchPantryRecipesMock
      .mockReturnValueOnce(recipesDeferred.promise)
      .mockResolvedValue(recipeResponse);
    const { onPantryIngredientsAdded } = renderMealPlanning();

    advanceToStaples();

    let rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^tortillas$/i }));
    rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^olive oil$/i }));
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    await waitFor(() => {
      expect(onPantryIngredientsAdded).toHaveBeenCalledTimes(1);
      expect(onPantryIngredientsAdded).toHaveBeenCalledWith(['tortillas', 'olive oil']);
      expect(fetchPantryRecipesMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/already saved in your pantry: tortillas/i)).toBeTruthy();
      expect(screen.getByLabelText(/already saved in your pantry: olive oil/i)).toBeTruthy();
    });

    expect(screen.queryByText(/^saved$/i)).toBeNull();
    expect(screen.queryByText(/saved to pantry/i)).toBeNull();

    fireEvent.click(screen.getByLabelText(/already saved in your pantry: tortillas/i));
    expect(screen.getByRole('status').textContent).toMatch(/already saved in your pantry\. head to pantry settings to make changes\./i);

    await act(async () => {
      recipesDeferred.resolve(recipeResponse);
      await recipesDeferred.promise;
    });

    expect(await screen.findByRole('heading', { name: /recipe suggestions from your pantry/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /back to cuisines/i }));

    expect(screen.getByRole('heading', { name: /anything else around/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /remove tortillas from added/i })).toBeNull();
    expect(screen.getByLabelText(/already saved in your pantry: tortillas/i)).toBeTruthy();
    expect(screen.queryByText(/^saved$/i)).toBeNull();
    expect(screen.queryByText(/saved to pantry/i)).toBeNull();

    fireEvent.click(screen.getByLabelText(/already saved in your pantry: tortillas/i));
    expect(screen.getByRole('status').textContent).toMatch(/already saved in your pantry\. head to pantry settings to make changes\./i);

    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    await waitFor(() => {
      expect(fetchPantryRecipesMock).toHaveBeenCalledTimes(2);
    });

    expect(onPantryIngredientsAdded).toHaveBeenCalledTimes(1);
  });

  it('shows an error toast when pantry staple save fails and still uses staples for recipes', async () => {
    const recipesDeferred = createDeferred<typeof recipeResponse>();
    fetchPantryRecipesMock.mockReturnValue(recipesDeferred.promise);
    const { onPantryIngredientsAdded } = renderMealPlanning({ savePantryIngredients: false });

    advanceToStaples();

    const rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^tortillas$/i }));
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    await waitFor(() => {
      expect(onPantryIngredientsAdded).toHaveBeenCalledWith(['tortillas']);
      expect(fetchPantryRecipesMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchPantryRecipesMock.mock.calls[0][0]).toEqual(expect.arrayContaining(['tortillas']));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Couldn't save pantry staples",
      description: "We'll still use them for these recipes. You can add them later in Settings.",
      variant: 'destructive',
    }));
  });

  it('freezes the Added shelf and visible queue while Back still cancels loading', async () => {
    const recipesDeferred = createDeferred<typeof recipeResponse>();
    let capturedSignal: AbortSignal | undefined;
    fetchPantryRecipesMock.mockImplementation((_ingredients, _preferences, _time, options) => {
      capturedSignal = options?.signal;
      return recipesDeferred.promise;
    });
    renderMealPlanning();

    advanceToStaples();

    let rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^tortillas$/i }));
    rows = getStapleRows();
    fireEvent.click(within(rows).getByRole('button', { name: /^olive oil$/i }));
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    await waitFor(() => {
      expect(fetchPantryRecipesMock).toHaveBeenCalledTimes(1);
    });

    const added = screen.getByRole('group', { name: /added pantry staples/i });
    expect(within(added).getByLabelText(/already saved in your pantry: tortillas/i)).toBeTruthy();
    expect(within(added).getByLabelText(/already saved in your pantry: olive oil/i)).toBeTruthy();
    expect(within(added).queryByRole('button', { name: /remove tortillas from added/i })).toBeNull();
    expect(within(added).queryByText(/^saved$/i)).toBeNull();
    expect(within(added).queryByText(/saved to pantry/i)).toBeNull();

    rows = getStapleRows();
    expect(within(rows).getByRole('button', { name: /^lime$/i })).toBeDisabled();
    expect(within(rows).getByRole('button', { name: /^cilantro$/i })).toBeDisabled();
    expect(within(rows).getByRole('button', { name: /^cumin$/i })).toBeDisabled();
    expect(within(rows).getByRole('button', { name: /^lemon$/i })).toBeDisabled();
    expect(within(rows).queryByRole('button', { name: /^feta$/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /back to cuisines/i }));

    expect(capturedSignal?.aborted).toBe(true);
    expect(screen.getByRole('heading', { name: /what sounds good/i })).toBeTruthy();

    await act(async () => {
      recipesDeferred.resolve(recipeResponse);
      await recipesDeferred.promise;
    });

    expect(screen.queryByRole('heading', { name: /recipe suggestions from your pantry/i })).toBeNull();
  });

  it('disables cuisine inputs while recipe generation is pending', async () => {
    const recipesDeferred = createDeferred<typeof recipeResponse>();
    fetchPantryRecipesMock.mockReturnValue(recipesDeferred.promise);
    renderMealPlanning();

    advanceToCuisine();
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    await waitFor(() => {
      expect(fetchPantryRecipesMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('button', { name: /mexican/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /mediterranean/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /no preference/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /finding recipes/i })).toBeDisabled();
  });

  it('aborts generation on Back and ignores the canceled result', async () => {
    const recipesDeferred = createDeferred<typeof recipeResponse>();
    let capturedSignal: AbortSignal | undefined;
    fetchPantryRecipesMock.mockImplementation((_ingredients, _preferences, _time, options) => {
      capturedSignal = options?.signal;
      return recipesDeferred.promise;
    });
    renderMealPlanning();

    advanceToCuisine();
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    await waitFor(() => {
      expect(fetchPantryRecipesMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /back to time/i }));

    expect(capturedSignal?.aborted).toBe(true);
    expect(screen.getByRole('heading', { name: /how much time do you have today/i })).toBeTruthy();

    await act(async () => {
      recipesDeferred.resolve(recipeResponse);
      await recipesDeferred.promise;
    });

    expect(screen.queryByRole('heading', { name: /recipe suggestions from your pantry/i })).toBeNull();
    expect(screen.getByRole('heading', { name: /how much time do you have today/i })).toBeTruthy();
  });

  it('shows exactly three recipe suggestions when generation completes', async () => {
    const recipesDeferred = createDeferred<typeof recipeResponse>();
    fetchPantryRecipesMock.mockReturnValue(recipesDeferred.promise);
    renderMealPlanning();

    advanceToCuisine();
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    await waitFor(() => {
      expect(fetchPantryRecipesMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      recipesDeferred.resolve(recipeResponse);
      await recipesDeferred.promise;
    });

    expect(await screen.findByRole('heading', { name: /recipe suggestions from your pantry/i })).toBeTruthy();
    expect(screen.getByText('Pantry Rice Bowl')).toBeTruthy();
    expect(screen.getByText('Spinach Egg Skillet')).toBeTruthy();
    expect(screen.getByText('Rice Frittata')).toBeTruthy();
  });

  it('keeps recipe selection in order and leaves split recipe names display-only', async () => {
    fetchPantryRecipesMock.mockResolvedValue({
      recipes: [
        {
          ...recipeResponse.recipes[0],
          recipeName: 'Pantry Rice Bowl: Lemon Greens',
        },
        {
          ...recipeResponse.recipes[1],
          recipeName: 'Spinach Egg Skillet (with lemon)',
        },
        recipeResponse.recipes[2],
      ],
    });
    const { onMealSelected } = renderMealPlanning();

    advanceToCuisine();
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    expect(await screen.findByRole('heading', { name: /recipe suggestions from your pantry/i })).toBeTruthy();

    const initialTickets = screen.getAllByRole('button', { name: /ticket #/i });
    expect(initialTickets.map((ticket) => ticket.textContent)).toEqual([
      expect.stringContaining('Ticket #1'),
      expect.stringContaining('Ticket #2'),
      expect.stringContaining('Ticket #3'),
    ]);
    expect(initialTickets[0].getAttribute('data-selected')).toBe('true');
    expect(initialTickets.map((ticket) => ticket.getAttribute('data-layout'))).toEqual([
      'featured',
      'compact',
      'compact',
    ]);
    expect(initialTickets.map((ticket) => ticket.getAttribute('data-relation'))).toEqual([
      'selected',
      'after',
      'after',
    ]);

    fireEvent.click(initialTickets[1]);

    const updatedTickets = screen.getAllByRole('button', { name: /ticket #/i });
    expect(updatedTickets.map((ticket) => ticket.textContent)).toEqual([
      expect.stringContaining('Ticket #1'),
      expect.stringContaining('Ticket #2'),
      expect.stringContaining('Ticket #3'),
    ]);
    expect(updatedTickets[1].getAttribute('data-selected')).toBe('true');
    expect(updatedTickets.map((ticket) => ticket.getAttribute('data-layout'))).toEqual([
      'compact',
      'featured',
      'compact',
    ]);
    expect(updatedTickets.map((ticket) => ticket.getAttribute('data-relation'))).toEqual([
      'before',
      'selected',
      'after',
    ]);
    expect(within(updatedTickets[1]).getByText('Spinach Egg Skillet').className).toContain('planning-ticket-title-main');
    expect(within(updatedTickets[1]).getByText('with lemon').className).toContain('planning-ticket-title-detail');

    fireEvent.click(screen.getByRole('button', { name: /view prep tray/i }));
    expect(screen.getByRole('heading', { name: /spinach egg skillet with lemon/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /cook this/i }));
    expect(onMealSelected).toHaveBeenCalledWith(
      expect.objectContaining({ recipeName: 'Spinach Egg Skillet (with lemon)' }),
      'now',
    );
  });

  it('maps bowl, noodle, and skillet recipes to deterministic placeholder variants', async () => {
    fetchPantryRecipesMock.mockResolvedValue({
      recipes: [
        {
          ...recipeResponse.recipes[0],
          recipeName: 'Pantry Rice Bowl',
          pantryIngredientsUsed: ['rice', 'eggs'],
        },
        {
          ...recipeResponse.recipes[1],
          recipeName: 'Soy Garlic Noodles',
          pantryIngredientsUsed: ['noodles', 'garlic'],
        },
        {
          ...recipeResponse.recipes[2],
          recipeName: 'Spinach Egg Skillet',
          pantryIngredientsUsed: ['spinach', 'eggs'],
        },
      ],
    });
    renderMealPlanning();

    advanceToCuisine();
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    expect(await screen.findByRole('heading', { name: /recipe suggestions from your pantry/i })).toBeTruthy();

    const tickets = screen.getAllByRole('button', { name: /ticket #/i });
    expect(tickets[0].querySelector('.planning-recipe-image-slot')?.getAttribute('data-placeholder-variant')).toBe('bowl');
    expect(tickets[1].querySelector('.planning-recipe-image-slot')?.getAttribute('data-placeholder-variant')).toBe('noodles');
    expect(tickets[2].querySelector('.planning-recipe-image-slot')?.getAttribute('data-placeholder-variant')).toBe('skillet');

    fireEvent.click(tickets[2]);
    fireEvent.click(screen.getByRole('button', { name: /view prep tray/i }));

    expect(document.querySelector('.planning-recipe-image-slot-prep')?.getAttribute('data-placeholder-variant')).toBe('skillet');
  });

  it('suppresses placeholder art when imageUrl exists', async () => {
    fetchPantryRecipesMock.mockResolvedValue({
      recipes: [
        {
          ...recipeResponse.recipes[0],
          recipeName: 'Pantry Rice Bowl',
        },
        {
          ...recipeResponse.recipes[1],
          recipeName: 'Soy Garlic Noodles',
        },
        {
          ...recipeResponse.recipes[2],
          recipeName: 'Spinach Egg Skillet',
          imageUrl: 'https://example.com/skillet.jpg',
        },
      ],
    });
    renderMealPlanning();

    advanceToCuisine();
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    expect(await screen.findByRole('heading', { name: /recipe suggestions from your pantry/i })).toBeTruthy();

    const imageSlot = screen.getAllByRole('button', { name: /ticket #/i })[2].querySelector('.planning-recipe-image-slot');
    expect(imageSlot?.getAttribute('data-has-image')).toBe('true');
    expect(imageSlot?.getAttribute('data-placeholder-variant')).toBeNull();
    expect(imageSlot?.querySelector('[data-placeholder-variant]')).toBeNull();
  });
});
