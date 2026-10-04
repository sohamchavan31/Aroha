// Legacy palette, remapped onto the Aroha signature (matte) tokens in theme.js.
// Screens not yet redesigned still read from here, so they pick up the new look.
// Keep every value a 6-digit hex: screens append alpha suffixes like `+ '22'`.
const Colors = {
  background: '#0B0A10',
  card: '#14121B',
  cardBorder: '#26232F',
  accentGold: '#C4A46A',
  accentPurple: '#8B6CF6',
  accentPurpleLight: '#A78BFA',
  text: '#F3F1F8',
  textSub: '#9B97AD',
  textMuted: '#5F5B70',
  success: '#4ADE80',
  tabBar: '#1C1926',
  tabBarBorder: '#26232F',
  rankE: '#7B2FBE',
  rankD: '#2E86AB',
  rankC: '#27AE60',
  rankB: '#E2B714',
  rankA: '#E67E22',
  rankS: '#E74C3C',
};

export default Colors;
