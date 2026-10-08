import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import IconButton from '../components/ui/IconButton';
import PrimaryButton from '../components/ui/PrimaryButton';
import SegmentBar from '../components/ui/SegmentBar';
import Segmented from '../components/ui/Segmented';
import WheelPicker from '../components/ui/WheelPicker';
import AnimatedPressable from '../components/AnimatedPressable';
import FormError from '../components/auth/FormError';
import { ALL_GOALS, LOSS_SPEEDS, GAIN_SPEEDS, LOSS_GOALS, GAIN_GOALS } from '../constants/profile';
import { Palette, Fonts, Type, Spacing, Radius, Motion } from '../constants/theme';
import { apiError } from '../utils/apiError';
import { tap, success, warn } from '../utils/haptics';

// ── Options ─────────────────────────────────────────────────────────────────
const GENDERS = [
  { key: 'male',              label: 'Male',              icon: 'male-outline' },
  { key: 'female',            label: 'Female',            icon: 'female-outline' },
  { key: 'prefer_not_to_say', label: 'Prefer not to say', icon: 'person-outline' },
];

const ACTIVITY = [
  { key: 'sedentary',         label: 'Mostly sitting',     sub: 'Desk job, little exercise',       icon: 'desktop-outline' },
  { key: 'lightly_active',    label: 'Lightly active',     sub: 'Exercise 1–3 days a week',        icon: 'walk-outline' },
  { key: 'moderately_active', label: 'Moderately active',  sub: 'Exercise 3–5 days a week',        icon: 'bicycle-outline' },
  { key: 'very_active',       label: 'Very active',        sub: 'Hard training 6–7 days a week',   icon: 'barbell-outline' },
  { key: 'athlete',           label: 'Athlete',            sub: 'Twice a day, or a physical job',  icon: 'trophy-outline' },
];

const GOALS = [
  { key: 'lose_weight',         sub: 'Eat in a deficit and burn fat',       icon: 'trending-down-outline' },
  { key: 'reduce_body_fat',     sub: 'Lose fat, keep your muscle',          icon: 'body-outline' },
  { key: 'gain_muscle',         sub: 'Small surplus, build muscle',         icon: 'barbell-outline' },
  { key: 'gain_weight',         sub: 'Put on healthy weight',               icon: 'trending-up-outline' },
  { key: 'increase_strength',   sub: 'Lift heavier, perform better',        icon: 'fitness-outline' },
  { key: 'general_fitness',     sub: 'Feel better day to day',              icon: 'heart-outline' },
  { key: 'maintain',            sub: 'Stay where you are',                  icon: 'checkmark-circle-outline' },
  { key: 'endurance',           sub: 'Build stamina and cardio',            icon: 'pulse-outline' },
  { key: 'improve_flexibility', sub: 'Move freely, less stiffness',         icon: 'accessibility-outline' },
].map(g => ({ ...g, label: ALL_GOALS[g.key].label, color: ALL_GOALS[g.key].color }));

const EXPERIENCE = [
  { key: 'beginner',     label: 'Beginner',     sub: 'Less than a year of training', icon: 'leaf-outline' },
  { key: 'intermediate', label: 'Intermediate', sub: '1–3 years, fairly consistent',  icon: 'flame-outline' },
  { key: 'advanced',     label: 'Advanced',     sub: '3+ years of serious training',  icon: 'trophy-outline' },
];

const DIETS = [
  { key: 'vegetarian',     label: 'Vegetarian',     sub: 'No meat, fish or egg', icon: 'leaf-outline' },
  { key: 'eggetarian',     label: 'Eggetarian',     sub: 'Vegetarian plus eggs', icon: 'egg-outline' },
  { key: 'non_vegetarian', label: 'Non-vegetarian', sub: 'Everything',           icon: 'restaurant-outline' },
  { key: 'vegan',          label: 'Vegan',          sub: 'No animal products',   icon: 'flower-outline' },
  { key: 'jain',           label: 'Jain',           sub: 'No root vegetables',   icon: 'hand-left-outline' },
];

