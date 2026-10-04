import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import IconButton from '../components/ui/IconButton';
import MacroBar from '../components/ui/MacroBar';
import Skeleton from '../components/Skeleton';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import AnimatedCounter from '../components/AnimatedCounter';
import ServingSheet from '../components/food/ServingSheet';
import RecipeBuilderSheet from '../components/food/RecipeBuilderSheet';
import { DEFAULT_GOALS, SLOTS, isUnitFood, macrosFor } from '../constants/food';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { formatNumber } from '../utils/format';
import { tap, success, warn } from '../utils/haptics';

function todayLabel() {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Today, ${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function MacrosScreen() {
  const [goals, setGoals]           = useState(DEFAULT_GOALS);
  const [log, setLog]               = useState([]);
  const [totals, setTotals]         = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0 });
  const [loadingLog, setLoadingLog] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed]   = useState({});

  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [targetSlot, setTargetSlot] = useState(null); // set by a slot's "Add food"

  const [pendingMeal, setPendingMeal] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const scrollRef   = useRef(null);
  const searchRef   = useRef(null);
  const searchSeq   = useRef(0);

  // ── Data ────────────────────────────────────────────────────────────────────
  const loadTodayLog = useCallback(async () => {
    try {
      const { data } = await client.get('/logs/today');
      setLog(data.entries || []);
      setTotals({
        calories: data.totalCalories  || 0,
        protein:  data.totalProtein   || 0,
        carbs:    data.totalCarbs     || 0,
        fat:      data.totalFat       || 0,
        burned:   data.caloriesBurned || 0,
      });
    } catch {
      // keep whatever is on screen
    } finally {
      setLoadingLog(false);
    }
  }, []);

  const loadGoals = useCallback(async () => {
    try {
      const { data } = await client.get('/profile');
      if (data.dailyCalorieGoal) {
        setGoals({
          calories: data.dailyCalorieGoal,
          protein:  data.dailyProteinGoal || DEFAULT_GOALS.protein,
          carbs:    data.dailyCarbGoal    || DEFAULT_GOALS.carbs,
          fat:      data.dailyFatGoal     || DEFAULT_GOALS.fat,
        });
      }
    } catch {}
  }, []);

  // Refresh on focus: a workout logged elsewhere changes "burned"
  useFocusEffect(useCallback(() => { loadTodayLog(); loadGoals(); }, [loadTodayLog, loadGoals]));

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadTodayLog(), loadGoals()]);
    setRefreshing(false);
  }

  // ── Search ──────────────────────────────────────────────────────────────────
  async function search(text) {
    setQuery(text);
    const q = text.trim();
    const seq = ++searchSeq.current;
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    try {
      const { data } = await client.get(`/meals/search?q=${encodeURIComponent(q)}`);
      if (seq === searchSeq.current) setResults(data || []); // ignore out-of-order replies
    } catch {
      if (seq === searchSeq.current) setResults([]);
    } finally {
      if (seq === searchSeq.current) setSearching(false);
    }
  }

  function clearSearch() {
    searchSeq.current++;
    setQuery('');
    setResults([]);
    setSearching(false);
    setTargetSlot(null);
  }

  function startAddToSlot(slotKey) {
    tap();
    setTargetSlot(slotKey);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => searchRef.current?.focus(), 250);
  }

  // ── Log actions ─────────────────────────────────────────────────────────────
  async function addEntry(meal, grams, slot) {
    try {
      await client.post('/logs', { mealId: meal.id, servingGrams: grams, mealSlot: slot });
      success();
      setPendingMeal(null);
      clearSearch();
      setCollapsed(c => ({ ...c, [slot]: false }));
      loadTodayLog();
      return true;
    } catch {
      warn();
      Alert.alert("Couldn't add food", 'Check your connection and try again.');
      return false;
    }
  }

  function confirmRemove(item) {
    tap();
    Alert.alert('Remove from log?', `${item.mealName} · ${Math.round(item.calories)} kcal`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeEntry(item.id) },
    ]);
  }

  async function removeEntry(id) {
    const before = log;
    setLog(l => l.filter(e => e.id !== id));
    try {
      await client.delete(`/logs/${id}`);
      loadTodayLog();
    } catch {
      setLog(before);
      Alert.alert("Couldn't remove entry", 'Check your connection and try again.');
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const left = goals.calories - totals.calories + totals.burned;
  const over = left < 0;

  const slotEntries = SLOTS.reduce((acc, { key }) => {
    acc[key] = log.filter(e => (e.mealSlot || 'SNACK') === key); // legacy null → Snack
    return acc;
  }, {});

  const targetSlotLabel = SLOTS.find(s => s.key === targetSlot)?.label;

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
        {/* Header */}
        <FadeInView index={0} style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Food</Text>
            <Text style={styles.date}>{todayLabel()}</Text>
          </View>
          <IconButton name="create-outline" onPress={() => setShowBuilder(true)} accessibilityLabel="Create a recipe" />
        </FadeInView>

        {/* Summary */}
        <FadeInView index={1}>
          <Card>
            <Text style={styles.label}>{over ? 'Over your goal by' : 'Calories left'}</Text>
            <View style={styles.bigRow}>
              {loadingLog ? (
                <Skeleton width={140} height={52} radius={Radius.sm} />
              ) : (
                <AnimatedCounter value={Math.abs(left)} style={[styles.big, over && { color: Palette.danger }]} />
              )}
              <Text style={styles.bigUnit}>of {formatNumber(goals.calories)} kcal</Text>
            </View>
            <View style={styles.eatenRow}>
              <Text style={styles.eaten}>Eaten <Text style={styles.eatenVal}>{formatNumber(totals.calories)}</Text></Text>
              {totals.burned > 0 && (
                <Text style={styles.eaten}>Burned <Text style={[styles.eatenVal, { color: Palette.success }]}>+{formatNumber(totals.burned)}</Text></Text>
              )}
            </View>
            <View style={styles.macros}>
              <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color={Palette.protein} />
              <MacroBar label="Carbs"   value={totals.carbs}   goal={goals.carbs}   color={Palette.carbs} />
              <MacroBar label="Fat"     value={totals.fat}     goal={goals.fat}     color={Palette.fat} />
            </View>
          </Card>
        </FadeInView>

        {/* Search */}
        <FadeInView index={2}>
          {!!targetSlotLabel && (
            <View style={styles.targetRow}>
              <Text style={styles.targetText}>Adding to <Text style={styles.targetStrong}>{targetSlotLabel}</Text></Text>
              <AnimatedPressable onPress={() => setTargetSlot(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.targetClear}>Change</Text>
              </AnimatedPressable>
            </View>
          )}
          <Field
            ref={searchRef}
            icon="search-outline"
            value={query}
            onChangeText={search}
            placeholder="Search dal, roti, paneer…"
            returnKeyType="search"
            right={
              searching ? <ActivityIndicator size="small" color={Palette.textSub} />
              : query.length > 0 ? (
                <AnimatedPressable onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={18} color={Palette.textDim} />
                </AnimatedPressable>
              ) : null
            }
          />
        </FadeInView>

        {results.length > 0 && (
          <Card style={styles.resultsCard}>
            {results.map((meal, i) => {
              const m = macrosFor(meal, meal.typicalServing);
              return (
                <AnimatedPressable
                  key={meal.id}
                  scaleTo={0.98}
                  onPress={() => { tap(); setPendingMeal(meal); }}
                  style={[styles.resultRow, i > 0 && styles.divider]}
                >
                  <View style={styles.resultInfo}>
                    <View style={styles.resultNameRow}>
                      <Text style={styles.resultName} numberOfLines={1}>{meal.name}</Text>
                      {meal.isCustom && <Text style={styles.mine}>MINE</Text>}
                    </View>
                    <Text style={styles.resultMeta}>
                      {isUnitFood(meal) ? `1 ${meal.servingUnit} · ` : ''}{meal.typicalServing} g · P {Math.round(m.p)} · C {Math.round(m.c)} · F {Math.round(m.f)}
                    </Text>
                  </View>
                  <Text style={styles.resultKcal}>{Math.round(m.cal)}</Text>
                  <Ionicons name="add-circle" size={24} color={Palette.textSub} />
                </AnimatedPressable>
              );
            })}
          </Card>
        )}

        {query.trim().length >= 2 && !searching && results.length === 0 && (
          <Card variant="dashed" style={styles.noResults}>
            <Text style={styles.noResultsText}>No foods match "{query.trim()}".</Text>
            <AnimatedPressable onPress={() => { tap(); setShowBuilder(true); }}>
              <Text style={styles.link}>Create it as a recipe</Text>
            </AnimatedPressable>
          </Card>
        )}

        {/* Meals */}
        {loadingLog ? (
          [0, 1, 2].map(i => <Skeleton key={i} height={64} radius={Radius.lg} />)
        ) : (
          SLOTS.map(({ key, label, icon, color }, idx) => {
            const entries = slotEntries[key] || [];
            const slotCal = entries.reduce((s, e) => s + (e.calories || 0), 0);
            const open = !collapsed[key];

            if (entries.length === 0) {
              return (
                <FadeInView key={key} index={3 + idx}>
                  <AnimatedPressable scaleTo={0.98} onPress={() => startAddToSlot(key)}>
                    <Card variant="dashed" style={styles.slotEmpty}>
                      <View style={[styles.slotIcon, { backgroundColor: color + '14' }]}>
                        <Ionicons name={icon} size={15} color={color} />
                      </View>
                      <Text style={styles.slotEmptyLabel}>{label}</Text>
                      <Text style={styles.addLink}>+ Add food</Text>
                    </Card>
                  </AnimatedPressable>
                </FadeInView>
              );
            }

            return (
              <FadeInView key={key} index={3 + idx}>
                <Card style={styles.slotCard}>
                  <AnimatedPressable
                    scaleTo={0.99}
                    onPress={() => { tap(); setCollapsed(c => ({ ...c, [key]: open })); }}
                    style={styles.slotHeader}
                    accessibilityLabel={`${label}, ${open ? 'collapse' : 'expand'}`}
                  >
                    <View style={[styles.slotIcon, { backgroundColor: color + '1F' }]}>
                      <Ionicons name={icon} size={15} color={color} />
                    </View>
                    <Text style={styles.slotLabel}>{label}</Text>
                    <Text style={styles.slotCount}>{entries.length}</Text>
                    <Text style={styles.slotKcal}>{formatNumber(slotCal)}<Text style={styles.slotKcalUnit}> kcal</Text></Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Palette.textDim} />
                  </AnimatedPressable>

                  {open && (
                    <View>
                      {entries.map(item => (
                        <View key={item.id} style={[styles.entry, styles.divider]}>
                          <View style={styles.entryInfo}>
                            <Text style={styles.entryName} numberOfLines={1}>{item.mealName}</Text>
                            <Text style={styles.entryMeta}>{Math.round(item.servingGrams)} g · P {Math.round(item.protein || 0)} g</Text>
                          </View>
                          <Text style={styles.entryKcal}>{Math.round(item.calories)}</Text>
                          <AnimatedPressable onPress={() => confirmRemove(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={`Remove ${item.mealName}`}>
                            <Ionicons name="close" size={16} color={Palette.textDim} />
                          </AnimatedPressable>
                        </View>
                      ))}
                      <AnimatedPressable onPress={() => startAddToSlot(key)} style={[styles.addRow, styles.divider]}>
                        <Text style={styles.addLink}>+ Add to {label}</Text>
                      </AnimatedPressable>
                    </View>
                  )}
                </Card>
              </FadeInView>
            );
          })
        )}
      </ScrollView>

      <ServingSheet
        meal={pendingMeal}
        initialSlot={targetSlot}
        onClose={() => setPendingMeal(null)}
        onAdd={addEntry}
      />
      <RecipeBuilderSheet visible={showBuilder} onClose={() => setShowBuilder(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Palette.ink },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl, gap: Spacing.md },
  label:   { ...Type.label, color: Palette.textSub },
  divider: { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  link:    { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.text, textDecorationLine: 'underline' },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  headerText: { flex: 1 },
  title:      { fontFamily: Fonts.display, fontSize: 22, color: Palette.text },
  date:       { ...Type.small, color: Palette.textSub, marginTop: 2 },

  // Summary
  bigRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginTop: Spacing.xs },
  big:      { ...Type.hero, color: Palette.text },
  bigUnit:  { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.textSub, marginBottom: 9 },
  eatenRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs },
  eaten:    { ...Type.small, color: Palette.textSub },
  eatenVal: { fontFamily: Fonts.bodyBold, color: Palette.text },
  macros:   { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },

  // Slot target
  targetRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs },
  targetText:   { ...Type.small, color: Palette.textSub },
  targetStrong: { fontFamily: Fonts.bodyBold, color: Palette.text },
  targetClear:  { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.textSub, textDecorationLine: 'underline' },

  // Results
  resultsCard:   { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md + 2 },
  resultRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  resultInfo:    { flex: 1, minWidth: 0 },
  resultNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  resultName:    { ...Type.bodyB, color: Palette.text, flexShrink: 1 },
  mine:          { fontFamily: Fonts.bodyHeavy, fontSize: 9, letterSpacing: 1, color: Palette.violet },
  resultMeta:    { ...Type.small, color: Palette.textSub, marginTop: 2 },
  resultKcal:    { fontFamily: Fonts.num, fontSize: 18, color: Palette.text },
  noResults:     { alignItems: 'flex-start', gap: Spacing.sm },
  noResultsText: { ...Type.body, color: Palette.textSub },

  // Slots
  slotEmpty:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md + 2 },
  slotEmptyLabel: { ...Type.bodyB, color: Palette.textSub, flex: 1 },
  slotCard:       { paddingVertical: 0, paddingHorizontal: Spacing.md + 2 },
  slotHeader:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: Spacing.md + 2 },
  slotIcon:       { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  slotLabel:      { ...Type.bodyB, color: Palette.text },
  slotCount:      { fontFamily: Fonts.bodyBold, fontSize: 11, color: Palette.textSub, backgroundColor: Palette.surface2, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 1, overflow: 'hidden' },
  slotKcal:       { fontFamily: Fonts.num, fontSize: 18, color: Palette.text, marginLeft: 'auto' },
  slotKcalUnit:   { fontSize: 12, color: Palette.textSub },

  entry:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  entryInfo: { flex: 1, minWidth: 0 },
  entryName: { ...Type.body, color: Palette.text },
  entryMeta: { ...Type.small, color: Palette.textSub, marginTop: 1 },
  entryKcal: { fontFamily: Fonts.num, fontSize: 16, color: Palette.text },
  addRow:    { paddingVertical: Spacing.md },
  addLink:   { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.violet },
});
