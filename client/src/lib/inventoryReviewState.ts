import { normalizeEntryDuplicateKey } from '@/lib/entryParsing';
import type { InventoryScanType } from '@shared/scan-policy';

export type InventoryReviewChipState = 'saved' | 'recent' | 'found-again';

export interface InventoryReviewKeys {
  recentKeys: Set<string>;
  foundAgainKeys: Set<string>;
}

export type InventoryReviewState = Record<InventoryScanType, InventoryReviewKeys>;

export function createInventoryReviewState(): InventoryReviewState {
  return {
    pantry: { recentKeys: new Set(), foundAgainKeys: new Set() },
    kitchen: { recentKeys: new Set(), foundAgainKeys: new Set() },
  };
}

function cloneInventoryReviewState(state: InventoryReviewState): InventoryReviewState {
  return {
    pantry: {
      recentKeys: new Set(state.pantry.recentKeys),
      foundAgainKeys: new Set(state.pantry.foundAgainKeys),
    },
    kitchen: {
      recentKeys: new Set(state.kitchen.recentKeys),
      foundAgainKeys: new Set(state.kitchen.foundAgainKeys),
    },
  };
}

function entryKeys(entries: string[]) {
  return entries.map(normalizeEntryDuplicateKey).filter(Boolean);
}

export function markInventoryReviewEntries(
  state: InventoryReviewState,
  type: InventoryScanType,
  entries: string[],
  marker: 'recent' | 'found-again',
): InventoryReviewState {
  const keys = entryKeys(entries);
  if (keys.length === 0) {
    return state;
  }

  const next = cloneInventoryReviewState(state);
  keys.forEach((key) => {
    if (marker === 'recent') {
      next[type].recentKeys.add(key);
      next[type].foundAgainKeys.delete(key);
    } else if (!next[type].recentKeys.has(key)) {
      next[type].foundAgainKeys.add(key);
    }
  });
  return next;
}

export function removeInventoryReviewEntries(
  state: InventoryReviewState,
  type: InventoryScanType,
  entries: string[],
): InventoryReviewState {
  const keys = entryKeys(entries);
  if (keys.length === 0) {
    return state;
  }

  const next = cloneInventoryReviewState(state);
  keys.forEach((key) => {
    next[type].recentKeys.delete(key);
    next[type].foundAgainKeys.delete(key);
  });
  return next;
}

export function clearInventoryReviewType(
  state: InventoryReviewState,
  type: InventoryScanType,
): InventoryReviewState {
  if (state[type].recentKeys.size === 0 && state[type].foundAgainKeys.size === 0) {
    return state;
  }

  const next = cloneInventoryReviewState(state);
  next[type] = { recentKeys: new Set(), foundAgainKeys: new Set() };
  return next;
}

export function pruneInventoryReviewType(
  state: InventoryReviewState,
  type: InventoryScanType,
  items: string[],
): InventoryReviewState {
  const itemKeys = new Set(entryKeys(items));
  const next = cloneInventoryReviewState(state);

  next[type].recentKeys.forEach((key) => {
    if (!itemKeys.has(key)) {
      next[type].recentKeys.delete(key);
    }
  });
  next[type].foundAgainKeys.forEach((key) => {
    if (!itemKeys.has(key)) {
      next[type].foundAgainKeys.delete(key);
    }
  });

  return next;
}

export function getInventoryReviewChipState(
  state: InventoryReviewState,
  type: InventoryScanType,
  item: string,
): InventoryReviewChipState {
  const key = normalizeEntryDuplicateKey(item);
  if (state[type].recentKeys.has(key)) {
    return 'recent';
  }

  if (state[type].foundAgainKeys.has(key)) {
    return 'found-again';
  }

  return 'saved';
}
