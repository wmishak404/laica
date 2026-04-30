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
  return normalizeEntryLabel(value).toLowerCase();
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
  const seen = new Set<string>();
  const merged: string[] = [];

  [...existing, ...incoming].forEach((rawEntry) => {
    const entry = normalizeEntryLabel(rawEntry);
    const key = entry.toLowerCase();

    if (!entry || seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(entry);
  });

  return merged;
}
