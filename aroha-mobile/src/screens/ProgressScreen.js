import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import Card from '../components/ui/Card';
import Sheet from '../components/ui/Sheet';
import Stepper from '../components/ui/Stepper';
import LineChart from '../components/ui/LineChart';
import SegmentBar from '../components/ui/SegmentBar';
import PrimaryButton from '../components/ui/PrimaryButton';
import Skeleton from '../components/Skeleton';
import FadeInView from '../components/FadeInView';
import AnimatedCounter from '../components/AnimatedCounter';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { formatNumber } from '../utils/format';
import { success, warn } from '../utils/haptics';

function fmtDate(dateStr) {
  const [, m, d] = (dateStr || '').split('-');
  return m && d ? `${parseInt(d, 10)}/${parseInt(m, 10)}` : '';
}

function fmtKg(n) {
  const v = Math.round(Number(n) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function macroCalPercent(p, c, f) {
  const total = p * 4 + c * 4 + f * 9;
  if (total === 0) return { pct: 0, cct: 0, fct: 0 };
  const pct = Math.round((p * 4 / total) * 100);
  const cct = Math.round((c * 4 / total) * 100);
  return { pct, cct, fct: Math.max(0, 100 - pct - cct) };
}

export default function ProgressScreen({ route }) {
  const [summary, setSummary]             = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [showWeighIn, setShowWeighIn]     = useState(false);
  const [weightInput, setWeightInput]     = useState(70);
  const [saving, setSaving]               = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sRes, wRes] = await Promise.all([
        client.get('/analytics/summary'),
        client.get('/weight-logs/history?days=30'),
      ]);
      setSummary(sRes.data);
      setWeightHistory(wRes.data ?? []);
    } catch {
      // keep what's on screen; empty states cover first load
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const currentW = summary?.currentWeightKg ?? 0;

  function openWeighIn() {
    const last = weightHistory[weightHistory.length - 1]?.weightKg;
    setWeightInput(Math.round((currentW || last || 70) * 10) / 10);
    setShowWeighIn(true);
  }

  // Quick-log "Weight" opens the weigh-in sheet directly
  const openWeightLog = route?.params?.openWeightLog;
  useEffect(() => {
    if (openWeightLog) openWeighIn();
  }, [openWeightLog]);

  async function logWeight() {
    const kg = Number(weightInput);
    if (!kg || kg < 20 || kg > 500) {
      Alert.alert('Check the number', 'Enter a weight between 20 and 500 kg.');
      return;
    }
    setSaving(true);
    try {
      await client.post('/weight-logs', { weightKg: kg });
      success();
      setShowWeighIn(false);
      loadData();
    } catch {
      warn();
      Alert.alert("Couldn't save weight", 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const targetW      = summary?.targetWeightKg ?? null;
  const startW       = summary?.startWeightKg ?? null;
  const goalPct      = summary?.goalProgressPct ?? null;
  const delta        = summary?.weightChange30d ?? 0;
  const hasWeight    = currentW > 0;
  const hasGoal      = targetW != null && hasWeight;
  const remainingKg  = hasGoal ? Math.abs(targetW - currentW) : null;

  // Green when the change moves toward the goal; neutral when there's no goal
  const losing = hasGoal && startW != null ? targetW < startW : null;
  const deltaGood = losing === null ? null : losing ? delta < 0 : delta > 0;
  const deltaColor = delta === 0 || deltaGood === null ? Palette.textSub : deltaGood ? Palette.success : Palette.danger;

  const habitPct = Math.round((summary?.habitCompletionRate7d ?? 0) * 100);
  const p = summary?.avgProteinG7d ?? 0;
  const c = summary?.avgCarbsG7d ?? 0;
  const f = summary?.avgFatG7d ?? 0;
  const { pct, cct, fct } = macroCalPercent(p, c, f);
  const hasMacros = p + c + f > 0;
  const loggedDays = summary?.loggedDays7d ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.textSub} colors={[Palette.brass]} progressBackgroundColor={Palette.surface2} />}
      >
        <FadeInView index={0}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Your body, your week, your trend</Text>
        </FadeInView>

        {/* Weight hero */}
        <FadeInView index={1}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.label}>Weight</Text>
              {hasWeight && delta !== 0 && (
                <View style={[styles.deltaChip, { borderColor: deltaColor + '55' }]}>
                  <Ionicons name={delta < 0 ? 'arrow-down' : 'arrow-up'} size={11} color={deltaColor} />
                  <Text style={[styles.deltaText, { color: deltaColor }]}>{fmtKg(Math.abs(delta))} kg · 30 days</Text>
                </View>
              )}
            </View>
            <View style={styles.bigRow}>
              {loading ? (
                <Skeleton width={130} height={52} radius={Radius.sm} />
              ) : hasWeight ? (
                <>
                  <Text style={styles.big}>{fmtKg(currentW)}</Text>
                  <Text style={styles.bigUnit}>kg</Text>
                </>
              ) : (
                <Text style={styles.noWeight}>Log your first weigh-in to start tracking.</Text>
              )}
            </View>

            {hasGoal && (
              <View style={styles.goal}>
                <View style={styles.row}>
                  <Text style={styles.goalLabel}>Goal progress</Text>
                  <Text style={styles.goalPct}>{Math.max(0, Math.min(100, Math.round(goalPct ?? 0)))}%</Text>
                </View>
                <SegmentBar progress={Math.max(0, Math.min(1, (goalPct ?? 0) / 100))} segments={12} color={Palette.text} height={6} />
                <View style={styles.goalStats}>
                  <GoalStat label="Start" value={startW != null ? `${fmtKg(startW)} kg` : '—'} />
                  <GoalStat label="Target" value={`${fmtKg(targetW)} kg`} />
                  <GoalStat label="Left" value={`${fmtKg(remainingKg)} kg`} align="flex-end" />
                </View>
              </View>
            )}
          </Card>
        </FadeInView>

        <FadeInView index={2}>
          <PrimaryButton title="Log today's weight" subtitle="One weigh-in a day keeps the trend honest" icon="add" onPress={openWeighIn} />
        </FadeInView>

        {/* Weight trend */}
        <FadeInView index={3}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.label}>Last 30 days</Text>
              {weightHistory.length > 0 && <Text style={styles.meta}>{weightHistory.length} weigh-in{weightHistory.length !== 1 ? 's' : ''}</Text>}
            </View>
            {loading ? (
              <Skeleton height={150} radius={Radius.md} style={{ marginTop: Spacing.md }} />
            ) : weightHistory.length >= 2 ? (
              <View style={styles.chart}>
                <LineChart
                  points={weightHistory.map(w => ({ label: fmtDate(w.loggedDate), value: w.weightKg }))}
                  height={170}
                  color={Palette.carbs}
                />
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="analytics-outline" size={28} color={Palette.textDim} />
                <Text style={styles.emptyText}>
                  {weightHistory.length === 0 ? 'Your weight trend shows up after two weigh-ins.' : 'One more weigh-in and your trend line appears.'}
                </Text>
              </View>
            )}
          </Card>
        </FadeInView>

        {/* This week */}
        <FadeInView index={4}>
          <Text style={[styles.label, styles.sectionLabel]}>This week</Text>
          <View style={styles.tiles}>
            <Tile label="Workouts"     value={summary?.workoutsThisWeek ?? 0}   icon="barbell-outline"          color={Palette.protein} loading={loading} />
            <Tile label="Avg calories" value={summary?.avgCalories7d ?? 0}      icon="flame-outline"            color={Palette.kcal}    loading={loading} unit="kcal" />
            <Tile label="Burned"       value={summary?.caloriesBurnedWeek ?? 0} icon="trending-down-outline"    color={Palette.success} loading={loading} unit="kcal" />
            <Tile label="Habits done"  value={habitPct}                         icon="checkmark-done-outline"   color={Palette.carbs}   loading={loading} unit="%" />
          </View>
        </FadeInView>

        {/* Macro split */}
        <FadeInView index={5}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.label}>Macro split · 7 days</Text>
              {hasMacros && <Text style={styles.meta}>{loggedDays} logged day{loggedDays !== 1 ? 's' : ''}</Text>}
            </View>
            {loading ? (
              <Skeleton height={60} radius={Radius.md} style={{ marginTop: Spacing.md }} />
            ) : hasMacros ? (
              <>
                <View style={styles.stack}>
                  {pct > 0 && <View style={[styles.stackPart, { flex: pct, backgroundColor: Palette.protein }]} />}
                  {cct > 0 && <View style={[styles.stackPart, { flex: cct, backgroundColor: Palette.carbs }]} />}
                  {fct > 0 && <View style={[styles.stackPart, { flex: fct, backgroundColor: Palette.fat }]} />}
                </View>
                <MacroRow color={Palette.protein} label="Protein" grams={p} pct={pct} />
                <MacroRow color={Palette.carbs}   label="Carbs"   grams={c} pct={cct} />
                <MacroRow color={Palette.fat}     label="Fat"     grams={f} pct={fct} />
                <Text style={styles.note}>Daily average, share of calories</Text>
              </>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="pie-chart-outline" size={28} color={Palette.textDim} />
                <Text style={styles.emptyText}>Log meals in Food to see your macro split.</Text>
              </View>
            )}
          </Card>
        </FadeInView>
      </ScrollView>

      <Sheet visible={showWeighIn} onClose={() => setShowWeighIn(false)} title="Today's weigh-in" subtitle="Saving again today replaces today's entry" showClose>
        <View style={styles.sheetBody}>
          <View style={styles.stepperRow}>
            <Stepper label="Weight" value={weightInput} onChange={setWeightInput} min={20} max={500} step={0.1} decimals={1} unit="kg" />
          </View>
          {hasWeight && (
            <Text style={styles.sheetHint}>
              Last logged {fmtKg(currentW)} kg
              {weightInput !== currentW ? ` · ${weightInput > currentW ? '+' : '−'}${fmtKg(Math.abs(weightInput - currentW))} kg` : ''}
            </Text>
          )}
          <PrimaryButton title={saving ? 'Saving…' : 'Save weight'} icon="checkmark" onPress={logWeight} style={saving && { opacity: 0.6 }} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function GoalStat({ label, value, align = 'flex-start' }) {
  return (
    <View style={[styles.goalStat, { alignItems: align }]}>
      <Text style={styles.goalStatLabel}>{label}</Text>
      <Text style={styles.goalStatValue}>{value}</Text>
    </View>
  );
}

