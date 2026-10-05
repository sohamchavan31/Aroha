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
const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TIME_SLOTS = [
  '05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00',
  '21:00','22:00','23:00',
];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function relativeLabel(d, today) {
  const diff = Math.round((new Date(toDateStr(d)) - new Date(toDateStr(today))) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return DAY_NAMES[d.getDay()];
}

// "13:00" → "1 PM"
function prettyTime(slot) {
  const [h, m] = slot.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}

// ─── Add task sheet ──────────────────────────────────────────────────────────
function AddTaskSheet({ visible, onClose, onAdd, defaultTime, dateLabel }) {
  const [title, setTitle] = useState('');
  const [time, setTime]   = useState(null);

  useEffect(() => {
    if (visible) { setTitle(''); setTime(defaultTime || null); }
  }, [visible, defaultTime]);

  return (
    <Sheet visible={visible} onClose={onClose} title="New task" subtitle={dateLabel} showClose>
      <View style={styles.sheetBody}>
        <Field value={title} onChangeText={setTitle} placeholder="What do you need to do?" autoFocus autoCorrect returnKeyType="done" />
        <View style={styles.row}>
          <Text style={styles.label}>Time (optional)</Text>
          {!!time && (
            <AnimatedPressable onPress={() => { tap(); setTime(null); }}>
              <Text style={styles.clear}>No time</Text>
            </AnimatedPressable>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChips} keyboardShouldPersistTaps="handled">
          {TIME_SLOTS.map(t => (
            <Chip key={t} label={prettyTime(t)} selected={time === t} onPress={() => setTime(time === t ? null : t)} capitalize={false} />
          ))}
        </ScrollView>
        <PrimaryButton
          title="Add task"
          subtitle={time ? `Scheduled at ${prettyTime(time)}` : 'Goes to your to-do list'}
          icon="add"
          onPress={() => {
            if (!title.trim()) { Alert.alert('Name your task', 'Write what you need to do.'); return; }
            onAdd({ title: title.trim(), scheduledTime: time });
          }}
          style={!title.trim() && styles.disabled}
        />
      </View>
    </Sheet>
  );
}

// ─── Task row ────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onDelete, first }) {
  return (
    <AnimatedPressable
      onPress={() => onToggle(task)}
      onLongPress={() => onDelete(task)}
      scaleTo={0.98}
      style={[styles.task, !first && styles.divider]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!task.completed }}
      accessibilityHint="Long press to delete"
    >
      <View style={[styles.checkbox, task.completed && styles.checkboxOn]}>
        {task.completed && <Ionicons name="checkmark" size={13} color={Palette.text} />}
      </View>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
        {task.carriedForward && (
          <View style={styles.carried}>
            <Ionicons name="return-down-forward" size={11} color={Palette.violet} />
            <Text style={styles.carriedText}>Carried from yesterday</Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function PlannerScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [tasks, setTasks]         = useState([]);
  const [stats, setStats]         = useState({ total: 0, done: 0, remaining: 0 });
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [defaultTime, setDefaultTime] = useState(null);

  const isToday = toDateStr(selectedDate) === toDateStr(today);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get(`/tasks?date=${toDateStr(selectedDate)}`);
      setTasks(data.tasks || []);
      setStats({ total: data.total ?? 0, done: data.done ?? 0, remaining: data.remaining ?? 0 });
    } catch {
      Alert.alert("Couldn't load tasks", 'Pull down to try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function shiftDay(dir) {
    tap();
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  }

  function openAdd(time = null) {
    tap();
    setDefaultTime(time);
    setShowAdd(true);
  }

  async function addTask({ title, scheduledTime }) {
    setShowAdd(false);
    try {
      await client.post('/tasks', { title, taskDate: toDateStr(selectedDate), scheduledTime });
      success();
      load();
    } catch {
      warn();
      Alert.alert("Couldn't add task", 'Check your connection and try again.');
    }
  }

  async function toggleTask(task) {
    if (task.completed) tap(); else success();
    try {
      const { data: updated } = await client.patch(`/tasks/${task.id}/toggle`);
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
      setStats(prev => ({
        ...prev,
        done:      updated.completed ? prev.done + 1 : prev.done - 1,
        remaining: updated.completed ? prev.remaining - 1 : prev.remaining + 1,
      }));
    } catch {
      warn();
      Alert.alert("Couldn't update task", 'Check your connection and try again.');
    }
  }

  function confirmDelete(task) {
    tap();
    Alert.alert('Delete task?', `"${task.title}"`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await client.delete(`/tasks/${task.id}`); load(); }
        catch { Alert.alert("Couldn't delete task", 'Check your connection and try again.'); }
      }},
    ]);
  }

  async function carryForward() {
    tap();
    try {
      const { data } = await client.post('/tasks/carry-forward');
      if (data.carried === 0) {
        Alert.alert('Nothing to carry over', 'Every task from yesterday is done.');
      } else {
        success();
        load();
      }
    } catch {
      warn();
      Alert.alert("Couldn't carry tasks over", 'Check your connection and try again.');
    }
  }

  const timed   = tasks.filter(t => t.scheduledTime);
  const untimed = tasks.filter(t => !t.scheduledTime);
  const slots   = TIME_SLOTS.filter(slot => timed.some(t => t.scheduledTime === slot));
  const otherTimed = timed.filter(t => !TIME_SLOTS.includes(t.scheduledTime)); // e.g. "07:30"
  const progress = stats.total === 0 ? 0 : stats.done / stats.total;
  const dateLabel = `${relativeLabel(selectedDate, today)}, ${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]}`;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.textSub} colors={[Palette.brass]} progressBackgroundColor={Palette.surface2} />}
      >
        {/* Date */}
        <View style={styles.dateRow}>
          <IconButton name="chevron-back" onPress={() => shiftDay(-1)} accessibilityLabel="Previous day" />
          <View style={styles.dateCenter}>
            <Text style={styles.dateTitle}>{relativeLabel(selectedDate, today)}</Text>
            <Text style={styles.meta}>{selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}</Text>
          </View>
          <IconButton name="chevron-forward" onPress={() => shiftDay(1)} accessibilityLabel="Next day" />
        </View>
        {!isToday && (
          <AnimatedPressable onPress={() => { tap(); setSelectedDate(new Date()); }} containerStyle={styles.backToday}>
            <Text style={styles.link}>Back to today</Text>
          </AnimatedPressable>
        )}

        {loading ? (
          <>
            <Skeleton height={96} radius={Radius.lg} />
            <Skeleton height={160} radius={Radius.lg} />
          </>
        ) : (
          <>
            {/* Progress */}
            {stats.total > 0 && (
              <Card>
                <View style={styles.row}>
                  <Text style={styles.label}>Progress</Text>
                  <Text style={styles.meta}>{stats.remaining} left</Text>
                </View>
                <Text style={styles.big}>
                  {stats.done}<Text style={styles.bigOf}> of {stats.total} done</Text>
                </Text>
                <SegmentBar progress={progress} segments={Math.min(Math.max(stats.total, 1), 12)} color={Palette.success} height={6} style={styles.bar} />
              </Card>
            )}

            {/* Carry forward */}
            {isToday && (
              <AnimatedPressable onPress={carryForward} scaleTo={0.98} style={styles.carry}>
                <View style={styles.carryIcon}>
                  <Ionicons name="return-down-forward" size={16} color={Palette.violet} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.carryTitle}>Carry over yesterday's tasks</Text>
                  <Text style={styles.meta}>Moves anything you didn't finish to today</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Palette.textDim} />
              </AnimatedPressable>
            )}

            {/* Schedule */}
            {timed.length > 0 && (
              <View>
                <Text style={[styles.label, styles.sectionLabel]}>Schedule</Text>
                <Card style={styles.listCard}>
                  {[...slots.map(slot => ({ slot, items: timed.filter(t => t.scheduledTime === slot) })),
                    ...(otherTimed.length ? [{ slot: null, items: otherTimed }] : [])].map(({ slot, items }, si) => (
                    <View key={slot || 'other'} style={[styles.slot, si > 0 && styles.divider]}>
                      <Text style={styles.slotTime}>{slot ? prettyTime(slot) : 'Other'}</Text>
                      <View style={styles.slotTasks}>
                        {items.map((task, ti) => (
                          <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={confirmDelete} first={ti === 0} />
                        ))}
                      </View>
                    </View>
                  ))}
                </Card>
              </View>
            )}

            {/* To-do */}
            <View>
              <View style={[styles.row, styles.sectionLabel]}>
                <Text style={styles.label}>To-do</Text>
                {untimed.length > 0 && <Text style={styles.meta}>{untimed.filter(t => !t.completed).length} open</Text>}
              </View>
              {untimed.length === 0 ? (
                <Card variant="dashed" style={styles.empty}>
                  <Text style={styles.emptyText}>{tasks.length === 0 ? `Nothing planned for ${relativeLabel(selectedDate, today).toLowerCase()}.` : 'No unscheduled tasks.'}</Text>
                </Card>
              ) : (
                <Card style={styles.listCard}>
                  {untimed.map((task, i) => (
                    <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={confirmDelete} first={i === 0} />
                  ))}
                </Card>
              )}
            </View>

            <PrimaryButton title="Add a task" subtitle={dateLabel} icon="add" onPress={() => openAdd()} />

            {/* Quick add at a time */}
            <View>
              <Text style={[styles.label, styles.sectionLabel]}>Add at a time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChips}>
                {TIME_SLOTS.map(t => <Chip key={t} label={prettyTime(t)} onPress={() => openAdd(t)} capitalize={false} />)}
              </ScrollView>
            </View>

            {tasks.length > 0 && <Text style={styles.hint}>Tap a task to tick it off · long press to delete</Text>}
          </>
        )}
      </ScrollView>

      <AddTaskSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addTask}
        defaultTime={defaultTime}
        dateLabel={dateLabel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Palette.ink },
  content:  { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  flex1:    { flex: 1 },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:    { ...Type.label, color: Palette.textSub },
  meta:     { ...Type.small, color: Palette.textSub },
  link:     { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.text, textDecorationLine: 'underline' },
  divider:  { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  disabled: { opacity: 0.4 },
  sectionLabel: { marginBottom: Spacing.sm },
  hint:     { ...Type.small, color: Palette.textDim, textAlign: 'center' },

  // Date
  dateRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateTitle:  { fontFamily: Fonts.display, fontSize: 18, color: Palette.text },
  backToday:  { alignSelf: 'center', marginTop: -Spacing.sm },

  // Progress
  big:   { fontFamily: Fonts.numHeavy, fontSize: 36, color: Palette.text, marginTop: Spacing.xs },
  bigOf: { fontFamily: Fonts.num, fontSize: 18, color: Palette.textSub },
  bar:   { marginTop: Spacing.md },

  // Carry forward
  carry:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md + 2, borderRadius: Radius.lg, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.lineSoft },
  carryIcon:  { width: 32, height: 32, borderRadius: 10, backgroundColor: Palette.violet + '1F', alignItems: 'center', justifyContent: 'center' },
  carryTitle: { ...Type.bodyB, color: Palette.text },

  // Lists
  listCard:      { paddingVertical: 0, paddingHorizontal: Spacing.lg },
  slot:          { flexDirection: 'row', gap: Spacing.md },
  slotTime:      { fontFamily: Fonts.num, fontSize: 15, color: Palette.textSub, width: 52, paddingTop: Spacing.md + 2 },
  slotTasks:     { flex: 1 },
  task:          { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.md + 2 },
  checkbox:      { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: Palette.textDim, alignItems: 'center', justifyContent: 'center', marginTop: -1 },
  checkboxOn:    { backgroundColor: Palette.violet, borderColor: Palette.violet },
  taskInfo:      { flex: 1 },
  taskTitle:     { ...Type.body, color: Palette.text },
  taskTitleDone: { color: Palette.textDim, textDecorationLine: 'line-through' },
  carried:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  carriedText:   { fontFamily: Fonts.bodySemi, fontSize: 11, color: Palette.violet },
  empty:         { paddingVertical: Spacing.lg },
  emptyText:     { ...Type.body, color: Palette.textSub },
  timeChips:     { gap: Spacing.sm },

  // Sheet
  sheetBody: { gap: Spacing.md, paddingBottom: Spacing.sm },
  clear:     { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.textSub, textDecorationLine: 'underline' },
});
