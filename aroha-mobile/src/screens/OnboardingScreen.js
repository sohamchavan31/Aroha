import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const GENDERS = [
  { key: 'male',   label: 'Male',            icon: 'male-outline' },
  { key: 'female', label: 'Female',          icon: 'female-outline' },
  { key: 'other',  label: 'Prefer not to say', icon: 'person-outline' },
];

const ACTIVITY_LEVELS = [
  { key: 'sedentary',         label: 'Sedentary',         desc: 'Little to no exercise',               icon: 'bed-outline',     color: '#95A5A6' },
  { key: 'lightly_active',    label: 'Lightly Active',    desc: 'Light exercise 1–3 days/week',        icon: 'walk-outline',    color: '#3498DB' },
  { key: 'moderately_active', label: 'Moderately Active', desc: 'Moderate exercise 3–5 days/week',     icon: 'bicycle-outline', color: '#2ECC71' },
  { key: 'very_active',       label: 'Very Active',       desc: 'Hard exercise 6–7 days/week',         icon: 'barbell-outline', color: '#E67E22' },
  { key: 'athlete',           label: 'Athlete',           desc: 'Twice daily training or physical job',icon: 'trophy-outline',  color: Colors.accentGold },
];

const HEALTH_GOALS = [
  { key: 'lose_weight',         label: 'Lose Weight',            desc: 'Calorie deficit, burn fat',                 icon: 'trending-down-outline',    color: '#E74C3C' },
  { key: 'reduce_body_fat',     label: 'Reduce Body Fat %',      desc: 'Lower fat %, preserve muscle',              icon: 'body-outline',             color: '#E74C3C' },
  { key: 'gain_muscle',         label: 'Gain Muscle Mass',       desc: 'Calorie surplus, build muscle',             icon: 'barbell-outline',          color: '#E67E22' },
  { key: 'gain_weight',         label: 'Gain Weight',            desc: 'Increase overall body weight',              icon: 'trending-up-outline',      color: '#F39C12' },
  { key: 'increase_strength',   label: 'Increase Strength',      desc: 'Get stronger, improve performance',         icon: 'fitness-outline',          color: '#9B59B6' },
  { key: 'general_fitness',     label: 'General Fitness',        desc: 'Improve overall health & wellbeing',        icon: 'heart-outline',            color: '#2ECC71' },
  { key: 'maintain',            label: 'Maintain Weight',        desc: 'Eat at maintenance calories',               icon: 'checkmark-circle-outline', color: '#3498DB' },
  { key: 'endurance',           label: 'Improve Endurance',      desc: 'Build stamina & cardiovascular fitness',    icon: 'pulse-outline',            color: '#1ABC9C' },
  { key: 'improve_flexibility', label: 'Flexibility & Mobility', desc: 'Reduce stiffness, improve range of motion', icon: 'body-outline',             color: '#2E86AB' },
];

const LOSS_SPEEDS = [
  { key: 'slow_cut',       label: 'Slow Cut',       desc: '−200 kcal/day · ~0.2 kg/week',  color: '#3498DB' },
  { key: 'moderate_cut',   label: 'Moderate Cut',   desc: '−400 kcal/day · ~0.4 kg/week',  color: '#E67E22' },
  { key: 'aggressive_cut', label: 'Aggressive Cut', desc: '−600 kcal/day · ~0.6 kg/week',  color: '#E74C3C' },
];

const GAIN_SPEEDS = [
  { key: 'slow_bulk',       label: 'Slow Bulk',       desc: '+150 kcal/day · minimal fat gain', color: '#3498DB' },
  { key: 'lean_bulk',       label: 'Lean Bulk',       desc: '+250 kcal/day · balanced gain',    color: '#2ECC71' },
  { key: 'aggressive_bulk', label: 'Aggressive Bulk', desc: '+400 kcal/day · max muscle gain',  color: '#E67E22' },
];

const EXPERIENCE_LEVELS = [
  { key: 'beginner',     label: 'Beginner',     desc: 'Less than 1 year of training',    icon: 'leaf-outline',    color: '#2ECC71' },
  { key: 'intermediate', label: 'Intermediate', desc: '1–3 years of consistent training',icon: 'flame-outline',   color: '#E67E22' },
  { key: 'advanced',     label: 'Advanced',     desc: '3+ years of serious training',    icon: 'trophy-outline',  color: Colors.accentGold },
];

