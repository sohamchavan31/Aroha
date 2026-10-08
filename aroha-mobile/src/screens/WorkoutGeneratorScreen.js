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
import Segmented from '../components/ui/Segmented';
import SegmentBar from '../components/ui/SegmentBar';
import IconButton from '../components/ui/IconButton';
import PrimaryButton from '../components/ui/PrimaryButton';
import AnimatedPressable from '../components/AnimatedPressable';
import FadeInView from '../components/FadeInView';
import { Ring } from '../components/ui/ProgressRing';
import MuscleMap from '../components/train/MuscleMap';
import { setsSummary, fmtKg } from '../components/train/LogSetSheet';
import { guideFor } from '../constants/exerciseGuide';
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

  const [save, setSave] = useState({ status: 'idle', kcal: null, prs: 0 }); // idle | saving | saved | error

  // What was actually lifted: logs[exIdx] = [{ weightKg, reps }], cur = the set being done.
  const [logs, setLogs]         = useState({});
  const [cur, setCur]           = useState({ weightKg: 0, reps: plan.exercises[0]?.reps || 10 });
  const [showGuide, setShowGuide] = useState(false);
  const touched = useRef(false); // user changed the weight; don't overwrite with history

  const ex = exercises[exIdx];
  const totalSets = exercises.reduce((s, e) => s + (e.sets || 0), 0);
  const nextEx = exercises[exIdx + 1];

  // New exercise: start from its target reps, then last session's top weight.
  useEffect(() => {
    if (!ex) return undefined;
    touched.current = false;
    setCur({ weightKg: 0, reps: ex.reps || 10 });
    if (typeof ex.id !== 'number') return undefined;
    let cancelled = false;
    client.get(`/workouts/history/${ex.id}`)
      .then(({ data }) => {
        const last = data?.sessions?.[data.sessions.length - 1];
        if (!cancelled && !touched.current && last?.topWeightKg > 0) setCur(c => ({ ...c, weightKg: last.topWeightKg }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [exIdx, ex?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (phase === 'rest' && restLeft === 10 && restTotal > 15) tap(); // heads-up: 10 seconds left
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
    setLogs(l => ({ ...l, [exIdx]: [...(l[exIdx] || []), { ...cur }] }));
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
    setSave({ status: 'saving', kcal: null, prs: 0 });
    try {
      // Each library exercise's sets go to its history, same as logging from Train.
      // Custom exercises added mid-session only count toward the session.
      const results = await Promise.allSettled(exercises.map((e, i) => (
        typeof e.id === 'number' && logs[i]?.length
          ? client.post('/workouts/log/sets', { exerciseId: e.id, sets: logs[i].slice(0, 20) })
          : null
      )).filter(Boolean));
      const prs = results.filter(r => r.status === 'fulfilled' && r.value?.data?.newPR).length;
      const { data } = await client.post('/workout/sessions', {
        workoutType:        plan.workoutType,
        plannedMinutes,
        actualSeconds:      elapsed,
        exercisesCompleted: exercises.length,
        totalSets:          doneSets,
        exerciseNames:      exercises.map(e => e.name),
      });
      setSave({ status: 'saved', kcal: data?.caloriesBurned ?? null, prs });
      if (prs > 0) success();
    } catch {
      warn();
      setSave({ status: 'error', kcal: null, prs: 0 });
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

        {save.prs > 0 && (
          <FadeInView index={2} style={styles.prBanner}>
            <Ionicons name="trophy" size={18} color={Palette.kcal} />
            <Text style={styles.prText}>{save.prs === 1 ? 'New personal record!' : `${save.prs} new personal records!`}</Text>
          </FadeInView>
        )}

        <FadeInView index={2}>
          <Card style={styles.doneList}>
            {exercises.map((e, i) => (
              <View key={e.id} style={[styles.doneRow, i > 0 && styles.divider]}>
                <Text style={styles.doneNum}>{i + 1}</Text>
                <View style={styles.doneText}>
                  <Text style={styles.doneName} numberOfLines={1}>{e.name}</Text>
                  {!!logs[i]?.length && <Text style={styles.doneDetail} numberOfLines={2}>{setsSummary(logs[i])}</Text>}
                </View>
                <Text style={styles.doneSets}>{logs[i]?.length || 0} sets</Text>
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
  const guide = guideFor(ex);

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

        {guide && (
          <AnimatedPressable onPress={() => { tap(); setShowGuide(true); }} scaleTo={0.97} style={styles.guideRow} accessibilityRole="button" accessibilityLabel={`How to do it. Feel it in: ${guide.feel}`}>
            <MuscleMap primary={guide.primary} secondary={guide.secondary} height={58} labels={false} />
            <View style={styles.guideText}>
              <Text style={styles.guideLabel}>Feel it in</Text>
              <Text style={styles.guideFeel} numberOfLines={2}>{guide.feel}</Text>
            </View>
            <Ionicons name="information-circle-outline" size={18} color={Palette.textSub} />
          </AnimatedPressable>
        )}

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
            <View style={styles.restChips}>
              <Chip label="+15 s" capitalize={false} onPress={() => { tap(); setRestLeft(r => r + 15); setRestTotal(t => t + 15); }} />
              <Chip label="Skip rest" onPress={() => setRestLeft(0)} />
            </View>
          </View>
        ) : (
          <View style={styles.workWrap}>
            <Text style={styles.label}>Set {setNum} of {ex?.sets} · target {ex?.reps} reps</Text>
            <View style={styles.setSteppers}>
              <Stepper value={cur.weightKg} onChange={v => { touched.current = true; setCur(c => ({ ...c, weightKg: v })); }} min={0} max={500} step={2.5} decimals={1} unit="kg" />
              <Stepper value={cur.reps} onChange={v => setCur(c => ({ ...c, reps: v }))} min={1} max={200} unit="reps" />
            </View>
            {!!logs[exIdx]?.length && (
              <Text style={styles.doneSoFar} numberOfLines={1}>Done: {setsSummary(logs[exIdx])}</Text>
            )}
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
          subtitle={resting ? 'Skip the rest of your break' : `${cur.weightKg > 0 ? `${fmtKg(cur.weightKg)} kg × ` : ''}${cur.reps} reps · set ${setNum}/${ex?.sets}`}
          icon={resting ? 'play' : 'checkmark'}
          onPress={resting ? () => setRestLeft(0) : markSetDone}
        />
      </View>

      <Sheet visible={showGuide} onClose={() => setShowGuide(false)} title={ex?.name} subtitle="How to do it" showClose>
        {guide && (
          <View style={styles.guideBody}>
            <MuscleMap primary={guide.primary} secondary={guide.secondary} height={210} />
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: Palette.kcal }]} /><Text style={styles.legendText}>Main muscle</Text>
              <View style={[styles.legendDot, { backgroundColor: Palette.kcal + '59' }]} /><Text style={styles.legendText}>Helping</Text>
            </View>
            <View style={styles.feelBox}>
              <Text style={styles.guideLabel}>Feel it in</Text>
              <Text style={styles.feelText}>{guide.feel}</Text>
            </View>
            {guide.cues.map((c, i) => (
              <View key={i} style={styles.cue}>
                <Text style={styles.cueNum}>{i + 1}</Text>
                <Text style={styles.cueText}>{c}</Text>
              </View>
            ))}
          </View>
        )}
      </Sheet>

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
  const [location, setLocation]       = useState('GYM');
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
      const { data } = await client.post('/workout/generate', { durationMinutes: duration, workoutType, location });
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
            <Text style={styles.hint}>Aroha builds a plan that fits your time and kit.</Text>
            <Segmented
              options={[{ key: 'GYM', label: 'At the gym', icon: 'barbell-outline' }, { key: 'HOME', label: 'At home', icon: 'home-outline' }]}
              value={location}
              onChange={setLocation}
              style={styles.where}
            />
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
            <Text style={styles.hint}>{duration} minutes {location === 'HOME' ? 'at home' : 'at the gym'}. Pick a focus.</Text>
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
  workWrap:         { alignItems: 'center', alignSelf: 'stretch', gap: Spacing.sm },
  restWrap:         { alignItems: 'center', gap: Spacing.lg },
  restChips:        { flexDirection: 'row', gap: Spacing.sm },
  setSteppers:      { flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch' },
  doneSoFar:        { ...Type.small, color: Palette.textSub },
  guideRow:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.lineSoft, alignSelf: 'stretch' },
  guideText:        { flex: 1 },
  guideLabel:       { ...Type.label, color: Palette.textSub },
  guideFeel:        { ...Type.bodyB, color: Palette.text, marginTop: 2 },
  guideBody:        { gap: Spacing.md, paddingBottom: Spacing.sm },
  legendRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  legendDot:        { width: 10, height: 10, borderRadius: 5, marginLeft: Spacing.sm },
  legendText:       { ...Type.small, color: Palette.textSub },
  feelBox:          { padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Palette.kcal + '12', borderWidth: 1, borderColor: Palette.kcal + '33', gap: 2 },
  feelText:         { ...Type.bodyB, fontSize: 15, color: Palette.text },
  cue:              { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  cueNum:           { width: 22, height: 22, borderRadius: 11, textAlign: 'center', lineHeight: 22, fontFamily: Fonts.num, fontSize: 13, color: Palette.text, backgroundColor: Palette.surface2, overflow: 'hidden' },
  cueText:          { ...Type.body, color: Palette.text, flex: 1 },
  prBanner:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Palette.kcal + '14', borderWidth: 1, borderColor: Palette.kcal + '40' },
  prText:           { ...Type.bodyB, color: Palette.text },
  doneText:         { flex: 1 },
  doneDetail:       { ...Type.small, color: Palette.textSub, marginTop: 2 },
  ring:             { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  restTime:         { fontFamily: Fonts.numHeavy, fontSize: 52, color: Palette.text },
  sessionBottom:    { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  nextUp:           { ...Type.small, color: Palette.textSub, textAlign: 'center' },
  addBody:          { gap: Spacing.lg },
  addSteppers:      { flexDirection: 'row', gap: Spacing.sm },
  where:            { marginBottom: Spacing.lg },

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
  doneName:      { ...Type.body, color: Palette.text },
  doneSets:      { fontFamily: Fonts.num, fontSize: 16, color: Palette.textSub },
  saveState:     { alignItems: 'center', minHeight: 20 },
  saveRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  saveText:      { ...Type.small, color: Palette.textSub },
  retry:         { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.text, textDecorationLine: 'underline' },
});
