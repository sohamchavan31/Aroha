import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg from 'react-native-svg';
import client from '../api/client';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import Sheet from '../components/ui/Sheet';
import Field from '../components/ui/Field';
import Stepper from '../components/ui/Stepper';
import SegmentBar from '../components/ui/SegmentBar';
import IconButton from '../components/ui/IconButton';
import PrimaryButton from '../components/ui/PrimaryButton';
import AnimatedPressable from '../components/AnimatedPressable';
import FadeInView from '../components/FadeInView';
import { Ring } from '../components/ui/ProgressRing';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { tap, press, success, warn } from '../utils/haptics';

// ── Config ────────────────────────────────────────────────────────────────────
const DURATIONS = [
  { label: '30', unit: 'min', value: 30 },
  { label: '45', unit: 'min', value: 45 },
  { label: '1',  unit: 'hr',  value: 60 },
  { label: '1.5', unit: 'hr', value: 90 },
  { label: '2',  unit: 'hr',  value: 120 },
];

const WORKOUT_TYPES = [
  { key: 'PUSH',      label: 'Push',      icon: 'barbell-outline',   desc: 'Chest · Shoulders · Triceps' },
  { key: 'PULL',      label: 'Pull',      icon: 'body-outline',      desc: 'Back · Biceps' },
  { key: 'LEGS',      label: 'Legs',      icon: 'footsteps-outline', desc: 'Quads · Hamstrings · Glutes' },
  { key: 'CARDIO',    label: 'Cardio',    icon: 'heart-outline',     desc: 'HIIT · Steady state' },
  { key: 'FULL_BODY', label: 'Full body', icon: 'flash-outline',     desc: 'All muscle groups' },
  { key: 'CROSSFIT',  label: 'Crossfit',  icon: 'flame-outline',     desc: 'Strength + cardio' },
  { key: 'YOGA',      label: 'Yoga',      icon: 'leaf-outline',      desc: 'Flexibility · Mindfulness' },
  { key: 'CORE',      label: 'Core',      icon: 'shield-outline',    desc: 'Abs · Obliques · Lower back' },
];

const MUSCLE_COLOR = {
  chest: Palette.fat, shoulders: Palette.fat, arms: Palette.kcal,
  back: Palette.water, legs: Palette.carbs, core: Palette.protein,
  cardio: Palette.danger, full_body: Palette.textSub, custom: Palette.violet,
};

const BETWEEN_EXERCISES_REST = 30;

