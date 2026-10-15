import { Palette } from './theme';

// What each number on the Body screen means, shown from its ⓘ button.
export const BODY_INFO = {
  bmi: {
    title: 'BMI',
    what: 'Body mass index: your weight compared with your height.',
    formula: 'weight (kg) ÷ height (m)²',
    ranges: [
      ['Under 18.5', 'Underweight'],
      ['18.5 – 22.9', 'Normal'],
      ['23 – 24.9', 'Overweight'],
      ['25 and up', 'Obese'],
    ],
    caveat: 'Aroha uses the Asia-Pacific cut-offs: health risk starts at a lower BMI for South Asian bodies. BMI can\'t tell muscle from fat, so a muscular lifter can read "overweight". Body fat % says more.',
  },
  bodyFat: {
    title: 'Body fat %',
    what: 'How much of your weight is fat. The rest is muscle, bone, organs and water.',
    formula: 'U.S. Navy tape method: men use waist, neck and height; women also add hips.',
    ranges: [
      ['Men 6–13 · Women 14–20', 'Athletic'],
      ['Men 14–17 · Women 21–24', 'Fit'],
      ['Men 18–24 · Women 25–31', 'Average'],
      ['Men 25+ · Women 32+', 'High'],
    ],
    caveat: 'An estimate, usually within 3–4% of a lab scan. Measure the same way each time and watch the trend, not one reading.',
  },
  leanMass: {
    title: 'Lean mass',
    what: 'Everything that isn\'t fat: muscle, bone, organs and water.',
    formula: 'weight × (1 − body fat %)',
    caveat: 'When you bulk, you want this to climb faster than fat mass.',
  },
  fatMass: {
    title: 'Fat mass',
    what: 'The kilograms of your weight that are fat.',
    formula: 'weight × body fat %',
    caveat: 'On a cut, this should fall while lean mass holds steady.',
  },
  waistToHeight: {
    title: 'Waist-to-height',
    what: 'Waist size compared with height. A strong sign of belly fat, the kind linked to heart disease and diabetes.',
    formula: 'waist (cm) ÷ height (cm)',
    ranges: [
      ['Under 0.5', 'Healthy'],
      ['0.5 – 0.59', 'Increased risk'],
      ['0.6 and up', 'High risk'],
    ],
    caveat: 'Simple rule: keep your waist under half your height.',
  },
  waistToHip: {
    title: 'Waist-to-hip',
    what: 'Waist compared with hips: where you carry fat.',
    formula: 'waist (cm) ÷ hip (cm)',
    ranges: [
      ['Men under 0.90', 'Healthy'],
      ['Women under 0.85', 'Healthy'],
    ],
    caveat: 'Above these (WHO) limits, fat sits mostly around the belly.',
  },
  bmr: {
    title: 'BMR',
    what: 'Basal metabolic rate: the calories your body burns at complete rest, just to keep you alive.',
    formula: 'Mifflin-St Jeor: 10 × kg + 6.25 × cm − 5 × age, + 5 (men) or − 161 (women)',
    caveat: 'Eating below this for long periods costs muscle and energy.',
  },
  tdee: {
    title: 'TDEE',
    what: 'Total daily energy expenditure: BMR plus everything you do in a day (walking, training, digesting).',
    formula: 'BMR × activity factor (1.2 desk job → 1.9 athlete)',
    caveat: 'Eat this much and your weight holds steady. If your weight moves when it shouldn\'t, your real TDEE is a little different: adjust by 100–200 kcal.',
  },
  balance: {
    title: 'Surplus or deficit',
    what: 'Your daily calorie target minus your TDEE.',
    formula: 'calorie target − TDEE',
    ranges: [
      ['+200 to +300', 'Lean bulk'],
      ['about 0', 'Maintain'],
      ['−300 to −500', 'Steady cut'],
    ],
    caveat: 'Bigger surpluses mostly add fat; bigger deficits cost muscle.',
  },
  pace: {
    title: 'Weekly pace',
    what: 'How fast your weight is moving, from the trend line through your last four weeks of weigh-ins, so one heavy morning doesn\'t skew it.',
    formula: 'slope of your weigh-ins × 7 days',
    ranges: [
      ['+0.1 to +0.25% a week', 'Lean bulk'],
      ['±0.1% a week', 'Maintain'],
      ['−0.5 to −1% a week', 'Fat loss'],
    ],
    caveat: 'Needs at least two weigh-ins a week apart. Weigh in after waking, after the toilet, before food.',
  },
};

// Tape measurements: what to measure and how.
export const MEASUREMENTS = [
  { key: 'waistCm',    label: 'Waist',     tip: 'Around your belly button. Relax, breathe out, don\'t suck in.' },
  { key: 'neckCm',     label: 'Neck',      tip: 'Just below the Adam\'s apple, tape sloping slightly down to the front.' },
  { key: 'hipCm',      label: 'Hips',      tip: 'Around the widest part of your buttocks, feet together.' },
  { key: 'chestCm',    label: 'Chest',     tip: 'Across the nipples, arms down, after a normal breath out.' },
  { key: 'armCm',      label: 'Arm',       tip: 'Biceps flexed, around the thickest part.' },
  { key: 'shoulderCm', label: 'Shoulders', tip: 'Around the widest part of both shoulders, arms relaxed.' },
  { key: 'thighCm',    label: 'Thigh',     tip: 'Standing, around the thickest part below the glutes.' },
];

const COLORS = {
  Normal: Palette.success, Healthy: Palette.success, Athletic: Palette.success, Fit: Palette.success, 'On track': Palette.success,
  Slim: Palette.water, Underweight: Palette.water, Essential: Palette.water, Average: Palette.water,
  'Too slow': Palette.water,
  Overweight: Palette.kcal, 'Increased risk': Palette.kcal, 'Too fast': Palette.kcal, Gaining: Palette.kcal, Losing: Palette.kcal,
  Obese: Palette.danger, 'High risk': Palette.danger, High: Palette.danger,
};

// Colour for a category or pace label; anything else stays muted.
export function categoryColor(label) {
  return COLORS[label] ?? Palette.textSub;
}
