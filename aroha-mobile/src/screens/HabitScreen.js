import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import Sheet from '../components/ui/Sheet';
import Field from '../components/ui/Field';
import IconButton from '../components/ui/IconButton';
import SegmentBar from '../components/ui/SegmentBar';
import PrimaryButton from '../components/ui/PrimaryButton';
import Skeleton from '../components/Skeleton';
import AnimatedPressable from '../components/AnimatedPressable';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { tap, success, warn } from '../utils/haptics';

// ─── Constants ───────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_LABELS   = ['Sa','Su','Mo','Tu','We','Th','Fr'];
// JS getDay(): 0=Sun..6=Sat → our column order Sa Su Mo Tu We Th Fr
const JS_DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

const PRESET_COLORS = [Palette.kcal, Palette.protein, Palette.carbs, Palette.fat, Palette.water, Palette.success, Palette.violet, Palette.danger];
const PRESET_ICONS  = ['fitness-outline','book-outline','water-outline','bed-outline',
                       'walk-outline','fast-food-outline','musical-notes-outline','barbell-outline',
                       'leaf-outline','sunny-outline','phone-portrait-outline','heart-outline'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getWeeksOfMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks = [];
  let currentWeek = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const colIndex = JS_DAY_ORDER.indexOf(new Date(year, month - 1, d).getDay());
    if (d === 1) for (let i = 0; i < colIndex; i++) currentWeek.push(null);
    currentWeek.push(d);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}

function pct(done, total) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// ─── Add habit sheet ─────────────────────────────────────────────────────────
function AddHabitSheet({ visible, onClose, onAdd }) {
  const [name, setName]   = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon]   = useState(PRESET_ICONS[0]);

  useEffect(() => {
    if (visible) { setName(''); setColor(PRESET_COLORS[0]); setIcon(PRESET_ICONS[0]); }
  }, [visible]);

  return (
    <Sheet visible={visible} onClose={onClose} title="New habit" subtitle="Something small you'll do every day" showClose>
      <View style={styles.sheetBody}>
        <Field value={name} onChangeText={setName} placeholder="e.g. Read 20 minutes" autoFocus autoCorrect />

        <View style={styles.preview}>
          <View style={[styles.previewIcon, { backgroundColor: color + '1F' }]}>
            <Ionicons name={icon} size={18} color={color} />
          </View>
          <Text style={styles.previewName} numberOfLines={1}>{name.trim() || 'Your habit'}</Text>
        </View>

        <Text style={styles.sheetLabel}>Colour</Text>
        <View style={styles.swatches}>
          {PRESET_COLORS.map(c => (
            <AnimatedPressable
              key={c}
              onPress={() => { tap(); setColor(c); }}
              scaleTo={0.88}
              style={[styles.swatchRing, color === c && { borderColor: c }]}
              accessibilityLabel="Pick colour"
              accessibilityState={{ selected: color === c }}
            >
              <View style={[styles.swatch, { backgroundColor: c }]} />
            </AnimatedPressable>
          ))}
        </View>

        <Text style={styles.sheetLabel}>Icon</Text>
        <View style={styles.icons}>
          {PRESET_ICONS.map(ic => (
            <AnimatedPressable
              key={ic}
              onPress={() => { tap(); setIcon(ic); }}
              scaleTo={0.9}
              style={[styles.iconBtn, icon === ic && { borderColor: color, backgroundColor: color + '14' }]}
              accessibilityState={{ selected: icon === ic }}
            >
              <Ionicons name={ic} size={19} color={icon === ic ? color : Palette.textSub} />
            </AnimatedPressable>
          ))}
        </View>

        <PrimaryButton
          title="Add habit"
          icon="add"
          onPress={() => {
            if (!name.trim()) { Alert.alert('Name your habit', 'For example: Read 20 minutes.'); return; }
            onAdd({ name: name.trim(), color, icon });
          }}
          style={!name.trim() && styles.disabled}
        />
      </View>
    </Sheet>
  );
}