function fmt(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function typeLabel(key) {
  return WORKOUT_TYPES.find(t => t.key === key)?.label || (key || '').replace('_', ' ').toLowerCase();
}

// ── Live session ──────────────────────────────────────────────────────────────
function SessionScreen({ plan, plannedMinutes, onExit }) {
  const [exercises, setExercises] = useState(plan.exercises);
  const [exIdx, setExIdx]         = useState(0);
  const [setNum, setSetNum]       = useState(1);
  const [phase, setPhase]         = useState('work'); // work | rest | done
  const [restLeft, setRestLeft]   = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [elapsed, setElapsed]     = useState(0);
  const [doneSets, setDoneSets]   = useState(0);

  const [showAdd, setShowAdd]     = useState(false);
  const [customName, setCustomName] = useState('');
  const [customSets, setCustomSets] = useState(3);
  const [customReps, setCustomReps] = useState(10);

  const [save, setSave] = useState({ status: 'idle', kcal: null }); // idle | saving | saved | error

  const ex = exercises[exIdx];
  const totalSets = exercises.reduce((s, e) => s + (e.sets || 0), 0);
  const nextEx = exercises[exIdx + 1];

  // One clock: elapsed time, and the rest countdown while resting.
  useEffect(() => {
    if (phase === 'done') return undefined;
    const id = setInterval(() => {
      setElapsed(t => t + 1);
      setRestLeft(r => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'rest' && restLeft === 0) {
      press();
      setPhase('work');
    }
  }, [phase, restLeft]);

  function startRest(seconds) {
    setRestTotal(seconds);
    setRestLeft(seconds);
    setPhase(seconds > 0 ? 'rest' : 'work');
  }

  function markSetDone() {
    tap();
    setDoneSets(d => d + 1);
    if (setNum < ex.sets) {
      setSetNum(s => s + 1);
      startRest(ex.restSeconds || 60);
    } else if (exIdx < exercises.length - 1) {
      setExIdx(i => i + 1);
      setSetNum(1);
      startRest(BETWEEN_EXERCISES_REST);
    } else {
      success();
      setPhase('done');
    }
  }

  function addCustomExercise() {
    if (!customName.trim()) return;
    tap();
    setExercises(list => [...list, {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      sets: customSets,
      reps: customReps,
      restSeconds: 60,
      muscleGroup: 'custom',
      isCustom: true,
    }]);
    setCustomName(''); setCustomSets(3); setCustomReps(10);
    setShowAdd(false);
  }

  // Save as soon as the last set is done
  async function saveSession() {
    setSave({ status: 'saving', kcal: null });
    try {
      const { data } = await client.post('/workout/sessions', {
        workoutType:        plan.workoutType,
        plannedMinutes,
        actualSeconds:      elapsed,
        exercisesCompleted: exercises.length,
        totalSets:          doneSets,
        exerciseNames:      exercises.map(e => e.name),
      });
      setSave({ status: 'saved', kcal: data?.caloriesBurned ?? null });
    } catch {
      warn();
      setSave({ status: 'error', kcal: null });
    }
  }

  useEffect(() => {
    if (phase === 'done' && save.status === 'idle') saveSession();
  }, [phase]);

  function confirmExit() {
    if (phase === 'done') { onExit(save.status === 'saved'); return; }
    Alert.alert('End this workout?', "Your progress in this session won't be saved.", [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End workout', style: 'destructive', onPress: () => onExit(false) },
    ]);
  }

  // ── Done ──
  if (phase === 'done') {
    return (
      <ScrollView contentContainerStyle={styles.doneWrap} showsVerticalScrollIndicator={false}>
        <FadeInView index={0} style={styles.doneHead}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={30} color={Palette.onIvory} />
          </View>
          <Text style={styles.doneTitle}>Session complete</Text>
          <Text style={styles.doneSub}>{typeLabel(plan.workoutType)} · {exercises.length} exercises</Text>
        </FadeInView>

        <FadeInView index={1} style={styles.doneStats}>
          <DoneStat label="Time" value={fmt(elapsed)} />
          <DoneStat label="Sets" value={String(doneSets)} />
          <DoneStat
            label="Burned"
            value={save.status === 'saved' && save.kcal != null ? `${Math.round(save.kcal)}` : '–'}
            unit="kcal"
            color={save.status === 'saved' ? Palette.success : undefined}
          />
        </FadeInView>

        <FadeInView index={2}>
          <Card style={styles.doneList}>
            {exercises.map((e, i) => (
              <View key={e.id} style={[styles.doneRow, i > 0 && styles.divider]}>
                <Text style={styles.doneNum}>{i + 1}</Text>
                <Text style={styles.doneName} numberOfLines={1}>{e.name}</Text>
                <Text style={styles.doneSets}>{e.sets} × {e.reps}</Text>
              </View>
            ))}
          </Card>
        </FadeInView>

        <View style={styles.saveState}>
          {save.status === 'saving' && (
            <View style={styles.saveRow}>
              <ActivityIndicator size="small" color={Palette.textSub} />
              <Text style={styles.saveText}>Saving your session…</Text>
            </View>
          )}
          {save.status === 'saved' && (
            <View style={styles.saveRow}>
              <Ionicons name="cloud-done-outline" size={16} color={Palette.success} />
              <Text style={styles.saveText}>Saved to your history</Text>
            </View>
          )}
          {save.status === 'error' && (
            <View style={styles.saveRow}>
              <Ionicons name="cloud-offline-outline" size={16} color={Palette.danger} />
              <Text style={styles.saveText}>Couldn't save. </Text>
              <AnimatedPressable onPress={() => { tap(); saveSession(); }}>
                <Text style={styles.retry}>Try again</Text>
              </AnimatedPressable>
            </View>
          )}
        </View>

        <PrimaryButton
          title="Done"
          icon="checkmark"
          onPress={() => {
            if (save.status === 'saving') return;
            if (save.status === 'error') {
              Alert.alert('Leave without saving?', 'This session is not saved yet.', [
                { text: 'Stay', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: () => onExit(false) },
              ]);
              return;
            }
            onExit(save.status === 'saved');
          }}
          style={save.status === 'saving' && styles.disabled}
        />
      </ScrollView>
    );
  }

  // ── Working / resting ──
  const muscle = ex?.muscleGroup || '';
  const color = MUSCLE_COLOR[muscle] || Palette.textSub;
  const resting = phase === 'rest';

  return (
    <View style={styles.flex}>
      <View style={styles.sessionTop}>
        <IconButton name="close" onPress={confirmExit} accessibilityLabel="End workout" />
        <View style={styles.sessionTopCenter}>
          <Text style={styles.label}>{typeLabel(plan.workoutType)}</Text>
          <Text style={styles.elapsed}>{fmt(elapsed)}</Text>
        </View>
        <IconButton name="add" onPress={() => setShowAdd(true)} accessibilityLabel="Add an exercise" />
      </View>

      <View style={styles.progressWrap}>
        <SegmentBar progress={totalSets ? doneSets / totalSets : 0} segments={Math.min(Math.max(totalSets, 1), 24)} color={Palette.text} height={4} />
        <Text style={styles.progressText}>Exercise {exIdx + 1} of {exercises.length} · {doneSets}/{totalSets} sets</Text>
      </View>

      <View style={styles.sessionMain}>
        <Text style={[styles.muscle, { color }]}>{muscle.replace('_', ' ').toUpperCase()}</Text>
        <Text style={styles.exName}>{ex?.name}</Text>

        <View style={styles.dots}>
          {Array.from({ length: ex?.sets || 1 }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < setNum - 1 && styles.dotDone, i === setNum - 1 && !resting && styles.dotActive]}
            />
          ))}
        </View>

        {resting ? (
          <View style={styles.restWrap}>
            <View style={styles.ring}>
              <Svg width={180} height={180} style={StyleSheet.absoluteFill}>
                <Ring cx={90} cy={90} r={82} stroke={8} progress={restTotal ? restLeft / restTotal : 0} color={Palette.water} />
              </Svg>
              <Text style={styles.label}>Rest</Text>
              <Text style={styles.restTime}>{fmt(restLeft)}</Text>
            </View>
            <Chip label="Skip rest" onPress={() => setRestLeft(0)} />
          </View>
        ) : (
          <View style={styles.workWrap}>
            <Text style={styles.label}>Set {setNum} of {ex?.sets}</Text>
            <Text style={styles.target}>{ex?.reps}<Text style={styles.targetUnit}> reps</Text></Text>
          </View>
        )}
      </View>

      <View style={styles.sessionBottom}>
        <Text style={styles.nextUp} numberOfLines={1}>
          {resting
            ? (setNum === 1 ? `Up next: ${ex?.name}` : `Next: set ${setNum} of ${ex?.name}`)
            : nextEx ? `After this: ${nextEx.name}` : 'Last exercise'}
        </Text>
        <PrimaryButton
          title={resting ? 'Start next set' : setNum === ex?.sets && !nextEx ? 'Finish workout' : 'Set done'}
          subtitle={resting ? 'Skip the rest of your break' : `${ex?.reps} reps · set ${setNum}/${ex?.sets}`}
          icon={resting ? 'play' : 'checkmark'}
          onPress={resting ? () => setRestLeft(0) : markSetDone}
        />
      </View>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)} title="Add an exercise" subtitle="It's added to the end of this session" showClose>
        <View style={styles.addBody}>
          <Field label="Exercise name" value={customName} onChangeText={setCustomName} placeholder="e.g. Dumbbell curl" autoFocus />
          <View style={styles.addSteppers}>
            <Stepper label="Sets" value={customSets} onChange={setCustomSets} min={1} max={10} />
            <Stepper label="Reps" value={customReps} onChange={setCustomReps} min={1} max={100} />
          </View>
          <PrimaryButton title="Add to session" icon="add" onPress={addCustomExercise} style={!customName.trim() && styles.disabled} />
        </View>
      </Sheet>
    </View>
  );
}

