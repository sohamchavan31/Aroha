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

const HEALTH_GOALS = [
  { key: 'lose_weight',         label: 'Lose Weight',         icon: 'trending-down-outline', color: '#E74C3C' },
  { key: 'gain_muscle',         label: 'Gain Muscle',         icon: 'barbell-outline',       color: '#E67E22' },
  { key: 'stay_fit',            label: 'Stay Fit',            icon: 'heart-outline',         color: '#2ECC71' },
  { key: 'improve_flexibility', label: 'Improve Flexibility', icon: 'body-outline',          color: '#2E86AB' },
];

const WATER_GOALS = [6, 7, 8, 10, 12];

export default function OnboardingScreen({ onComplete }) {
  const { token, user, login } = useAuth();
  const [step, setStep]         = useState(1);
  const [age, setAge]           = useState('');
  const [weight, setWeight]     = useState('');
  const [height, setHeight]     = useState('');
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' or 'ft'
  const [feet, setFeet]         = useState('');
  const [inches, setInches]     = useState('');
  const [healthGoal, setHealthGoal] = useState('');
  const [waterGoal, setWaterGoal]   = useState(8);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  function getHeightCm() {
    if (heightUnit === 'cm') return parseFloat(height);
    const f = parseFloat(feet) || 0;
    const i = parseFloat(inches) || 0;
    return Math.round((f * 30.48 + i * 2.54) * 10) / 10;
  }

  function nextStep() {
    setError('');
    if (step === 1) {
      const heightCm = getHeightCm();
      if (!age || !weight) { setError('Fill in all fields.'); return; }
      if (heightUnit === 'cm' && !height) { setError('Fill in your height.'); return; }
      if (heightUnit === 'ft' && !feet) { setError('Fill in your height in feet.'); return; }
      if (isNaN(parseFloat(age)) || isNaN(parseFloat(weight)) || !heightCm || isNaN(heightCm) || heightCm < 50) {
        setError('Check your values — height must be at least 50 cm.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!healthGoal) { setError('Pick a goal.'); return; }
      setStep(3);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      const { data } = await client.patch('/profile', {
        age: parseInt(age),
        weightKg: parseFloat(weight),
        heightCm: getHeightCm(),
        healthGoal,
        waterGoalGlasses: waterGoal,
      });
      await login(token, {
        ...user,
        profileComplete: true,
        waterGoalGlasses: waterGoal,
      });
      onComplete();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not save.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Progress dots */}
      <View style={styles.dots}>
        {[1, 2, 3].map(s => (
          <View key={s} style={[styles.dot, step === s && styles.dotActive]} />
        ))}
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Your Body Stats</Text>
            <Text style={styles.stepSub}>Helps us calculate your BMI and daily calorie needs.</Text>

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 22"
              placeholderTextColor={Colors.textMuted}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 70"
              placeholderTextColor={Colors.textMuted}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />

            {/* Height with unit toggle */}
            <View style={styles.heightHeader}>
              <Text style={styles.label}>Height</Text>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitBtn, heightUnit === 'cm' && styles.unitBtnActive]}
                  onPress={() => setHeightUnit('cm')}
                >
                  <Text style={[styles.unitBtnText, heightUnit === 'cm' && styles.unitBtnTextActive]}>cm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitBtn, heightUnit === 'ft' && styles.unitBtnActive]}
                  onPress={() => setHeightUnit('ft')}
                >
                  <Text style={[styles.unitBtnText, heightUnit === 'ft' && styles.unitBtnTextActive]}>ft / in</Text>
                </TouchableOpacity>
              </View>
            </View>

            {heightUnit === 'cm' ? (
              <TextInput
                style={styles.input}
                placeholder="e.g. 175"
                placeholderTextColor={Colors.textMuted}
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
              />
            ) : (
              <View style={styles.ftRow}>
                <TextInput
                  style={[styles.input, styles.ftInput]}
                  placeholder="5"
                  placeholderTextColor={Colors.textMuted}
                  value={feet}
                  onChangeText={setFeet}
                  keyboardType="numeric"
                />
                <Text style={styles.ftLabel}>ft</Text>
                <TextInput
                  style={[styles.input, styles.ftInput]}
                  placeholder="9"
                  placeholderTextColor={Colors.textMuted}
                  value={inches}
                  onChangeText={setInches}
                  keyboardType="numeric"
                />
                <Text style={styles.ftLabel}>in</Text>
              </View>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Your Health Goal</Text>
            <Text style={styles.stepSub}>We'll tailor your missions and meal plans around this.</Text>

            {HEALTH_GOALS.map(g => (
              <TouchableOpacity
                key={g.key}
                style={[styles.goalCard, healthGoal === g.key && { borderColor: g.color, backgroundColor: g.color + '15' }]}
                onPress={() => setHealthGoal(g.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.goalIcon, { backgroundColor: g.color + '22' }]}>
                  <Ionicons name={g.icon} size={24} color={g.color} />
                </View>
                <Text style={[styles.goalLabel, healthGoal === g.key && { color: g.color }]}>{g.label}</Text>
                {healthGoal === g.key && (
                  <Ionicons name="checkmark-circle" size={20} color={g.color} />
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Daily Water Goal</Text>
            <Text style={styles.stepSub}>How many glasses of water do you aim to drink each day?</Text>

            <View style={styles.waterOptions}>
              {WATER_GOALS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.waterChip, waterGoal === g && styles.waterChipActive]}
                  onPress={() => setWaterGoal(g)}
                >
                  <Ionicons name="water" size={14} color={waterGoal === g ? Colors.background : '#2E86AB'} />
                  <Text style={[styles.waterChipText, waterGoal === g && styles.waterChipTextActive]}>
                    {g} glasses
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Profile</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Age</Text>
                <Text style={styles.summaryVal}>{age} years</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Weight</Text>
                <Text style={styles.summaryVal}>{weight} kg</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Height</Text>
                <Text style={styles.summaryVal}>{getHeightCm() || '—'} cm</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Goal</Text>
                <Text style={styles.summaryVal}>{HEALTH_GOALS.find(g => g.key === healthGoal)?.label}</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryKey}>Water</Text>
                <Text style={styles.summaryVal}>{waterGoal} glasses/day</Text>
              </View>
            </View>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step < 3 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={nextStep} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.background} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, saving && { opacity: 0.6 }]}
            onPress={finish}
            disabled={saving}
            activeOpacity={0.8}
          >
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
  safe: { flex: 1, backgroundColor: Colors.background },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 20, paddingBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cardBorder },
  dotActive: { backgroundColor: Colors.accentGold, width: 24 },
  scroll: { flex: 1, paddingHorizontal: 24 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 24, marginBottom: 8 },
  stepSub: { fontSize: 14, color: Colors.textSub, marginBottom: 28, lineHeight: 20 },
  label: { fontSize: 13, color: Colors.textSub, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 12, padding: 14, color: Colors.text, fontSize: 16, marginBottom: 18 },
  goalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.cardBorder, padding: 16, marginBottom: 10, gap: 14 },
  goalIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  waterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  waterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#2E86AB', backgroundColor: Colors.card },
  waterChipActive: { backgroundColor: '#2E86AB', borderColor: '#2E86AB' },
  waterChipText: { fontSize: 13, color: '#2E86AB', fontWeight: '600' },
  waterChipTextActive: { color: Colors.background },
  summaryCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 16, marginBottom: 20 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  summaryKey: { fontSize: 13, color: Colors.textSub },
  summaryVal: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  error: { color: '#E74C3C', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  nextBtn: { flexDirection: 'row', backgroundColor: Colors.accentGold, borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: Colors.background },

  heightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  unitToggle: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 5 },
  unitBtnActive: { backgroundColor: Colors.accentGold },
  unitBtnText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  unitBtnTextActive: { color: Colors.background },
  ftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  ftInput: { flex: 1, marginBottom: 0 },
  ftLabel: { fontSize: 15, color: Colors.textSub, fontWeight: '600' },
});
