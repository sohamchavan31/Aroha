import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Alert, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import WorkoutGeneratorScreen from './WorkoutGeneratorScreen';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import Field from '../components/ui/Field';
import PrimaryButton from '../components/ui/PrimaryButton';
import Skeleton from '../components/Skeleton';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import LogSetSheet, { setsSummary } from '../components/train/LogSetSheet';
import ExerciseHistorySheet from '../components/train/ExerciseHistorySheet';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { tap, success, warn } from '../utils/haptics';

const CATEGORIES = [
  { key: 'all',         label: 'All' },
  { key: 'strength',    label: 'Strength' },
  { key: 'cardio',      label: 'Cardio' },
  { key: 'yoga',        label: 'Yoga' },
  { key: 'flexibility', label: 'Flexibility' },
];

// Equipment groups for the library filter.
const KIT = [
  { key: 'all',      label: 'Any kit' },
  { key: 'body',     label: 'Bodyweight', match: ['none', 'mat', 'pullup_bar', 'rope'] },
  { key: 'free',     label: 'Free weights', match: ['barbell', 'dumbbell', 'ez_bar', 'kettlebell', 'bench'] },
  { key: 'machines', label: 'Machines & cables', match: ['machine', 'cable', 'smith_machine', 'ab_wheel'] },
];
const kitLabel = k => (k && k !== 'none' ? k.replace(/_/g, ' ') : 'bodyweight');

const CATEGORY_ICON = {
  strength: 'barbell-outline', cardio: 'heart-outline', yoga: 'body-outline', flexibility: 'leaf-outline',
};

function fmtKg(n) {
  return Number.isInteger(n) ? String(n) : Number(n).toFixed(1);
}

// Today's rows grouped per exercise, in the order first logged. Older rows
// that stored "3 × 10" in one entry expand into 3 sets.
function groupToday(entries) {
  const groups = [];
  const byKey = {};
  for (const e of entries) {
    const key = e.exerciseId ?? e.exerciseName;
    if (!byKey[key]) {
      byKey[key] = { key: String(key), name: e.exerciseName, ids: [], sets: [], pr: false };
      groups.push(byKey[key]);
    }
    const g = byKey[key];
    g.ids.push(e.id);
    g.pr = g.pr || !!e.newPR;
    for (let i = 0; i < Math.max(1, e.sets || 1); i++) g.sets.push({ weightKg: e.weightKg || 0, reps: e.reps });
  }
  return groups;
}

