import type { EvalFeatureType } from "./ai-feature-types";

export type ErrorMode = {
  id: string;
  name: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
};

export type EvalCriteria = {
  featureType: EvalFeatureType;
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

export const EVAL_CRITERIA: Record<EvalFeatureType, EvalCriteria> = {

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
        description: 'A recipe relies on key ingredients that are not in the user\'s pantry or confirmed staples. additionalIngredientsNeeded is only for optional enhancements and must not be used to justify required missing ingredients. Minor pantry-adjacent items (salt, pepper, water, neutral oil) can be assumed.',
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

  chef_it_up_suggestions: {
    featureType: 'chef_it_up_suggestions',
    description: 'Evaluates Chef It Up pantry recipe suggestions for current response shape, pantry grounding, cuisine fit, optional ingredients, and user constraints.',
    evaluatorInstructions: `You are a culinary AI quality evaluator. Assess whether Chef It Up produced three pantry-first recipe suggestions that satisfy the user's packed preferences, selected cuisines, skill, time, dietary restrictions, confirmed staples, and pantry ingredients. Be strict on dietary and structure failures. Keep EFF-022 cuisine fallback cases separate from deterministic pantry grounding until the product rule is resolved.`,
    errorModes: [
      {
        id: 'wrong_cuisine',
        name: 'Wrong Cuisine',
        description: 'One or more suggested recipes do not visibly honor the selected cuisine direction and do not clearly identify themselves as inspired, adapted, fusion, or pantry-flexible.',
        severity: 'high',
      },
      {
        id: 'dietary_violation',
        name: 'Dietary Restriction Violation',
        description: 'A recipe includes ingredients or required steps that violate the user\'s stated dietary restrictions. Dietary restrictions override softer cuisine or preference fit.',
        severity: 'high',
      },
      {
        id: 'pantry_mismatch',
        name: 'Pantry Mismatch',
        description: 'A recipe depends on required ingredients that are not in the pantry or confirmed staples. additionalIngredientsNeeded is only for optional enhancements.',
        severity: 'medium',
      },
      {
        id: 'optional_ingredient_required',
        name: 'Optional Ingredient Required',
        description: 'Instructions, overview, or dish identity require an item listed only in additionalIngredientsNeeded.',
        severity: 'medium',
      },
      {
        id: 'skill_mismatch',
        name: 'Skill Level Mismatch',
        description: 'The recipe complexity or required techniques are clearly mismatched with the user\'s stated cooking skill level.',
        severity: 'low',
      },
    ],
  },

  slop_bowl_suggestions: {
    featureType: 'slop_bowl_suggestions',
    description: 'Evaluates Slop Bowl generation for one coherent bowl-style meal, current shape, pantry grounding, optional extras, equipment fit, safety, and usefulness.',
    evaluatorInstructions: `You are evaluating Laica's Slop Bowl output: one bowl-style meal generated from a user's pantry, skill, restrictions, equipment, recent meals, planning time, and optional feedback. The output must be coherent, safe, pantry-grounded, and honest about fusion or cuisine direction.`,
    errorModes: [
      {
        id: 'invalid_shape',
        name: 'Invalid Shape',
        description: 'The Slop Bowl output is not one valid recipe object in the current Slop Bowl response contract.',
        severity: 'high',
      },
      {
        id: 'not_bowl_meal',
        name: 'Not A Bowl Meal',
        description: 'The recipe is not plausibly a bowl-style meal or is a disconnected collection of pantry items.',
        severity: 'medium',
      },
      {
        id: 'pantry_mismatch',
        name: 'Pantry Mismatch',
        description: 'The bowl relies on required ingredients not in the pantry instead of treating additions as optional enhancements.',
        severity: 'medium',
      },
      {
        id: 'equipment_assumption',
        name: 'Unsupported Equipment Assumption',
        description: 'The bowl requires equipment the user did not list without a safe common alternative.',
        severity: 'medium',
      },
      {
        id: 'unsafe_instruction',
        name: 'Unsafe Cooking Instruction',
        description: 'The bowl includes unsafe food handling, unsafe technique, or inadequate doneness guidance.',
        severity: 'high',
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

  live_cooking_step_previews: {
    featureType: 'live_cooking_step_previews',
    description: 'Evaluates Live Cooking step-preview/action labels for small-card recall quality. This judge lane is uncalibrated until Wilson labels and TPR/TNR exist.',
    evaluatorInstructions: `You are evaluating Live Cooking step-preview/action labels for a hands-busy home cook. The full cooking step may be safe and useful while the small preview label is still bad. Judge the preview label artifact separately from broad cooking-step safety or recipe quality.

This lane is uncalibrated until Wilson-labeled examples and TPR/TNR exist. Distinguish provider actionLabel failures from final rendered-label failures when the client fallback rescues the label.`,
    errorModes: [
      {
        id: 'measurement_or_quantity_label',
        name: 'Measurement Or Quantity Label',
        description: 'The final rendered preview label includes measurements, quantities, or numeric fragments instead of an action/result label, such as "Bring 4 Cups".',
        severity: 'medium',
      },
      {
        id: 'wrong_milestone_label',
        name: 'Wrong Milestone Label',
        description: 'The label names incidental setup words instead of the actual cooking milestone, such as labeling a vegetable-cooking step as only heating oil or butter.',
        severity: 'medium',
      },
      {
        id: 'ungrammatical_or_incomplete_label',
        name: 'Ungrammatical Or Incomplete Label',
        description: 'The label is not plain English, uses incorrect singular/plural agreement for the object being prepared, or omits a needed noun, preposition, or adverb, such as "Prep Leek" for multiple leeks, "Push Vegetables Side", or "Add Cold Cooked".',
        severity: 'medium',
      },
      {
        id: 'duplicate_distinct_milestone_label',
        name: 'Duplicate Distinct Milestone Label',
        description: 'Different milestones in the same recipe render the same generic preview label, such as repeated "Cook Vegetables" cards for distinct fried-rice steps.',
        severity: 'medium',
      },
      {
        id: 'too_long_for_preview_card',
        name: 'Too Long For Preview Card',
        description: 'The label is too long for the small preview card. Labels should usually be 2-4 words and stretch to 5 only when needed for meaning.',
        severity: 'low',
      },
      {
        id: 'provider_label_needs_client_rescue',
        name: 'Provider Label Needs Client Rescue',
        description: 'The raw provider actionLabel is poor, but the final rendered label is acceptable only because client normalization or fallback corrected it. Track separately from final rendered-label failure.',
        severity: 'low',
      },
    ],
  },
};
