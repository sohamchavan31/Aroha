// Aroha signature design kit — matte, dark, calm.
// Rules: brass only for stage/EP, ivory only for the primary action,
// no gradients or glows on controls, every gap a multiple of 4.

const Palette = {
  ink:       '#0B0A10', // app background
  surface:   '#14121B', // cards
  surface2:  '#1C1926', // raised: inputs, tab bar, icon buttons
  hero:      '#17141F', // stage card
  line:      '#26232F', // hairline borders
  lineSoft:  'rgba(255,255,255,0.07)',
  track:     'rgba(255,255,255,0.08)',

  text:      '#F3F1F8',
  textSub:   '#9B97AD',
  textDim:   '#5F5B70',

  brass:     '#C4A46A', // stage, EP — nothing else
  ivory:     '#EBE7DE', // primary action — nothing else
  onIvory:   '#14121B',
  violet:    '#8B6CF6', // completed states

  kcal:      '#F5A524',
  protein:   '#A78BFA',
  carbs:     '#4FD1C5',
  fat:       '#F472B6',
  water:     '#60A5FA',
  success:   '#4ADE80',
  danger:    '#F87171',
};

// Font family names registered in App.js via useFonts.
const Fonts = {
  display:  'Unbounded_600SemiBold',     // brand, stage names, screen titles
  num:      'BarlowCondensed_700Bold',   // every number
  numHeavy: 'BarlowCondensed_800ExtraBold',
  body:     'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyHeavy:'Manrope_800ExtraBold',
};

const Type = {
  hero:    { fontFamily: Fonts.numHeavy, fontSize: 56, lineHeight: 58 },
  stat:    { fontFamily: Fonts.num, fontSize: 22, lineHeight: 24 },
  statSm:  { fontFamily: Fonts.num, fontSize: 16, lineHeight: 18 },
  stage:   { fontFamily: Fonts.display, fontSize: 20, letterSpacing: 0.8 },
  title:   { fontFamily: Fonts.display, fontSize: 18 },
  h2:      { fontFamily: Fonts.bodyHeavy, fontSize: 18 },
  body:    { fontFamily: Fonts.body, fontSize: 14, lineHeight: 20 },
  bodyB:   { fontFamily: Fonts.bodyBold, fontSize: 14, lineHeight: 20 },
  small:   { fontFamily: Fonts.body, fontSize: 12, lineHeight: 16 },
  label:   { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' },
};

const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 40,
};

const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 999,
};

// Shadows stay neutral and soft — never coloured glows.
const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  }),
};

const Motion = {
  fast: 150,
  base: 250,
  slow: 400,
  ring: 900,
  stagger: 60,
};

export { Palette, Fonts, Type, Spacing, Radius, Shadow, Motion };
