import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import client from '../api/client';

// ─── Constants ───────────────────────────────────────────────────────────────
const MONTH_NAMES  = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
const DAY_LABELS   = ['Sa','Su','Mo','Tu','We','Th','Fr'];
// JS getDay(): 0=Sun,1=Mon,...,6=Sat  →  our order: Sa=6,Su=0,Mo=1,Tu=2,We=3,Th=4,Fr=5
const JS_DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

const PRESET_COLORS = ['#E2B714','#7B2FBE','#2ECC71','#E74C3C','#2E86AB','#E67E22','#1ABC9C','#9B59B6'];
const PRESET_ICONS  = ['fitness-outline','book-outline','water-outline','bed-outline',
                       'walk-outline','fast-food-outline','musical-notes-outline','barbell-outline'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getWeeksOfMonth(year, month) {
  // Returns array of weeks; each week is array of {date, dayOfMonth} or null if out of month
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks = [];
  let currentWeek = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const jsDay = new Date(year, month - 1, d).getDay(); // 0=Sun..6=Sat
    const colIndex = JS_DAY_ORDER.indexOf(jsDay);

    if (d === 1) {
      // Pad start of first week with nulls
      for (let i = 0; i < colIndex; i++) currentWeek.push(null);
    }

    currentWeek.push(d);

    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  }

  // Pad last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push([...currentWeek]);
  }

  return weeks;
}

