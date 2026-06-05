import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import client from '../api/client';

// ── Config ────────────────────────────────────────────────────────────────────
const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hr',   value: 60 },
  { label: '1.5 hr', value: 90 },
  { label: '2 hr',   value: 120 },
];

const WORKOUT_TYPES = [
  { key: 'PUSH',      label: 'Push',       icon: 'barbell-outline',      desc: 'Chest · Shoulders · Triceps' },
  { key: 'PULL',      label: 'Pull',       icon: 'body-outline',         desc: 'Back · Biceps' },
  { key: 'LEGS',      label: 'Legs',       icon: 'footsteps-outline',    desc: 'Quads · Hamstrings · Glutes' },
  { key: 'CARDIO',    label: 'Cardio',     icon: 'heart-outline',        desc: 'HIIT · Steady State' },
  { key: 'FULL_BODY', label: 'Full Body',  icon: 'flash-outline',        desc: 'All muscle groups' },
  { key: 'CROSSFIT',  label: 'Crossfit',   icon: 'flame-outline',        desc: 'Strength + Cardio' },
  { key: 'YOGA',      label: 'Yoga',       icon: 'leaf-outline',         desc: 'Flexibility · Mindfulness' },
  { key: 'CORE',      label: 'Core',       icon: 'shield-outline',       desc: 'Abs · Obliques · Lower back' },
];

const MUSCLE_COLOR = {
  chest: '#E74C3C', shoulders: '#E74C3C', arms: '#E67E22',
  back: '#2E86AB',  legs: '#27AE60',      core: '#7B2FBE',
  cardio: '#FF6B35', full_body: Colors.accentGold,
};

