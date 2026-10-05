import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Chip from '../ui/Chip';
import Field from '../ui/Field';
import PrimaryButton from '../ui/PrimaryButton';
import AnimatedPressable from '../AnimatedPressable';
import client from '../../api/client';
import {
  ALL_GOALS, GENDERS, ACTIVITY_LEVELS, EXPERIENCE_LEVELS, DIET_PREFS,
  LOSS_SPEEDS, GAIN_SPEEDS, LOSS_GOALS, GAIN_GOALS,
} from '../../constants/profile';
import { Palette, Fonts, Type, Spacing, Radius } from '../../constants/theme';
import { tap, success, warn } from '../../utils/haptics';

function cmToFtIn(cm) {
  const totalInches = cm / 2.54;
  return { feet: String(Math.floor(totalInches / 12)), inches: String(Math.round(totalInches % 12)) };
}

function initialForm(profile) {
  const storedCm = profile?.heightCm ?? '';
  const ftIn = storedCm ? cmToFtIn(storedCm) : { feet: '', inches: '' };
  return {
    gender:            profile?.gender ?? '',
    age:               String(profile?.age ?? ''),
    weightKg:          String(profile?.weightKg ?? ''),
    targetWeightKg:    String(profile?.targetWeightKg ?? ''),
    heightCm:          String(storedCm),
    feet:              ftIn.feet,
    inches:            ftIn.inches,
    activityLevel:     profile?.activityLevel ?? '',
    healthGoal:        profile?.healthGoal ?? '',
    weightChangeSpeed: profile?.weightChangeSpeed ?? '',
    experienceLevel:   profile?.experienceLevel ?? '',
    dietaryPreference: profile?.dietaryPreference ?? '',
    waterGoalGlasses:  String(profile?.waterGoalGlasses ?? '8'),
  };
}

