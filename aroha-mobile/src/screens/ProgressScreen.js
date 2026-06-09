import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Modal, TextInput, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import Colors from '../constants/colors';
import client from '../api/client';

const SCREEN_W = Dimensions.get('window').width;

function fmtDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

function macroCalPercent(p, c, f) {
  const total = p * 4 + c * 4 + f * 9;
  if (total === 0) return { pct: 0, cct: 0, fct: 0 };
  return {
    pct: Math.round((p * 4 / total) * 100),
    cct: Math.round((c * 4 / total) * 100),
    fct: Math.round((f * 9 / total) * 100),
  };
}

function StatCard({ label, value, unit, color, icon }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 6 }} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MacroBar({ label, grams, percent, color }) {
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroGrams}>{grams}g</Text>
      <Text style={styles.macroPct}>{percent}%</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const [summary, setSummary]             = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [weightInput, setWeightInput]     = useState('');
  const [saving, setSaving]               = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, wRes] = await Promise.all([
        client.get('/analytics/summary'),
        client.get('/weight-logs/history?days=30'),
      ]);
      setSummary(sRes.data);
      setWeightHistory(wRes.data ?? []);
    } catch {
      // silent — show empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function logWeight() {
    const kg = parseFloat(weightInput);
    if (!kg || kg < 20 || kg > 500) {
      Alert.alert('Invalid', 'Enter a weight between 20 – 500 kg.');
      return;
    }
    setSaving(true);
    try {
      await client.post('/weight-logs', { weightKg: kg });
      setShowModal(false);
      setWeightInput('');
      loadData();
    } catch {
      Alert.alert('Error', 'Could not save weight.');
    } finally {
      setSaving(false);
    }
  }

  // ── chart data ────────────────────────────────────────────────────────────
  const hasChart = weightHistory.length >= 2;
  let chartData = null;
  if (hasChart) {
    // Show at most 7 labels to avoid crowding the x-axis
    const step = Math.max(1, Math.floor(weightHistory.length / 6));
    const labels = weightHistory.map((w, i) =>
      i % step === 0 || i === weightHistory.length - 1 ? fmtDate(w.loggedDate) : '');
    chartData = {
      labels,
      datasets: [{ data: weightHistory.map(w => w.weightKg) }],
    };
  }

  // ── macro breakdown ───────────────────────────────────────────────────────
  const p = summary?.avgProteinG7d ?? 0;
  const c = summary?.avgCarbsG7d   ?? 0;
  const f = summary?.avgFatG7d     ?? 0;
  const { pct, cct, fct } = macroCalPercent(p, c, f);
  const hasMacros = (p + c + f) > 0;

  // ── weight change display ─────────────────────────────────────────────────
  const delta = summary?.weightChange30d ?? 0;
  const deltaTxt = delta === 0 ? '—'
    : delta > 0 ? `+${delta} kg` : `${delta} kg`;
  const deltaColor = delta < 0 ? Colors.success
    : delta > 0 ? Colors.rankS : Colors.textSub;

  const currentW  = summary?.currentWeightKg       ?? 0;
  const habitPct  = Math.round((summary?.habitCompletionRate7d ?? 0) * 100);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <TouchableOpacity style={styles.logBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={18} color={Colors.background} />
            <Text style={styles.logBtnTxt}>Log Weight</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.accentGold} size="large" style={{ marginTop: 80 }} />
        ) : (
          <>
            {/* ── weight summary cards ── */}
            <View style={styles.weightRow}>
              <View style={styles.weightCard}>
                <Text style={styles.weightCardLabel}>Current Weight</Text>
                <Text style={styles.weightCardValue}>
                  {currentW > 0 ? `${currentW} kg` : '—'}
                </Text>
              </View>
              <View style={[styles.weightCard, { flex: 0.9 }]}>
                <Text style={styles.weightCardLabel}>30-Day Change</Text>
                <Text style={[styles.weightCardValue, { color: deltaColor, fontSize: 22 }]}>
                  {currentW > 0 ? deltaTxt : '—'}
                </Text>
              </View>
            </View>

            {/* ── weight line chart ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weight History (30 days)</Text>
              {hasChart ? (
                <LineChart
                  data={chartData}
                  width={SCREEN_W - 48}
                  height={185}
                  chartConfig={{
                    backgroundColor:         Colors.card,
                    backgroundGradientFrom:  Colors.card,
                    backgroundGradientTo:    Colors.card,
                    color:                   () => Colors.accentGold,
                    labelColor:              () => Colors.textSub,
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: Colors.accentGold,
                    },
                    propsForBackgroundLines: { stroke: Colors.cardBorder, strokeDasharray: '' },
                    decimalPlaces: 1,
                  }}
                  bezier
                  withInnerLines={false}
                  withOuterLines={false}
                  style={{ borderRadius: 10, marginTop: 10 }}
                />
              ) : (
                <View style={styles.emptyChart}>
                  <Ionicons name="analytics-outline" size={42} color={Colors.textMuted} />
                  <Text style={styles.emptyTxt}>
                    {weightHistory.length === 0
                      ? 'Log your weight to start tracking trends'
                      : 'Log one more entry to see your trend'}
                  </Text>
                </View>
              )}
            </View>

            {/* ── this week stats ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <View style={styles.statsRow}>
                <StatCard
                  label="Workouts"
                  value={summary?.workoutsThisWeek ?? 0}
                  icon="barbell-outline"
                  color={Colors.accentGold}
                />
                <StatCard
                  label="Avg Calories"
                  value={summary?.avgCalories7d ?? 0}
                  unit="kcal"
                  icon="flame-outline"
                  color={Colors.rankA}
                />
                <StatCard
                  label="Habit Rate"
                  value={`${habitPct}%`}
                  icon="checkmark-circle-outline"
                  color={Colors.success}
                />
              </View>
            </View>

            {/* ── macro split ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7-Day Macro Split</Text>
              {hasMacros ? (
                <View style={styles.macroContainer}>
                  <MacroBar label="Protein" grams={p} percent={pct} color="#E74C3C" />
                  <MacroBar label="Carbs"   grams={c} percent={cct} color={Colors.accentGold} />
                  <MacroBar label="Fat"     grams={f} percent={fct} color={Colors.accentPurpleLight} />
                  <Text style={styles.macroNote}>
                    Average over {summary?.loggedDays7d ?? 0} logged day
                    {summary?.loggedDays7d !== 1 ? 's' : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyChart}>
                  <Ionicons name="pie-chart-outline" size={42} color={Colors.textMuted} />
                  <Text style={styles.emptyTxt}>Log meals to see your macro breakdown</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── log weight modal ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Log Today's Weight</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 72.5"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
              autoFocus
            />
            <Text style={styles.modalUnit}>kilograms</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowModal(false); setWeightInput(''); }}
              >
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={logWeight} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={Colors.background} size="small" />
                  : <Text style={styles.saveTxt}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:        { fontSize: 24, fontWeight: '700', color: Colors.text },
  logBtn:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accentGold,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4 },
  logBtnTxt:    { fontSize: 13, fontWeight: '700', color: Colors.background },

  weightRow:       { flexDirection: 'row', gap: 12, marginBottom: 16 },
  weightCard:      { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 16,
                     borderWidth: 1, borderColor: Colors.cardBorder },
  weightCardLabel: { fontSize: 12, color: Colors.textSub, marginBottom: 6 },
  weightCardValue: { fontSize: 26, fontWeight: '800', color: Colors.text },

  section:      { backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 16,
                  borderWidth: 1, borderColor: Colors.cardBorder },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },

  emptyChart:   { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyTxt:     { fontSize: 13, color: Colors.textSub, textAlign: 'center', maxWidth: 220 },

  statsRow:  { flexDirection: 'row', gap: 10, marginTop: 12 },
  statCard:  { flex: 1, backgroundColor: Colors.background, borderRadius: 12, padding: 12,
               alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  statUnit:  { fontSize: 10, color: Colors.textSub, marginTop: 1 },
  statLabel: { fontSize: 11, color: Colors.textSub, marginTop: 4, textAlign: 'center' },

  macroContainer: { marginTop: 12, gap: 14 },
  macroRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroLabel:     { width: 50, fontSize: 12, color: Colors.textSub },
  macroTrack:     { flex: 1, height: 8, backgroundColor: Colors.background, borderRadius: 4, overflow: 'hidden' },
  macroFill:      { height: 8, borderRadius: 4 },
  macroGrams:     { width: 36, fontSize: 12, color: Colors.text, textAlign: 'right' },
  macroPct:       { width: 34, fontSize: 11, color: Colors.textSub, textAlign: 'right' },
  macroNote:      { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center',
                alignItems: 'center', padding: 24 },
  modal:      { backgroundColor: Colors.card, borderRadius: 18, padding: 24, width: '100%',
                borderWidth: 1, borderColor: Colors.cardBorder },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  modalInput: { backgroundColor: Colors.background, borderRadius: 10, padding: 14,
                fontSize: 30, fontWeight: '700', color: Colors.text, textAlign: 'center',
                borderWidth: 1, borderColor: Colors.cardBorder },
  modalUnit:  { fontSize: 12, color: Colors.textSub, textAlign: 'center', marginTop: 6 },
  modalBtns:  { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn:  { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1,
                borderColor: Colors.cardBorder, alignItems: 'center' },
  cancelTxt:  { color: Colors.textSub, fontWeight: '600' },
  saveBtn:    { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.accentGold,
                alignItems: 'center', justifyContent: 'center' },
  saveTxt:    { color: Colors.background, fontWeight: '700', fontSize: 15 },
});
