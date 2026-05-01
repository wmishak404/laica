import { normalizeEntryLabel } from './entryParsing';

export const TEXT_ONLY_DOCUMENT_REJECTION_CODE = 'TEXT_ONLY_DOCUMENT';

export type VisionScanType = 'pantry' | 'kitchen';

export interface VisionAnalysisResult {
  ingredients?: unknown[];
  equipment?: unknown[];
  detectedIngredients?: unknown[];
  detectedEquipment?: unknown[];
  rejected?: boolean;
  rejectionCode?: string;
  rejectionMessage?: string;
  analysis?: string;
  description?: string;
  [key: string]: unknown;
}

export function isRejectedVisionResult(result: VisionAnalysisResult | null | undefined): boolean {
  return Boolean(
    result?.rejected === true ||
    result?.rejectionCode === TEXT_ONLY_DOCUMENT_REJECTION_CODE
  );
}

export function getVisionRejectionFeedback(
  result: VisionAnalysisResult | null | undefined,
  type: VisionScanType,
) {
  return {
    title: type === 'pantry' ? 'Photo needs visible pantry items' : 'Photo needs visible kitchen tools',
    description:
      result?.rejectionMessage ||
      "I can't use screenshots, lists, receipts, menus, recipes, or notes as inventory evidence. Upload a photo with the items visible, or enter them manually.",
  };
}

export function extractVisionLabels(
  result: VisionAnalysisResult | null | undefined,
  type: VisionScanType,
): string[] {
  if (!result || isRejectedVisionResult(result)) {
    return [];
  }

  const primaryKey = type === 'pantry' ? 'ingredients' : 'equipment';
  const legacyKey = type === 'pantry' ? 'detectedIngredients' : 'detectedEquipment';
  const primary = Array.isArray(result[primaryKey]) ? result[primaryKey] : [];
  const legacy = Array.isArray(result[legacyKey]) ? result[legacyKey] : [];

  return [...primary, ...legacy]
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return record.name || record.ingredient || record.item || record.equipment || record.description || '';
      }
      return '';
    })
    .map((item) => normalizeEntryLabel(String(item).toLowerCase()))
    .filter(Boolean);
}