function fmt(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Session Screen ────────────────────────────────────────────────────────────
function SessionScreen({ exercises, onFinish }) {
  const [exIdx, setExIdx]         = useState(0);
  const [setNum, setSetNum]       = useState(1);
  const [phase, setPhase]         = useState('work');   // 'work' | 'rest' | 'done'
  const [restLeft, setRestLeft]   = useState(0);
  const [totalSecs, setTotalSecs] = useState(0);
  const timerRef = useRef(null);

  const ex = exercises[exIdx];

  const tick = useCallback(() => {
    setTotalSecs(t => t + 1);
    setRestLeft(r => {
      if (r <= 1) {
        setPhase('work');
        return 0;
      }
      return r - 1;
    });
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [tick]);

  function markSetDone() {
    if (setNum < ex.sets) {
      setSetNum(s => s + 1);
      setPhase('rest');
      setRestLeft(ex.restSeconds);
    } else if (exIdx < exercises.length - 1) {
      setExIdx(i => i + 1);
      setSetNum(1);
      setPhase('rest');
      setRestLeft(30); // 30s transition between exercises
    } else {
      clearInterval(timerRef.current);
      setPhase('done');
    }
  }

  function skipRest() {
    setRestLeft(0);
    setPhase('work');
  }

  if (phase === 'done') {
    return (
      <View style={styles.doneScreen}>
        <Text style={styles.doneIcon}>🏆</Text>
        <Text style={styles.doneTitle}>Session Complete!</Text>
        <Text style={styles.doneSub}>Total time: {fmt(totalSecs)}</Text>
        <Text style={styles.doneSub}>{exercises.length} exercises · great work</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={onFinish} activeOpacity={0.8}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = ((exIdx * ex.sets + setNum - 1) / (exercises.length * ex.sets)) * 100;
  const muscleColor = MUSCLE_COLOR[ex.muscleGroup] || Colors.accentGold;

  return (
    <View style={{ flex: 1 }}>
      {/* Progress bar */}
      <View style={styles.sessionProgressTrack}>
        <View style={[styles.sessionProgressFill, { width: `${progress}%` }]} />
      </View>

      {/* Exercise counter */}
      <Text style={styles.sessionExerciseCount}>
        Exercise {exIdx + 1} of {exercises.length}
      </Text>

      {/* Main content */}
      <View style={styles.sessionMain}>
        <View style={[styles.sessionCategoryChip, { backgroundColor: muscleColor + '22' }]}>
          <Text style={[styles.sessionCategoryText, { color: muscleColor }]}>
            {ex.muscleGroup?.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.sessionExName}>{ex.name}</Text>
        <Text style={styles.sessionSetInfo}>{ex.sets} sets × {ex.reps} reps</Text>

        <View style={styles.sessionSetIndicator}>
          {Array.from({ length: ex.sets }).map((_, i) => (
            <View
              key={i}
              style={[styles.sessionSetDot, i < setNum - 1 && styles.sessionSetDotDone, i === setNum - 1 && styles.sessionSetDotActive]}
            />
          ))}
        </View>
        <Text style={styles.sessionCurrentSet}>Set {setNum} of {ex.sets}</Text>

        {/* Phase display */}
        {phase === 'rest' ? (
          <View style={styles.restBlock}>
            <Text style={styles.restLabel}>Rest</Text>
            <Text style={styles.restCountdown}>{fmt(restLeft)}</Text>
            <TouchableOpacity onPress={skipRest} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>Skip Rest</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.workBlock}>
            <Text style={styles.workLabel}>GO!</Text>
          </View>
        )}
      </View>

      {/* Bottom controls */}
      <View style={styles.sessionBottom}>
        <Text style={styles.sessionTimer}>{fmt(totalSecs)}</Text>
        {phase === 'work' && (
          <TouchableOpacity style={styles.markDoneBtn} onPress={markSetDone} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.background} />
            <Text style={styles.markDoneBtnText}>Set Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function WorkoutGeneratorScreen({ visible, onClose }) {
  const [step, setStep]               = useState(1);
  const [duration, setDuration]       = useState(null);
  const [workoutType, setWorkoutType] = useState(null);
  const [plan, setPlan]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  function reset() {
    setStep(1);
    setDuration(null);
    setWorkoutType(null);
    setPlan(null);
    setSessionActive(false);
  }

  async function generate() {
    setLoading(true);
    try {
      const { data } = await client.post('/workout/generate', {
        durationMinutes: duration,
        workoutType,
      });
      setPlan(data);
      setStep(3);
    } catch {
      // Mock plan for offline dev
      setPlan({
        workoutType,
        requestedMinutes: duration,
        estimatedMinutes: duration - 2,
        exercises: [
          { id: 1, name: 'Push-ups',       sets: 4, reps: 10, restSeconds: 90, muscleGroup: 'chest',     estimatedSeconds: 390 },
          { id: 2, name: 'Pike Push-ups',  sets: 4, reps: 10, restSeconds: 90, muscleGroup: 'shoulders', estimatedSeconds: 390 },
          { id: 3, name: 'Diamond Push-ups', sets: 3, reps: 10, restSeconds: 90, muscleGroup: 'arms',    estimatedSeconds: 300 },
          { id: 4, name: 'Dips',           sets: 3, reps: 12, restSeconds: 90, muscleGroup: 'arms',      estimatedSeconds: 306 },
        ],
      });
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  if (sessionActive && plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Session</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
            <Ionicons name="close" size={24} color={Colors.textSub} />
          </TouchableOpacity>
        </View>
        <SessionScreen exercises={plan.exercises} onFinish={() => { reset(); onClose(); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(s => s - 1)} hitSlop={{ top:10,bottom:10,left:10,right:10 }} style={{ marginRight: 12 }}>
              <Ionicons name="chevron-back" size={22} color={Colors.textSub} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Duration' : step === 2 ? 'Workout Type' : 'Your Workout'}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
          <Ionicons name="close" size={24} color={Colors.textSub} />
        </TouchableOpacity>
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {[1, 2, 3].map(s => (
          <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Step 1: Duration ── */}
        {step === 1 && (
          <View>
            <Text style={styles.stepHint}>How long do you have?</Text>
            <View style={styles.durationGrid}>
              {DURATIONS.map(d => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.durationBtn, duration === d.value && styles.durationBtnActive]}
                  onPress={() => setDuration(d.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.durationBtnText, duration === d.value && styles.durationBtnTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.nextBtn, !duration && styles.nextBtnDisabled]}
              onPress={() => duration && setStep(2)}
              disabled={!duration}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Workout Type ── */}
        {step === 2 && (
          <View>
            <Text style={styles.stepHint}>What are you training today?</Text>
            <View style={styles.typeGrid}>
              {WORKOUT_TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeCard, workoutType === t.key && styles.typeCardActive]}
                  onPress={() => setWorkoutType(t.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={t.icon} size={24} color={workoutType === t.key ? Colors.accentGold : Colors.textSub} />
                  <Text style={[styles.typeCardLabel, workoutType === t.key && styles.typeCardLabelActive]}>{t.label}</Text>
                  <Text style={styles.typeCardDesc}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.nextBtn, (!workoutType || loading) && styles.nextBtnDisabled]}
              onPress={generate}
              disabled={!workoutType || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={styles.nextBtnText}>Generate Workout ✦</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3: Preview ── */}
        {step === 3 && plan && (
          <View>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{plan.workoutType.replace('_', ' ')}</Text>
              <Text style={styles.planMeta}>~{plan.estimatedMinutes} min · {plan.exercises.length} exercises</Text>
            </View>

            {plan.exercises.map((ex, idx) => {
              const color = MUSCLE_COLOR[ex.muscleGroup] || Colors.accentGold;
              return (
                <View key={ex.id} style={styles.previewCard}>
                  <View style={styles.previewNum}>
                    <Text style={styles.previewNumText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewName}>{ex.name}</Text>
                    <Text style={styles.previewDetail}>
                      {ex.sets} sets × {ex.reps} reps · {ex.restSeconds}s rest
                    </Text>
                  </View>
                  <View style={[styles.previewChip, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.previewChipText, { color }]}>
                      {ex.muscleGroup}
                    </Text>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => setSessionActive(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="play-circle" size={22} color={Colors.background} />
              <Text style={styles.startBtnText}>Start Session</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll: { flex: 1, paddingHorizontal: 20 },

  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cardBorder },
  stepDotActive: { backgroundColor: Colors.accentGold },

  stepHint: { fontSize: 14, color: Colors.textSub, textAlign: 'center', marginBottom: 24, marginTop: 8 },

  // Duration
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  durationBtn: { flex: 1, minWidth: '28%', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 18, alignItems: 'center' },
  durationBtnActive: { borderColor: Colors.accentGold, backgroundColor: Colors.accentGold + '22' },
  durationBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textSub },
  durationBtnTextActive: { color: Colors.accentGold },

  // Workout type
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  typeCard: { width: '47%', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, alignItems: 'center', gap: 6 },
  typeCardActive: { borderColor: Colors.accentGold, backgroundColor: Colors.accentGold + '11' },
  typeCardLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSub },
  typeCardLabelActive: { color: Colors.accentGold },
  typeCardDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },

  nextBtn: { backgroundColor: Colors.accentGold, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 8 },
  nextBtnDisabled: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: Colors.background },

  // Plan preview
  planHeader: { alignItems: 'center', paddingVertical: 20 },
  planTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: 0.5 },
  planMeta:  { fontSize: 13, color: Colors.textSub, marginTop: 6 },
  previewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, marginBottom: 10, gap: 12 },
  previewNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accentGold + '22', alignItems: 'center', justifyContent: 'center' },
  previewNumText: { fontSize: 12, fontWeight: '800', color: Colors.accentGold },
  previewName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  previewDetail: { fontSize: 12, color: Colors.textSub },
  previewChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  previewChipText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.accentGold, borderRadius: 14, padding: 18, marginTop: 16 },
  startBtnText: { fontSize: 16, fontWeight: '800', color: Colors.background },

  // Session screen
  sessionProgressTrack: { height: 4, backgroundColor: Colors.cardBorder },
  sessionProgressFill:  { height: 4, backgroundColor: Colors.accentGold },
  sessionExerciseCount: { fontSize: 12, color: Colors.textSub, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  sessionMain: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  sessionCategoryChip: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16 },
  sessionCategoryText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sessionExName: { fontSize: 28, fontWeight: '900', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  sessionSetInfo: { fontSize: 14, color: Colors.textSub, marginBottom: 20 },
  sessionSetIndicator: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  sessionSetDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.cardBorder },
  sessionSetDotDone: { backgroundColor: Colors.success },
  sessionSetDotActive: { backgroundColor: Colors.accentGold, transform: [{ scale: 1.3 }] },
  sessionCurrentSet: { fontSize: 13, color: Colors.textSub, marginBottom: 28 },
  workBlock: { alignItems: 'center' },
  workLabel: { fontSize: 48, fontWeight: '900', color: Colors.accentGold, letterSpacing: 4 },
  restBlock: { alignItems: 'center', gap: 8 },
  restLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSub, textTransform: 'uppercase', letterSpacing: 1 },
  restCountdown: { fontSize: 56, fontWeight: '900', color: '#2E86AB' },
  skipBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, marginTop: 8 },
  skipBtnText: { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  sessionBottom: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  sessionTimer: { fontSize: 20, fontWeight: '800', color: Colors.textSub, fontVariant: ['tabular-nums'] },
  markDoneBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.accentGold, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  markDoneBtnText: { fontSize: 15, fontWeight: '800', color: Colors.background },

  // Done screen
  doneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  doneIcon:  { fontSize: 64 },
  doneTitle: { fontSize: 28, fontWeight: '900', color: Colors.text },
  doneSub:   { fontSize: 15, color: Colors.textSub },
  doneBtn:   { backgroundColor: Colors.accentGold, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 16, marginTop: 16 },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: Colors.background },
});
