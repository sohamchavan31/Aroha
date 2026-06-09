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

const DEFAULT_GOALS = { calories: 2000, protein: 120, carbs: 250, fat: 65 };

const CATEGORIES = ['dal', 'rice', 'roti', 'sabzi', 'snack', 'dairy', 'fruit', 'protein', 'beverage', 'konkan', 'other'];
const SERVING_UNITS = ['katori', 'piece', 'glass', 'plate', 'tablespoon', 'slice', 'cup', 'scoop'];

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
  const [goals, setGoals]           = useState(DEFAULT_GOALS);
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
  const [pieceQty, setPieceQty]         = useState(1);

  // Recipe builder
  const [showBuilder, setShowBuilder]             = useState(false);
  const [savingCustom, setSavingCustom]           = useState(false);
  const [recipeName, setRecipeName]               = useState('');
  const [recipeCategory, setRecipeCategory]       = useState('other');
  const [recipeServings, setRecipeServings]       = useState(1);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeServingUnit, setRecipeServingUnit] = useState('katori');
  const [recipeSearch, setRecipeSearch]           = useState('');
  const [recipeResults, setRecipeResults]         = useState([]);
  const [recipeSearching, setRecipeSearching]     = useState(false);

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

  useEffect(() => {
    loadTodayLog();
    client.get('/profile').then(({ data }) => {
      if (data.dailyCalorieGoal) {
        setGoals({
          calories: data.dailyCalorieGoal,
          protein:  data.dailyProteinGoal,
          carbs:    data.dailyCarbGoal,
          fat:      data.dailyFatGoal,
        });
      }
    }).catch(() => {});
  }, [loadTodayLog]);

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
    setPieceQty(1);
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

  async function saveRecipe() {
    if (!recipeName.trim()) {
      Alert.alert('Name required', 'Please enter a recipe name.');
      return;
    }
    if (recipeIngredients.length === 0) {
      Alert.alert('No ingredients', 'Add at least one ingredient.');
      return;
    }
    const totalG = recipeIngredients.reduce((s, i) => s + (Number(i.grams) || 0), 0);
    if (totalG === 0) {
      Alert.alert('Invalid', 'All ingredient grams are 0.');
      return;
    }
    const totCal  = recipeIngredients.reduce((s, i) => s + (i.meal.caloriesPer100g * (Number(i.grams) || 0) / 100), 0);
    const totProt = recipeIngredients.reduce((s, i) => s + (i.meal.proteinPer100g  * (Number(i.grams) || 0) / 100), 0);
    const totCarb = recipeIngredients.reduce((s, i) => s + (i.meal.carbsPer100g    * (Number(i.grams) || 0) / 100), 0);
    const totFat  = recipeIngredients.reduce((s, i) => s + (i.meal.fatPer100g      * (Number(i.grams) || 0) / 100), 0);
    setSavingCustom(true);
    try {
      await client.post('/meals/custom', {
        name:            recipeName.trim(),
        category:        recipeCategory,
        caloriesPer100g: Math.round(totCal  / totalG * 100),
        proteinPer100g:  Math.round(totProt / totalG * 1000) / 10,
        carbsPer100g:    Math.round(totCarb / totalG * 1000) / 10,
        fatPer100g:      Math.round(totFat  / totalG * 1000) / 10,
        fiberPer100g:    0,
        servingUnit:     recipeServingUnit,
        typicalServing:  Math.max(1, Math.round(totalG / recipeServings)),
      });
      setRecipeName('');
      setRecipeCategory('other');
      setRecipeServings(1);
      setRecipeServingUnit('katori');
      setRecipeIngredients([]);
      setRecipeSearch('');
      setRecipeResults([]);
      setShowBuilder(false);
      Alert.alert('Saved!', `"${recipeName.trim()}" added to your recipes.`);
    } catch {
      Alert.alert('Error', 'Could not save recipe. Try again.');
    } finally {
      setSavingCustom(false);
    }
  }

  async function searchRecipeIngredient(text) {
    setRecipeSearch(text);
    if (text.trim().length < 2) { setRecipeResults([]); return; }
    setRecipeSearching(true);
    try {
      const { data } = await client.get(`/meals/search?q=${encodeURIComponent(text.trim())}`);
      setRecipeResults(data);
    } catch {
      setRecipeResults([]);
    } finally {
      setRecipeSearching(false);
    }
  }

  function addIngredient(meal) {
    setRecipeIngredients(prev => [
      ...prev,
      { id: Date.now(), meal, qty: '1', grams: String(meal.typicalServing) },
    ]);
    setRecipeSearch('');
    setRecipeResults([]);
  }

  function removeIngredient(id) {
    setRecipeIngredients(prev => prev.filter(i => i.id !== id));
  }

  function updateIngredientQty(id, qty, typicalServing) {
    const q = Number(qty) || 0;
    setRecipeIngredients(prev => prev.map(i =>
      i.id === id ? { ...i, qty, grams: String(Math.round(q * typicalServing)) } : i
    ));
  }

  function updateIngredientGrams(id, grams) {
    setRecipeIngredients(prev => prev.map(i => i.id === id ? { ...i, grams } : i));
  }

  const recipeTotalG = recipeIngredients.reduce((s, i) => s + (Number(i.grams) || 0), 0);
  const recipeTotals = recipeIngredients.reduce((acc, i) => {
    const g = Number(i.grams) || 0;
    return {
      cal:  acc.cal  + (i.meal.caloriesPer100g * g / 100),
      prot: acc.prot + (i.meal.proteinPer100g  * g / 100),
      carb: acc.carb + (i.meal.carbsPer100g    * g / 100),
      fat:  acc.fat  + (i.meal.fatPer100g      * g / 100),
    };
  }, { cal: 0, prot: 0, carb: 0, fat: 0 });

  const caloriesPct = Math.round((totals.calories / goals.calories) * 100);

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

  function isUnitFood(meal) {
    const u = (meal?.servingUnit || '').toLowerCase();
    return Boolean(u && u !== 'g' && u !== 'gram' && u !== 'grams' && u !== 'ml');
  }

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
              {isUnitFood(pendingMeal)
                ? `${pendingMeal?.typicalServing}g per ${pendingMeal?.servingUnit}`
                : `Default: ${pendingMeal?.typicalServing}g`}
            </Text>

            {isUnitFood(pendingMeal) ? (
              <View style={styles.stepperSection}>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const next = Math.max(1, pieceQty - 1);
                      setPieceQty(next);
                      setServingGrams(String(Math.round((pendingMeal?.typicalServing || 0) * next)));
                      setCustomQty(false);
                    }}>
                    <Ionicons name="remove" size={22} color={Colors.text} />
                  </TouchableOpacity>
                  <View style={styles.stepperCenter}>
                    <Text style={styles.stepperNum}>{pieceQty}</Text>
                    <Text style={styles.stepperUnitLbl}>{pendingMeal?.servingUnit}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const next = pieceQty + 1;
                      setPieceQty(next);
                      setServingGrams(String(Math.round((pendingMeal?.typicalServing || 0) * next)));
                      setCustomQty(false);
                    }}>
                    <Ionicons name="add" size={22} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.stepperGrams}>
                  ≈ {Math.round((pendingMeal?.typicalServing || 0) * pieceQty)}g total
                </Text>
                {!customQty && (
                  <TouchableOpacity
                    style={styles.customGramsLink}
                    onPress={() => { setCustomQty(true); setServingGrams(''); }}
                    activeOpacity={0.7}>
                    <Text style={styles.customGramsLinkTxt}>Enter custom grams instead</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
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
            )}

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

      {/* ── Recipe Builder Modal ── */}
      <Modal visible={showBuilder} transparent animationType="slide" onRequestClose={() => setShowBuilder(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.builderSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.builderHeader}>
              <Text style={styles.builderTitle}>Create Recipe</Text>
              <TouchableOpacity onPress={() => setShowBuilder(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={Colors.textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <CustomField
                label="Recipe Name *"
                value={recipeName}
                onChangeText={setRecipeName}
                placeholder="e.g. Mom's Dal Tadka"
              />

              {/* Servings stepper */}
              <View style={styles.servingsRow}>
                <Text style={styles.customFieldLabel}>Makes</Text>
                <View style={styles.servingsStepper}>
                  <TouchableOpacity
                    style={styles.servingsBtn}
                    onPress={() => setRecipeServings(s => Math.max(1, s - 1))}>
                    <Ionicons name="remove" size={16} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.servingsNum}>{recipeServings}</Text>
                  <TouchableOpacity
                    style={styles.servingsBtn}
                    onPress={() => setRecipeServings(s => s + 1)}>
                    <Ionicons name="add" size={16} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.servingsLabel}>serving{recipeServings !== 1 ? 's' : ''}</Text>
              </View>

              <Text style={styles.sectionLabel}>Serving Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {SERVING_UNITS.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.chip, recipeServingUnit === unit && styles.chipActive]}
                    onPress={() => setRecipeServingUnit(unit)}>
                    <Text style={[styles.chipText, recipeServingUnit === unit && styles.chipTextActive]}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.sectionLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, recipeCategory === cat && styles.chipActive]}
                    onPress={() => setRecipeCategory(cat)}>
                    <Text style={[styles.chipText, recipeCategory === cat && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Ingredient search */}
              <Text style={styles.sectionLabel}>Ingredients</Text>
              <View style={styles.ingSearchRow}>
                <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.ingSearchInput}
                  placeholder="Search dal, rice, egg..."
                  placeholderTextColor={Colors.textMuted}
                  value={recipeSearch}
                  onChangeText={searchRecipeIngredient}
                  autoCorrect={false}
                />
                {recipeSearching && <ActivityIndicator size="small" color={Colors.accentGold} />}
              </View>

              {recipeResults.length > 0 && (
                <View style={styles.ingResultsList}>
                  {recipeResults.map(meal => (
                    <TouchableOpacity
                      key={meal.id}
                      style={styles.ingResultRow}
                      onPress={() => addIngredient(meal)}
                      activeOpacity={0.7}>
                      <Text style={styles.ingResultName} numberOfLines={1}>{meal.name}</Text>
                      <Text style={styles.ingResultMeta}>{meal.caloriesPer100g} kcal/100g</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Ingredient list */}
              {recipeIngredients.length > 0 && (
                <View style={styles.ingList}>
                  {recipeIngredients.map(item => (
                    <View key={item.id} style={styles.ingRow}>
                      <Text style={styles.ingName} numberOfLines={1}>{item.meal.name}</Text>
                      {isUnitFood(item.meal) ? (
                        <>
                          <TextInput
                            style={styles.ingQtyInput}
                            keyboardType="numeric"
                            value={item.qty}
                            onChangeText={v => updateIngredientQty(item.id, v, item.meal.typicalServing)}
                          />
                          <Text style={styles.ingUnitLbl}>{item.meal.servingUnit}</Text>
                        </>
                      ) : (
                        <>
                          <TextInput
                            style={styles.ingGramsInput}
                            keyboardType="numeric"
                            value={item.grams}
                            onChangeText={v => updateIngredientGrams(item.id, v)}
                          />
                          <Text style={styles.ingGramsUnit}>g</Text>
                        </>
                      )}
                      <TouchableOpacity
                        onPress={() => removeIngredient(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Totals preview */}
              {recipeIngredients.length > 0 && recipeTotalG > 0 && (
                <View style={styles.recipeTotalsBox}>
                  <Text style={styles.recipeTotalsTitle}>Total · {Math.round(recipeTotalG)}g</Text>
                  <Text style={styles.recipeTotalsMacros}>
                    {Math.round(recipeTotals.cal)} kcal · P {Math.round(recipeTotals.prot)}g · C {Math.round(recipeTotals.carb)}g · F {Math.round(recipeTotals.fat)}g
                  </Text>
                  {recipeServings > 1 && (
                    <Text style={styles.recipeTotalsServing}>
                      Per serving ({Math.round(recipeTotalG / recipeServings)}g): {Math.round(recipeTotals.cal / recipeServings)} kcal · P {Math.round(recipeTotals.prot / recipeServings)}g · C {Math.round(recipeTotals.carb / recipeServings)}g · F {Math.round(recipeTotals.fat / recipeServings)}g
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, savingCustom && { opacity: 0.6 }]}
                onPress={saveRecipe}
                disabled={savingCustom}
                activeOpacity={0.8}>
                {savingCustom
                  ? <ActivityIndicator color={Colors.background} size="small" />
                  : <Text style={styles.saveBtnText}>Save Recipe</Text>}
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
                <Text style={styles.calorieLabel}>/ {goals.calories} kcal</Text>
              </View>
            </View>

            <View style={styles.macroCard}>
              <View style={styles.calRingRow}>
                <View style={styles.calRing}>
                  <Text style={styles.calRingPct}>{caloriesPct}%</Text>
                  <Text style={styles.calRingLabel}>of goal</Text>
                </View>
                <View style={styles.macroBarList}>
                  <MacroBar label="Protein" value={Math.round(totals.protein)} goal={goals.protein} color={Colors.accentPurple} />
                  <MacroBar label="Carbs"   value={Math.round(totals.carbs)}   goal={goals.carbs}   color={Colors.accentGold} />
                  <MacroBar label="Fat"     value={Math.round(totals.fat)}     goal={goals.fat}     color="#E67E22" />
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
            <Text style={styles.searchHint}>Tap + to create a recipe from ingredients</Text>

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

  // ── Quantity Stepper ──
  stepperSection: { alignItems: 'center', marginBottom: 20 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 32, marginBottom: 8 },
  stepperBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  stepperCenter: { alignItems: 'center', minWidth: 80 },
  stepperNum: { fontSize: 42, fontWeight: '800', color: Colors.text, lineHeight: 48 },
  stepperUnitLbl: { fontSize: 13, color: Colors.textSub, marginTop: 2, textTransform: 'capitalize' },
  stepperGrams: { fontSize: 13, color: Colors.textMuted, marginBottom: 10 },
  customGramsLink: { paddingVertical: 6 },
  customGramsLinkTxt: { fontSize: 13, color: Colors.accentGold, textDecorationLine: 'underline' },

  // ── Recipe Builder ──
  builderSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
  builderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  builderTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },

  customFieldRow: { marginBottom: 12 },
  customFieldLabel: { fontSize: 12, color: Colors.textSub, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  customFieldInput: { backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, color: Colors.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: 10 },

  servingsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  servingsStepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  servingsBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  servingsNum: { fontSize: 16, fontWeight: '700', color: Colors.text, paddingHorizontal: 10, minWidth: 32, textAlign: 'center' },
  servingsLabel: { fontSize: 14, color: Colors.textSub },

  sectionLabel: { fontSize: 12, color: Colors.textSub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  chipScroll: { marginBottom: 16 },
  chip: { backgroundColor: Colors.background, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipActive: { backgroundColor: Colors.accentGold + '22', borderColor: Colors.accentGold },
  chipText: { fontSize: 13, color: Colors.textSub, fontWeight: '500' },
  chipTextActive: { color: Colors.accentGold, fontWeight: '700' },

  ingSearchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  ingSearchInput: { flex: 1, color: Colors.text, fontSize: 14 },

  ingResultsList: { backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 10, overflow: 'hidden' },
  ingResultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  ingResultName: { fontSize: 14, color: Colors.text, fontWeight: '500', flex: 1, marginRight: 8 },
  ingResultMeta: { fontSize: 12, color: Colors.textMuted },

  ingList: { marginBottom: 10 },
  ingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, gap: 8 },
  ingName: { flex: 1, fontSize: 14, color: Colors.text },
  ingGramsInput: { width: 54, backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder, color: Colors.text, fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 6 },
  ingGramsUnit: { fontSize: 13, color: Colors.textMuted },
  ingQtyInput: { width: 44, backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.accentGold + '88', color: Colors.text, fontSize: 14, fontWeight: '700', textAlign: 'center', paddingVertical: 6 },
  ingUnitLbl: { fontSize: 13, color: Colors.accentGold, fontWeight: '600', minWidth: 52 },

  recipeTotalsBox: { backgroundColor: Colors.accentGold + '18', borderRadius: 12, borderWidth: 1, borderColor: Colors.accentGold + '44', padding: 14, marginBottom: 16 },
  recipeTotalsTitle: { fontSize: 12, fontWeight: '700', color: Colors.accentGold, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  recipeTotalsMacros: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  recipeTotalsServing: { fontSize: 12, color: Colors.textSub, marginTop: 6 },

  saveBtn: { backgroundColor: Colors.accentGold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.background },
});