// All onboarding fields, editable. Saving PATCHes /profile, which recomputes macro targets.
export default function EditProfileForm({ profile, onSaved }) {
  const [form, setForm]             = useState(() => initialForm(profile));
  const [heightUnit, setHeightUnit] = useState('cm');
  const [saving, setSaving]         = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  function getHeightCm() {
    if (heightUnit === 'cm') return parseFloat(form.heightCm);
    const f = parseFloat(form.feet) || 0;
    const i = parseFloat(form.inches) || 0;
    return Math.round((f * 30.48 + i * 2.54) * 10) / 10;
  }

  async function save() {
    const heightCm = getHeightCm();
    if (!form.gender)        { Alert.alert('Gender needed', 'Pick the option that fits you.'); return; }
    if (!form.age || !form.weightKg || !heightCm) { Alert.alert('Missing details', 'Fill in age, weight and height.'); return; }
    if (isNaN(heightCm) || heightCm < 50) { Alert.alert('Check your height', 'Height must be at least 50 cm.'); return; }
    if (!form.activityLevel) { Alert.alert('Activity level needed', 'Pick how active you are.'); return; }
    if (!form.healthGoal)    { Alert.alert('Goal needed', 'Pick your main health goal.'); return; }

    setSaving(true);
    try {
      const payload = {
        gender:           form.gender,
        age:              parseInt(form.age, 10),
        weightKg:         parseFloat(form.weightKg),
        heightCm,
        activityLevel:    form.activityLevel,
        healthGoal:       form.healthGoal,
        waterGoalGlasses: parseInt(form.waterGoalGlasses, 10) || 8,
      };
      if (form.targetWeightKg)    payload.targetWeightKg    = parseFloat(form.targetWeightKg);
      if (form.weightChangeSpeed) payload.weightChangeSpeed = form.weightChangeSpeed;
      if (form.experienceLevel)   payload.experienceLevel   = form.experienceLevel;
      if (form.dietaryPreference) payload.dietaryPreference = form.dietaryPreference;

      const { data } = await client.patch('/profile', payload);
      success();
      onSaved(data);
    } catch {
      warn();
      Alert.alert("Couldn't save profile", 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  const isLoss = LOSS_GOALS.has(form.healthGoal);
  const isGain = GAIN_GOALS.has(form.healthGoal);
  const speedOptions = isLoss ? LOSS_SPEEDS : GAIN_SPEEDS;

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Section title="Body">
        <Text style={styles.fieldLabel}>Gender</Text>
        <View style={styles.wrap}>
          {GENDERS.map(g => <Chip key={g.key} label={g.label} selected={form.gender === g.key} onPress={() => set('gender', g.key)} capitalize={false} />)}
        </View>
        <View style={styles.pair}>
          <Field label="Age" value={form.age} onChangeText={v => set('age', v)} keyboardType="number-pad" placeholder="22" style={styles.flex1} right={<Text style={styles.unit}>yrs</Text>} />
          <Field label="Weight" value={form.weightKg} onChangeText={v => set('weightKg', v)} keyboardType="decimal-pad" placeholder="70" style={styles.flex1} right={<Text style={styles.unit}>kg</Text>} />
        </View>
        <View style={styles.heightHead}>
          <Text style={styles.fieldLabel}>Height</Text>
          <View style={styles.unitToggle}>
            {['cm', 'ft'].map(u => (
              <AnimatedPressable key={u} onPress={() => { tap(); setHeightUnit(u); }} style={[styles.unitBtn, heightUnit === u && styles.unitBtnOn]} scaleTo={0.94}>
                <Text style={[styles.unitBtnText, heightUnit === u && styles.unitBtnTextOn]}>{u === 'cm' ? 'cm' : 'ft / in'}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>
        {heightUnit === 'cm' ? (
          <Field value={form.heightCm} onChangeText={v => set('heightCm', v)} keyboardType="decimal-pad" placeholder="175" right={<Text style={styles.unit}>cm</Text>} />
        ) : (
          <View style={styles.pair}>
            <Field value={form.feet} onChangeText={v => set('feet', v)} keyboardType="number-pad" placeholder="5" style={styles.flex1} right={<Text style={styles.unit}>ft</Text>} />
            <Field value={form.inches} onChangeText={v => set('inches', v)} keyboardType="number-pad" placeholder="9" style={styles.flex1} right={<Text style={styles.unit}>in</Text>} />
          </View>
        )}
      </Section>

      <Section title="Activity level">
        {ACTIVITY_LEVELS.map(a => (
          <Option key={a.key} label={a.label} sub={a.sub} selected={form.activityLevel === a.key} onPress={() => set('activityLevel', a.key)} />
        ))}
      </Section>

      <Section title="Main goal">
        <View style={styles.goalGrid}>
          {Object.entries(ALL_GOALS).map(([key, { label, color }]) => {
            const sel = form.healthGoal === key;
            return (
              <AnimatedPressable
                key={key}
                containerStyle={styles.goalSlot}
                style={[styles.goal, sel && { borderColor: color, backgroundColor: color + '14' }]}
                scaleTo={0.96}
                onPress={() => { tap(); setForm(f => ({ ...f, healthGoal: key, weightChangeSpeed: '' })); }}
                accessibilityState={{ selected: sel }}
              >
                <View style={[styles.goalDot, { backgroundColor: color }]} />
                <Text style={[styles.goalText, sel && { color: Palette.text }]}>{label}</Text>
              </AnimatedPressable>
            );
          })}
        </View>
        {(isLoss || isGain) && (
          <Field
            label="Target weight (optional)"
            value={form.targetWeightKg}
            onChangeText={v => set('targetWeightKg', v)}
            keyboardType="decimal-pad"
            placeholder={isLoss ? '65' : '80'}
            right={<Text style={styles.unit}>kg</Text>}
          />
        )}
      </Section>

      {(isLoss || isGain) && (
        <Section title="Pace">
          {speedOptions.map(s => (
            <Option key={s.key} label={s.label} sub={s.sub} selected={form.weightChangeSpeed === s.key} onPress={() => set('weightChangeSpeed', s.key)} />
          ))}
        </Section>
      )}

      <Section title="Preferences">
        <Text style={styles.fieldLabel}>Training experience</Text>
        <View style={styles.wrap}>
          {EXPERIENCE_LEVELS.map(e => (
            <Chip key={e.key} label={e.label} sublabel={e.sub} selected={form.experienceLevel === e.key} onPress={() => set('experienceLevel', e.key)} containerStyle={styles.flex1} capitalize={false} />
          ))}
        </View>
        <Text style={styles.fieldLabel}>Diet</Text>
        <View style={styles.wrap}>
          {DIET_PREFS.map(d => <Chip key={d.key} label={d.label} selected={form.dietaryPreference === d.key} onPress={() => set('dietaryPreference', d.key)} capitalize={false} />)}
        </View>
        <Field label="Daily water goal" value={form.waterGoalGlasses} onChangeText={v => set('waterGoalGlasses', v)} keyboardType="number-pad" placeholder="8" right={<Text style={styles.unit}>glasses</Text>} />
      </Section>

      <Text style={styles.note}>Saving recalculates your daily calorie and macro targets.</Text>
      <PrimaryButton title={saving ? 'Saving…' : 'Save changes'} icon="checkmark" onPress={() => !saving && save()} style={saving && { opacity: 0.6 }} />
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Option({ label, sub, selected, onPress }) {
  return (
    <AnimatedPressable
      onPress={() => { tap(); onPress(); }}
      scaleTo={0.98}
      style={[styles.option, selected && styles.optionOn]}
      accessibilityState={{ selected: !!selected }}
    >
      <View style={styles.flex1}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionSub}>{sub}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && <Ionicons name="checkmark" size={12} color={Palette.onIvory} />}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  body:         { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.xl },
  flex1:        { flex: 1 },
  section:      { gap: Spacing.sm + 2 },
  sectionTitle: { ...Type.label, color: Palette.textSub },
  fieldLabel:   { ...Type.label, color: Palette.textSub, marginTop: Spacing.xs },
  wrap:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pair:         { flexDirection: 'row', gap: Spacing.sm },
  unit:         { fontFamily: Fonts.bodySemi, fontSize: 12, color: Palette.textSub },

  heightHead:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  unitToggle:    { flexDirection: 'row', backgroundColor: Palette.surface2, borderRadius: Radius.sm + 2, borderWidth: 1, borderColor: Palette.lineSoft, padding: 2 },
  unitBtn:       { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.sm },
  unitBtnOn:     { backgroundColor: 'rgba(255,255,255,0.1)' },
  unitBtnText:   { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.textDim },
  unitBtnTextOn: { color: Palette.text },

  option:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.surface, borderRadius: Radius.md + 2, borderWidth: 1, borderColor: Palette.lineSoft, padding: Spacing.md + 2 },
  optionOn:    { borderColor: Palette.text, backgroundColor: Palette.surface2 },
  optionLabel: { ...Type.bodyB, color: Palette.text },
  optionSub:   { ...Type.small, color: Palette.textSub, marginTop: 1 },
  radio:       { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Palette.textDim, alignItems: 'center', justifyContent: 'center' },
  radioOn:     { backgroundColor: Palette.ivory, borderColor: Palette.ivory },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  goalSlot: { width: '48%', flexGrow: 1 },
  goal:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Palette.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  goalDot:  { width: 8, height: 8, borderRadius: 3 },
  goalText: { ...Type.small, fontFamily: Fonts.bodyBold, color: Palette.textSub, flexShrink: 1 },

  note: { ...Type.small, color: Palette.textSub, textAlign: 'center', marginBottom: -Spacing.sm },
});
