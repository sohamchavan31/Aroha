import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import client from '../api/client';

const DAILY_GOALS = { calories: 2000, protein: 50, carbs: 250, fat: 65 };

const CATEGORIES = ['dal', 'rice', 'roti', 'sabzi', 'snack', 'dairy', 'fruit', 'protein', 'beverage', 'konkan', 'other'];
const SERVING_UNITS = ['katori', 'piece', 'glass', 'plate', 'tablespoon', 'slice', 'cup', 'scoop'];

const EMPTY_CUSTOM = {
  name: '', category: 'sabzi',
  caloriesPer100g: '', proteinPer100g: '', carbsPer100g: '',
  fatPer100g: '', fiberPer100g: '0',
  servingUnit: 'katori', typicalServing: '100',
};

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

function CustomField({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.customFieldRow}>
      <Text style={styles.customFieldLabel}>{label}</Text>
      <TextInput
        style={styles.customFieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType || 'default'}
        autoCorrect={false}
      />
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

  // Serving size modal
  const [pendingMeal, setPendingMeal]   = useState(null);
  const [servingGrams, setServingGrams] = useState('');
  const [customQty, setCustomQty]       = useState(false);

  // Custom food builder
  const [showBuilder, setShowBuilder]   = useState(false);
  const [customForm, setCustomForm]     = useState(EMPTY_CUSTOM);
  const [savingCustom, setSavingCustom] = useState(false);

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

  function openServingModal(meal) {
    setPendingMeal(meal);
    setServingGrams(String(meal.typicalServing));
    setCustomQty(false);
  }

  function setPreset(multiplier) {
    setServingGrams(String(Math.round(pendingMeal.typicalServing * multiplier)));
    setCustomQty(false);
  }

  async function confirmAdd() {
    const grams = Number(servingGrams);
    if (!grams || grams <= 0) return;
    try {
      await client.post('/logs', { mealId: pendingMeal.id, servingGrams: grams });
      setPendingMeal(null);
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

  async function saveCustomFood() {
    if (!customForm.name.trim()) {
      Alert.alert('Name required', 'Please enter a food name.');
      return;
    }
    if (!Number(customForm.caloriesPer100g)) {
      Alert.alert('Calories required', 'Enter calories per 100g.');
      return;
    }
    setSavingCustom(true);
    try {
      await client.post('/meals/custom', {
        name:            customForm.name.trim(),
        category:        customForm.category,
        caloriesPer100g: Number(customForm.caloriesPer100g) || 0,
        proteinPer100g:  Number(customForm.proteinPer100g)  || 0,
        carbsPer100g:    Number(customForm.carbsPer100g)    || 0,
        fatPer100g:      Number(customForm.fatPer100g)      || 0,
        fiberPer100g:    Number(customForm.fiberPer100g)    || 0,
        servingUnit:     customForm.servingUnit,
        typicalServing:  Number(customForm.typicalServing)  || 100,
      });
      setCustomForm(EMPTY_CUSTOM);
      setShowBuilder(false);
      Alert.alert('Saved!', `"${customForm.name.trim()}" added to your foods.`);
    } catch {
      Alert.alert('Error', 'Could not save food. Try again.');
    } finally {
      setSavingCustom(false);
    }
  }

  const caloriesPct = Math.round((totals.calories / DAILY_GOALS.calories) * 100);

  function previewMacros(grams) {
    if (!pendingMeal || !grams) return null;
    const g = Number(grams);
    if (!g) return null;
    return {
      cal: Math.round(pendingMeal.caloriesPer100g * g / 100),
      p:   Math.round(pendingMeal.proteinPer100g  * g / 100),
      c:   Math.round(pendingMeal.carbsPer100g    * g / 100),
      f:   Math.round(pendingMeal.fatPer100g      * g / 100),
    };
  }

  const preview = previewMacros(servingGrams);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* ── Serving Size Modal ── */}
      <Modal visible={!!pendingMeal} transparent animationType="slide" onRequestClose={() => setPendingMeal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.servingSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{pendingMeal?.name}</Text>
            <Text style={styles.sheetUnit}>
              Default: {pendingMeal?.typicalServing}g · unit: {pendingMeal?.servingUnit}
            </Text>

            <View style={styles.presetRow}>
              {[0.5, 1, 1.5, 2].map(mult => {
                const g = Math.round((pendingMeal?.typicalServing || 0) * mult);
                const active = !customQty && Number(servingGrams) === g;
                return (
                  <TouchableOpacity
                    key={mult}
                    style={[styles.presetBtn, active && styles.presetBtnActive]}
                    onPress={() => setPreset(mult)}
                    activeOpacity={0.7}>
                    <Text style={[styles.presetMult, active && styles.presetMultActive]}>
                      {mult === 0.5 ? '½×' : mult === 1 ? '1×' : mult === 1.5 ? '1½×' : '2×'}
                    </Text>
                    <Text style={[styles.presetG, active && styles.presetGActive]}>{g}g</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.presetBtn, customQty && styles.presetBtnActive]}
                onPress={() => { setCustomQty(true); setServingGrams(''); }}
                activeOpacity={0.7}>
                <Text style={[styles.presetMult, customQty && styles.presetMultActive]}>Custom</Text>
                <Text style={[styles.presetG, customQty && styles.presetGActive]}>grams</Text>
              </TouchableOpacity>
            </View>

            {customQty && (
              <TextInput
                style={styles.servingInput}
                keyboardType="numeric"
                value={servingGrams}
                onChangeText={setServingGrams}
                placeholder="Enter grams"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
            )}

            {preview && (
              <View style={styles.previewBox}>
                <Text style={styles.previewCal}>{preview.cal} kcal</Text>
                <Text style={styles.previewMeta}>P {preview.p}g · C {preview.c}g · F {preview.f}g</Text>
              </View>
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPendingMeal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, !preview && styles.addBtnDisabled]}
                onPress={confirmAdd}
                disabled={!preview}>
                <Text style={styles.addBtnText}>Add to Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Custom Food Builder Modal ── */}
      <Modal visible={showBuilder} transparent animationType="slide" onRequestClose={() => setShowBuilder(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.builderSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.builderHeader}>
              <Text style={styles.builderTitle}>Create Food</Text>
              <TouchableOpacity onPress={() => setShowBuilder(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={Colors.textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <CustomField label="Food Name *" value={customForm.name} onChangeText={v => setCustomForm(f => ({ ...f, name: v }))} placeholder="e.g. Mom's Dal" />
              <CustomField label="Calories / 100g" value={customForm.caloriesPer100g} onChangeText={v => setCustomForm(f => ({ ...f, caloriesPer100g: v }))} placeholder="e.g. 120" keyboardType="numeric" />
              <CustomField label="Protein / 100g (g)" value={customForm.proteinPer100g} onChangeText={v => setCustomForm(f => ({ ...f, proteinPer100g: v }))} placeholder="e.g. 8" keyboardType="numeric" />
              <CustomField label="Carbs / 100g (g)" value={customForm.carbsPer100g} onChangeText={v => setCustomForm(f => ({ ...f, carbsPer100g: v }))} placeholder="e.g. 20" keyboardType="numeric" />
              <CustomField label="Fat / 100g (g)" value={customForm.fatPer100g} onChangeText={v => setCustomForm(f => ({ ...f, fatPer100g: v }))} placeholder="e.g. 2" keyboardType="numeric" />
              <CustomField label="Typical Serving (g)" value={customForm.typicalServing} onChangeText={v => setCustomForm(f => ({ ...f, typicalServing: v }))} placeholder="e.g. 150" keyboardType="numeric" />

              <Text style={styles.sectionLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, customForm.category === cat && styles.chipActive]}
                    onPress={() => setCustomForm(f => ({ ...f, category: cat }))}>
                    <Text style={[styles.chipText, customForm.category === cat && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.sectionLabel}>Serving Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {SERVING_UNITS.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.chip, customForm.servingUnit === unit && styles.chipActive]}
                    onPress={() => setCustomForm(f => ({ ...f, servingUnit: unit }))}>
                    <Text style={[styles.chipText, customForm.servingUnit === unit && styles.chipTextActive]}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveBtn, savingCustom && { opacity: 0.6 }]}
                onPress={saveCustomFood}
                disabled={savingCustom}
                activeOpacity={0.8}>
                {savingCustom
                  ? <ActivityIndicator color={Colors.background} size="small" />
                  : <Text style={styles.saveBtnText}>Save Food</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Main List ── */}
      <FlatList
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Macro Tracker</Text>
              <View style={styles.calorieBadge}>
                <Text style={styles.calorieValue}>{Math.round(totals.calories)}</Text>
                <Text style={styles.calorieLabel}>/ {DAILY_GOALS.calories} kcal</Text>
              </View>
            </View>

            <View style={styles.macroCard}>
              <View style={styles.calRingRow}>
                <View style={styles.calRing}>
                  <Text style={styles.calRingPct}>{caloriesPct}%</Text>
                  <Text style={styles.calRingLabel}>of goal</Text>
                </View>
                <View style={styles.macroBarList}>
                  <MacroBar label="Protein" value={Math.round(totals.protein)} goal={DAILY_GOALS.protein} color={Colors.accentPurple} />
                  <MacroBar label="Carbs"   value={Math.round(totals.carbs)}   goal={DAILY_GOALS.carbs}   color={Colors.accentGold} />
                  <MacroBar label="Fat"     value={Math.round(totals.fat)}     goal={DAILY_GOALS.fat}     color="#E67E22" />
                </View>
              </View>
            </View>

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
              <TouchableOpacity
                style={styles.addCustomBtn}
                onPress={() => setShowBuilder(true)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="add-circle-outline" size={22} color={Colors.accentGold} />
              </TouchableOpacity>
            </View>
            <Text style={styles.searchHint}>Tap + to create your own food</Text>

            {searching && <ActivityIndicator color={Colors.accentGold} style={{ marginVertical: 12 }} />}
            {results.length > 0 && (
              <View style={styles.resultsCard}>
                {results.map(meal => (
                  <TouchableOpacity
                    key={meal.id}
                    style={styles.resultRow}
                    onPress={() => openServingModal(meal)}
                    activeOpacity={0.7}>
                    <View style={styles.resultInfo}>
                      <View style={styles.resultNameRow}>
                        <Text style={styles.resultName}>{meal.name}</Text>
                        {meal.isCustom && (
                          <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>My Food</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.resultMeta}>
                        {meal.typicalServing}g · {Math.round(meal.caloriesPer100g * meal.typicalServing / 100)} kcal
                      </Text>
                    </View>
                    <View style={styles.resultMacros}>
                      <Text style={styles.resultMacroText}>P {Math.round(meal.proteinPer100g * meal.typicalServing / 100)}g</Text>
                      <Text style={styles.resultMacroText}>C {Math.round(meal.carbsPer100g * meal.typicalServing / 100)}g</Text>
                      <Text style={styles.resultMacroText}>F {Math.round(meal.fatPer100g * meal.typicalServing / 100)}g</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 6 }} />
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
              <Text style={styles.logMeta}>{item.servingGrams}g · {Math.round(item.calories)} kcal</Text>
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

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
  addCustomBtn: { marginLeft: 8 },
  searchHint: { fontSize: 11, color: Colors.textMuted, marginBottom: 10, marginLeft: 4 },

  resultsCard: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 12, overflow: 'hidden' },
  resultRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  resultInfo: { flex: 1 },
  resultNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultName: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  customBadge: { backgroundColor: '#9B59B633', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  customBadgeText: { fontSize: 10, color: Colors.accentPurple, fontWeight: '700' },
  resultMeta: { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  resultMacros: { flexDirection: 'row', gap: 6 },
  resultMacroText: { fontSize: 11, color: Colors.textMuted },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 4 },

  logRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, marginBottom: 8 },
  logInfo: { flex: 1 },
  logName: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  logMeta: { fontSize: 12, color: Colors.textSub, marginTop: 2 },

  emptyText: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, marginTop: 20, lineHeight: 20 },

  // ── Modal shared ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheetHandle: { width: 36, height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },

  // ── Serving Size Modal ──
  servingSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  sheetUnit: { fontSize: 12, color: Colors.textMuted, marginBottom: 20 },

  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  presetBtn: { flex: 1, backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', paddingVertical: 10 },
  presetBtnActive: { borderColor: Colors.accentGold, backgroundColor: Colors.accentGold + '22' },
  presetMult: { fontSize: 13, fontWeight: '700', color: Colors.textSub },
  presetMultActive: { color: Colors.accentGold },
  presetG: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  presetGActive: { color: Colors.accentGold },

  servingInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.accentGold, color: Colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center', paddingVertical: 12, marginBottom: 16 },

  previewBox: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 },
  previewCal: { fontSize: 22, fontWeight: '800', color: Colors.accentGold },
  previewMeta: { fontSize: 13, color: Colors.textSub, marginTop: 4 },

  sheetActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSub },
  addBtn: { flex: 2, backgroundColor: Colors.accentGold, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontSize: 15, fontWeight: '700', color: Colors.background },

  // ── Custom Food Builder ──
  builderSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  builderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  builderTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },

  customFieldRow: { marginBottom: 12 },
  customFieldLabel: { fontSize: 12, color: Colors.textSub, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  customFieldInput: { backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, color: Colors.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: 10 },

  sectionLabel: { fontSize: 12, color: Colors.textSub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  chipScroll: { marginBottom: 16 },
  chip: { backgroundColor: Colors.background, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipActive: { backgroundColor: Colors.accentGold + '22', borderColor: Colors.accentGold },
  chipText: { fontSize: 13, color: Colors.textSub, fontWeight: '500' },
  chipTextActive: { color: Colors.accentGold, fontWeight: '700' },

  saveBtn: { backgroundColor: Colors.accentGold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.background },
});
