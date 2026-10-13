// Switches for features that are built but not shipped yet.
// Turn one on for a local build with EXPO_PUBLIC_FEATURE_<NAME>=true.

const on = value => String(value).toLowerCase() === 'true';

export const FEATURES = {
  // Aroha AI (coach, meal plans): hidden for v1, launches in an update.
  ai: on(process.env.EXPO_PUBLIC_FEATURE_AI),
};
