/**
 * @vitest-environment jsdom
 */

import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

function renderMealPlanning() {
  const onMealSelected = vi.fn();
  const onPantryIngredientsAdded = vi.fn(async (ingredients: string[]) => true);

  function Harness() {
    const [profile, setProfile] = useState({
      cookingSkill: 'Intermediate',
      dietaryRestrictions: [] as string[],
      pantryIngredients: ['rice', 'eggs', 'spinach'],
      kitchenEquipment: ['skillet'],
      favoriteChefs: [] as string[],
    });

    onPantryIngredientsAdded.mockImplementation(async (ingredients: string[]) => {
      setProfile((previousProfile) => ({
        ...previousProfile,
        pantryIngredients: mergeUniqueEntries(previousProfile.pantryIngredients, ingredients),
      }));
      return true;
    });

    return (
      <MealPlanning
        userProfile={profile}
        initialTimeAvailable="30"
        onPlanningTimeChange={vi.fn()}
        onPantryIngredientsAdded={onPantryIngredientsAdded}
        onMealSelected={onMealSelected}
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('MealPlanning recipe generation locking', () => {
  it('freezes staple options while selected staples are saved before generation', async () => {
    const recipesDeferred = createDeferred<typeof recipeResponse>();
    fetchPantryRecipesMock.mockReturnValue(recipesDeferred.promise);
    const { onPantryIngredientsAdded } = renderMealPlanning();

    advanceToCuisine();
    fireEvent.click(screen.getByRole('button', { name: /mexican/i }));
    fireEvent.click(screen.getByRole('button', { name: /mediterranean/i }));
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    expect(screen.getByRole('heading', { name: /anything else around/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /tortillas/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /olive oil/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /lime/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /cilantro/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /tortillas/i }));
    fireEvent.click(screen.getByRole('button', { name: /olive oil/i }));
    fireEvent.click(screen.getByRole('button', { name: /view recipe suggestions/i }));

    await waitFor(() => {
      expect(onPantryIngredientsAdded).toHaveBeenCalledWith(['tortillas', 'olive oil']);
      expect(fetchPantryRecipesMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('button', { name: /tortillas/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /olive oil/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /lime/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cilantro/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /lemon/i })).toBeNull();
    expect(fetchPantryRecipesMock.mock.calls[0][0]).toEqual(expect.arrayContaining(['tortillas', 'olive oil']));
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
});
