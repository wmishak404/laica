export type InventoryScanType = 'pantry' | 'kitchen';

export const SCAN_IMAGES_PER_REFRESH = 20;
export const SCAN_IMAGES_PER_DAY = 40;
export const SCAN_ANALYSIS_CONCURRENCY = 4;

export const SCAN_UPLOAD_LIMITS: Record<InventoryScanType, number> = {
  pantry: SCAN_IMAGES_PER_REFRESH,
  kitchen: SCAN_IMAGES_PER_REFRESH,
};

export function scanAreaLabel(type: InventoryScanType): string {
  return type === 'pantry' ? 'Pantry' : 'Tools';
}

export function scanItemLabel(type: InventoryScanType): string {
  return type === 'pantry' ? 'pantry items' : 'tools';
}
