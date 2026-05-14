import { CheckCircle2, Plus, X } from 'lucide-react';
import type { InventoryReviewChipState } from '@/lib/inventoryReviewState';

interface InventoryReviewChipProps {
  item: string;
  state: InventoryReviewChipState;
  disabled?: boolean;
  wasRecentlyCorrected?: boolean;
  onRemove: () => void;
}

export function InventoryReviewChip({
  item,
  state,
  disabled = false,
  wasRecentlyCorrected = false,
  onRemove,
}: InventoryReviewChipProps) {
  const isRecent = state === 'recent';

  return (
    <span
      className="setup-chip setup-review-chip"
      data-state={state}
      data-corrected={wasRecentlyCorrected ? 'true' : undefined}
    >
      {isRecent ? (
        <Plus className="setup-review-chip-status h-4 w-4" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="setup-review-chip-status h-4 w-4" aria-hidden="true" />
      )}
      <span className="setup-review-chip-text">{item}</span>
      <button
        type="button"
        aria-label={`Remove ${item}`}
        className="setup-review-chip-remove rounded-full p-0.5"
        disabled={disabled}
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </span>
  );
}
