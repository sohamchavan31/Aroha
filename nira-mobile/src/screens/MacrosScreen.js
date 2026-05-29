import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import client from '../api/client';

const DAILY_GOALS = { calories: 2000, protein: 50, carbs: 250, fat: 65 };

function MacroBar({ label, value, goal, color }) {
  const pct = Math.min((value / goal) * 100, 100);
  return (
    <View style={styles.macroBarRow}>
      <View style={styles.macroBarHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{value}g <Text style={styles.macroGoal}>/ {goal}g</Text></Text>
      </View>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function MacrosScreen() {
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [log, setLog]               = useState([]);
  const [totals, setTotals]         = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loadingLog, setLoadingLog] = useState(true);

  const loadTodayLog = useCallback(async () => {
    try {
      const { data } = await client.get('/logs/today');
      setLog(data.entries || []);
      setTotals({
        calories: data.totalCalories || 0,
        protein:  data.totalProtein  || 0,
        carbs:    data.totalCarbs    || 0,
        fat:      data.totalFat      || 0,
      });
    } catch {
      // silently fail — user sees empty log
    } finally {
      setLoadingLog(false);
    }
  }, []);

  useEffect(() => { loadTodayLog(); }, [loadTodayLog]);

  async function search(text) {
    setQuery(text);
    if (text.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await client.get(`/meals/search?q=${encodeURIComponent(text.trim())}`);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function addMeal(meal) {
    try {
      await client.post('/logs', {
        mealId: meal.id,
        servingGrams: meal.typicalServing,
      });
      setQuery('');
      setResults([]);
      loadTodayLog();
    } catch {
      Alert.alert('Error', 'Could not add meal. Try again.');
    }
  }

  async function removeEntry(id) {
    try {
      await client.delete(`/logs/${id}`);
      loadTodayLog();
    } catch {
      Alert.alert('Error', 'Could not remove entry.');
    }
  }

  const caloriesPct = Math.round((totals.calories / DAILY_GOALS.calories) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <FlatList
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Macro Tracker</Text>
              <View style={styles.calorieBadge}>
                <Text style={styles.calorieValue}>{Math.round(totals.calories)}</Text>
                <Text style={styles.calorieLabel}>/ {DAILY_GOALS.calories} kcal</Text>
              </View>
            </View>

            {/* Macro bars */}
            <View style={styles.macroCard}>
              <View style={styles.calRingRow}>
                <View style={styles.calRing}>
                  <Text style={styles.calRingPct}>{caloriesPct}%</Text>
                  <Text style={styles.calRingLabel}>of goal</Text>
                </View>
                <View style={styles.macroBarList}>
                  <MacroBar label="Protein" value={Math.round(totals.protein)} goal={DAILY_GOALS.protein}  color={Colors.accentPurple} />
                  <MacroBar label="Carbs"   value={Math.round(totals.carbs)}   goal={DAILY_GOALS.carbs}    color={Colors.accentGold} />
                  <MacroBar label="Fat"     value={Math.round(totals.fat)}     goal={DAILY_GOALS.fat}      color="#E67E22" />
                </View>
              </View>
            </View>

            {/* Search bar */}
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search dal, chawal, sabzi..."
                placeholderTextColor={Colors.textMuted}
                value={query}
                onChangeText={search}
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search results */}
            {searching && <ActivityIndicator color={Colors.accentGold} style={{ marginVertical: 12 }} />}
            {results.length > 0 && (
              <View style={styles.resultsCard}>
                {results.map(meal => (
                  <TouchableOpacity
                    key={meal.id}
                    style={styles.resultRow}
                    onPress={() => addMeal(meal)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{meal.name}</Text>
                      <Text style={styles.resultMeta}>
                        {meal.typicalServing}g • {Math.round(meal.caloriesPer100g * meal.typicalServing / 100)} kcal
                      </Text>
                    </View>
                    <View style={styles.resultMacros}>
                      <Text style={styles.resultMacroText}>P {Math.round(meal.proteinPer100g * meal.typicalServing / 100)}g</Text>
                      <Text style={styles.resultMacroText}>C {Math.round(meal.carbsPer100g * meal.typicalServing / 100)}g</Text>
                      <Text style={styles.resultMacroText}>F {Math.round(meal.fatPer100g * meal.typicalServing / 100)}g</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={Colors.accentGold} style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Today's Log</Text>
          </>
        }
        data={log}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.logRow}>
            <View style={styles.logInfo}>
              <Text style={styles.logName}>{item.mealName}</Text>
              <Text style={styles.logMeta}>{item.servingGrams}g • {Math.round(item.calories)} kcal</Text>
            </View>
            <TouchableOpacity onPress={() => removeEntry(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          !loadingLog ? (
            <Text style={styles.emptyText}>Nothing logged yet. Search a meal above to start.</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { flex: 1, paddingHorizontal: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  calorieBadge: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  calorieValue: { fontSize: 18, fontWeight: '800', color: Colors.accentGold },
  calorieLabel: { fontSize: 10, color: Colors.textSub },

  macroCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, padding: 16, marginBottom: 16 },
  calRingRow: { flexDirection: 'row', alignItems: 'center' },
  calRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: Colors.accentGold, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  calRingPct: { fontSize: 16, fontWeight: '800', color: Colors.accentGold },
  calRingLabel: { fontSize: 9, color: Colors.textSub },
  macroBarList: { flex: 1, gap: 8 },
  macroBarRow: { gap: 4 },
  macroBarHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: { fontSize: 11, color: Colors.textSub, fontWeight: '600' },
  macroValue: { fontSize: 11, color: Colors.text, fontWeight: '600' },
  macroGoal: { color: Colors.textMuted },
  macroTrack: { height: 5, backgroundColor: Colors.cardBorder, borderRadius: 3, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 3 },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },

  resultsCard: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 12, overflow: 'hidden' },
  resultRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  resultMeta: { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  resultMacros: { flexDirection: 'row', gap: 6 },
  resultMacroText: { fontSize: 11, color: Colors.textMuted },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 4 },

  logRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, marginBottom: 8 },
  logInfo: { flex: 1 },
  logName: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  logMeta: { fontSize: 12, color: Colors.textSub, marginTop: 2 },

  emptyText: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, marginTop: 20, lineHeight: 20 },
});
