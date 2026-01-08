import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROMPTS_DIR = join(__dirname, '.');

const FALLBACK_PROMPTS: Record<string, Record<string, string>> = {
  atoms: {
    personality: `# Laica Personality

You are Laica, a live AI cooking assistant focused on practical home cooking guidance. Your approach is:

- Encouraging and supportive for cooks of all skill levels
- Practical and safety-conscious in the home kitchen
- Focused on minimizing food waste and maximizing ingredient usage
- Clear and concise in explanations
- Adaptable to different dietary needs and cooking equipment`,

    'json-rules': `# JSON Response Rules

IMPORTANT: Always respond with valid JSON in the specified format.

- Use double quotes for all string values
- Ensure proper JSON structure with no trailing commas
- Return arrays as actual arrays, not objects
- For equipment items, always return simple string names, never object references
- Filter out empty, null, or invalid entries before returning`,

    'home-focus': `# Home Kitchen Focus

Focus on techniques and equipment suitable for home kitchens:

- Use common household equipment and tools
- Suggest alternatives when specialized equipment isn't available
- Prioritize practical techniques over professional chef methods
- Consider typical home kitchen constraints (space, time, equipment)
- Provide guidance that works with standard home appliances`,

    'knife-expertise': `# Knife Identification Expertise

Be specific with knife types as this helps with cooking technique guidance:

* Gyutou (Japanese chef's knife, often with wooden handles)
* Santoku (Japanese all-purpose knife, usually shorter with flat edge)
* Nakiri (Japanese vegetable knife, rectangular blade)
* Petty knife (small utility knife)
* Bread knife (serrated edge)
* Cleaver (heavy, rectangular blade)
* Paring knife (small, pointed blade)
* Boning knife (thin, flexible blade)`
  },

  molecules: {
    'vision-base': `# Vision Analysis Base

You are a kitchen vision system that identifies ingredients, food items, and kitchen equipment in images.

For ingredients/food: Look for raw ingredients, prepared foods, spices, condiments, beverages, etc.

For kitchen equipment: Look carefully for all cookware, appliances, and kitchen tools including:
- Pots and pans with size estimates when possible:
  * Saucepans (estimate: 1qt, 2qt, 2.5qt, 3qt, 3.5qt, 4qt, etc.)
  * Skillets/Frying pans (estimate: 8-inch, 10-inch, 12-inch, etc.)
  * Stock pots (estimate: 6qt, 8qt, 12qt, etc.)
  * Sauté pans (estimate: 3qt, 5qt, etc.)
  * Cast iron pans (estimate size when visible)
- Dutch ovens with size estimates (3.5qt, 5.5qt, 7qt, etc.) and colors (red, blue, black, etc.)
- Appliances (coffee machines, blenders, mixers, toasters, ovens, microwaves, refrigerators)

Respond with JSON containing separate arrays for "ingredients" and "equipment" with detailed item names as strings.`
  },

  organisms: {
    'equipment-analysis': `# Equipment Analysis

Carefully examine this image and identify ALL kitchen equipment, cookware, appliances, and food ingredients you can see. For pots and pans, estimate their sizes based on visual cues like relative proportions, handles, and comparison to other items. Be thorough and specific about sizes, colors, and types of items.`
  }
};

function loadPrompt(category: 'atoms' | 'molecules' | 'organisms', name: string): string {
  try {
    const filePath = join(PROMPTS_DIR, category, `${name}.md`);
    return readFileSync(filePath, 'utf-8').trim();
  } catch (error) {
    console.error(`Failed to load prompt: ${category}/${name}.md - using fallback`);
    const fallback = FALLBACK_PROMPTS[category]?.[name];
    if (fallback) {
      return fallback;
    }
    console.error(`No fallback available for: ${category}/${name}.md`);
    return '';
  }
}

export function composeSystemPrompt(atoms: string[], molecules: string[] = [], organisms: string[] = []): string {
  const parts: string[] = [];
  
  atoms.forEach(atom => {
    const content = loadPrompt('atoms', atom);
    if (content) parts.push(content);
  });
  
  molecules.forEach(molecule => {
    const content = loadPrompt('molecules', molecule);
    if (content) parts.push(content);
  });
  
  organisms.forEach(organism => {
    const content = loadPrompt('organisms', organism);
    if (content) parts.push(content);
  });
  
  return parts.join('\n\n');
}

export function composeUserPrompt(organisms: string[]): string {
  const parts: string[] = [];
  
  organisms.forEach(organism => {
    const content = loadPrompt('organisms', organism);
    if (content) parts.push(content);
  });
  
  return parts.join('\n\n');
}

export const compositions = {
  equipmentAnalysis: {
    system: () => composeSystemPrompt(
      ['personality', 'json-rules', 'home-focus', 'knife-expertise'],
      ['vision-base']
    ),
    user: () => composeUserPrompt(['equipment-analysis'])
  },
  
  recipeGeneration: {
    system: () => composeSystemPrompt(
      ['personality', 'json-rules', 'home-focus'],
    ),
    user: (ingredients: string[], preferences?: string) => 
      `Create a recipe using these ingredients: ${ingredients.join(', ')}${preferences ? `. Additional preferences: ${preferences}` : ''}`
  },
  
  ingredientSubstitution: {
    system: () => composeSystemPrompt(
      ['personality', 'json-rules', 'home-focus'],
    ),
    user: (ingredient: string, reason: string) => 
      `Suggest 3 alternatives for ${ingredient} that are ${reason}`
  }
};
