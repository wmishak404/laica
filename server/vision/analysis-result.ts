export const TEXT_ONLY_DOCUMENT_REJECTION_CODE = "TEXT_ONLY_DOCUMENT";

export interface VisionAnalysisResult {
  ingredients?: unknown[];
  equipment?: unknown[];
  rejected?: boolean;
  rejectionCode?: string;
  rejectionMessage?: string;
  [key: string]: unknown;
}

const DEFAULT_TEXT_ONLY_REJECTION_MESSAGE =
  "I can't use screenshots, lists, receipts, menus, recipes, or notes as inventory evidence. Upload a photo with the items visible, or enter them manually.";

function normalizeRejectionCode(code: unknown): string | undefined {
  if (typeof code !== "string") {
    return undefined;
  }

  const normalized = code.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return normalized === TEXT_ONLY_DOCUMENT_REJECTION_CODE ? TEXT_ONLY_DOCUMENT_REJECTION_CODE : code;
}

export function normalizeVisionAnalysisResult(rawResult: unknown): VisionAnalysisResult {
  const result: VisionAnalysisResult =
    rawResult && typeof rawResult === "object" && !Array.isArray(rawResult)
      ? { ...(rawResult as Record<string, unknown>) }
      : {};

  const rejectionCode = normalizeRejectionCode(result.rejectionCode);
  const rejected = result.rejected === true || rejectionCode === TEXT_ONLY_DOCUMENT_REJECTION_CODE;

  if (!rejected) {
    return result;
  }

  return {
    ...result,
    ingredients: [],
    equipment: [],
    rejected: true,
    rejectionCode: TEXT_ONLY_DOCUMENT_REJECTION_CODE,
    rejectionMessage:
      typeof result.rejectionMessage === "string" && result.rejectionMessage.trim()
        ? result.rejectionMessage
        : DEFAULT_TEXT_ONLY_REJECTION_MESSAGE,
  };
}
