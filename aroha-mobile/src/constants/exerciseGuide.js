// Where you should feel an exercise, and the few cues that matter most.
// Matched on the exercise name (first rule wins), then on its muscle group.
// Muscle keys are the regions MuscleMap draws.

const RULES = [
  [/leg press|hack squat/i, { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'], feel: 'Front of your thighs and glutes',
    cues: ['Feet shoulder-width on the platform', "Lower until your knees reach 90°, don't let your hips lift", "Push through your heels, don't lock your knees"] }],

  // ── Chest ──
  [/reverse pec|rear delt/i, { primary: ['rear_delts'], secondary: ['upper_back', 'traps'], feel: 'Back of your shoulders',
    cues: ['Lead with your elbows, not your hands', 'Squeeze your shoulder blades at the end', 'Light weight, slow and controlled'] }],
  [/fly|flyes|crossover|pec deck/i, { primary: ['chest'], secondary: ['front_delts'], feel: 'Across your chest, as your arms close',
    cues: ['Keep a soft, fixed bend in your elbows', 'Open until you feel a stretch, not pain', 'Squeeze your chest as your hands meet'] }],
  [/close-grip bench/i, { primary: ['triceps'], secondary: ['chest', 'front_delts'], feel: 'Back of your arms',
    cues: ['Hands shoulder-width, not narrower', 'Elbows tucked close to your body', 'Lock out by squeezing your triceps'] }],
  [/incline.*(press|bench)|smith machine incline/i, { primary: ['chest'], secondary: ['front_delts', 'triceps'], feel: 'Upper chest, just below your collarbones',
    cues: ['Bench at 30–45°, no steeper', 'Lower to your upper chest', 'Shoulder blades pinched back and down'] }],
  [/diamond push/i, { primary: ['triceps'], secondary: ['chest', 'front_delts'], feel: 'Back of your arms',
    cues: ['Thumbs and index fingers touch under your chest', 'Elbows brush your sides', 'Body in one straight line'] }],
  [/pike push/i, { primary: ['front_delts', 'side_delts'], secondary: ['triceps'], feel: 'Top of your shoulders',
    cues: ['Hips high, body in an upside-down V', 'Lower your head between your hands', 'Push back up through your palms'] }],
  [/bench press|chest press|push-up|pushup/i, { primary: ['chest'], secondary: ['triceps', 'front_delts'], feel: 'Middle of your chest, not your shoulders',
    cues: ['Shoulder blades pinched back and down', 'Elbows about 45° from your body', 'Control the way down, press up hard'] }],
  [/tricep dip machine/i, { primary: ['triceps'], secondary: [], feel: 'Back of your arms',
    cues: ['Elbows point straight back', 'Stay upright', 'Lock out at the bottom'] }],
  [/dip/i, { primary: ['chest', 'triceps'], secondary: ['front_delts'], feel: 'Lower chest and back of your arms',
    cues: ['Lean slightly forward for more chest', 'Lower until upper arms are parallel to the floor', 'Shoulders down, away from your ears'] }],

  // ── Back ──
  [/romanian deadlift/i, { primary: ['hamstrings', 'glutes'], secondary: ['lower_back'], feel: 'Back of your thighs, stretching',
    cues: ['Push your hips back, knees soft', 'Bar stays close to your legs', 'Flat back the whole time'] }],
  [/deadlift/i, { primary: ['glutes', 'hamstrings', 'lower_back'], secondary: ['quads', 'traps', 'forearms'], feel: 'Glutes and back of your legs',
    cues: ['Bar over mid-foot, flat back', 'Push the floor away, then drive your hips forward', "Don't round your lower back"] }],
  [/straight-arm pulldown/i, { primary: ['lats'], secondary: ['triceps'], feel: 'Sides of your back, under your armpits',
    cues: ['Arms almost straight', 'Sweep the bar down to your thighs', 'Squeeze your lats at the bottom'] }],
  [/pulldown|pull-up|chin-up|assisted pull/i, { primary: ['lats'], secondary: ['biceps', 'upper_back'], feel: 'Sides of your back, under your armpits',
    cues: ['Pull your elbows down to your ribs', 'Chest up, no swinging', 'Full stretch at the top'] }],
  [/row/i, { primary: ['lats', 'upper_back'], secondary: ['rear_delts', 'biceps'], feel: 'Middle of your back, between the shoulder blades',
    cues: ['Flat back, chest proud', 'Pull with your elbows, not your hands', 'Squeeze your shoulder blades together'] }],
  [/back extension|superman/i, { primary: ['lower_back'], secondary: ['glutes', 'hamstrings'], feel: 'Lower back',
    cues: ['Move slowly, no jerking', 'Stop when your body is straight', 'Squeeze your glutes at the top'] }],
  [/face pull/i, { primary: ['rear_delts'], secondary: ['upper_back', 'traps'], feel: 'Back of your shoulders',
    cues: ['Rope to your forehead, elbows high', 'Pull the rope apart', 'Pause and squeeze'] }],
  [/shrug/i, { primary: ['traps'], secondary: ['forearms'], feel: 'Top of your shoulders, by your neck',
    cues: ['Lift straight up toward your ears', "Don't roll your shoulders", 'Pause at the top'] }],

  // ── Shoulders ──
  [/overhead.*tricep|tricep|pushdown|skull|kickback/i, { primary: ['triceps'], secondary: [], feel: 'Back of your arms',
    cues: ['Elbows stay still', 'Only your forearms move', 'Fully straighten and squeeze'] }],
  [/lateral raise/i, { primary: ['side_delts'], secondary: ['traps'], feel: 'Outside of your shoulders',
    cues: ['Lead with your elbows', 'Raise to shoulder height, no higher', 'Light weight, no swinging'] }],
  [/front raise/i, { primary: ['front_delts'], secondary: [], feel: 'Front of your shoulders',
    cues: ['Raise to eye level', 'Arms almost straight', 'Lower slowly'] }],
  [/press|arnold/i, { primary: ['front_delts', 'side_delts'], secondary: ['triceps', 'traps'], feel: 'Front and top of your shoulders',
    cues: ['Brace your core, no arching', 'Press straight up over your head', 'Lower to chin height'] }],

  // ── Arms ──
  [/leg curl/i, { primary: ['hamstrings'], secondary: ['calves'], feel: 'Back of your thighs',
    cues: ['Hips stay down on the pad', 'Curl all the way', 'Lower slowly'] }],
  [/hammer curl/i, { primary: ['biceps', 'forearms'], secondary: [], feel: 'Outside of your upper arm and forearm',
    cues: ['Palms face each other', 'Elbows pinned to your sides', 'No swinging'] }],
  [/curl/i, { primary: ['biceps'], secondary: ['forearms'], feel: 'Front of your upper arms',
    cues: ['Elbows pinned to your sides', 'Squeeze at the top', 'Lower slowly, all the way'] }],

  // ── Legs ──
  [/leg extension/i, { primary: ['quads'], secondary: [], feel: 'Front of your thighs',
    cues: ['Knees line up with the machine pivot', 'Squeeze at the top for a second', 'Lower slowly'] }],
  [/front squat/i, { primary: ['quads'], secondary: ['glutes', 'abs'], feel: 'Front of your thighs',
    cues: ['Elbows high, chest up', 'Sit straight down', 'Knees track over your toes'] }],
  [/hip thrust|glute bridge|pull-through/i, { primary: ['glutes'], secondary: ['hamstrings'], feel: 'Glutes',
    cues: ['Drive through your heels', 'Squeeze your glutes hard at the top', "Don't over-arch your back"] }],
  [/abductor/i, { primary: ['abductors'], secondary: ['glutes'], feel: 'Outside of your hips',
    cues: ['Sit tall', 'Push out slowly', 'Control the return'] }],
  [/adductor/i, { primary: ['adductors'], secondary: [], feel: 'Inner thighs',
    cues: ['Sit tall', 'Squeeze in slowly', 'Control the return'] }],
  [/calf/i, { primary: ['calves'], secondary: [], feel: 'Calves',
    cues: ['Full stretch at the bottom', 'Rise onto the balls of your feet', 'Pause at the top'] }],
  [/squat|leg press|lunge|step|stair/i, { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'], feel: 'Front of your thighs and glutes',
    cues: ['Knees track over your toes', 'Weight through your mid-foot and heels', 'Chest up, back neutral'] }],

  // ── Core ──
  [/side plank/i, { primary: ['obliques'], secondary: ['abs', 'abductors'], feel: 'Side of your waist',
    cues: ['Body in one straight line', 'Hips lifted, not sagging', 'Breathe steadily'] }],
  [/plank/i, { primary: ['abs'], secondary: ['obliques', 'front_delts'], feel: 'Your whole core',
    cues: ['Body in one straight line', 'Squeeze your glutes', "Don't let your hips sag"] }],
  [/russian twist|woodchopper|seated twist/i, { primary: ['obliques'], secondary: ['abs'], feel: 'Sides of your waist',
    cues: ['Turn from your ribs, not your arms', 'Keep your chest up', 'Control both directions'] }],
  [/leg raise/i, { primary: ['abs', 'hip_flexors'], secondary: [], feel: 'Lower abs',
    cues: ['Lower back stays down', 'Lift with your abs, not momentum', 'Lower slowly'] }],
  [/crunch|ab wheel|rollout/i, { primary: ['abs'], secondary: ['obliques'], feel: 'Front of your stomach',
    cues: ['Curl your ribs toward your hips', 'Exhale as you crunch', "Don't pull on your neck"] }],

  // ── Cardio ──
  [/mountain climber/i, { primary: ['abs', 'hip_flexors'], secondary: ['front_delts', 'quads'], feel: 'Core and shoulders',
    cues: ['Hands under your shoulders', 'Drive your knees fast', 'Hips level'] }],
  [/burpee|jumping jack|high knee|skipping/i, { primary: ['quads', 'calves'], secondary: ['abs', 'front_delts'], feel: 'Legs and lungs',
    cues: ['Land softly', 'Keep a steady rhythm', 'Breathe out on effort'] }],

  // ── Yoga and stretches ──
  [/downward dog/i, { primary: ['hamstrings', 'calves'], secondary: ['front_delts', 'lats'], feel: 'Stretch along the back of your legs',
    cues: ['Hips up and back', 'Heels reach toward the floor', 'Push the floor away'] }],
  [/cobra|cat-cow/i, { primary: ['lower_back'], secondary: ['abs'], feel: 'Gentle stretch through your spine',
    cues: ['Move with your breath', 'Shoulders away from your ears', 'No pain in the lower back'] }],
  [/warrior|tree pose/i, { primary: ['quads', 'glutes'], secondary: ['abductors', 'abs'], feel: 'Legs and balance',
    cues: ['Front knee over your ankle', 'Hips square', 'Steady breathing'] }],
  [/surya namaskar/i, { primary: ['hamstrings', 'front_delts'], secondary: ['abs', 'quads', 'lower_back'], feel: 'Whole body, flowing',
    cues: ['Inhale to lift, exhale to fold', 'Move smoothly between poses', 'Go at your own pace'] }],
  [/hip flexor/i, { primary: ['hip_flexors'], secondary: ['quads'], feel: 'Front of your hip',
    cues: ['Tuck your pelvis under', 'Lean forward gently', 'Hold and breathe'] }],
  [/hamstring stretch/i, { primary: ['hamstrings'], secondary: [], feel: 'Back of your thighs',
    cues: ['Hinge from your hips', 'Keep your back long', 'No bouncing'] }],
  [/shoulder stretch/i, { primary: ['rear_delts'], secondary: ['upper_back'], feel: 'Back of your shoulder',
    cues: ['Pull your arm across gently', 'Shoulders down', 'Hold and breathe'] }],
  [/neck roll/i, { primary: ['traps'], secondary: [], feel: 'Sides and back of your neck',
    cues: ['Slow, small circles', 'Never force it', 'Both directions'] }],
];

