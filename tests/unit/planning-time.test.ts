import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLANNING_TIME_VALUE,
  getPlanningTimeMinutes,
  getPlanningTimePrompt,
  normalizePlanningTimeValue,
} from '../../shared/planning';

describe('planning time options', () => {
  it('normalizes unknown values to the Phase 3 default', () => {
    expect(normalizePlanningTimeValue('90')).toBe('90');
    expect(normalizePlanningTimeValue('120')).toBe(DEFAULT_PLANNING_TIME_VALUE);
    expect(normalizePlanningTimeValue(null)).toBe(DEFAULT_PLANNING_TIME_VALUE);
  });

  it('maps the four approved stops to prompt time bounds', () => {
    expect(getPlanningTimeMinutes('30')).toBe(30);
    expect(getPlanningTimeMinutes('60')).toBe(60);
    expect(getPlanningTimeMinutes('90')).toBe(90);
    expect(getPlanningTimeMinutes('unbounded')).toBeNull();
    expect(getPlanningTimePrompt('unbounded')).toBe('no strict time limit');
  });
});
