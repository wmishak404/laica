import { describe, expect, it } from 'vitest';
import { filterDetectedEquipment, isExcludedEquipmentLabel } from '../../server/vision/equipment-filter';

describe('equipment filter', () => {
  it('removes fixed kitchen infrastructure and plumbing labels', () => {
    const equipment = [
      'vent hood (over stove)',
      'farmhouse kitchen sink',
      'kitchen faucet',
      'gas range (6-burner)',
      'French press coffee maker',
      'glass carafe',
    ];

    expect(filterDetectedEquipment(equipment)).toEqual([
      'gas range (6-burner)',
      'French press coffee maker',
      'glass carafe',
    ]);
  });

  it('filters object-shaped entries using their name-like field', () => {
    const equipment = [
      { name: 'range hood' },
      { item: 'soap dispenser' },
      { description: 'coffee maker' },
      { equipment: 'cutting board' },
    ];

    expect(filterDetectedEquipment(equipment)).toEqual([
      { description: 'coffee maker' },
      { equipment: 'cutting board' },
    ]);
  });

  it('recognizes excluded aliases directly', () => {
    expect(isExcludedEquipmentLabel('vent hood')).toBe(true);
    expect(isExcludedEquipmentLabel('farmhouse sink')).toBe(true);
    expect(isExcludedEquipmentLabel('French press coffee maker')).toBe(false);
    expect(isExcludedEquipmentLabel('glass carafe')).toBe(false);
  });
});