// Expected weekly change for each pace, from the kcal delta (≈ 7700 kcal per kg).
const PACE_KCAL = { slow_cut: 200, moderate_cut: 400, aggressive_cut: 600, slow_bulk: 150, lean_bulk: 250, aggressive_bulk: 400 };
const kgPerWeek = pace => (PACE_KCAL[pace] || 0) * 7 / 7700;

// ── Small pieces ────────────────────────────────────────────────────────────
function Option({ item, selected, onPress, color }) {
  const tint = color || item.color || Palette.text;
  return (
    <AnimatedPressable
      scaleTo={0.98}
      onPress={onPress}
      style={[styles.option, selected && styles.optionOn]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      {!!item.icon && (
        <View style={[styles.optionIcon, { backgroundColor: tint + '1F' }]}>
          <Ionicons name={item.icon} size={19} color={tint} />
        </View>
      )}
      <View style={styles.flex}>
        <Text style={styles.optionLabel}>{item.label}</Text>
        {!!item.sub && <Text style={styles.optionSub}>{item.sub}</Text>}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && <Ionicons name="checkmark" size={13} color={Palette.onIvory} />}
      </View>
    </AnimatedPressable>
  );
}

function Row({ label, value, first }) {
  return (
    <View style={[styles.row, !first && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────
export default function OnboardingScreen({ onComplete }) {
  const { token, user, login } = useAuth();
  const firstName = (user?.name || '').trim().split(/\s+/)[0];

  const [gender, setGender]       = useState('');
  const [age, setAge]             = useState(25);
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightCm, setHeightCm]   = useState(170);
  const [weight, setWeight]       = useState(70);
  const [activity, setActivity]   = useState('');
  const [goal, setGoal]           = useState('');
  const [target, setTarget]       = useState(null);
  const [pace, setPace]           = useState('');
  const [experience, setExperience] = useState('');
  const [diet, setDiet]           = useState('');
  const [water, setWater]         = useState(8);

  const [index, setIndex]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [plan, setPlan]     = useState(null);   // profile returned by PATCH /profile

  const isLoss = LOSS_GOALS.has(goal);
  const isGain = GAIN_GOALS.has(goal);

  // Height in ft / in is edited as two steppers but stored in cm.
  const totalIn = Math.round(heightCm / 2.54);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn % 12;
  const setFtIn = (f, i) => setHeightCm(Math.round((f * 12 + i) * 2.54));

  const steps = useMemo(() => [
    'gender', 'age', 'height', 'weight', 'activity', 'goal',
    ...(isLoss || isGain ? ['target'] : []),
    'experience', 'diet', 'water', 'review',
  ], [isLoss, isGain]);
  const step = plan ? 'plan' : steps[Math.min(index, steps.length - 1)];

  // Fade + slide each new question in.
  const enter = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: Motion.base, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [step, enter]);

  // Default the target 5 kg in the goal's direction when the goal changes.
  useEffect(() => {
    if (isLoss) { setTarget(Math.max(30, Math.round(weight - 5))); setPace('moderate_cut'); }
    else if (isGain) { setTarget(Math.min(250, Math.round(weight + 5))); setPace('lean_bulk'); }
    else { setTarget(null); setPace(''); }
  }, [goal]); // eslint-disable-line react-hooks/exhaustive-deps

  function stepError() {
    switch (step) {
      case 'gender':     return gender ? '' : 'Pick one to continue.';
      case 'activity':   return activity ? '' : 'Pick your activity level.';
      case 'goal':       return goal ? '' : 'Pick a goal.';
      case 'experience': return experience ? '' : 'Pick your experience level.';
      case 'diet':       return diet ? '' : 'Pick how you eat.';
      case 'target':
        if (isLoss && target >= weight) return 'Your target should be below your current weight.';
        if (isGain && target <= weight) return 'Your target should be above your current weight.';
        return pace ? '' : 'Pick a pace.';
      default: return '';
    }
  }

  function next() {
    const e = stepError();
    if (e) { warn(); setError(e); return; }
    setError('');
    if (step === 'review') { save(); return; }
    setIndex(i => Math.min(i + 1, steps.length - 1));
  }

  function back() {
    setError('');
    if (plan) { setPlan(null); return; }
    setIndex(i => Math.max(0, i - 1));
  }

  // Single-choice questions move on by themselves after a short beat.
  function pick(setter, value) {
    tap();
    setter(value);
    setError('');
    setTimeout(() => setIndex(i => Math.min(i + 1, steps.length - 1)), 220);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        gender, age, weightKg: weight, heightCm,
        activityLevel: activity, healthGoal: goal,
        experienceLevel: experience, dietaryPreference: diet,
        waterGoalGlasses: water,
      };
      if (target != null && (isLoss || isGain)) payload.targetWeightKg = target;
      if (pace) payload.weightChangeSpeed = pace;
      const { data } = await client.patch('/profile', payload);
      setPlan(data);
      success();
    } catch (err) {
      warn();
      setError(apiError(err, 'Could not save your profile. Try again.'));
    } finally {
      setSaving(false);
    }
  }

  async function start() {
    tap();
    await login(token, {
      ...user,
      profileComplete: true,
      waterGoalGlasses: water,
      evolutionStage: plan?.evolutionStage ?? user?.evolutionStage,
      evolutionPoints: plan?.evolutionPoints ?? user?.evolutionPoints,
    });
    onComplete?.();
  }

  const paces = isLoss ? LOSS_SPEEDS : GAIN_SPEEDS;
  const weeks = target != null && pace ? Math.ceil(Math.abs(weight - target) / kgPerWeek(pace)) : null;
  const label = (list, key) => list.find(o => o.key === key)?.label ?? '';

  // ── Question bodies ──────────────────────────────────────────────────────
  const Q = {
    gender: {
      title: firstName ? `Hi ${firstName}. Let's set up your plan.` : "Let's set up your plan.",
      sub: 'A few quick questions so your calories and macros fit you. First, your sex for the calorie maths.',
      body: <View style={styles.list}>{GENDERS.map(g => <Option key={g.key} item={g} selected={gender === g.key} onPress={() => pick(setGender, g.key)} />)}</View>,
    },
    age: {
      title: 'How old are you?',
      sub: 'Your metabolism slows a little with age.',
      body: (
        <>
          <View style={styles.wheel}><WheelPicker value={age} onChange={setAge} min={13} max={100} unit="years" /></View>
        </>
      ),
    },
    height: {
      title: 'How tall are you?',
      sub: 'Used with your weight for BMR and BMI.',
      body: (
        <>
          <Segmented options={[{ key: 'cm', label: 'cm' }, { key: 'ft', label: 'ft / in' }]} value={heightUnit} onChange={setHeightUnit} style={styles.unitSwitch} />
          <View style={styles.wheel}>
            {heightUnit === 'cm'
              ? <WheelPicker value={heightCm} onChange={setHeightCm} min={120} max={230} unit="cm" />
              : <View style={styles.wheelPair}>
                  <WheelPicker value={ft} onChange={f => setFtIn(f, inch)} min={4} max={7} unit="ft" wholeWidth={56} />
                  <WheelPicker value={inch} onChange={i => setFtIn(ft, i)} min={0} max={11} unit="in" wholeWidth={56} />
                </View>}
          </View>
          <Text style={styles.wheelNote}>{heightUnit === 'cm' ? `${ft}′${inch}″` : `${heightCm} cm`}</Text>
        </>
      ),
    },
    weight: {
      title: 'What do you weigh?',
      sub: 'Your weight today. You can log new weigh-ins any time.',
      body: (
        <>
          <View style={styles.wheel}><WheelPicker value={weight} onChange={setWeight} min={30} max={250} decimals={1} unit="kg" /></View>
          <Text style={styles.wheelNote}>BMI {(weight / Math.pow(heightCm / 100, 2)).toFixed(1)}</Text>
        </>
      ),
    },
    activity: {
      title: 'How active is a normal week?',
      sub: 'Not counting what you plan to do. Be honest; it sets your daily burn.',
      body: <View style={styles.list}>{ACTIVITY.map(a => <Option key={a.key} item={a} color={Palette.carbs} selected={activity === a.key} onPress={() => pick(setActivity, a.key)} />)}</View>,
    },
    goal: {
      title: "What's your main goal?",
      sub: 'Your calories, protein, carbs and fat are built around this.',
      body: <View style={styles.list}>{GOALS.map(g => <Option key={g.key} item={g} selected={goal === g.key} onPress={() => pick(setGoal, g.key)} />)}</View>,
    },
    target: {
      title: isLoss ? 'Where do you want to get to?' : 'How much do you want to gain?',
      sub: 'Pick a target and a pace. A steady pace is easier to stick to.',
      body: (
        <>
          <View style={styles.targetRow}>
            <View style={styles.targetFrom}>
              <Text style={styles.label}>Now</Text>
              <Text style={styles.targetNow}>{weight}<Text style={styles.bigUnit}> kg</Text></Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={Palette.textDim} style={{ marginTop: 18 }} />
            <View style={styles.flex}>
              <WheelPicker label="Target" value={target ?? weight} onChange={setTarget} min={30} max={250} decimals={1} unit="kg" wholeWidth={72} />
            </View>
          </View>
          <Text style={[styles.label, styles.section]}>Pace</Text>
          <View style={styles.list}>
            {paces.map(p => (
              <Option key={p.key} color={isLoss ? Palette.kcal : Palette.success}
                item={{ ...p, sub: `${p.sub} · about ${kgPerWeek(p.key).toFixed(2)} kg a week` }}
                selected={pace === p.key}
                onPress={() => { tap(); setPace(p.key); setError(''); }} />
            ))}
          </View>
          {!!weeks && weeks < 520 && <Text style={styles.hint}>At this pace you'd reach {target} kg in about {weeks} weeks.</Text>}
        </>
      ),
    },
    experience: {
      title: 'How long have you been training?',
      sub: 'Sets the sets, reps and rest in your generated workouts.',
      body: <View style={styles.list}>{EXPERIENCE.map(e => <Option key={e.key} item={e} color={Palette.protein} selected={experience === e.key} onPress={() => pick(setExperience, e.key)} />)}</View>,
    },
    diet: {
      title: 'How do you eat?',
      sub: 'Your AI meal plans will stick to this.',
      body: <View style={styles.list}>{DIETS.map(d => <Option key={d.key} item={d} color={Palette.success} selected={diet === d.key} onPress={() => pick(setDiet, d.key)} />)}</View>,
    },
    water: {
      title: 'How much water a day?',
      sub: 'One glass is about 250 ml. Most adults do well with 8–10.',
      body: (
        <>
          <View style={styles.wheel}><WheelPicker value={water} onChange={setWater} min={4} max={20} unit="glasses" /></View>
          <Text style={styles.wheelNote}>about {(water * 0.25).toFixed(1)} litres</Text>
          <View style={styles.chips}>
            {[6, 8, 10, 12].map(n => <Chip key={n} label={`${n}`} selected={water === n} color={Palette.water} onPress={() => setWater(n)} />)}
          </View>
        </>
      ),
    },
    review: {
      title: 'All set. Look right?',
      sub: 'Tap a row to change it.',
      body: (
        <Card style={styles.review}>
          {[
            ['gender', 'Sex', label(GENDERS, gender)],
            ['age', 'Age', `${age} years`],
            ['height', 'Height', `${heightCm} cm`],
            ['weight', 'Weight', `${weight} kg`],
            ['activity', 'Activity', label(ACTIVITY, activity)],
            ['goal', 'Goal', label(GOALS, goal)],
            ...(isLoss || isGain ? [['target', 'Target', `${target} kg · ${label(paces, pace).toLowerCase()}`]] : []),
            ['experience', 'Experience', label(EXPERIENCE, experience)],
            ['diet', 'Diet', label(DIETS, diet)],
            ['water', 'Water', `${water} glasses`],
          ].map(([key, k, v], i) => (
            <AnimatedPressable key={key} scaleTo={0.99} onPress={() => { tap(); setIndex(steps.indexOf(key)); }}
              style={[styles.row, i > 0 && styles.rowDivider]} accessibilityRole="button" accessibilityLabel={`Change ${k}`}>
              <Text style={styles.rowLabel}>{k}</Text>
              <Text style={styles.rowValue}>{v}</Text>
              <Ionicons name="chevron-forward" size={14} color={Palette.textDim} />
            </AnimatedPressable>
          ))}
        </Card>
      ),
    },
  };

  // ── Result: the calculated plan from the backend ────────────────────────
  function PlanView() {
    const kcal = plan.dailyCalorieGoal || 0;
    const macros = [
      { key: 'Protein', g: plan.dailyProteinGoal || 0, per: 4, color: Palette.protein },
      { key: 'Carbs',   g: plan.dailyCarbGoal || 0,    per: 4, color: Palette.carbs },
      { key: 'Fat',     g: plan.dailyFatGoal || 0,     per: 9, color: Palette.fat },
    ];
    const diff = plan.tdee ? kcal - plan.tdee : 0;
    return (
      <>
        <Card variant="hero" style={styles.planHero}>
          <Text style={styles.label}>Daily target</Text>
          <Text style={styles.planKcal}>{kcal.toLocaleString('en-IN')}<Text style={styles.planUnit}> kcal</Text></Text>
          {!!plan.tdee && (
            <Text style={styles.planWhy}>
              You burn about {plan.tdee.toLocaleString('en-IN')} kcal a day.{' '}
              {diff < 0 ? `Eating ${Math.abs(diff)} less` : diff > 0 ? `Eating ${diff} more` : 'Eating the same'} gets you to your goal.
            </Text>
          )}
          <View style={styles.split}>
            {macros.map(m => (
              <View key={m.key} style={{ flex: Math.max(1, m.g * m.per), height: 6, borderRadius: 3, backgroundColor: m.color }} />
            ))}
          </View>
          <View style={styles.macroRow}>
            {macros.map(m => (
              <View key={m.key} style={styles.macro}>
                <Text style={[styles.macroNum, { color: m.color }]}>{m.g}g</Text>
                <Text style={styles.macroLabel}>{m.key}</Text>
              </View>
            ))}
          </View>
        </Card>
        <Card style={styles.review}>
          {!!plan.bmi && <Row first label="BMI" value={`${plan.bmi} · ${plan.bmiCategory}`} />}
          <Row first={!plan.bmi} label="Water" value={`${plan.waterGoalGlasses} glasses a day`} />
          {plan.targetWeightKg != null && (isLoss || isGain) && <Row label="Target" value={`${plan.targetWeightKg} kg${weeks ? ` · ~${weeks} weeks` : ''}`} />}
        </Card>
        <Text style={styles.hint}>You can change any of this later in Profile → Edit, and your targets are recalculated.</Text>
        <View style={styles.disclaimer} accessibilityRole="text">
          <Ionicons name="medkit-outline" size={16} color={Palette.textSub} />
          <Text style={styles.disclaimerText}>
            These targets are estimates for healthy adults, not medical advice. If you are pregnant, have a medical condition or take regular medication, check with a doctor before changing your diet or training.
          </Text>
        </View>
      </>
    );
  }

  const q = Q[step];
  const position = plan ? steps.length : index + 1;
  const showBack = plan || index > 0;
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />

      <View style={styles.header}>
        {showBack
          ? <IconButton name="chevron-back" onPress={back} accessibilityLabel="Back" />
          : <View style={styles.headerSpacer} />}
        <View style={styles.progress}>
          <SegmentBar progress={position / steps.length} segments={steps.length} color={Palette.text} height={4} />
        </View>
        <Text style={styles.count}>{plan ? 'Done' : `${position}/${steps.length}`}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: enter, transform: [{ translateY }] }}>
          <Text style={styles.title}>{plan ? 'Your plan is ready' : q.title}</Text>
          <Text style={styles.sub}>{plan ? `Built from your answers${firstName ? `, ${firstName}` : ''}. This is what a day looks like.` : q.sub}</Text>
          <View style={styles.body}>{plan ? <PlanView /> : q.body}</View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <FormError message={error} />
        {plan
          ? <PrimaryButton title="Start my journey" icon="flash" onPress={start} />
          : <PrimaryButton
              title={step === 'review' ? (saving ? 'Calculating…' : 'Calculate my plan') : 'Continue'}
              icon={step === 'review' ? 'calculator-outline' : 'arrow-forward'}
              onPress={next}
            />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ink },
  flex: { flex: 1 },

  header:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  headerSpacer: { width: 38, height: 38 },
  progress:     { flex: 1 },
  count:        { fontFamily: Fonts.num, fontSize: 14, color: Palette.textSub, minWidth: 34, textAlign: 'right' },

  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  title:   { fontFamily: Fonts.display, fontSize: 24, lineHeight: 32, color: Palette.text },
  sub:     { ...Type.body, fontSize: 15, lineHeight: 22, color: Palette.textSub, marginTop: Spacing.sm },
  body:    { marginTop: Spacing.xl },
  label:   { ...Type.label, color: Palette.textSub },
  section: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
  hint:    { ...Type.small, color: Palette.textDim, marginTop: Spacing.md, lineHeight: 18 },
  disclaimer:     { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.line },
  disclaimerText: { ...Type.small, color: Palette.textSub, lineHeight: 18, flex: 1 },

  list:        { gap: Spacing.sm },
  option:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.lineSoft, borderRadius: Radius.md + 2, paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.md },
  optionOn:    { borderColor: Palette.text + '66', backgroundColor: Palette.surface2 },
  optionIcon:  { width: 38, height: 38, borderRadius: Radius.sm + 4, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { ...Type.bodyB, fontSize: 15, color: Palette.text },
  optionSub:   { ...Type.small, color: Palette.textSub, marginTop: 2 },
  radio:       { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Palette.textDim, alignItems: 'center', justifyContent: 'center' },
  radioOn:     { backgroundColor: Palette.ivory, borderColor: Palette.ivory },

  bigUnit:   { fontFamily: Fonts.bodySemi, fontSize: 16, color: Palette.textSub },
  wheel:     { marginTop: Spacing.lg },
  wheelPair: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg },
  wheelNote: { ...Type.small, color: Palette.textSub, textAlign: 'center', marginTop: Spacing.md },
  unitSwitch:{ alignSelf: 'center', width: 180 },
  chips:     { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg },

  targetRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  targetFrom: { width: 76 },
  targetNow:  { fontFamily: Fonts.numHeavy, fontSize: 30, color: Palette.textSub, marginTop: Spacing.sm },

  review:     { paddingVertical: 0, paddingHorizontal: Spacing.lg },
  row:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md + 1 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  rowLabel:   { ...Type.body, fontSize: 14, color: Palette.textSub, flex: 1 },
  rowValue:   { ...Type.bodyB, fontSize: 14, color: Palette.text, textAlign: 'right', flexShrink: 1 },

  planHero:  { marginBottom: Spacing.md },
  planKcal:  { fontFamily: Fonts.numHeavy, fontSize: 56, lineHeight: 62, color: Palette.kcal, marginTop: Spacing.xs },
  planUnit:  { fontFamily: Fonts.bodySemi, fontSize: 15, color: Palette.textSub },
  planWhy:   { ...Type.small, fontSize: 13, lineHeight: 19, color: Palette.textSub, marginTop: Spacing.xs },
  split:     { flexDirection: 'row', gap: 3, marginTop: Spacing.lg },
  macroRow:  { flexDirection: 'row', marginTop: Spacing.md },
  macro:     { flex: 1 },
  macroNum:  { fontFamily: Fonts.numHeavy, fontSize: 26 },
  macroLabel:{ ...Type.small, color: Palette.textSub },

  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.lg, gap: Spacing.md, borderTopWidth: 1, borderTopColor: Palette.lineSoft },
});
