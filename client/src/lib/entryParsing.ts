const PROMPT_MARKERS = [
  /###/g,
  /<\|[^|]*\|>/g,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /\[SYSTEM\]/gi,
  /\[\/SYSTEM\]/gi,
];

export function stripPromptMarkers(value: string): string {
  return PROMPT_MARKERS.reduce((current, pattern) => current.replace(pattern, ' '), value)
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeEntryLabel(value: string): string {
  return stripPromptMarkers(value).slice(0, 64);
}

export function normalizeEntryKey(value: string): string {
  return normalizeEntryDuplicateKey(value);
}

export function normalizeEntryDuplicateKey(value: string): string {
  const label = normalizeEntryLabel(value);
  const key = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b([a-z0-9]+)['`\u2019]s\b/g, '$1')
    .replace(/['`\u2019]/g, '')
    .replace(/[-\u2010-\u2015_./]+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return key || label.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function parseCommaSeparatedEntries(value: string): string[] {
  const seen = new Set<string>();
  const entries: string[] = [];

  value.split(/[,.]/).forEach((rawEntry) => {
    const entry = normalizeEntryLabel(rawEntry);
    const key = entry.toLowerCase();

    if (!entry || seen.has(key)) {
      return;
    }

    seen.add(key);
    entries.push(entry);
  });

  return entries;
}

const PANTRY_MANUAL_ENTRY_CORRECTIONS: Record<string, string> = {
  aspargus: 'asparagus',
  avcado: 'avocado',
  avacado: 'avocado',
  beens: 'beans',
  bluebery: 'blueberry',
  brocoli: 'broccoli',
  brocolli: 'broccoli',
  broccolli: 'broccoli',
  chiken: 'chicken',
  chickin: 'chicken',
  cilanto: 'cilantro',
  garilic: 'garlic',
  letuce: 'lettuce',
  mozerella: 'mozzarella',
  mushroms: 'mushrooms',
  onoin: 'onion',
  parmesean: 'parmesan',
  potatos: 'potatoes',
  ryce: 'rice',
  spinich: 'spinach',
  strawbery: 'strawberry',
  tomatos: 'tomatoes',
  zuchini: 'zucchini',
};

export interface PantryManualEntryCorrection {
  original: string;
  corrected: string;
}

export interface PantryManualEntryCorrectionResult {
  entries: string[];
  corrections: PantryManualEntryCorrection[];
}

function pantryCorrectionKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isProtectedPantryManualEntry(value: string): boolean {
  const letters = value.match(/[A-Za-z]/g)?.join('') ?? '';
  const isAllCaps = letters.length >= 2 && letters === letters.toUpperCase();
  return isAllCaps || /\d/.test(value);
}

export function correctPantryManualEntries(entries: string[]): PantryManualEntryCorrectionResult {
  const corrections: PantryManualEntryCorrection[] = [];

  const correctedEntries = entries.map((entry) => {
    if (isProtectedPantryManualEntry(entry)) {
      return entry;
    }

    const corrected = PANTRY_MANUAL_ENTRY_CORRECTIONS[pantryCorrectionKey(entry)];
    if (!corrected || corrected === entry) {
      return entry;
    }

    corrections.push({ original: entry, corrected });
    return corrected;
  });

  return { entries: correctedEntries, corrections };
}

export function mergeUniqueEntries(existing: string[], incoming: string[]): string[] {
  return mergeUniqueEntriesWithMetadata(existing, incoming).items;
}

export interface EntryMergeResult {
  items: string[];
  added: string[];
  duplicateCount: number;
  foundAgain: string[];
}

export function mergeUniqueEntriesWithMetadata(existing: string[], incoming: string[]): EntryMergeResult {
  const seen = new Map<string, { entry: string; source: 'existing' | 'incoming' }>();
  const items: string[] = [];
  const added: string[] = [];
  const foundAgain: string[] = [];
  const foundAgainKeys = new Set<string>();
  let duplicateCount = 0;

  existing.forEach((rawEntry) => {
    const entry = normalizeEntryLabel(rawEntry);
    const key = normalizeEntryDuplicateKey(entry);

    if (!entry || seen.has(key)) {
      return;
    }

    seen.set(key, { entry, source: 'existing' });
    items.push(entry);
  });

  incoming.forEach((rawEntry) => {
    const entry = normalizeEntryLabel(rawEntry);
    const key = normalizeEntryDuplicateKey(entry);

    if (!entry) {
      return;
    }

    const existingMatch = seen.get(key);
    if (existingMatch) {
      duplicateCount += 1;
      if (existingMatch.source === 'existing' && !foundAgainKeys.has(key)) {
        foundAgainKeys.add(key);
        foundAgain.push(existingMatch.entry);
      }
      return;
    }

    seen.set(key, { entry, source: 'incoming' });
    items.push(entry);
    added.push(entry);
  });

  return { items, added, duplicateCount, foundAgain };
}