// ─── Add Habit Modal ─────────────────────────────────────────────────────────
function AddHabitModal({ visible, onClose, onAdd }) {
  const [name, setName]   = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon]   = useState(PRESET_ICONS[0]);

  function submit() {
    if (!name.trim()) { Alert.alert('Enter a habit name'); return; }
    onAdd({ name: name.trim(), color, icon });
    setName(''); setColor(PRESET_COLORS[0]); setIcon(PRESET_ICONS[0]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>New Habit</Text>

          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Wake up at 5, Read 30 min..."
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={styles.modalSection}>Color</Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          <Text style={styles.modalSection}>Icon</Text>
          <View style={styles.iconRow}>
            {PRESET_ICONS.map(ic => (
              <TouchableOpacity
                key={ic}
                style={[styles.iconBtn, icon === ic && { borderColor: color }]}
                onPress={() => setIcon(ic)}
              >
                <Ionicons name={ic} size={20} color={icon === ic ? color : Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.addBtn, { backgroundColor: color }]} onPress={submit} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>Add Habit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Progress Chart ──────────────────────────────────────────────────────────
function ProgressChart({ habits, monthData, year, month, weeks, weekIndex }) {
  const [tab, setTab] = useState('Day');
  const today = new Date();

  // Build chart bars based on tab
  let bars = [];

  if (tab === 'Day') {
    // Last 7 days completion %
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (d.getMonth() + 1 !== month || d.getFullYear() !== year) {
        bars.push({ label: DAY_LABELS[JS_DAY_ORDER.indexOf(d.getDay())] || '?', pct: 0, faded: true });
        continue;
      }
      const dayNum = d.getDate();
      const total = habits.length;
      const done  = total === 0 ? 0 : habits.filter(h => (h.completedDays || []).includes(dayNum)).length;
      const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
      bars.push({ label: DAY_LABELS[JS_DAY_ORDER.indexOf(d.getDay())], pct });
    }
  } else if (tab === 'Week') {
    // Each week of the month
    weeks.forEach((week, wi) => {
      const validDays = week.filter(Boolean);
      const total     = habits.length;
      const done = total === 0 ? 0 : validDays.reduce((sum, d) =>
        sum + habits.filter(h => (h.completedDays || []).includes(d)).length, 0);
      const maxPossible = total * validDays.length;
      const pct = maxPossible === 0 ? 0 : Math.round((done / maxPossible) * 100);
      bars.push({ label: `W${wi + 1}`, pct });
    });
  } else {
    // Month — show overall % for this month
    const daysInMonth = monthData?.daysInMonth || 30;
    const total = habits.length;
    const totalPossible = total * daysInMonth;
    const done = total === 0 ? 0 : habits.reduce((sum, h) => sum + (h.completedDays?.length || 0), 0);
    const pct = totalPossible === 0 ? 0 : Math.round((done / totalPossible) * 100);
    bars.push({ label: MONTH_NAMES[month - 1].slice(0, 3), pct });
  }

  return (
    <View style={styles.chartCard}>
      {/* Tab row */}
      <View style={styles.chartTabRow}>
        {['Day','Week','Month'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.chartTab, tab === t && styles.chartTabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.chartTabText, tab === t && styles.chartTabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Y-axis labels + bars */}
      <View style={styles.chartArea}>
        <View style={styles.yAxis}>
          {['100%','50%','0%'].map(l => (
            <Text key={l} style={styles.yLabel}>{l}</Text>
          ))}
        </View>
        <View style={styles.barsArea}>
          {/* Grid lines */}
          {[0, 50, 100].map(pct => (
            <View key={pct} style={[styles.gridLine, { bottom: `${pct}%` }]} />
          ))}
          {/* Bars */}
          <View style={styles.barsRow}>
            {bars.map((b, i) => (
              <View key={i} style={styles.barWrapper}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${b.pct}%`, opacity: b.faded ? 0.3 : 1 }]} />
                </View>
                <Text style={styles.barLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HabitScreen() {
  const now = new Date();
  const [year, setYear]         = useState(now.getFullYear());
  const [month, setMonth]       = useState(now.getMonth() + 1);
  const [weekIndex, setWeekIndex] = useState(0);
  const [monthData, setMonthData] = useState(null);
  const [habits, setHabits]     = useState([]);
  const [weeks, setWeeks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/habits/monthly?year=${year}&month=${month}`);
      setMonthData(data);
      setHabits(data.habits || []);
      const w = getWeeksOfMonth(year, month);
      setWeeks(w);
      // Jump to current week if same month
      if (year === now.getFullYear() && month === now.getMonth() + 1) {
        const todayDate = now.getDate();
        const idx = w.findIndex(week => week.includes(todayDate));
        setWeekIndex(idx >= 0 ? idx : 0);
      } else {
        setWeekIndex(0);
      }
    } catch {
      Alert.alert('Error', 'Could not load habits.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  async function toggle(habitId, day) {
    if (!day) return;
    const date = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    try {
      await client.post(`/habits/${habitId}/toggle?date=${date}`);
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        const days = new Set(h.completedDays || []);
        days.has(day) ? days.delete(day) : days.add(day);
        return { ...h, completedDays: Array.from(days), completedCount: days.size };
      }));
    } catch {
      Alert.alert('Error', 'Could not update.');
    }
  }

  async function addHabit(req) {
    setShowModal(false);
    try {
      await client.post('/habits', req);
      load();
    } catch {
      Alert.alert('Error', 'Could not add habit.');
    }
  }

  async function deleteHabit(id, name) {
    Alert.alert('Delete', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await client.delete(`/habits/${id}`); load(); }
        catch { Alert.alert('Error', 'Could not delete.'); }
      }},
    ]);
  }

  // Metrics
  const todayDate     = (year === now.getFullYear() && month === now.getMonth() + 1) ? now.getDate() : null;
  const currentWeek   = weeks[weekIndex] || [];
  const validWeekDays = currentWeek.filter(Boolean);

  const totalHabits = habits.length;

  const dayDone    = todayDate ? habits.filter(h => (h.completedDays || []).includes(todayDate)).length : 0;
  const dayNotDone = totalHabits - dayDone;
  const dayPct     = totalHabits === 0 ? 0 : Math.round((dayDone / totalHabits) * 100);

  const weekDoneTotal = validWeekDays.reduce((sum, d) =>
    sum + habits.filter(h => (h.completedDays || []).includes(d)).length, 0);
  const weekMaxPossible = totalHabits * validWeekDays.length;
  const weekPct = weekMaxPossible === 0 ? 0 : Math.round((weekDoneTotal / weekMaxPossible) * 100);
  const weekDoneHabits = validWeekDays.length === 0 ? 0
    : habits.filter(h => validWeekDays.every(d => (h.completedDays || []).includes(d))).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Month Header ── */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={prevMonth} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTH_NAMES[month - 1]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
            <Ionicons name="chevron-forward" size={22} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addFab} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={18} color={Colors.background} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.accentGold} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* ── Grid Card ── */}
            <View style={styles.gridCard}>
              {/* Week nav */}
              <View style={styles.weekNavRow}>
                <TouchableOpacity
                  onPress={() => setWeekIndex(i => Math.max(0, i - 1))}
                  disabled={weekIndex === 0}
                >
                  <Ionicons name="chevron-back" size={16} color={weekIndex === 0 ? Colors.textMuted : Colors.text} />
                </TouchableOpacity>
                <Text style={styles.weekLabel}>
                  Week {weekIndex + 1} of {weeks.length}
                </Text>
                <TouchableOpacity
                  onPress={() => setWeekIndex(i => Math.min(weeks.length - 1, i + 1))}
                  disabled={weekIndex === weeks.length - 1}
                >
                  <Ionicons name="chevron-forward" size={16} color={weekIndex === weeks.length - 1 ? Colors.textMuted : Colors.text} />
                </TouchableOpacity>
              </View>

              {/* Column headers: Habits | Sa Su Mo Tu We Th Fr */}
              <View style={styles.gridHeaderRow}>
                <Text style={styles.habitsColHeader}>Habits</Text>
                {DAY_LABELS.map((d, i) => {
                  const dayNum = currentWeek[i];
                  const isToday = todayDate && dayNum === todayDate;
                  return (
                    <View key={d} style={styles.dayColHeader}>
                      <Text style={[styles.dayColLabel, isToday && { color: Colors.accentGold }]}>{d}</Text>
                      {dayNum ? <Text style={[styles.dayColDate, isToday && { color: Colors.accentGold }]}>{dayNum}</Text> : null}
                    </View>
                  );
                })}
              </View>

              {/* Habit rows */}
              {habits.length === 0 ? (
                <Text style={styles.emptyGrid}>Tap + to add your first habit</Text>
              ) : (
                habits.map(habit => {
                  const completedSet = new Set(habit.completedDays || []);
                  return (
                    <View key={habit.id} style={styles.habitGridRow}>
                      <TouchableOpacity
                        style={styles.habitNameCell}
                        onLongPress={() => deleteHabit(habit.id, habit.name)}
                      >
                        <Ionicons name={habit.icon || 'checkmark-circle-outline'} size={12} color={habit.color} />
                        <Text style={styles.habitNameText} numberOfLines={2}>{habit.name}</Text>
                      </TouchableOpacity>

                      {currentWeek.map((dayNum, i) => {
                        const done = dayNum && completedSet.has(dayNum);
                        return (
                          <TouchableOpacity
                            key={i}
                            style={[styles.checkCell, done && { borderColor: habit.color, backgroundColor: habit.color + '22' }]}
                            onPress={() => toggle(habit.id, dayNum)}
                            disabled={!dayNum}
                            activeOpacity={0.6}
                          >
                            {done && <Ionicons name="checkmark" size={12} color={habit.color} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })
              )}
            </View>

            {/* ── Metrics Table ── */}
            {habits.length > 0 && (
              <View style={styles.metricsCard}>
                {/* Header */}
                <View style={styles.metricsHeaderRow}>
                  <Text style={[styles.metricsCell, styles.metricsLabel]}>Metrics</Text>
                  <Text style={[styles.metricsCell, styles.metricsColHeader]}>Day</Text>
                  <Text style={[styles.metricsCell, styles.metricsColHeader]}>Week</Text>
                </View>
                {/* Progress */}
                <View style={styles.metricsRow}>
                  <Text style={[styles.metricsCell, styles.metricsRowLabel]}>Progress</Text>
                  <Text style={[styles.metricsCell, styles.metricsValue, { color: Colors.accentGold }]}>{dayPct}%</Text>
                  <Text style={[styles.metricsCell, styles.metricsValue, { color: Colors.accentPurple }]}>{weekPct}%</Text>
                </View>
                {/* Done */}
                <View style={styles.metricsRow}>
                  <Text style={[styles.metricsCell, styles.metricsRowLabel]}>Done</Text>
                  <Text style={[styles.metricsCell, styles.metricsValue, { color: Colors.success }]}>{dayDone}</Text>
                  <Text style={[styles.metricsCell, styles.metricsValue, { color: Colors.success }]}>{weekDoneHabits}</Text>
                </View>
                {/* Not Done */}
                <View style={[styles.metricsRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.metricsCell, styles.metricsRowLabel]}>Not Done</Text>
                  <Text style={[styles.metricsCell, styles.metricsValue, { color: '#E74C3C' }]}>{dayNotDone}</Text>
                  <Text style={[styles.metricsCell, styles.metricsValue, { color: '#E74C3C' }]}>{totalHabits - weekDoneHabits}</Text>
                </View>
              </View>
            )}

            {/* ── Progress Chart ── */}
            {habits.length > 0 && (
              <ProgressChart
                habits={habits}
                monthData={monthData}
                year={year}
                month={month}
                weeks={weeks}
                weekIndex={weekIndex}
              />
            )}
          </>
        )}

        <Text style={styles.hintText}>Long press a habit to delete it</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      <AddHabitModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addHabit}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const HABIT_COL_W = 100;
const DAY_COL_W   = 38;
const CHECK_SIZE  = 28;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Month header
  monthHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingBottom: 12, gap: 10 },
  monthTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: Colors.text },
  addFab: { backgroundColor: Colors.accentGold, borderRadius: 8, padding: 6 },

  // Grid card
  gridCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, marginBottom: 12 },

  weekNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  weekLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSub },

  gridHeaderRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  habitsColHeader: { width: HABIT_COL_W, fontSize: 12, fontWeight: '700', color: Colors.text },
  dayColHeader: { width: DAY_COL_W, alignItems: 'center' },
  dayColLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSub },
  dayColDate: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  habitGridRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  habitNameCell: { width: HABIT_COL_W, flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 4 },
  habitNameText: { flex: 1, fontSize: 11, color: Colors.text, fontWeight: '500' },

  checkCell: { width: CHECK_SIZE, height: CHECK_SIZE, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.cardBorder, marginRight: (DAY_COL_W - CHECK_SIZE) / 2, marginLeft: (DAY_COL_W - CHECK_SIZE) / 2, alignItems: 'center', justifyContent: 'center' },

  emptyGrid: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, paddingVertical: 20 },

  // Metrics
  metricsCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 12, overflow: 'hidden' },
  metricsHeaderRow: { flexDirection: 'row', backgroundColor: Colors.cardBorder, paddingVertical: 10, paddingHorizontal: 16 },
  metricsRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  metricsCell: { flex: 1, textAlign: 'center' },
  metricsLabel: { textAlign: 'left', fontSize: 13, fontWeight: '700', color: Colors.text },
  metricsColHeader: { fontSize: 13, fontWeight: '700', color: Colors.text },
  metricsRowLabel: { textAlign: 'left', fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  metricsValue: { fontSize: 15, fontWeight: '800' },

  // Chart
  chartCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, padding: 16, marginBottom: 12 },
  chartTabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chartTab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder },
  chartTabActive: { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  chartTabText: { fontSize: 12, color: Colors.textSub, fontWeight: '600' },
  chartTabTextActive: { color: Colors.background },
  chartArea: { flexDirection: 'row', height: 120 },
  yAxis: { width: 36, justifyContent: 'space-between', paddingBottom: 20 },
  yLabel: { fontSize: 10, color: Colors.textMuted },
  barsArea: { flex: 1, position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.cardBorder },
  barsRow: { position: 'absolute', left: 0, right: 0, bottom: 20, top: 0, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  barWrapper: { alignItems: 'center', flex: 1 },
  barTrack: { width: 18, height: 90, backgroundColor: Colors.cardBorder, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: Colors.accentGold, borderRadius: 4 },
  barLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 4 },

  hintText: { textAlign: 'center', color: Colors.textMuted, fontSize: 11, marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: Colors.cardBorder, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  nameInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 12, padding: 14, color: Colors.text, fontSize: 15, marginBottom: 20 },
  modalSection: { fontSize: 12, color: Colors.textSub, fontWeight: '600', marginBottom: 10 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: Colors.text },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  iconBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  addBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  addBtnText: { fontSize: 16, fontWeight: '800', color: Colors.background },
  cancelBtn: { alignItems: 'center', padding: 10 },
  cancelText: { fontSize: 14, color: Colors.textSub },
});
