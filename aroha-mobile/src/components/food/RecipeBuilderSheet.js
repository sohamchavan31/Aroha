import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '../ui/Sheet';
import Chip from '../ui/Chip';
import Field from '../ui/Field';
import PrimaryButton from '../ui/PrimaryButton';
import AnimatedPressable from '../AnimatedPressable';
import client from '../../api/client';
import { CATEGORIES, SERVING_UNITS, isUnitFood, macrosFor } from '../../constants/food';
import { Palette, Fonts, Type, Radius, Spacing } from '../../constants/theme';
import { tap, success } from '../../utils/haptics';

// Build a recipe from logged ingredients; saved as a custom food (macros per 100 g).
export default function RecipeBuilderSheet({ visible, onClose }) {
  const [name, setName]               = useState('');
  const [category, setCategory]       = useState('other');
  const [servings, setServings]       = useState(1);
  const [unit, setUnit]               = useState('katori');
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch]           = useState('');
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const [saving, setSaving]           = useState(false);

  function reset() {
    setName(''); setCategory('other'); setServings(1); setUnit('katori');
    setIngredients([]); setSearch(''); setResults([]);
  }

  async function searchIngredient(text) {
    setSearch(text);
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

  function addIngredient(meal) {
    tap();
    setIngredients(prev => [...prev, { id: Date.now(), meal, qty: '1', grams: String(meal.typicalServing) }]);
    setSearch(''); setResults([]);
  }

  function removeIngredient(id) {
    tap();
    setIngredients(prev => prev.filter(i => i.id !== id));
  }

  function updateQty(id, qty, typicalServing) {
    const q = Number(qty) || 0;
    setIngredients(prev => prev.map(i => (i.id === id ? { ...i, qty, grams: String(Math.round(q * typicalServing)) } : i)));
  }

  function updateGrams(id, grams) {
    setIngredients(prev => prev.map(i => (i.id === id ? { ...i, grams } : i)));
  }

  const totalG = ingredients.reduce((s, i) => s + (Number(i.grams) || 0), 0);
  const totals = ingredients.reduce((acc, i) => {
    const m = macrosFor(i.meal, i.grams);
    return { cal: acc.cal + m.cal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f };
  }, { cal: 0, p: 0, c: 0, f: 0 });

  async function save() {
    if (!name.trim()) { Alert.alert('Name required', 'Give your recipe a name.'); return; }
    if (ingredients.length === 0) { Alert.alert('No ingredients', 'Add at least one ingredient.'); return; }
    if (totalG === 0) { Alert.alert('Check quantities', 'Every ingredient is set to 0 g.'); return; }
    setSaving(true);
    try {
      await client.post('/meals/custom', {
        name:            name.trim(),
        category,
        caloriesPer100g: Math.round(totals.cal / totalG * 100),
        proteinPer100g:  Math.round(totals.p / totalG * 1000) / 10,
        carbsPer100g:    Math.round(totals.c / totalG * 1000) / 10,
        fatPer100g:      Math.round(totals.f / totalG * 1000) / 10,
        fiberPer100g:    0,
        servingUnit:     unit,
        typicalServing:  Math.max(1, Math.round(totalG / servings)),
      });
      success();
      const saved = name.trim();
      reset();
      onClose();
      Alert.alert('Recipe saved', `"${saved}" is now in your foods. Search for it to log it.`);
    } catch {
      Alert.alert("Couldn't save recipe", 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Create recipe" subtitle="Combine ingredients into one food you can log" showClose>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <Field label="Recipe name" value={name} onChangeText={setName} placeholder="e.g. Mom's dal tadka" autoCorrect />

        <View style={styles.servingsRow}>
          <Text style={styles.label}>Makes</Text>
          <View style={styles.stepper}>
            <AnimatedPressable style={styles.stepBtn} scaleTo={0.9} onPress={() => { tap(); setServings(s => Math.max(1, s - 1)); }} accessibilityLabel="Fewer servings">
              <Ionicons name="remove" size={16} color={Palette.text} />
            </AnimatedPressable>
            <Text style={styles.stepNum}>{servings}</Text>
            <AnimatedPressable style={styles.stepBtn} scaleTo={0.9} onPress={() => { tap(); setServings(s => s + 1); }} accessibilityLabel="More servings">
              <Ionicons name="add" size={16} color={Palette.text} />
            </AnimatedPressable>
          </View>
          <Text style={styles.servingsWord}>serving{servings !== 1 ? 's' : ''}</Text>
        </View>

        <Text style={styles.label}>Serving unit</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SERVING_UNITS.map(u => <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} />)}
        </ScrollView>

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATEGORIES.map(c => <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />)}
        </ScrollView>

        <Field
          label="Ingredients"
          icon="search-outline"
          value={search}
          onChangeText={searchIngredient}
          placeholder="Search dal, rice, egg…"
          right={searching ? <ActivityIndicator size="small" color={Palette.textSub} /> : null}
        />

        {results.length > 0 && (
          <View style={styles.list}>
            {results.map((meal, i) => (
              <AnimatedPressable key={meal.id} scaleTo={0.98} onPress={() => addIngredient(meal)} style={[styles.resultRow, i > 0 && styles.divider]}>
                <Text style={styles.resultName} numberOfLines={1}>{meal.name}</Text>
                <Text style={styles.resultMeta}>{meal.caloriesPer100g} kcal/100 g</Text>
                <Ionicons name="add-circle-outline" size={18} color={Palette.textSub} />
              </AnimatedPressable>
            ))}
          </View>
        )}

        {ingredients.length > 0 && (
          <View style={styles.list}>
            {ingredients.map((item, i) => (
              <View key={item.id} style={[styles.ingRow, i > 0 && styles.divider]}>
                <Text style={styles.ingName} numberOfLines={1}>{item.meal.name}</Text>
                {isUnitFood(item.meal) ? (
                  <>
                    <TextInput style={styles.qtyInput} keyboardType="numeric" value={item.qty} onChangeText={v => updateQty(item.id, v, item.meal.typicalServing)} selectionColor={Palette.brass} />
                    <Text style={styles.qtyUnit}>{item.meal.servingUnit}</Text>
                  </>
                ) : (
                  <>
                    <TextInput style={styles.qtyInput} keyboardType="numeric" value={item.grams} onChangeText={v => updateGrams(item.id, v)} selectionColor={Palette.brass} />
                    <Text style={styles.qtyUnit}>g</Text>
                  </>
                )}
                <AnimatedPressable onPress={() => removeIngredient(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel={`Remove ${item.meal.name}`}>
                  <Ionicons name="close" size={18} color={Palette.textDim} />
                </AnimatedPressable>
              </View>
            ))}
          </View>
        )}

        {ingredients.length > 0 && totalG > 0 && (
          <View style={styles.totals}>
            <Text style={styles.label}>Whole recipe · {Math.round(totalG)} g</Text>
            <Text style={styles.totalsMain}>
              {Math.round(totals.cal)} kcal  ·  P {Math.round(totals.p)}  ·  C {Math.round(totals.c)}  ·  F {Math.round(totals.f)}
            </Text>
            {servings > 1 && (
              <Text style={styles.totalsSub}>
                Per serving ({Math.round(totalG / servings)} g): {Math.round(totals.cal / servings)} kcal · P {Math.round(totals.p / servings)} g · C {Math.round(totals.c / servings)} g · F {Math.round(totals.f / servings)} g
              </Text>
            )}
          </View>
        )}

        <PrimaryButton title={saving ? 'Saving…' : 'Save recipe'} icon="checkmark" onPress={save} style={saving && { opacity: 0.6 }} />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll:  { flexShrink: 1 },
  body:    { gap: Spacing.lg, paddingBottom: Spacing.lg },
  label:   { ...Type.label, color: Palette.textSub, marginBottom: -Spacing.sm },
  chipRow: { gap: Spacing.sm, paddingTop: Spacing.sm },

  servingsRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepper:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepBtn:      { width: 34, height: 34, borderRadius: 11, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.lineSoft, alignItems: 'center', justifyContent: 'center' },
  stepNum:      { fontFamily: Fonts.num, fontSize: 22, color: Palette.text, minWidth: 24, textAlign: 'center' },
  servingsWord: { ...Type.body, color: Palette.textSub },

  list:       { backgroundColor: Palette.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft, overflow: 'hidden', marginTop: -Spacing.sm },
  divider:    { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  resultRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.md },
  resultName: { ...Type.body, color: Palette.text, flex: 1 },
  resultMeta: { ...Type.small, color: Palette.textSub },

  ingRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.sm + 2 },
  ingName:  { ...Type.body, color: Palette.text, flex: 1 },
  qtyInput: { width: 56, fontFamily: Fonts.num, fontSize: 17, color: Palette.text, textAlign: 'center', backgroundColor: Palette.surface, borderRadius: Radius.sm, borderWidth: 1, borderColor: Palette.line, paddingVertical: 6 },
  qtyUnit:  { ...Type.small, color: Palette.textSub, minWidth: 44 },

  totals:     { backgroundColor: Palette.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft, padding: Spacing.md + 2, gap: Spacing.sm + 2 },
  totalsMain: { fontFamily: Fonts.num, fontSize: 18, color: Palette.text },
  totalsSub:  { ...Type.small, color: Palette.textSub },
});
