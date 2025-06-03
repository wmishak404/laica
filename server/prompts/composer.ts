import { readFileSync } from 'fs';
import { join } from 'path';

const PROMPTS_DIR = join(__dirname, '.');

function loadPrompt(category: 'atoms' | 'molecules' | 'organisms', name: string): string {
  try {
    const filePath = join(PROMPTS_DIR, category, `${name}.md`);
    return readFileSync(filePath, 'utf-8').trim();
  } catch (error) {
    console.error(`Failed to load prompt: ${category}/${name}.md`);
    return '';
  }
}

export function composeSystemPrompt(atoms: string[], molecules: string[] = [], organisms: string[] = []): string {
  const parts: string[] = [];
  
  // Load atoms
  atoms.forEach(atom => {
    const content = loadPrompt('atoms', atom);
    if (content) parts.push(content);
  });
  
  // Load molecules
  molecules.forEach(molecule => {
    const content = loadPrompt('molecules', molecule);
    if (content) parts.push(content);
  });
  
  // Load organisms
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

// Predefined compositions for common use cases
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
      // Add recipe-base molecule when created
    ),
    user: (ingredients: string[], preferences?: string) => 
      `Create a recipe using these ingredients: ${ingredients.join(', ')}${preferences ? `. Additional preferences: ${preferences}` : ''}`
  },
  
  ingredientSubstitution: {
    system: () => composeSystemPrompt(
      ['personality', 'json-rules', 'home-focus'],
      // Add substitute-base molecule when created
    ),
    user: (ingredient: string, reason: string) => 
      `Suggest 3 alternatives for ${ingredient} that are ${reason}`
  }
};