// ─── Completion chart ────────────────────────────────────────────────────────
function CompletionChart({ habits, year, month, weeks }) {
  const [tab, setTab] = useState('Day');
  const today = new Date();
  const total = habits.length;
  const doneOn = day => habits.filter(h => (h.completedDays || []).includes(day)).length;
  let bars = [];

  if (tab === 'Day') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = DAY_LABELS[JS_DAY_ORDER.indexOf(d.getDay())];
      if (d.getMonth() + 1 !== month || d.getFullYear() !== year) {
        bars.push({ label, pct: 0, faded: true });
        continue;
      }
      bars.push({ label, pct: pct(doneOn(d.getDate()), total), current: i === 0 });
    }
  } else if (tab === 'Week') {
    weeks.forEach((week, wi) => {
      const days = week.filter(Boolean);
      bars.push({ label: `W${wi + 1}`, pct: pct(days.reduce((s, d) => s + doneOn(d), 0), total * days.length) });
    });
  } else {
    const daysInMonth = new Date(year, month, 0).getDate();
    const done = habits.reduce((s, h) => s + (h.completedDays?.length || 0), 0);
    bars.push({ label: MONTH_NAMES[month - 1].slice(0, 3), pct: pct(done, total * daysInMonth), current: true });
  }

  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.label}>Completion</Text>
        <View style={styles.tabs}>
          {['Day', 'Week', 'Month'].map(t => <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} style={styles.tabChip} />)}
        </View>
      </View>
      <View style={styles.chart}>
        <View style={styles.yAxis}>
          {['100', '50', '0'].map(l => <Text key={l} style={styles.yLabel}>{l}%</Text>)}
        </View>
        <View style={styles.barsArea}>
          {[0, 50, 100].map(p => <View key={p} style={[styles.gridLine, { bottom: `${p}%` }]} />)}
          <View style={styles.barsRow}>
            {bars.map((b, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${b.pct}%`, opacity: b.faded ? 0.25 : b.current ? 1 : 0.7 }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.barLabels}>
        <View style={styles.yAxisSpacer} />
        {bars.map((b, i) => <Text key={i} style={[styles.barLabel, b.current && styles.barLabelOn]}>{b.label}</Text>)}
      </View>
    </Card>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function HabitScreen() {
  const now = new Date();
  const [year, setYear]           = useState(now.getFullYear());
  const [month, setMonth]         = useState(now.getMonth() + 1);
  const [weekIndex, setWeekIndex] = useState(0);
  const [habits, setHabits]       = useState([]);
  const [weeks, setWeeks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]     = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get(`/habits/monthly?year=${year}&month=${month}`);
      setHabits(data.habits || []);
      const w = getWeeksOfMonth(year, month);
      setWeeks(w);
      const n = new Date();
      if (year === n.getFullYear() && month === n.getMonth() + 1) {
        const idx = w.findIndex(week => week.includes(n.getDate()));
        setWeekIndex(idx >= 0 ? idx : 0);
      } else {
        setWeekIndex(0);
      }
    } catch {
      Alert.alert("Couldn't load habits", 'Pull down to try again.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function shiftMonth(dir) {
    tap();
    const m = month + dir;
    if (m < 1) { setYear(y => y - 1); setMonth(12); }
    else if (m > 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m);
  }

  function setDone(habitId, day, done) {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const days = new Set(h.completedDays || []);
      if (done) days.add(day); else days.delete(day);
      return { ...h, completedDays: Array.from(days), completedCount: days.size };
    }));
  }

  async function toggle(habit, day) {
    if (!day) return;
    const wasDone = (habit.completedDays || []).includes(day);
    if (wasDone) tap(); else success();
    setDone(habit.id, day, !wasDone); // optimistic
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    try {
      await client.post(`/habits/${habit.id}/toggle?date=${date}`);
    } catch {
      setDone(habit.id, day, wasDone);
      warn();
      Alert.alert("Couldn't update habit", 'Check your connection and try again.');
    }
  }

  async function addHabit(req) {
    setShowAdd(false);
    try {
      await client.post('/habits', req);
      success();
      load();
    } catch {
      warn();
      Alert.alert("Couldn't add habit", 'Check your connection and try again.');
    }
  }

  function confirmDelete(habit) {
    tap();
    Alert.alert('Delete habit?', `"${habit.name}" and its history will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await client.delete(`/habits/${habit.id}`); load(); }
        catch { Alert.alert("Couldn't delete habit", 'Check your connection and try again.'); }
      }},
    ]);
  }

  // ── Metrics ──
  const isThisMonth  = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDate    = isThisMonth ? now.getDate() : null;
  const currentWeek  = weeks[weekIndex] || [];
  const weekDays     = currentWeek.filter(Boolean);
  const total        = habits.length;
  const doneToday    = todayDate ? habits.filter(h => (h.completedDays || []).includes(todayDate)).length : 0;
  const weekDone     = weekDays.reduce((s, d) => s + habits.filter(h => (h.completedDays || []).includes(d)).length, 0);
  const weekPct      = pct(weekDone, total * weekDays.length);
  const perfectWeek  = weekDays.length === 0 ? 0 : habits.filter(h => weekDays.every(d => (h.completedDays || []).includes(d))).length;
  const rangeLabel   = weekDays.length ? `${weekDays[0]}–${weekDays[weekDays.length - 1]} ${MONTH_NAMES[month - 1].slice(0, 3)}` : '';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.textSub} colors={[Palette.brass]} progressBackgroundColor={Palette.surface2} />}
      >
        {/* Month */}
        <View style={styles.monthRow}>
          <IconButton name="chevron-back" onPress={() => shiftMonth(-1)} accessibilityLabel="Previous month" />
          <Text style={styles.month}>{MONTH_NAMES[month - 1]} {year}</Text>
          <IconButton name="chevron-forward" onPress={() => shiftMonth(1)} accessibilityLabel="Next month" />
        </View>

        {loading ? (
          <>
            <Skeleton height={120} radius={Radius.lg} />
            <Skeleton height={220} radius={Radius.lg} />
          </>
        ) : total === 0 ? (
          <Card variant="dashed" style={styles.emptyCard}>
            <Ionicons name="checkmark-done-outline" size={30} color={Palette.textDim} />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyText}>Start with one small thing you want to do every day. Tick it off here and watch your week fill up.</Text>
            <PrimaryButton title="Add your first habit" icon="add" onPress={() => setShowAdd(true)} containerStyle={styles.stretch} />
          </Card>
        ) : (
          <>
            {/* Summary */}
            <Card>
              <View style={styles.summary}>
                <View style={styles.summaryCol}>
                  <Text style={styles.label}>Today</Text>
                  <Text style={styles.big}>
                    {todayDate ? doneToday : '–'}<Text style={styles.bigOf}>/{total}</Text>
                  </Text>
                  <Text style={styles.meta}>{todayDate ? (doneToday === total ? 'All done. Nice.' : `${total - doneToday} left today`) : 'Not this month'}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.label}>This week</Text>
                  <Text style={styles.big}>{weekPct}<Text style={styles.bigOf}>%</Text></Text>
                  <Text style={styles.meta}>{perfectWeek} perfect habit{perfectWeek !== 1 ? 's' : ''}</Text>
                </View>
              </View>
              {!!todayDate && <SegmentBar progress={total ? doneToday / total : 0} segments={Math.max(total, 1)} color={Palette.success} height={6} style={styles.summaryBar} />}
            </Card>

            {/* Week grid */}
            <Card style={styles.gridCard}>
              <View style={styles.weekRow}>
                <IconButton name="chevron-back" size={32} onPress={() => setWeekIndex(i => Math.max(0, i - 1))} accessibilityLabel="Previous week" style={weekIndex === 0 && styles.disabled} />
                <View style={styles.weekCenter}>
                  <Text style={styles.weekTitle}>Week {weekIndex + 1} of {weeks.length}</Text>
                  <Text style={styles.meta}>{rangeLabel}</Text>
                </View>
                <IconButton name="chevron-forward" size={32} onPress={() => setWeekIndex(i => Math.min(weeks.length - 1, i + 1))} accessibilityLabel="Next week" style={weekIndex === weeks.length - 1 && styles.disabled} />
              </View>

              <View style={styles.gridHead}>
                <View style={styles.nameCol} />
                {DAY_LABELS.map((d, i) => {
                  const dayNum = currentWeek[i];
                  const isToday = !!todayDate && dayNum === todayDate;
                  return (
                    <View key={d} style={[styles.dayCol, isToday && styles.todayCol]}>
                      <Text style={[styles.dayLabel, isToday && styles.todayText]}>{d}</Text>
                      <Text style={[styles.dayNum, isToday && styles.todayText]}>{dayNum ?? ''}</Text>
                    </View>
                  );
                })}
              </View>

              {habits.map((habit, hi) => {
                const doneSet = new Set(habit.completedDays || []);
                return (
                  <View key={habit.id} style={[styles.habitRow, hi > 0 && styles.divider]}>
                    <AnimatedPressable
                      containerStyle={styles.nameCol}
                      style={styles.nameCell}
                      onLongPress={() => confirmDelete(habit)}
                      scaleTo={0.97}
                      accessibilityHint="Long press to delete"
                    >
                      <View style={[styles.habitIcon, { backgroundColor: (habit.color || Palette.violet) + '1F' }]}>
                        <Ionicons name={habit.icon || 'checkmark-circle-outline'} size={13} color={habit.color || Palette.violet} />
                      </View>
                      <Text style={styles.habitName} numberOfLines={2}>{habit.name}</Text>
                    </AnimatedPressable>
                    {currentWeek.map((dayNum, i) => {
                      const done = !!dayNum && doneSet.has(dayNum);
                      const isToday = !!todayDate && dayNum === todayDate;
                      const c = habit.color || Palette.violet;
                      return (
                        <View key={i} style={[styles.dayCol, isToday && styles.todayCol]}>
                          {dayNum ? (
                            <AnimatedPressable
                              onPress={() => toggle(habit, dayNum)}
                              scaleTo={0.85}
                              style={[styles.check, done && { backgroundColor: c, borderColor: c }]}
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: done }}
                              accessibilityLabel={`${habit.name}, day ${dayNum}`}
                            >
                              {done && <Ionicons name="checkmark" size={14} color={Palette.ink} />}
                            </AnimatedPressable>
                          ) : <View style={styles.checkEmpty} />}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
              <Text style={styles.hint}>Tap a box to tick it off · long press a habit to delete it</Text>
            </Card>

            <CompletionChart habits={habits} year={year} month={month} weeks={weeks} />

            <PrimaryButton title="New habit" subtitle="Add something to track every day" icon="add" onPress={() => setShowAdd(true)} />
          </>
        )}
      </ScrollView>

      <AddHabitSheet visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addHabit} />
    </SafeAreaView>
  );
}

const CHECK = 28;

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Palette.ink },
  content:  { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:    { ...Type.label, color: Palette.textSub },
  meta:     { ...Type.small, color: Palette.textSub },
  divider:  { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  disabled: { opacity: 0.35 },
  stretch:  { alignSelf: 'stretch' },

  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  month:    { fontFamily: Fonts.display, fontSize: 18, color: Palette.text },

  // Empty
  emptyCard:  { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyTitle: { ...Type.h2, color: Palette.text },
  emptyText:  { ...Type.body, color: Palette.textSub, textAlign: 'center', marginBottom: Spacing.md },

  // Summary
  summary:        { flexDirection: 'row' },
  summaryCol:     { flex: 1, gap: 2 },
  summaryDivider: { width: 1, backgroundColor: Palette.lineSoft, marginHorizontal: Spacing.lg },
  big:            { fontFamily: Fonts.numHeavy, fontSize: 40, lineHeight: 44, color: Palette.text, marginTop: Spacing.xs },
  bigOf:          { fontFamily: Fonts.num, fontSize: 18, color: Palette.textSub },
  summaryBar:     { marginTop: Spacing.lg },

  // Grid
  gridCard:   { paddingHorizontal: Spacing.md },
  weekRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  weekCenter: { flex: 1, alignItems: 'center' },
  weekTitle:  { ...Type.bodyB, color: Palette.text },
  gridHead:   { flexDirection: 'row', alignItems: 'flex-end', paddingBottom: Spacing.sm },
  nameCol:    { flex: 1, minWidth: 0 },
  dayCol:     { width: 34, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 10 },
  todayCol:   { backgroundColor: 'rgba(255,255,255,0.05)' },
  dayLabel:   { fontFamily: Fonts.bodyBold, fontSize: 10, color: Palette.textSub },
  dayNum:     { fontFamily: Fonts.num, fontSize: 13, color: Palette.textDim, marginTop: 1 },
  todayText:  { color: Palette.text },
  habitRow:   { flexDirection: 'row', alignItems: 'center' },
  nameCell:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingRight: Spacing.xs, paddingVertical: Spacing.sm },
  habitIcon:  { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  habitName:  { ...Type.small, fontFamily: Fonts.bodySemi, color: Palette.text, flex: 1 },
  check:      { width: CHECK, height: CHECK, borderRadius: 9, borderWidth: 1.5, borderColor: Palette.line, alignItems: 'center', justifyContent: 'center' },
  checkEmpty: { width: CHECK, height: CHECK },
  hint:       { ...Type.small, color: Palette.textDim, textAlign: 'center', marginTop: Spacing.md },

  // Chart
  tabs:        { flexDirection: 'row', gap: 6 },
  tabChip:     { paddingHorizontal: Spacing.md, paddingVertical: 5 },
  chart:       { flexDirection: 'row', height: 120, marginTop: Spacing.lg },
  yAxis:       { width: 36, justifyContent: 'space-between', marginTop: -6, marginBottom: -6 },
  yAxisSpacer: { width: 36 },
  yLabel:      { fontFamily: Fonts.bodySemi, fontSize: 10, color: Palette.textDim },
  barsArea:    { flex: 1 },
  gridLine:    { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Palette.lineSoft },
  barsRow:     { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'flex-end' },
  barCol:      { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack:    { width: 16, height: '100%', justifyContent: 'flex-end' },
  barFill:     { width: '100%', backgroundColor: Palette.success, borderRadius: 5, minHeight: 2 },
  barLabels:   { flexDirection: 'row', marginTop: Spacing.sm },
  barLabel:    { flex: 1, textAlign: 'center', fontFamily: Fonts.bodySemi, fontSize: 10, color: Palette.textDim },
  barLabelOn:  { color: Palette.text },

  // Sheet
  sheetBody:   { gap: Spacing.md, paddingBottom: Spacing.sm },
  sheetLabel:  { ...Type.label, color: Palette.textSub, marginTop: Spacing.xs },
  preview:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Palette.surface2 },
  previewIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  previewName: { ...Type.bodyB, color: Palette.text, flex: 1 },
  swatches:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatchRing:  { padding: 2, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  swatch:      { width: 28, height: 28, borderRadius: 14 },
  icons:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  iconBtn:     { width: 46, height: 46, borderRadius: 14, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.lineSoft, alignItems: 'center', justifyContent: 'center' },
});