const DIETARY_PREFS = [
  { key: 'non_vegetarian', label: 'Non-Vegetarian', icon: 'restaurant-outline' },
  { key: 'vegetarian',     label: 'Vegetarian',     icon: 'leaf-outline' },
  { key: 'eggetarian',     label: 'Eggetarian',     icon: 'egg-outline' },
  { key: 'vegan',          label: 'Vegan',          icon: 'flower-outline' },
  { key: 'jain',           label: 'Jain',           icon: 'hand-left-outline' },
];

const WATER_GOALS = [6, 7, 8, 10, 12];
const TOTAL_STEPS = 5;

const LOSS_GOALS = new Set(['lose_weight', 'reduce_body_fat']);
const GAIN_GOALS = new Set(['gain_muscle', 'gain_weight']);

export default function OnboardingScreen({ onComplete }) {
  const { token, user, login } = useAuth();
  const [step, setStep]             = useState(1);

  // Step 1
  const [gender, setGender]         = useState('');
  const [age, setAge]               = useState('');
  const [weight, setWeight]         = useState('');
  const [height, setHeight]         = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [feet, setFeet]             = useState('');
  const [inches, setInches]         = useState('');

  // Step 2
  const [activityLevel, setActivityLevel] = useState('');

  // Step 3
  const [healthGoal, setHealthGoal] = useState('');

  // Step 4
  const [targetWeight, setTargetWeight]         = useState('');
  const [weightChangeSpeed, setWeightChangeSpeed] = useState('');
  const [experienceLevel, setExperienceLevel]   = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('');

  // Step 5
  const [waterGoal, setWaterGoal]   = useState(8);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function getHeightCm() {
    if (heightUnit === 'cm') return parseFloat(height);
    const f = parseFloat(feet) || 0;
    const i = parseFloat(inches) || 0;
    return Math.round((f * 30.48 + i * 2.54) * 10) / 10;
  }

  const needsSpeed  = LOSS_GOALS.has(healthGoal) || GAIN_GOALS.has(healthGoal);
  const speedOptions = LOSS_GOALS.has(healthGoal) ? LOSS_SPEEDS : GAIN_SPEEDS;

  function nextStep() {
    setError('');
    if (step === 1) {
      if (!gender) { setError('Please select your gender.'); return; }
      if (!age || !weight) { setError('Fill in age and weight.'); return; }
      if (heightUnit === 'cm' && !height) { setError('Fill in your height.'); return; }
      if (heightUnit === 'ft' && !feet) { setError('Fill in your height in feet.'); return; }
      const hCm = getHeightCm();
      if (isNaN(parseFloat(age)) || isNaN(parseFloat(weight)) || !hCm || isNaN(hCm) || hCm < 50) {
        setError('Check your values — height must be at least 50 cm.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!activityLevel) { setError('Select your activity level.'); return; }
      setStep(3);
    } else if (step === 3) {
      if (!healthGoal) { setError('Pick a goal.'); return; }
      // Reset speed if goal type changed
      setWeightChangeSpeed('');
      setStep(4);
    } else if (step === 4) {
      if (needsSpeed && !weightChangeSpeed) { setError('Choose your pace.'); return; }
      if (!experienceLevel) { setError('Select your experience level.'); return; }
      if (!dietaryPreference) { setError('Select your dietary preference.'); return; }
      setStep(5);
    }
  }

  async function finish() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        gender,
        age:              parseInt(age),
        weightKg:         parseFloat(weight),
        heightCm:         getHeightCm(),
        activityLevel,
        healthGoal,
        experienceLevel,
        dietaryPreference,
        waterGoalGlasses: waterGoal,
      };
      if (targetWeight) payload.targetWeightKg = parseFloat(targetWeight);
      if (weightChangeSpeed) payload.weightChangeSpeed = weightChangeSpeed;

      await client.patch('/profile', payload);
      await login(token, { ...user, profileComplete: true, waterGoalGlasses: waterGoal });
      onComplete();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const goalObj     = HEALTH_GOALS.find(g => g.key === healthGoal);
  const activityObj = ACTIVITY_LEVELS.find(a => a.key === activityLevel);
  const speedObj    = [...LOSS_SPEEDS, ...GAIN_SPEEDS].find(s => s.key === weightChangeSpeed);
  const expObj      = EXPERIENCE_LEVELS.find(e => e.key === experienceLevel);
  const dietObj     = DIETARY_PREFS.find(d => d.key === dietaryPreference);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Progress dots */}
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
          <View key={s} style={[styles.dot, step >= s && styles.dotActive]} />
        ))}
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Step 1: Body Stats ── */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Your Body Stats</Text>
            <Text style={styles.stepSub}>Used to calculate your personalised BMR and daily calorie needs.</Text>

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.genderBtn, gender === g.key && styles.genderBtnActive]}
                  onPress={() => setGender(g.key)}
                  activeOpacity={0.7}>
                  <Ionicons name={g.icon} size={22} color={gender === g.key ? Colors.background : Colors.textSub} />
                  <Text style={[styles.genderLabel, gender === g.key && styles.genderLabelActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} placeholder="e.g. 22" placeholderTextColor={Colors.textMuted}
              value={age} onChangeText={setAge} keyboardType="numeric" />

            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.input} placeholder="e.g. 70" placeholderTextColor={Colors.textMuted}
              value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />

            <View style={styles.heightHeader}>
              <Text style={styles.label}>Height</Text>
              <View style={styles.unitToggle}>
                <TouchableOpacity style={[styles.unitBtn, heightUnit === 'cm' && styles.unitBtnActive]} onPress={() => setHeightUnit('cm')}>
                  <Text style={[styles.unitBtnText, heightUnit === 'cm' && styles.unitBtnTextActive]}>cm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.unitBtn, heightUnit === 'ft' && styles.unitBtnActive]} onPress={() => setHeightUnit('ft')}>
                  <Text style={[styles.unitBtnText, heightUnit === 'ft' && styles.unitBtnTextActive]}>ft / in</Text>
                </TouchableOpacity>
              </View>
            </View>
            {heightUnit === 'cm' ? (
              <TextInput style={styles.input} placeholder="e.g. 175" placeholderTextColor={Colors.textMuted}
                value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
            ) : (
              <View style={styles.ftRow}>
                <TextInput style={[styles.input, styles.ftInput]} placeholder="5" placeholderTextColor={Colors.textMuted}
                  value={feet} onChangeText={setFeet} keyboardType="numeric" />
                <Text style={styles.ftLabel}>ft</Text>
                <TextInput style={[styles.input, styles.ftInput]} placeholder="9" placeholderTextColor={Colors.textMuted}
                  value={inches} onChangeText={setInches} keyboardType="numeric" />
                <Text style={styles.ftLabel}>in</Text>
              </View>
            )}
          </>
        )}

        {/* ── Step 2: Activity Level ── */}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Activity Level</Text>
            <Text style={styles.stepSub}>How active are you on a typical week? This sets your TDEE multiplier.</Text>
            {ACTIVITY_LEVELS.map(a => (
              <TouchableOpacity key={a.key}
                style={[styles.optionCard, activityLevel === a.key && { borderColor: a.color, backgroundColor: a.color + '15' }]}
                onPress={() => setActivityLevel(a.key)} activeOpacity={0.7}>
                <View style={[styles.optionIcon, { backgroundColor: a.color + '22' }]}>
                  <Ionicons name={a.icon} size={22} color={a.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, activityLevel === a.key && { color: a.color }]}>{a.label}</Text>
                  <Text style={styles.optionDesc}>{a.desc}</Text>
                </View>
                {activityLevel === a.key && <Ionicons name="checkmark-circle" size={20} color={a.color} />}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── Step 3: Health Goal ── */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Your Health Goal</Text>
            <Text style={styles.stepSub}>We'll calculate your calories, protein, carbs and fat around this.</Text>
            {HEALTH_GOALS.map(g => (
              <TouchableOpacity key={g.key}
                style={[styles.optionCard, healthGoal === g.key && { borderColor: g.color, backgroundColor: g.color + '15' }]}
                onPress={() => setHealthGoal(g.key)} activeOpacity={0.7}>
                <View style={[styles.optionIcon, { backgroundColor: g.color + '22' }]}>
                  <Ionicons name={g.icon} size={22} color={g.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, healthGoal === g.key && { color: g.color }]}>{g.label}</Text>
                  <Text style={styles.optionDesc}>{g.desc}</Text>
                </View>
                {healthGoal === g.key && <Ionicons name="checkmark-circle" size={20} color={g.color} />}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── Step 4: Target Weight + Speed + Experience + Diet ── */}
        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>Your Preferences</Text>
            <Text style={styles.stepSub}>Help us personalise your meal plans and workout recommendations.</Text>

            {/* Target weight — for gain/loss goals */}
            {(LOSS_GOALS.has(healthGoal) || GAIN_GOALS.has(healthGoal)) && (
              <>
                <Text style={styles.label}>
                  Target Weight (kg) <Text style={styles.labelOptional}>optional</Text>
                </Text>
                <View style={styles.targetWeightRow}>
                  <View style={styles.targetWeightCurrent}>
                    <Text style={styles.targetWeightSub}>Current</Text>
                    <Text style={styles.targetWeightVal}>{weight} kg</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color={Colors.textMuted} />
                  <TextInput
                    style={[styles.input, styles.targetWeightInput]}
                    placeholder={GAIN_GOALS.has(healthGoal) ? 'e.g. 80' : 'e.g. 65'}
                    placeholderTextColor={Colors.textMuted}
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    keyboardType="decimal-pad"
                  />
                </View>
              </>
            )}

            {/* Speed — for gain/loss goals only */}
            {needsSpeed && (
              <>
                <Text style={styles.label}>
                  {LOSS_GOALS.has(healthGoal) ? 'Weight Loss Pace' : 'Muscle Gain Pace'}
                </Text>
                {speedOptions.map(s => (
                  <TouchableOpacity key={s.key}
                    style={[styles.speedCard, weightChangeSpeed === s.key && { borderColor: s.color, backgroundColor: s.color + '18' }]}
                    onPress={() => setWeightChangeSpeed(s.key)} activeOpacity={0.7}>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, weightChangeSpeed === s.key && { color: s.color }]}>{s.label}</Text>
                      <Text style={styles.optionDesc}>{s.desc}</Text>
                    </View>
                    {weightChangeSpeed === s.key && <Ionicons name="checkmark-circle" size={20} color={s.color} />}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Experience level */}
            <Text style={styles.label}>Workout Experience</Text>
            {EXPERIENCE_LEVELS.map(e => (
              <TouchableOpacity key={e.key}
                style={[styles.optionCard, experienceLevel === e.key && { borderColor: e.color, backgroundColor: e.color + '15' }]}
                onPress={() => setExperienceLevel(e.key)} activeOpacity={0.7}>
                <View style={[styles.optionIcon, { backgroundColor: e.color + '22' }]}>
                  <Ionicons name={e.icon} size={22} color={e.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, experienceLevel === e.key && { color: e.color }]}>{e.label}</Text>
                  <Text style={styles.optionDesc}>{e.desc}</Text>
                </View>
                {experienceLevel === e.key && <Ionicons name="checkmark-circle" size={20} color={e.color} />}
              </TouchableOpacity>
            ))}

            {/* Dietary preference */}
            <Text style={[styles.label, { marginTop: 8 }]}>Dietary Preference</Text>
            <View style={styles.dietRow}>
              {DIETARY_PREFS.map(d => (
                <TouchableOpacity key={d.key}
                  style={[styles.dietChip, dietaryPreference === d.key && styles.dietChipActive]}
                  onPress={() => setDietaryPreference(d.key)} activeOpacity={0.7}>
                  <Ionicons name={d.icon} size={16} color={dietaryPreference === d.key ? Colors.background : Colors.accentGold} />
                  <Text style={[styles.dietChipText, dietaryPreference === d.key && styles.dietChipTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Step 5: Water + Summary ── */}
        {step === 5 && (
          <>
            <Text style={styles.stepTitle}>Daily Water Goal</Text>
            <Text style={styles.stepSub}>How many glasses of water do you aim to drink each day?</Text>

            <View style={styles.waterOptions}>
              {WATER_GOALS.map(g => (
                <TouchableOpacity key={g}
                  style={[styles.waterChip, waterGoal === g && styles.waterChipActive]}
                  onPress={() => setWaterGoal(g)}>
                  <Ionicons name="water" size={14} color={waterGoal === g ? Colors.background : '#2E86AB'} />
                  <Text style={[styles.waterChipText, waterGoal === g && styles.waterChipTextActive]}>{g} glasses</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Profile</Text>
              {[
                ['Gender',   GENDERS.find(g => g.key === gender)?.label],
                ['Age',      `${age} years`],
                ['Weight',   `${weight} kg${targetWeight ? `  →  ${targetWeight} kg` : ''}`],
                ['Height',   `${getHeightCm()} cm`],
                ['Activity', activityObj?.label],
                ['Goal',     goalObj?.label],
                speedObj ? ['Pace', speedObj.label] : null,
                ['Experience', expObj?.label],
                ['Diet',     dietObj?.label],
                ['Water',    `${waterGoal} glasses/day`],
              ].filter(Boolean).map(([k, v], i, arr) => (
                <View key={k} style={[styles.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.summaryKey}>{k}</Text>
                  <Text style={styles.summaryVal}>{v}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step < TOTAL_STEPS ? (
          <TouchableOpacity style={styles.nextBtn} onPress={nextStep} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.background} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, saving && { opacity: 0.6 }]}
            onPress={finish}
            disabled={saving}
            activeOpacity={0.8}>
            {saving
              ? <ActivityIndicator color={Colors.background} />
              : <>
                  <Text style={styles.nextBtnText}>Begin Your Evolution</Text>
                  <Ionicons name="flash" size={18} color={Colors.background} />
                </>
            }
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.background },
  dots:  { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 20, paddingBottom: 8 },
  dot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cardBorder },
  dotActive: { backgroundColor: Colors.accentGold, width: 24 },
  scroll: { flex: 1, paddingHorizontal: 24 },

  stepTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 24, marginBottom: 8 },
  stepSub:   { fontSize: 14, color: Colors.textSub, marginBottom: 28, lineHeight: 20 },
  label:     { fontSize: 13, color: Colors.textSub, fontWeight: '600', marginBottom: 8 },
  labelOptional: { fontWeight: '400', color: Colors.textMuted, fontSize: 12 },
  input:     { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 12, padding: 14, color: Colors.text, fontSize: 16, marginBottom: 18 },

  genderRow:        { flexDirection: 'row', gap: 10, marginBottom: 18 },
  genderBtn:        { flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.cardBorder, gap: 6 },
  genderBtnActive:  { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  genderLabel:      { fontSize: 12, fontWeight: '600', color: Colors.textSub, textAlign: 'center' },
  genderLabelActive:{ color: Colors.background },

  optionCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.cardBorder, padding: 14, marginBottom: 10, gap: 12 },
  optionIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionText:  { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  optionDesc:  { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },

  speedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.cardBorder, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, gap: 12 },

  targetWeightRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  targetWeightCurrent:{ alignItems: 'center' },
  targetWeightSub:    { fontSize: 10, color: Colors.textMuted, marginBottom: 2 },
  targetWeightVal:    { fontSize: 16, fontWeight: '700', color: Colors.textSub },
  targetWeightInput:  { flex: 1, marginBottom: 0 },

  dietRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  dietChip:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.accentGold + '66', backgroundColor: Colors.card },
  dietChipActive:  { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  dietChipText:    { fontSize: 13, color: Colors.accentGold, fontWeight: '600' },
  dietChipTextActive: { color: Colors.background },

  heightHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  unitToggle:       { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  unitBtn:          { paddingHorizontal: 12, paddingVertical: 5 },
  unitBtnActive:    { backgroundColor: Colors.accentGold },
  unitBtnText:      { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  unitBtnTextActive:{ color: Colors.background },
  ftRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  ftInput: { flex: 1, marginBottom: 0 },
  ftLabel: { fontSize: 15, color: Colors.textSub, fontWeight: '600' },

  waterOptions:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  waterChip:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#2E86AB', backgroundColor: Colors.card },
  waterChipActive:    { backgroundColor: '#2E86AB', borderColor: '#2E86AB' },
  waterChipText:      { fontSize: 13, color: '#2E86AB', fontWeight: '600' },
  waterChipTextActive:{ color: Colors.background },

  summaryCard:  { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 16, marginBottom: 20 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  summaryKey:   { fontSize: 13, color: Colors.textSub },
  summaryVal:   { fontSize: 13, color: Colors.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  error:       { color: '#E74C3C', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  nextBtn:     { flexDirection: 'row', backgroundColor: Colors.accentGold, borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: Colors.background },
});