export default function WorkoutScreen() {
  const [exercises, setExercises]   = useState([]);
  const [loadingEx, setLoadingEx]   = useState(true);
  const [exError, setExError]       = useState(false);
  const [category, setCategory]     = useState('all');
  const [kit, setKit]               = useState('all');
  const [query, setQuery]           = useState('');

  const [today, setToday]           = useState({ entries: [], exerciseCount: 0, totalSets: 0, totalReps: 0 });
  const [loadingToday, setLoadingToday] = useState(true);
  const [prIds, setPrIds]           = useState(() => new Set()); // entries logged as PRs this session
  const [prBanner, setPrBanner]     = useState(null);            // { name, detail }
  const [refreshing, setRefreshing] = useState(false);

  const [logExercise, setLogExercise]         = useState(null);
  const [historyExercise, setHistoryExercise] = useState(null);
  const [showGenerator, setShowGenerator]     = useState(false);

  const scrollRef = useRef(null);
  const bannerTimer = useRef(null);
  useEffect(() => () => clearTimeout(bannerTimer.current), []);

  // ── Data ────────────────────────────────────────────────────────────────────
  const loadExercises = useCallback(async () => {
    try {
      const { data } = await client.get('/workouts/exercises');
      setExercises(data || []);
      setExError(false);
    } catch {
      setExError(true);
    } finally {
      setLoadingEx(false);
    }
  }, []);

  const loadToday = useCallback(async () => {
    try {
      const { data } = await client.get('/workouts/today');
      setToday({
        entries:       data.entries || [],
        exerciseCount: data.exerciseCount || 0,
        totalSets:     data.totalSets || 0,
        totalReps:     data.totalReps || 0,
      });
    } catch {
      // keep what's on screen
    } finally {
      setLoadingToday(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadToday();
    if (exercises.length === 0) loadExercises();
  }, [loadToday, loadExercises, exercises.length]));

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadToday(), loadExercises()]);
    setRefreshing(false);
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  // rows: [{ weightKg, reps }] — one per set.
  async function saveLog(rows) {
    const ex = logExercise;
    try {
      const { data } = await client.post('/workouts/log/sets', {
        exerciseId: ex.id,
        sets: rows.map(r => ({ weightKg: r.weightKg, reps: r.reps })),
      });
      setLogExercise(null);
      if (data?.newPR) {
        success();
        const prEntry = (data.entries || []).find(e => e.newPR);
        if (prEntry) setPrIds(s => new Set(s).add(prEntry.id));
        setPrBanner({ name: ex.name, detail: data.bestWeightKg > 0 ? `${fmtKg(data.bestWeightKg)} kg × ${data.bestReps}` : `${data.bestReps} reps` });
        clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setPrBanner(null), 6000);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        tap();
      }
      loadToday();
      return true;
    } catch {
      warn();
      Alert.alert("Couldn't log exercise", 'Check your connection and try again.');
      return false;
    }
  }

  function confirmDelete(group) {
    tap();
    Alert.alert('Remove from today?', `${group.name} · ${group.sets.length} set${group.sets.length === 1 ? '' : 's'}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteGroup(group) },
    ]);
  }

  // Removes every set of that exercise logged today.
  async function deleteGroup(group) {
    const before = today;
    const ids = new Set(group.ids);
    setToday(t => ({ ...t, entries: t.entries.filter(e => !ids.has(e.id)) }));
    try {
      await Promise.all(group.ids.map(id => client.delete(`/workouts/log/${id}`)));
      loadToday();
    } catch {
      setToday(before);
      Alert.alert("Couldn't remove entry", 'Check your connection and try again.');
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase();
  const visible = exercises.filter(e =>
    (category === 'all' || e.category === category) &&
    (kit === 'all' || KIT.find(k => k.key === kit)?.match.includes(e.equipment)) &&
    (!q || e.name?.toLowerCase().includes(q) || e.muscleGroup?.toLowerCase().includes(q) || kitLabel(e.equipment).includes(q))
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.textSub} colors={[Palette.brass]} progressBackgroundColor={Palette.surface2} />}
      >
        <FadeInView index={0}>
          <Text style={styles.title}>Train</Text>
          <Text style={styles.subtitle}>Log your sets and watch your numbers climb</Text>
        </FadeInView>

        {prBanner && (
          <AnimatedPressable onPress={() => setPrBanner(null)} scaleTo={0.98} accessibilityLabel="Dismiss personal record">
            <View style={styles.pr}>
              <View style={styles.prIcon}>
                <Ionicons name="trending-up" size={16} color="#06210F" />
              </View>
              <View style={styles.prText}>
                <Text style={styles.prTitle}>New personal record</Text>
                <Text style={styles.prSub}>{prBanner.name} · {prBanner.detail}</Text>
              </View>
            </View>
          </AnimatedPressable>
        )}

        {/* Today */}
        <FadeInView index={1}>
          <Card>
            <Text style={styles.label}>Today</Text>
            <View style={styles.stats}>
              <Stat value={today.exerciseCount} label="Exercises" loading={loadingToday} />
              <Stat value={today.totalSets}     label="Sets"      loading={loadingToday} />
              <Stat value={today.totalReps}     label="Reps"      loading={loadingToday} />
            </View>
            {!loadingToday && today.entries.length === 0 && (
              <Text style={styles.todayEmpty}>Nothing logged yet. Pick an exercise below or generate a workout.</Text>
            )}
            {groupToday(today.entries).map(group => (
              <View key={group.key} style={[styles.entry, styles.divider]}>
                <View style={styles.entryInfo}>
                  <View style={styles.entryNameRow}>
                    <Text style={styles.entryName} numberOfLines={1}>{group.name}</Text>
                    {group.ids.some(id => prIds.has(id)) || group.pr ? <Text style={styles.prTag}>PR</Text> : null}
                  </View>
                  <Text style={styles.entryMeta} numberOfLines={2}>{group.sets.some(s => s.weightKg > 0) ? setsSummary(group.sets) : `${setsSummary(group.sets)} reps · bodyweight`}</Text>
                </View>
                <Text style={styles.entrySets}>{group.sets.length} set{group.sets.length === 1 ? '' : 's'}</Text>
                <AnimatedPressable onPress={() => confirmDelete(group)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={`Remove ${group.name}`}>
                  <Ionicons name="close" size={16} color={Palette.textDim} />
                </AnimatedPressable>
              </View>
            ))}
          </Card>
        </FadeInView>

        <FadeInView index={2}>
          <PrimaryButton
            title="Generate a workout"
            subtitle="Pick your time and focus, get a plan"
            icon="flash"
            onPress={() => setShowGenerator(true)}
          />
        </FadeInView>

        {/* Library */}
        <FadeInView index={3} style={styles.libraryHead}>
          <Text style={styles.label}>Exercise library</Text>
          <Field
            icon="search-outline"
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercise or muscle"
            returnKeyType="search"
            right={query.length > 0 ? (
              <AnimatedPressable onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={Palette.textDim} />
              </AnimatedPressable>
            ) : null}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {CATEGORIES.map(c => (
              <Chip key={c.key} label={c.label} selected={category === c.key} onPress={() => setCategory(c.key)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {KIT.map(k => (
              <Chip key={k.key} label={k.label} capitalize={false} color={Palette.carbs} selected={kit === k.key} onPress={() => setKit(k.key)} />
            ))}
          </ScrollView>
        </FadeInView>

        {loadingEx ? (
          [0, 1, 2, 3].map(i => <Skeleton key={i} height={60} radius={Radius.lg} />)
        ) : exError ? (
          <Card variant="dashed" style={styles.emptyCard}>
            <Text style={styles.emptyText}>Couldn't load exercises.</Text>
            <AnimatedPressable onPress={() => { setLoadingEx(true); loadExercises(); }}>
              <Text style={styles.link}>Try again</Text>
            </AnimatedPressable>
          </Card>
        ) : visible.length === 0 ? (
          <Card variant="dashed" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No exercises match{q ? ` "${query.trim()}"` : ''}.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {visible.map((ex, i) => (
              <AnimatedPressable
                key={ex.id}
                scaleTo={0.98}
                onPress={() => { tap(); setLogExercise(ex); }}
                style={[styles.exRow, i > 0 && styles.divider]}
                accessibilityLabel={`Log ${ex.name}`}
              >
                <View style={styles.exIcon}>
                  <Ionicons name={CATEGORY_ICON[ex.category] || 'fitness-outline'} size={16} color={Palette.textSub} />
                </View>
                <View style={styles.exInfo}>
                  <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                  <Text style={styles.exMeta} numberOfLines={1}>{[ex.muscleGroup?.replace(/_/g, ' '), kitLabel(ex.equipment)].filter(Boolean).join(' · ')}</Text>
                </View>
                <Text style={styles.exDefault}>{ex.defaultSets}×{ex.defaultReps}</Text>
                <AnimatedPressable
                  onPress={() => { tap(); setHistoryExercise(ex); }}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  accessibilityLabel={`${ex.name} history`}
                >
                  <Ionicons name="stats-chart-outline" size={18} color={Palette.textSub} />
                </AnimatedPressable>
              </AnimatedPressable>
            ))}
          </Card>
        )}
      </ScrollView>

      <LogSetSheet exercise={logExercise} onClose={() => setLogExercise(null)} onSave={saveLog} />
      <ExerciseHistorySheet exercise={historyExercise} onClose={() => setHistoryExercise(null)} />

      <Modal visible={showGenerator} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowGenerator(false)}>
        <WorkoutGeneratorScreen visible={showGenerator} onClose={() => { setShowGenerator(false); loadToday(); }} />
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ value, label, loading }) {
  return (
    <View style={styles.stat}>
      {loading ? <Skeleton width={36} height={30} /> : <Text style={styles.statValue}>{value}</Text>}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Palette.ink },
  content:  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl, gap: Spacing.md },
  title:    { fontFamily: Fonts.display, fontSize: 22, color: Palette.text },
  subtitle: { ...Type.small, color: Palette.textSub, marginTop: 2 },
  label:    { ...Type.label, color: Palette.textSub },
  divider:  { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  link:     { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.text, textDecorationLine: 'underline' },

  // PR banner (flat, no glow)
  pr:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md + 2, borderRadius: Radius.lg, backgroundColor: 'rgba(74,222,128,0.07)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  prIcon:  { width: 32, height: 32, borderRadius: 10, backgroundColor: Palette.success, alignItems: 'center', justifyContent: 'center' },
  prText:  { flex: 1 },
  prTitle: { ...Type.bodyB, color: Palette.text },
  prSub:   { ...Type.small, color: Palette.textSub, marginTop: 1 },

  // Today
  stats:      { flexDirection: 'row', marginTop: Spacing.sm, marginBottom: Spacing.xs },
  stat:       { flex: 1, gap: 2 },
  statValue:  { fontFamily: Fonts.numHeavy, fontSize: 32, color: Palette.text },
  statLabel:  { ...Type.small, color: Palette.textSub },
  todayEmpty: { ...Type.small, color: Palette.textSub, marginTop: Spacing.md },
  entry:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, marginTop: Spacing.xs },
  entryInfo:    { flex: 1, minWidth: 0 },
  entryNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  entryName:    { ...Type.body, color: Palette.text, flexShrink: 1 },
  prTag:        { fontFamily: Fonts.bodyHeavy, fontSize: 9, letterSpacing: 1, color: Palette.success },
  entryMeta:    { ...Type.small, color: Palette.textSub, marginTop: 1 },
  entrySets:    { fontFamily: Fonts.num, fontSize: 18, color: Palette.text },

  // Library
  libraryHead: { gap: Spacing.sm + 2, marginTop: Spacing.sm },
  chips:       { gap: Spacing.sm },
  listCard:    { paddingVertical: 0, paddingHorizontal: Spacing.md + 2 },
  exRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  exIcon:      { width: 32, height: 32, borderRadius: 10, backgroundColor: Palette.surface2, alignItems: 'center', justifyContent: 'center' },
  exInfo:      { flex: 1, minWidth: 0 },
  exName:      { ...Type.bodyB, color: Palette.text },
  exMeta:      { ...Type.small, color: Palette.textSub, marginTop: 1, textTransform: 'capitalize' },
  exDefault:   { fontFamily: Fonts.num, fontSize: 15, color: Palette.textSub },
  emptyCard:   { alignItems: 'flex-start', gap: Spacing.sm },
  emptyText:   { ...Type.body, color: Palette.textSub },
});