const BY_GROUP = {
  chest:     { primary: ['chest'], secondary: ['triceps', 'front_delts'], feel: 'Chest' },
  back:      { primary: ['lats', 'upper_back'], secondary: ['biceps'], feel: 'Back' },
  shoulders: { primary: ['front_delts', 'side_delts'], secondary: ['triceps'], feel: 'Shoulders' },
  arms:      { primary: ['biceps', 'triceps'], secondary: ['forearms'], feel: 'Arms' },
  legs:      { primary: ['quads', 'glutes'], secondary: ['hamstrings'], feel: 'Legs' },
  core:      { primary: ['abs'], secondary: ['obliques'], feel: 'Core' },
  cardio:    { primary: ['quads', 'calves'], secondary: ['abs'], feel: 'Legs and lungs' },
  full_body: { primary: ['quads', 'chest', 'lats'], secondary: ['abs', 'glutes'], feel: 'Whole body' },
};

const GENERAL_CUES = ['Control every rep', 'Breathe out on the hard part', 'Stop if anything feels sharp'];

export function guideFor(exercise) {
  const name = exercise?.name || '';
  const hit = RULES.find(([re]) => re.test(name));
  if (hit) return hit[1];
  const group = BY_GROUP[(exercise?.muscleGroup || '').toLowerCase()];
  if (group) return { ...group, cues: GENERAL_CUES };
  return null;
}
