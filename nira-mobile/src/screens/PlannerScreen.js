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
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec'];

const TIME_SLOTS = [
  '05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00',
  '21:00','22:00','23:00',
];

function formatDate(d) {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────
function AddTaskModal({ visible, onClose, onAdd, defaultTime }) {
  const [title, setTitle]   = useState('');
  const [time, setTime]     = useState(defaultTime || '');
  const [timed, setTimed]   = useState(!!defaultTime);

  useEffect(() => {
    setTitle('');
    setTime(defaultTime || '');
    setTimed(!!defaultTime);
  }, [visible, defaultTime]);

  function submit() {
    if (!title.trim()) { Alert.alert('Enter a task title'); return; }
    onAdd({ title: title.trim(), scheduledTime: timed && time ? time : null });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>New Task</Text>

          <TextInput
            style={styles.titleInput}
            placeholder="What do you need to do?"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          {/* Time toggle */}
          <TouchableOpacity style={styles.timeToggleRow} onPress={() => setTimed(t => !t)}>
            <Ionicons
              name={timed ? 'time' : 'time-outline'}
              size={18}
              color={timed ? Colors.accentGold : Colors.textMuted}
            />
            <Text style={[styles.timeToggleText, timed && { color: Colors.accentGold }]}>
              {timed ? 'Scheduled at' : 'Add a time (optional)'}
            </Text>
          </TouchableOpacity>

          {timed && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotScroll}>
              {TIME_SLOTS.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, time === t && styles.timeChipActive]}
                  onPress={() => setTime(t)}
                >
                  <Text style={[styles.timeChipText, time === t && styles.timeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.addBtn} onPress={submit} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onDelete }) {
  return (
    <TouchableOpacity
      style={[styles.taskRow, task.completed && styles.taskRowDone]}
      onPress={() => onToggle(task.id)}
      onLongPress={() => onDelete(task.id, task.title)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
        {task.completed && <Ionicons name="checkmark" size={12} color={Colors.background} />}
      </View>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
          {task.title}
        </Text>
        {task.carriedForward && (
          <Text style={styles.carriedTag}>↩ carried forward</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function PlannerScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [tasks, setTasks]       = useState([]);
  const [stats, setStats]       = useState({ total: 0, done: 0, remaining: 0 });
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [defaultTime, setDefaultTime] = useState(null);

  const isToday = toDateStr(selectedDate) === toDateStr(today);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/tasks?date=${toDateStr(selectedDate)}`);
      setTasks(data.tasks || []);
      setStats({ total: data.total, done: data.done, remaining: data.remaining });
    } catch {
      Alert.alert('Error', 'Could not load tasks.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  function prevDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  }

  function nextDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  }

  function openAddModal(time = null) {
    setDefaultTime(time);
    setShowModal(true);
  }

  async function addTask({ title, scheduledTime }) {
    setShowModal(false);
    try {
      await client.post('/tasks', {
        title,
        taskDate: toDateStr(selectedDate),
        scheduledTime,
      });
      load();
    } catch {
      Alert.alert('Error', 'Could not add task.');
    }
  }

  async function toggleTask(id) {
    try {
      const { data: updated } = await client.patch(`/tasks/${id}/toggle`);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      setStats(prev => ({
        ...prev,
        done:      updated.completed ? prev.done + 1 : prev.done - 1,
        remaining: updated.completed ? prev.remaining - 1 : prev.remaining + 1,
      }));
    } catch {
      Alert.alert('Error', 'Could not update task.');
    }
  }

  async function deleteTask(id, title) {
    Alert.alert('Delete', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await client.delete(`/tasks/${id}`); load(); }
        catch { Alert.alert('Error', 'Could not delete task.'); }
      }},
    ]);
  }

  async function handleCarryForward() {
    try {
      const { data } = await client.post('/tasks/carry-forward');
      if (data.carried === 0) {
        Alert.alert('Nothing to carry', 'No incomplete tasks from yesterday.');
      } else {
        load();
      }
    } catch {
      Alert.alert('Error', 'Could not carry forward tasks.');
    }
  }

  // Split tasks: timed vs unscheduled
  const timedTasks    = tasks.filter(t => t.scheduledTime);
  const untimedTasks  = tasks.filter(t => !t.scheduledTime);

  const progressPct = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* ── Date Header ── */}
      <View style={styles.dateHeader}>
        <TouchableOpacity onPress={prevDay} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          {isToday && <Text style={styles.todayBadge}>Today</Text>}
        </View>
        <TouchableOpacity onPress={nextDay} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
          <Ionicons name="chevron-forward" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Stats Row ── */}
        {stats.total > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              {[
                { label: 'Total',  value: stats.total,     color: Colors.text },
                { label: 'Done',   value: stats.done,      color: Colors.success },
                { label: 'Left',   value: stats.remaining, color: '#E67E22' },
                { label: 'Done',   value: `${progressPct}%`, color: Colors.accentGold },
              ].map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={Colors.accentGold} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* ── Carry Forward Button (today only, if no tasks yet) ── */}
            {isToday && tasks.length === 0 && (
              <TouchableOpacity style={styles.carryBtn} onPress={handleCarryForward}>
                <Ionicons name="return-down-forward-outline" size={16} color={Colors.accentGold} />
                <Text style={styles.carryBtnText}>Carry forward yesterday's tasks</Text>
              </TouchableOpacity>
            )}

            {/* ── Scheduled / Time-blocked ── */}
            {timedTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Scheduled</Text>
                {TIME_SLOTS.filter(slot => timedTasks.some(t => t.scheduledTime === slot)).map(slot => (
                  <View key={slot}>
                    <View style={styles.slotHeader}>
                      <Text style={styles.slotTime}>{slot}</Text>
                      <View style={styles.slotLine} />
                    </View>
                    {timedTasks.filter(t => t.scheduledTime === slot).map(task => (
                      <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* ── To-Do List (unscheduled) ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>To-Do</Text>
                <TouchableOpacity onPress={() => openAddModal()} style={styles.addRowBtn}>
                  <Ionicons name="add" size={16} color={Colors.accentGold} />
                  <Text style={styles.addRowBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {untimedTasks.length === 0 ? (
                <Text style={styles.emptyText}>No tasks yet. Tap Add to create one.</Text>
              ) : (
                untimedTasks.map(task => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                ))
              )}
            </View>

            {/* ── Add Scheduled Task ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Add to Schedule</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TIME_SLOTS.map(t => (
                  <TouchableOpacity key={t} style={styles.quickTimeChip} onPress={() => openAddModal(t)}>
                    <Ionicons name="add-circle-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.quickTimeText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        <Text style={styles.hintText}>Long press a task to delete it</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={() => openAddModal()} activeOpacity={0.8}>
        <Ionicons name="add" size={26} color={Colors.background} />
      </TouchableOpacity>

      <AddTaskModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addTask}
        defaultTime={defaultTime}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: 16 },

  dateHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  todayBadge: { fontSize: 11, color: Colors.accentGold, fontWeight: '600', marginTop: 2 },

  statsCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, marginBottom: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: Colors.textSub, marginTop: 2 },
  progressTrack: { height: 5, backgroundColor: Colors.cardBorder, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accentGold, borderRadius: 3 },

  carryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.accentGold + '44', padding: 14, marginBottom: 14 },
  carryBtnText: { fontSize: 14, color: Colors.accentGold, fontWeight: '600' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addRowBtnText: { fontSize: 13, color: Colors.accentGold, fontWeight: '600' },

  slotHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  slotTime: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', width: 40 },
  slotLine: { flex: 1, height: 1, backgroundColor: Colors.cardBorder },

  taskRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, marginBottom: 6, gap: 12 },
  taskRowDone: { opacity: 0.6 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  carriedTag: { fontSize: 10, color: Colors.accentPurple, marginTop: 3, fontWeight: '600' },

  quickTimeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  quickTimeText: { fontSize: 11, color: Colors.textMuted },

  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  hintText: { textAlign: 'center', color: Colors.textMuted, fontSize: 11, marginTop: 4 },

  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: Colors.accentGold, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: Colors.cardBorder, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  titleInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 12, padding: 14, color: Colors.text, fontSize: 15, marginBottom: 16 },
  timeToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  timeToggleText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  timeSlotScroll: { marginBottom: 20 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, marginRight: 8, backgroundColor: Colors.background },
  timeChipActive: { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  timeChipText: { fontSize: 12, color: Colors.textSub, fontWeight: '600' },
  timeChipTextActive: { color: Colors.background },
  addBtn: { backgroundColor: Colors.accentGold, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  addBtnText: { fontSize: 16, fontWeight: '800', color: Colors.background },
  cancelBtn: { alignItems: 'center', padding: 10 },
  cancelText: { fontSize: 14, color: Colors.textSub },
});
