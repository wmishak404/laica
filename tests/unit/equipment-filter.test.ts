import { describe, expect, it } from 'vitest';
import { filterDetectedEquipment, isExcludedEquipmentLabel } from '../../server/vision/equipment-filter';

describe('equipment filter', () => {
  it('removes fixed kitchen infrastructure and plumbing labels', () => {
    const equipment = [
      'vent hood (over stove)',
      'farmhouse kitchen sink',
      'kitchen faucet',
      'wine glass',
      'wine bottle',
      'water filtration dispenser',
      'stainless steel countertop water filter',
      'wooden utensil set',
      'utensil holder',
      'drinking glass',
      'magnetic knife rack',
      'flower vase',
      'gas range (6-burner)',
      'French press coffee maker',
      'glass carafe',
      'mason jars',
      'serving tray',
    ];

    expect(filterDetectedEquipment(equipment)).toEqual([
      'gas range (6-burner)',
      'French press coffee maker',
      'glass carafe',
      'mason jars',
      'serving tray',
    ]);
  });

  it('filters object-shaped entries using their name-like field', () => {
    const equipment = [
      { name: 'range hood' },
      { item: 'soap dispenser' },
      { description: 'wine bottle' },
      { description: 'water filtration system' },
      { equipment: 'utensil set' },
      { equipment: 'utensil holder' },
      { description: 'drinking glass' },
      { description: 'magnetic knife rack' },
      { item: 'flower vase' },
      { description: 'coffee maker' },
      { equipment: 'cutting board' },
      { item: 'mason jars' },
    ];

    expect(filterDetectedEquipment(equipment)).toEqual([
      { description: 'coffee maker' },
      { equipment: 'cutting board' },
      { item: 'mason jars' },
    ]);
  });

  it('recognizes excluded aliases directly', () => {
    expect(isExcludedEquipmentLabel('vent hood')).toBe(true);
    expect(isExcludedEquipmentLabel('farmhouse sink')).toBe(true);
    expect(isExcludedEquipmentLabel('wine glass')).toBe(true);
    expect(isExcludedEquipmentLabel('wine bottle')).toBe(true);
    expect(isExcludedEquipmentLabel('water filter dispenser')).toBe(true);
    expect(isExcludedEquipmentLabel('stainless steel countertop water filter')).toBe(true);
    expect(isExcludedEquipmentLabel('utensil set')).toBe(true);
    expect(isExcludedEquipmentLabel('utensil holder')).toBe(true);
    expect(isExcludedEquipmentLabel('drinking glass')).toBe(true);
    expect(isExcludedEquipmentLabel('magnetic knife rack')).toBe(true);
    expect(isExcludedEquipmentLabel('flower vase')).toBe(true);
    expect(isExcludedEquipmentLabel('French press coffee maker')).toBe(false);
    expect(isExcludedEquipmentLabel('glass carafe')).toBe(false);
    expect(isExcludedEquipmentLabel('mason jars')).toBe(false);
    expect(isExcludedEquipmentLabel('serving tray')).toBe(false);
  });
});