function DoneStat({ label, value, unit, color }) {
  return (
    <View style={styles.doneStat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.doneStatValue, color && { color }]}>
        {value}{!!unit && <Text style={styles.doneStatUnit}> {unit}</Text>}
      </Text>
    </View>
  );
}

// ── Generator flow ────────────────────────────────────────────────────────────
export default function WorkoutGeneratorScreen({ visible, onClose }) {
  const [step, setStep]               = useState(1);
  const [duration, setDuration]       = useState(null);
  const [workoutType, setWorkoutType] = useState(null);
  const [plan, setPlan]               = useState(null);
  const [isSample, setIsSample]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const scrollRef = useRef(null);

  function reset() {
    setStep(1); setDuration(null); setWorkoutType(null);
    setPlan(null); setIsSample(false); setSessionActive(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function generate() {
    setLoading(true);
    try {
      const { data } = await client.post('/workout/generate', { durationMinutes: duration, workoutType });
      setPlan(data);
      setIsSample(false);
    } catch {
      // Offline fallback so the flow still works; clearly labelled as a sample.
      setPlan({
        workoutType,
        requestedMinutes: duration,
        estimatedMinutes: Math.max(duration - 2, 10),
        exercises: [
          { id: 1, name: 'Push-ups',         sets: 4, reps: 10, restSeconds: 90, muscleGroup: 'chest' },
          { id: 2, name: 'Pike push-ups',    sets: 4, reps: 10, restSeconds: 90, muscleGroup: 'shoulders' },
          { id: 3, name: 'Diamond push-ups', sets: 3, reps: 10, restSeconds: 90, muscleGroup: 'arms' },
          { id: 4, name: 'Dips',             sets: 3, reps: 12, restSeconds: 90, muscleGroup: 'arms' },
        ],
      });
      setIsSample(true);
    } finally {
      setLoading(false);
      setStep(3);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }

  if (!visible) return null;

  if (sessionActive && plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />
        <SessionScreen plan={plan} plannedMinutes={duration} onExit={close} />
      </SafeAreaView>
    );
  }

  const titles = { 1: 'How long do you have?', 2: 'What are you training?', 3: typeLabel(plan?.workoutType) };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />

      <View style={styles.header}>
        {step > 1
          ? <IconButton name="chevron-back" onPress={() => setStep(s => s - 1)} accessibilityLabel="Back" />
          : <View style={styles.headerSpacer} />}
        <View style={styles.headerCenter}>
          <SegmentBar progress={step / 3} segments={3} color={Palette.text} height={4} style={styles.steps} />
          <Text style={styles.stepText}>Step {step} of 3</Text>
        </View>
        <IconButton name="close" onPress={close} accessibilityLabel="Close" />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{titles[step]}</Text>

        {step === 1 && (
          <>
            <Text style={styles.hint}>Aroha builds a plan that fits your time.</Text>
            <View style={styles.durations}>
              {DURATIONS.map(d => {
                const sel = duration === d.value;
                return (
                  <AnimatedPressable
                    key={d.value}
                    containerStyle={styles.durationSlot}
                    style={[styles.option, styles.duration, sel && styles.optionOn]}
                    scaleTo={0.95}
                    onPress={() => { tap(); setDuration(d.value); }}
                    accessibilityState={{ selected: sel }}
                  >
                    <Text style={[styles.durationNum, sel && styles.optionTextOn]}>{d.label}</Text>
                    <Text style={styles.durationUnit}>{d.unit}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
            <PrimaryButton title="Next" onPress={() => setStep(2)} style={!duration && styles.disabled} containerStyle={!duration && styles.noTouch} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.hint}>{duration} minutes. Pick a focus.</Text>
            <View style={styles.types}>
              {WORKOUT_TYPES.map(t => {
                const sel = workoutType === t.key;
                return (
                  <AnimatedPressable
                    key={t.key}
                    containerStyle={styles.typeSlot}
                    style={[styles.option, styles.type, sel && styles.optionOn]}
                    scaleTo={0.96}
                    onPress={() => { tap(); setWorkoutType(t.key); }}
                    accessibilityState={{ selected: sel }}
                  >
                    <Ionicons name={t.icon} size={22} color={sel ? Palette.text : Palette.textSub} />
                    <Text style={[styles.typeLabel, sel && styles.optionTextOn]}>{t.label}</Text>
                    <Text style={styles.typeDesc}>{t.desc}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={Palette.textSub} />
                <Text style={styles.hint}>Building your workout…</Text>
              </View>
            ) : (
              <PrimaryButton title="Generate workout" icon="flash" onPress={generate} style={!workoutType && styles.disabled} containerStyle={!workoutType && styles.noTouch} />
            )}
          </>
        )}

        {step === 3 && plan && (
          <>
            <Text style={styles.hint}>~{plan.estimatedMinutes} min · {plan.exercises.length} exercises · {plan.exercises.reduce((s, e) => s + e.sets, 0)} sets</Text>
            {isSample && (
              <View style={styles.sample}>
                <Ionicons name="cloud-offline-outline" size={15} color={Palette.kcal} />
                <Text style={styles.sampleText}>Couldn't reach the server, so this is a sample plan.</Text>
              </View>
            )}
            <Card style={styles.planCard}>
              {plan.exercises.map((e, i) => {
                const c = MUSCLE_COLOR[e.muscleGroup] || Palette.textSub;
                return (
                  <View key={e.id} style={[styles.planRow, i > 0 && styles.divider]}>
                    <Text style={styles.planNum}>{i + 1}</Text>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName} numberOfLines={1}>{e.name}</Text>
                      <Text style={styles.planMeta}>{e.sets} × {e.reps} · {e.restSeconds}s rest</Text>
                    </View>
                    <Text style={[styles.planMuscle, { color: c }]}>{(e.muscleGroup || '').replace('_', ' ')}</Text>
                  </View>
                );
              })}
            </Card>
            <PrimaryButton title="Start session" subtitle="Timer and rest breaks are automatic" icon="play" onPress={() => setSessionActive(true)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Palette.ink },
  flex:     { flex: 1 },
  label:    { ...Type.label, color: Palette.textSub },
  divider:  { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  disabled: { opacity: 0.4 },
  noTouch:  { pointerEvents: 'none' },

  // Generator
  header:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerSpacer: { width: 38 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  steps:        { width: 120 },
  stepText:     { ...Type.small, color: Palette.textSub },
  body:         { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  title:        { fontFamily: Fonts.display, fontSize: 22, color: Palette.text },
  hint:         { ...Type.body, color: Palette.textSub, marginTop: -Spacing.sm },

  option:       { backgroundColor: Palette.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.lineSoft },
  optionOn:     { borderColor: Palette.text, backgroundColor: Palette.surface2 },
  optionTextOn: { color: Palette.text },

  durations:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  durationSlot: { width: '31%', flexGrow: 1 },
  duration:     { alignItems: 'center', paddingVertical: Spacing.lg },
  durationNum:  { fontFamily: Fonts.numHeavy, fontSize: 34, color: Palette.textSub },
  durationUnit: { ...Type.small, color: Palette.textDim },

  types:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeSlot:  { width: '48%', flexGrow: 1 },
  type:      { padding: Spacing.lg, gap: 4 },
  typeLabel: { ...Type.bodyB, color: Palette.textSub, marginTop: Spacing.sm },
  typeDesc:  { ...Type.small, color: Palette.textDim },
  loadingRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },

  sample:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: 'rgba(245,165,36,0.08)', borderWidth: 1, borderColor: 'rgba(245,165,36,0.25)' },
  sampleText: { ...Type.small, color: Palette.text, flex: 1 },
  planCard:   { paddingVertical: 0, paddingHorizontal: Spacing.md + 2 },
  planRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  planNum:    { fontFamily: Fonts.numHeavy, fontSize: 20, color: Palette.textDim, width: 22 },
  planInfo:   { flex: 1, minWidth: 0 },
  planName:   { ...Type.bodyB, color: Palette.text },
  planMeta:   { fontFamily: Fonts.num, fontSize: 14, color: Palette.textSub, marginTop: 1 },
  planMuscle: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },

  // Session
  sessionTop:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  sessionTopCenter: { flex: 1, alignItems: 'center' },
  elapsed:          { fontFamily: Fonts.num, fontSize: 22, color: Palette.text, marginTop: 2 },
  progressWrap:     { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg, gap: Spacing.sm },
  progressText:     { ...Type.small, color: Palette.textSub, textAlign: 'center' },
  sessionMain:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  muscle:           { fontFamily: Fonts.bodyHeavy, fontSize: 11, letterSpacing: 1.6 },
  exName:           { fontFamily: Fonts.display, fontSize: 26, lineHeight: 34, color: Palette.text, textAlign: 'center' },
  dots:             { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  dot:              { width: 22, height: 6, borderRadius: 3, backgroundColor: Palette.track },
  dotDone:          { backgroundColor: Palette.success },
  dotActive:        { backgroundColor: Palette.text },
  workWrap:         { alignItems: 'center', gap: Spacing.sm },
  target:           { fontFamily: Fonts.numHeavy, fontSize: 88, lineHeight: 92, color: Palette.text },
  targetUnit:       { fontFamily: Fonts.num, fontSize: 24, color: Palette.textSub },
  restWrap:         { alignItems: 'center', gap: Spacing.lg },
  ring:             { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  restTime:         { fontFamily: Fonts.numHeavy, fontSize: 52, color: Palette.text },
  sessionBottom:    { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  nextUp:           { ...Type.small, color: Palette.textSub, textAlign: 'center' },
  addBody:          { gap: Spacing.lg },
  addSteppers:      { flexDirection: 'row', gap: Spacing.sm },

  // Done
  doneWrap:      { padding: Spacing.lg, paddingTop: Spacing.xxl, gap: Spacing.lg },
  doneHead:      { alignItems: 'center', gap: Spacing.sm },
  doneIcon:      { width: 64, height: 64, borderRadius: 22, backgroundColor: Palette.ivory, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  doneTitle:     { fontFamily: Fonts.display, fontSize: 24, color: Palette.text },
  doneSub:       { ...Type.body, color: Palette.textSub },
  doneStats:     { flexDirection: 'row', gap: Spacing.sm },
  doneStat:      { flex: 1, backgroundColor: Palette.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.lineSoft, padding: Spacing.md + 2, gap: 4 },
  doneStatValue: { fontFamily: Fonts.numHeavy, fontSize: 28, color: Palette.text },
  doneStatUnit:  { fontFamily: Fonts.num, fontSize: 13, color: Palette.textSub },
  doneList:      { paddingVertical: 0, paddingHorizontal: Spacing.md + 2 },
  doneRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  doneNum:       { fontFamily: Fonts.num, fontSize: 16, color: Palette.textDim, width: 18 },
  doneName:      { ...Type.body, color: Palette.text, flex: 1 },
  doneSets:      { fontFamily: Fonts.num, fontSize: 16, color: Palette.textSub },
  saveState:     { alignItems: 'center', minHeight: 20 },
  saveRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  saveText:      { ...Type.small, color: Palette.textSub },
  retry:         { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.text, textDecorationLine: 'underline' },
});
