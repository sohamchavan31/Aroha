import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import client from '../api/client';
import WorkoutGeneratorScreen from './WorkoutGeneratorScreen';

const CATEGORIES = [
  { key: 'all',         label: 'All',         icon: 'grid-outline' },
  { key: 'strength',   label: 'Strength',    icon: 'barbell-outline' },
  { key: 'cardio',     label: 'Cardio',      icon: 'heart-outline' },
  { key: 'yoga',       label: 'Yoga',        icon: 'body-outline' },
  { key: 'flexibility',label: 'Flexibility', icon: 'leaf-outline' },
];

function LogModal({ exercise, visible, onClose, onSave }) {
  const [sets, setSets]     = useState(String(exercise?.defaultSets || 3));
  const [reps, setReps]     = useState(String(exercise?.defaultReps || 10));
  const [weight, setWeight] = useState('0');

  useEffect(() => {
    if (exercise) {
      setSets(String(exercise.defaultSets || 3));
      setReps(String(exercise.defaultReps || 10));
      setWeight('0');
    }
  }, [exercise]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{exercise?.name}</Text>
          <Text style={styles.modalSub}>{exercise?.description}</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sets</Text>
              <TextInput
                style={styles.numInput}
                value={sets}
                onChangeText={setSets}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                style={styles.numInput}
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.numInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => onSave({ sets: parseInt(sets) || 1, reps: parseInt(reps) || 1, weightKg: parseFloat(weight) || 0 })}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Log It</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function WorkoutScreen() {
  const [exercises, setExercises]       = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [todayLog, setTodayLog]         = useState([]);
  const [stats, setStats]               = useState({ exerciseCount: 0, totalSets: 0, totalReps: 0 });
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]           = useState(null);
  const [modalVisible, setModalVisible]   = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const loadExercises = useCallback(async () => {
    try {
      const { data } = await client.get('/workouts/exercises');
      setExercises(data);
      setFiltered(data);
    } catch {
      Alert.alert('Error', 'Could not load exercises.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTodayLog = useCallback(async () => {
    try {
      const { data } = await client.get('/workouts/today');
      setTodayLog(data.entries || []);
      setStats({
        exerciseCount: data.exerciseCount || 0,
        totalSets: data.totalSets || 0,
        totalReps: data.totalReps || 0,
      });
    } catch {}
  }, []);

  useEffect(() => {
    loadExercises();
    loadTodayLog();
  }, []);

  function filterByCategory(cat) {
    setActiveCategory(cat);
    setFiltered(cat === 'all' ? exercises : exercises.filter(e => e.category === cat));
  }

  function openLog(exercise) {
    setSelected(exercise);
    setModalVisible(true);
  }

  async function saveLog({ sets, reps, weightKg }) {
    setModalVisible(false);
    try {
      await client.post('/workouts/log', { exerciseId: selected.id, sets, reps, weightKg });
      loadTodayLog();
    } catch {
      Alert.alert('Error', 'Could not save log.');
    }
  }

  async function deleteEntry(id) {
    try {
      await client.delete(`/workouts/log/${id}`);
      loadTodayLog();
    } catch {
      Alert.alert('Error', 'Could not delete entry.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <FlatList
        style={styles.list}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Workout Logger</Text>
              <TouchableOpacity style={styles.generateBtn} onPress={() => setShowGenerator(true)} activeOpacity={0.8}>
                <Ionicons name="flash-outline" size={15} color={Colors.background} />
                <Text style={styles.generateBtnText}>Generate</Text>
              </TouchableOpacity>
            </View>

            {/* Today stats */}
            <View style={styles.statsRow}>
              {[
                { icon: 'fitness-outline',  value: stats.exerciseCount, label: 'Exercises' },
                { icon: 'layers-outline',   value: stats.totalSets,     label: 'Total Sets' },
                { icon: 'repeat-outline',   value: stats.totalReps,     label: 'Total Reps' },
              ].map(s => (
                <View key={s.label} style={styles.statCard}>
                  <Ionicons name={s.icon} size={20} color={Colors.accentGold} />
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Category tabs */}
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={c => c.key}
              showsHorizontalScrollIndicator={false}
              style={styles.catList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.catTab, activeCategory === item.key && styles.catTabActive]}
                  onPress={() => filterByCategory(item.key)}
                >
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={activeCategory === item.key ? Colors.background : Colors.textSub}
                  />
                  <Text style={[styles.catLabel, activeCategory === item.key && styles.catLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.sectionTitle}>Exercise Library</Text>
          </>
        }
        data={loading ? [] : filtered}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.exerciseCard} onPress={() => openLog(item)} activeOpacity={0.7}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseMeta}>{item.muscleGroup} • {item.equipment}</Text>
            </View>
            <View style={styles.exerciseRight}>
              <Text style={styles.exerciseDefault}>{item.defaultSets}×{item.defaultReps}</Text>
              <Ionicons name="add-circle-outline" size={22} color={Colors.accentGold} />
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          todayLog.length > 0 ? (
            <View style={styles.todaySection}>
              <Text style={styles.sectionTitle}>Today's Session</Text>
              {todayLog.map(entry => (
                <View key={entry.id} style={styles.logRow}>
                  <View style={styles.logInfo}>
                    <Text style={styles.logName}>{entry.exerciseName}</Text>
                    <Text style={styles.logMeta}>
                      {entry.sets} sets × {entry.reps} reps
                      {entry.weightKg > 0 ? ` • ${entry.weightKg}kg` : ' • Bodyweight'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteEntry(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color={Colors.accentGold} style={{ marginTop: 40 }} />
            : <Text style={styles.emptyText}>No exercises found.</Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <LogModal
        exercise={selected}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={saveLog}
      />

      <Modal visible={showGenerator} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowGenerator(false)}>
        <WorkoutGeneratorScreen visible={showGenerator} onClose={() => setShowGenerator(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { flex: 1, paddingHorizontal: 20 },

  header: { marginTop: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accentGold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  generateBtnText: { fontSize: 13, fontWeight: '800', color: Colors.background },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textSub, textAlign: 'center' },

  catList: { marginBottom: 16 },
  catTab: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  catTabActive: { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  catLabel: { fontSize: 12, color: Colors.textSub, fontWeight: '600' },
  catLabelActive: { color: Colors.background },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },

  exerciseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, marginBottom: 8 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  exerciseMeta: { fontSize: 11, color: Colors.textSub, marginTop: 2, textTransform: 'capitalize' },
  exerciseRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exerciseDefault: { fontSize: 12, color: Colors.textMuted },

  todaySection: { marginTop: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, marginBottom: 8 },
  logInfo: { flex: 1 },
  logName: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  logMeta: { fontSize: 12, color: Colors.textSub, marginTop: 2 },

  emptyText: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, marginTop: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: Colors.cardBorder, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  modalSub: { fontSize: 13, color: Colors.textSub, marginBottom: 24 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  inputGroup: { flex: 1, alignItems: 'center', gap: 8 },
  inputLabel: { fontSize: 12, color: Colors.textSub, fontWeight: '600' },
  numInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 12, padding: 12, color: Colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', width: '100%' },
  saveBtn: { backgroundColor: Colors.accentGold, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: Colors.background },
  cancelBtn: { alignItems: 'center', padding: 10 },
  cancelBtnText: { fontSize: 14, color: Colors.textSub },
});