function Tile({ label, value, unit, icon, color, loading }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: color + '1F' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      {loading ? <Skeleton width={60} height={28} /> : (
        <Text style={styles.tileValue}>
          <AnimatedCounter value={Number(value) || 0} style={styles.tileValue} format={formatNumber} />
          {!!unit && <Text style={styles.tileUnit}> {unit}</Text>}
        </Text>
      )}
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function MacroRow({ color, label, grams, pct }) {
  return (
    <View style={styles.macroRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroGrams}>{Math.round(grams)} g</Text>
      <Text style={styles.macroPct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Palette.ink },
  content:  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl, gap: Spacing.md },
  title:    { fontFamily: Fonts.display, fontSize: 22, color: Palette.text },
  subtitle: { ...Type.small, color: Palette.textSub, marginTop: 2 },
  label:    { ...Type.label, color: Palette.textSub },
  meta:     { ...Type.small, color: Palette.textSub },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Weight hero
  deltaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.pill, borderWidth: 1 },
  deltaText: { fontFamily: Fonts.bodyBold, fontSize: 11 },
  bigRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginTop: Spacing.xs, minHeight: 56 },
  big:       { ...Type.hero, color: Palette.text },
  bigUnit:   { fontFamily: Fonts.num, fontSize: 18, color: Palette.textSub, marginBottom: 8 },
  noWeight:  { ...Type.body, color: Palette.textSub, alignSelf: 'center' },
  goal:      { marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Palette.lineSoft, gap: Spacing.sm + 2 },
  goalLabel: { ...Type.bodyB, color: Palette.text },
  goalPct:   { fontFamily: Fonts.num, fontSize: 18, color: Palette.text },
  goalStats: { flexDirection: 'row', marginTop: Spacing.xs },
  goalStat:  { flex: 1, gap: 2 },
  goalStatLabel: { ...Type.small, color: Palette.textSub },
  goalStatValue: { fontFamily: Fonts.num, fontSize: 17, color: Palette.text },

  // Trend
  chart:     { marginTop: Spacing.md },
  empty:     { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyText: { ...Type.small, color: Palette.textSub, textAlign: 'center', maxWidth: 240 },

  // This week
  sectionLabel: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  tiles:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile:      { width: '48%', flexGrow: 1, backgroundColor: Palette.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.lineSoft, padding: Spacing.md + 2, gap: 4 },
  tileIcon:  { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  tileValue: { fontFamily: Fonts.numHeavy, fontSize: 28, color: Palette.text },
  tileUnit:  { fontFamily: Fonts.num, fontSize: 13, color: Palette.textSub },
  tileLabel: { ...Type.small, color: Palette.textSub },

  // Macros
  stack:      { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2, marginTop: Spacing.md, marginBottom: Spacing.sm },
  stackPart:  { height: '100%' },
  macroRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  dot:        { width: 8, height: 8, borderRadius: 2 },
  macroLabel: { ...Type.body, color: Palette.text, flex: 1 },
  macroGrams: { fontFamily: Fonts.num, fontSize: 16, color: Palette.text, width: 60, textAlign: 'right' },
  macroPct:   { fontFamily: Fonts.num, fontSize: 16, color: Palette.textSub, width: 44, textAlign: 'right' },
  note:       { ...Type.small, color: Palette.textDim, marginTop: Spacing.xs },

  // Sheet
  sheetBody: { gap: Spacing.lg },
  stepperRow: { flexDirection: 'row' },
  sheetHint: { ...Type.small, color: Palette.textSub, textAlign: 'center' },
});
