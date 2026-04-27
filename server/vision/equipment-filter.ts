const EXCLUDED_EQUIPMENT_PATTERNS = [
  /\bsoap\s+(?:dispenser|pump)\b/i,
  /\btowel\s+bar\b/i,
  /\btowel\s+rack\b/i,
  /\bsink\b/i,
  /\bfaucet\b/i,
  /\bsprayer\b/i,
  /\bgarbage\s+disposal\b/i,
  /\b(?:range|vent)\s+hood\b/i,
  /\bexhaust\s+(?:fan|hood)\b/i,
  /\bwine\s+glass\b/i,
  /\bwine\s+bottle\b/i,
  /\bwater\s+fil(?:ter|tration)(?:ing)?\b/i,
  /\butensil\s+set\b/i,
  /\butensil\s+(?:holder|crock|container)\b/i,
  /\bdrinking\s+glass\b/i,
];

function getEquipmentLabel(item: unknown): string {
  if (typeof item === 'string') {
    return item;
  }

  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    const candidate = record.name ?? record.item ?? record.equipment ?? record.description;
    if (typeof candidate === 'string') {
      return candidate;
    }
  }

  return '';
}

export function isExcludedEquipmentLabel(label: string): boolean {
  return EXCLUDED_EQUIPMENT_PATTERNS.some((pattern) => pattern.test(label));
}

export function filterDetectedEquipment<T>(equipment: T[]): T[] {
  return equipment.filter((item) => {
    const label = getEquipmentLabel(item).trim();

    if (!label) {
      return false;
    }

    return !isExcludedEquipmentLabel(label);
  });
}
