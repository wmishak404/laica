import { describe, expect, it } from 'vitest';
import { compositions } from '../../server/prompts/composer';

describe('Equipment vision prompts', () => {
  it('adds non-kitchen exclusions to the system prompt', () => {
    const systemPrompt = compositions.equipmentAnalysis.system();

    expect(systemPrompt).toContain('Include only items that are clearly used for cooking, food preparation, food storage, or food serving.');
    expect(systemPrompt).toContain('Prioritize items that materially affect cooking capability: appliances, cookware, knives, utensils, cutting boards, mixing bowls, prep vessels, bakeware, strainers, and food-storage containers.');
    expect(systemPrompt).toContain('Judge each object by its function, not by whether the overall room looks like a kitchen.');
    expect(systemPrompt).toContain('Do not include bathroom items such as soap dispensers, toothbrush holders, or towel racks.');
    expect(systemPrompt).toContain('Do not include doorway or hallway items such as umbrella stands, coat racks, shoes, luggage, backpacks, or entryway furniture.');
    expect(systemPrompt).toContain('Do not include room furniture or built-in infrastructure such as dining tables, stools, shelving units, carts, sinks, faucets, towel bars, range hoods, vent hoods, countertops, cabinets, or islands. These are kitchen context or room infrastructure, not kitchen equipment.');
    expect(systemPrompt).toContain('Installed plumbing fixtures are never kitchen equipment. Exclude sinks, faucets, sprayers, drains, garbage disposals, and soap pumps even when they appear in a kitchen work area.');
    expect(systemPrompt).toContain('Do not include cleaning supplies or maintenance items such as dish soap, hand soap, paper towel holders, disinfecting wipes, tissue boxes, sponges, or cleaning canisters.');
    expect(systemPrompt).toContain('Do not include beverage containers or support appliances that are not directly used for cooking or serving food, such as wine bottles, wine glasses, water filtration dispensers, or water filtration systems.');
    expect(systemPrompt).toContain('Dedicated beverage-prep tools such as coffee makers, espresso machines, French presses, kettles, and coffee or tea carafes can count when they are clearly used for preparing or serving drinks.');
    expect(systemPrompt).toContain('For tools stored in organizers, name the cooking tools when clearly visible, not the organizer. For example, list knives, wooden spoons, or spatulas, not the knife block, generic utensil set, utensil crock, wire basket, or paper towel holder.');
    expect(systemPrompt).toContain('Serving and storage items such as mason jars or serving trays can count when they are clearly used for food storage or serving.');
    expect(systemPrompt).toContain('Do not classify an item as kitchen equipment just because it is near a counter, sink, island, dining table, or stove.');
    expect(systemPrompt).toContain('Do not use speculative hybrid labels such as "carafe or water bottle." If the object\'s function is ambiguous, omit it.');
    expect(systemPrompt).toContain('If you are unsure whether an item is used for cooking or food handling, omit it.');
  });

  it('reinforces the exclusions in the user prompt', () => {
    const userPrompt = compositions.equipmentAnalysis.user();

    expect(userPrompt).toContain('Only include equipment you are confident is used for cooking, food preparation, food storage, or food serving.');
    expect(userPrompt).toContain('Prioritize equipment that materially affects cooking capability: appliances, cookware, knives, utensils, cutting boards, mixing bowls, prep vessels, bakeware, strainers, and food-storage containers.');
    expect(userPrompt).toContain('Judge each object by its function, not by whether the room looks like a kitchen.');
    expect(userPrompt).toContain('Do not infer that an object is kitchen equipment just because it is near a counter, sink, island, dining table, or stove.');
    expect(userPrompt).toContain('Do not list bathroom items, luggage, coats, shoes, pet items, decor, furniture, televisions, lamps, dining tables, dining chairs, shelving units, carts, sinks, faucets, towel bars, range hoods, vent hoods, countertops, cabinets, islands, cleaning supplies, paper towel holders, tissue boxes, drinkware, or unrelated household objects as kitchen equipment. Treat those as room context or kitchen infrastructure, not usable cooking equipment.');
    expect(userPrompt).toContain('Installed plumbing fixtures are never kitchen equipment. Exclude sinks, faucets, sprayers, drains, garbage disposals, and soap pumps even when they are part of a kitchen work area.');
    expect(userPrompt).toContain('Exclude wine bottles, wine glasses, water filtration dispensers, and water filtration systems from kitchen equipment.');
    expect(userPrompt).toContain('Dedicated beverage-prep tools such as coffee makers, espresso machines, French presses, kettles, and coffee or tea carafes can count when they are clearly used for preparing or serving drinks.');
    expect(userPrompt).toContain('If knives, spoons, spatulas, or other cooking tools are stored inside a holder or block, list the tools when clearly visible, not the storage object. Do not list knife blocks, generic utensil sets, utensil crocks, wire baskets, or paper towel holders as equipment.');
    expect(userPrompt).toContain('Serving and storage items such as mason jars or serving trays can count when they are clearly used for food storage or serving.');
    expect(userPrompt).toContain('Ignore humans and animals.');
    expect(userPrompt).toContain('Do not use speculative labels like "carafe or water bottle." If you cannot tell whether an object is a true kitchen prep or serving vessel, omit it.');
  });
});
