import { Palette } from './theme';

export const DEFAULT_GOALS = { calories: 2000, protein: 120, carbs: 250, fat: 65 };

export const CATEGORIES    = ['dal', 'rice', 'roti', 'sabzi', 'snack', 'dairy', 'fruit', 'protein', 'beverage', 'konkan', 'other'];
export const SERVING_UNITS = ['katori', 'piece', 'glass', 'plate', 'tablespoon', 'slice', 'cup', 'scoop'];

export const SLOTS = [
  { key: 'BREAKFAST', label: 'Breakfast', icon: 'sunny-outline',      color: Palette.kcal },
  { key: 'LUNCH',     label: 'Lunch',     icon: 'restaurant-outline', color: Palette.carbs },
  { key: 'DINNER',    label: 'Dinner',    icon: 'moon-outline',       color: Palette.protein },
  { key: 'SNACK',     label: 'Snack',     icon: 'cafe-outline',       color: Palette.water },
];

export function getDefaultSlot() {
  const h = new Date().getHours();
  if (h < 11) return 'BREAKFAST';
  if (h < 15) return 'LUNCH';
  if (h < 21) return 'DINNER';
  return 'SNACK';
}

export function isUnitFood(meal) {
  const u = (meal?.servingUnit || '').toLowerCase();
  return Boolean(u && u !== 'g' && u !== 'gram' && u !== 'grams' && u !== 'ml');
}

// Macros for `grams` of a meal whose values are per 100 g.
export function macrosFor(meal, grams) {
  const g = Number(grams) || 0;
  return {
    cal: (meal?.caloriesPer100g || 0) * g / 100,
    p:   (meal?.proteinPer100g  || 0) * g / 100,
    c:   (meal?.carbsPer100g    || 0) * g / 100,
    f:   (meal?.fatPer100g      || 0) * g / 100,
  };
}
