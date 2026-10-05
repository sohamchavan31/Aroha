import { Palette } from './theme';

// Option lists shared by the profile view and the edit form.
export const ALL_GOALS = {
  lose_weight:         { label: 'Lose weight',         color: Palette.danger },
  reduce_body_fat:     { label: 'Reduce body fat',     color: Palette.fat },
  gain_muscle:         { label: 'Gain muscle',         color: Palette.kcal },
  gain_weight:         { label: 'Gain weight',         color: Palette.kcal },
  increase_strength:   { label: 'Increase strength',   color: Palette.protein },
  general_fitness:     { label: 'General fitness',     color: Palette.success },
  maintain:            { label: 'Maintain weight',     color: Palette.carbs },
  endurance:           { label: 'Endurance',           color: Palette.water },
  improve_flexibility: { label: 'Improve flexibility', color: Palette.violet },
};

export const GENDERS = [
  { key: 'male',              label: 'Male' },
  { key: 'female',            label: 'Female' },
  { key: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const ACTIVITY_LEVELS = [
  { key: 'sedentary',         label: 'Sedentary',         sub: 'Desk job, little movement' },
  { key: 'lightly_active',    label: 'Lightly active',    sub: 'Light exercise 1–3×/week' },
  { key: 'moderately_active', label: 'Moderately active', sub: 'Moderate exercise 3–5×/week' },
  { key: 'very_active',       label: 'Very active',       sub: 'Hard training 6–7×/week' },
  { key: 'athlete',           label: 'Athlete',           sub: 'Twice-daily or physical job' },
];

export const EXPERIENCE_LEVELS = [
  { key: 'beginner',     label: 'Beginner',     sub: '< 1 year' },
  { key: 'intermediate', label: 'Intermediate', sub: '1–3 years' },
  { key: 'advanced',     label: 'Advanced',     sub: '3+ years' },
];

export const DIET_PREFS = [
  { key: 'vegetarian',     label: 'Vegetarian' },
  { key: 'eggetarian',     label: 'Eggetarian' },
  { key: 'non_vegetarian', label: 'Non-veg' },
  { key: 'vegan',          label: 'Vegan' },
  { key: 'jain',           label: 'Jain' },
];

export const LOSS_SPEEDS = [
  { key: 'slow_cut',       label: 'Slow cut',       sub: '−200 kcal/day' },
  { key: 'moderate_cut',   label: 'Moderate cut',   sub: '−400 kcal/day' },
  { key: 'aggressive_cut', label: 'Aggressive cut', sub: '−600 kcal/day' },
];

export const GAIN_SPEEDS = [
  { key: 'slow_bulk',       label: 'Slow bulk',       sub: '+150 kcal/day' },
  { key: 'lean_bulk',       label: 'Lean bulk',       sub: '+250 kcal/day' },
  { key: 'aggressive_bulk', label: 'Aggressive bulk', sub: '+400 kcal/day' },
];

export const LOSS_GOALS = new Set(['lose_weight', 'reduce_body_fat']);
export const GAIN_GOALS = new Set(['gain_muscle', 'gain_weight']);

export function labelFor(list, key) {
  return list.find(o => o.key === key)?.label ?? key;
}

export function bmiColor(bmi) {
  if (!bmi) return Palette.text;
  if (bmi < 18.5) return Palette.water;
  if (bmi < 25) return Palette.success;
  if (bmi < 30) return Palette.kcal;
  return Palette.danger;
}
