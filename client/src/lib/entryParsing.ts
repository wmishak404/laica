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

export function mergeUniqueEntries(existing: string[], incoming: string[]): string[] {
  return mergeUniqueEntriesWithMetadata(existing, incoming).items;
}

export interface EntryMergeResult {
  items: string[];
  added: string[];
  duplicateCount: number;
}

export function mergeUniqueEntriesWithMetadata(existing: string[], incoming: string[]): EntryMergeResult {
  const seen = new Set<string>();
  const items: string[] = [];
  const added: string[] = [];
  let duplicateCount = 0;

  existing.forEach((rawEntry) => {
    const entry = normalizeEntryLabel(rawEntry);
    const key = normalizeEntryDuplicateKey(entry);

    if (!entry || seen.has(key)) {
      return;
    }

    seen.add(key);
    items.push(entry);
  });

  incoming.forEach((rawEntry) => {
    const entry = normalizeEntryLabel(rawEntry);
    const key = normalizeEntryDuplicateKey(entry);

    if (!entry) {
      return;
    }

    if (seen.has(key)) {
      duplicateCount += 1;
      return;
    }

    seen.add(key);
    items.push(entry);
    added.push(entry);
  });

  return { items, added, duplicateCount };
}
