export const PLANNING_TIME_VALUES = ['30', '60', '90', 'unbounded'] as const;

export type PlanningTimeValue = typeof PLANNING_TIME_VALUES[number];

export const DEFAULT_PLANNING_TIME_VALUE: PlanningTimeValue = '30';
export const PLANNING_TIME_STORAGE_KEY = 'laica_last_planning_time';

export interface PlanningTimeOption {
  value: PlanningTimeValue;
  label: string;
  promptLabel: string;
  minutes: number | null;
}

export const PLANNING_TIME_OPTIONS: PlanningTimeOption[] = [
  { value: '30', label: '30m', promptLabel: '30 minutes', minutes: 30 },
  { value: '60', label: '1hr', promptLabel: '1 hour', minutes: 60 },
  { value: '90', label: '1.5hrs', promptLabel: '90 minutes', minutes: 90 },
  { value: 'unbounded', label: 'Got all the time', promptLabel: 'no strict time limit', minutes: null },
];

export function isPlanningTimeValue(value: unknown): value is PlanningTimeValue {
  return typeof value === 'string' && PLANNING_TIME_VALUES.includes(value as PlanningTimeValue);
}

export function normalizePlanningTimeValue(value: unknown): PlanningTimeValue {
  return isPlanningTimeValue(value) ? value : DEFAULT_PLANNING_TIME_VALUE;
}

export function getPlanningTimeOption(value: PlanningTimeValue): PlanningTimeOption {
  return PLANNING_TIME_OPTIONS.find((option) => option.value === value) ?? PLANNING_TIME_OPTIONS[0];
}

export function getPlanningTimeLabel(value: PlanningTimeValue): string {
  return getPlanningTimeOption(value).label;
}

export function getPlanningTimePrompt(value: PlanningTimeValue): string {
  return getPlanningTimeOption(value).promptLabel;
}

export function getPlanningTimeMinutes(value: PlanningTimeValue): number | null {
  return getPlanningTimeOption(value).minutes;
}
