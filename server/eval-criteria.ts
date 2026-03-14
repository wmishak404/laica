export type FeatureType = 'recipe_suggestions' | 'cooking_assistance' | 'cooking_steps';

export type ErrorMode = {
  id: string;
  name: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
};

export type EvalCriteria = {
  featureType: FeatureType;
  description: string;
  errorModes: ErrorMode[];
  evaluatorInstructions: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATION CRITERIA
// To add a new error mode: add an entry to the relevant errorModes array below.
// To update evaluation instructions: edit evaluatorInstructions for that feature.
// Changes here are picked up automatically by the next eval batch.
// ─────────────────────────────────────────────────────────────────────────────

export const EVAL_CRITERIA: Record<FeatureType, EvalCriteria> = {

  recipe_suggestions: {
    featureType: 'recipe_suggestions',
    description: 'Evaluates recipe suggestions for cuisine alignment, dietary safety, pantry usage, and instruction quality.',
    evaluatorInstructions: `You are a culinary AI quality evaluator. Your job is to assess whether an AI cooking assistant produced correct, safe, and appropriate recipe suggestions based on the user's input. Be strict on high-severity errors. Be fair — only flag genuine violations, not minor style preferences.`,
    errorModes: [
      {
        id: 'wrong_cuisine',
        name: 'Wrong Cuisine',
        description: 'One or more suggested recipes have no meaningful connection to the requested cuisine preference. A fusion recipe is acceptable only if it is clearly labeled as fusion and uses at least some elements of the target cuisine.',
        severity: 'high',
      },
      {
        id: 'dietary_violation',
        name: 'Dietary Restriction Violation',
        description: 'A recipe includes ingredients that violate the user\'s stated dietary restrictions (allergies, religious restrictions such as halal/kosher, or medical conditions such as celiac). This is the most critical error — flag any trace violation.',
        severity: 'high',
      },
      {
        id: 'pantry_mismatch',
        name: 'Pantry Mismatch',
        description: 'A recipe relies on key ingredients that are not in the user\'s pantry without listing them in additionalIngredientsNeeded. Minor pantry-adjacent items (salt, pepper, oil) can be assumed.',
        severity: 'medium',
      },
      {
        id: 'unsafe_instruction',
        name: 'Unsafe Cooking Instruction',
        description: 'A step contains a technique that is physically dangerous (e.g., putting hands near open flame, using a mandoline without a guard) or violates food safety (e.g., serving poultry undercooked without a doneness check).',
        severity: 'high',
      },
      {
        id: 'skill_mismatch',
        name: 'Skill Level Mismatch',
        description: 'The recipe complexity or required techniques are clearly mismatched with the user\'s stated cooking skill level (e.g., a beginner being asked to make a soufflé or debone a whole fish).',
        severity: 'low',
      },
    ],
  },

  cooking_assistance: {
    featureType: 'cooking_assistance',
    description: 'Evaluates real-time cooking help responses for relevance, tone, conciseness, and safety.',
    evaluatorInstructions: `You are evaluating an AI cooking assistant's real-time guidance given during live cooking. The user is mid-cook and asked a question. The response must: directly answer what was asked, be grounded in the current step context, maintain a neutral supportive tone (not cheerleader-like, not discouraging), and be concise. Flag any violations strictly.`,
    errorModes: [
      {
        id: 'off_topic',
        name: 'Off Topic',
        description: 'The response does not address the user\'s actual question, or ignores the context of the current cooking step entirely. Generic cooking advice that does not relate to the step counts as off-topic.',
        severity: 'high',
      },
      {
        id: 'wrong_tone',
        name: 'Wrong Tone',
        description: 'The response is excessively enthusiastic (e.g., "Amazing question! You\'re doing great!") or unnecessarily discouraging. The target tone is calm, helpful, and neutral.',
        severity: 'medium',
      },
      {
        id: 'too_vague',
        name: 'Too Vague',
        description: 'The answer is generic and does not give actionable guidance. It should give the user something specific they can do right now at that step.',
        severity: 'medium',
      },
      {
        id: 'too_long',
        name: 'Too Long',
        description: 'The response exceeds approximately 150 words when a shorter, direct answer would serve the user better. Users are mid-cook and cannot read long paragraphs.',
        severity: 'low',
      },
      {
        id: 'unsafe_advice',
        name: 'Unsafe Cooking Advice',
        description: 'The response suggests something physically risky or unsafe during the cooking process (e.g., touching hot surfaces, improper handling of raw meat).',
        severity: 'high',
      },
    ],
  },

  cooking_steps: {
    featureType: 'cooking_steps',
    description: 'Evaluates step-by-step cooking instructions for timing accuracy, safety, equipment assumptions, visual cues, and logical order.',
    evaluatorInstructions: `You are evaluating step-by-step cooking instructions generated for a home cook to follow in real time. This is high stakes — users follow these instructions while actively cooking. Check each step carefully for timing accuracy, equipment requirements, food safety standards, presence of visual/sensory cues, and logical step ordering. Apply a high standard.`,
    errorModes: [
      {
        id: 'timing_error',
        name: 'Timing Error',
        description: 'A step specifies a cooking time or temperature that is significantly inaccurate and would result in an undercooked, overcooked, or ruined dish (e.g., "sauté garlic for 10 minutes on high heat").',
        severity: 'high',
      },
      {
        id: 'equipment_assumption',
        name: 'Unsupported Equipment Assumption',
        description: 'A step requires specific equipment that the user has not listed in their kitchen inventory, without providing an alternative method or substitution.',
        severity: 'medium',
      },
      {
        id: 'unsafe_technique',
        name: 'Unsafe Technique',
        description: 'A step describes a technique that is physically dangerous or violates food safety (e.g., not specifying minimum internal temperature for meat, adding water to hot oil without warning).',
        severity: 'high',
      },
      {
        id: 'missing_visual_cue',
        name: 'Missing Visual or Sensory Cue',
        description: 'A step that requires judgement (e.g., browning, searing, doneness of proteins, caramelization) does not provide any visual, tactile, or aromatic cue to help the user know when to proceed.',
        severity: 'medium',
      },
      {
        id: 'wrong_step_order',
        name: 'Incorrect Step Order',
        description: 'Steps are arranged in an order that would produce a worse result or is culinarily incorrect (e.g., aromatics added before oil is hot, sauce reduced before protein is cooked, pasta added before water boils).',
        severity: 'high',
      },
    ],
  },
};
