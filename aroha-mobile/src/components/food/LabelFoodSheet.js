import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Sheet from '../ui/Sheet';
import Chip from '../ui/Chip';
import Field from '../ui/Field';
import Segmented from '../ui/Segmented';
import PrimaryButton from '../ui/PrimaryButton';
import FormError from '../auth/FormError';
import client from '../../api/client';
import { apiError } from '../../utils/apiError';
import { Palette, Fonts, Type, Spacing } from '../../constants/theme';
import { success, warn } from '../../utils/haptics';

const BASIS = [
  { key: '100g',    label: 'Per 100 g' },
  { key: 'serving', label: 'Per serving' },
];
const UNITS = ['g', 'piece', 'scoop', 'glass', 'cup', 'slice', 'katori', 'bar', 'pack'];
const num = v => {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

// Packaged food copied from the nutrition label (brands differ: Amul vs
// Govardhan paneer, Pintola vs Dr. Oatkar oats). Saved as the user's own food,
// with macros stored per 100 g like every other food. Pass `food` to edit one
// of the user's foods instead.
export default function LabelFoodSheet({ visible, initialName = '', food = null, onClose, onSaved }) {
  const [name, setName]       = useState('');
  const [brand, setBrand]     = useState('');
  const [basis, setBasis]     = useState('100g');
  const [unit, setUnit]       = useState('g');
  const [serving, setServing] = useState('');
  const [kcal, setKcal]       = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs]     = useState('');
  const [fat, setFat]         = useState('');
  const [tried, setTried]     = useState(false);
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTried(false); setError(''); setBasis('100g');
    if (food) {
      const u = (food.servingUnit || '').toLowerCase();
      const known = !u || u === 'grams' || u === 'gram' ? 'g' : u; // recipes may use units not in the list
      setName(food.name || ''); setBrand(food.brand || '');
      setUnit(known);
      setServing(known !== 'g' && food.typicalServing ? String(food.typicalServing) : '');
      const show = v => (v == null ? '' : String(Math.round(v * 10) / 10));
      setKcal(show(food.caloriesPer100g)); setProtein(show(food.proteinPer100g));
      setCarbs(show(food.carbsPer100g)); setFat(show(food.fatPer100g));
      return;
    }
    setName(initialName); setBrand(''); setUnit('g'); setServing('');
    setKcal(''); setProtein(''); setCarbs(''); setFat('');
  }, [visible, food?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const servingG = num(serving);
  const per = basis === '100g' ? 100 : servingG;
  const to100 = v => (per > 0 ? (num(v) * 100) / per : NaN);

  const errors = {
    name:    !name.trim() ? 'Enter the food name' : '',
    serving: basis === 'serving' || unit !== 'g'
      ? (!(servingG > 0) ? 'Enter the serving size in grams' : servingG > 2000 ? 'That serving looks too big' : '')
      : '',
    kcal:    !(num(kcal) >= 0) ? 'Enter calories' : to100(kcal) > 900 ? 'Over 900 kcal per 100 g — check the label' : '',
    protein: !(num(protein) >= 0) ? 'Required' : to100(protein) > 100 ? 'Too high' : '',
    carbs:   !(num(carbs) >= 0) ? 'Required' : to100(carbs) > 100 ? 'Too high' : '',
    fat:     !(num(fat) >= 0) ? 'Required' : to100(fat) > 100 ? 'Too high' : '',
  };
  const invalid = Object.values(errors).some(Boolean);
  const show = k => (tried ? errors[k] : '');

  async function save() {
    if (saving) return;
    setTried(true);
    setError('');
    if (invalid) { warn(); return; }
    setSaving(true);
    try {
      const round = v => Math.round(to100(v) * 10) / 10;
      const body = {
        name: name.trim(),
        brand: brand.trim() || null,
        category: food?.category || 'packaged',
        caloriesPer100g: round(kcal),
        proteinPer100g: round(protein),
        carbsPer100g: round(carbs),
        fatPer100g: round(fat),
        fiberPer100g: food?.fiberPer100g || 0,
        servingUnit: unit === 'g' ? 'grams' : unit,
        typicalServing: servingG > 0 ? servingG : (food?.typicalServing || 100),
      };
      const { data } = food
        ? await client.put(`/meals/custom/${food.id}`, body)
        : await client.post('/meals/custom', body);
      success();
      onSaved?.(data);
    } catch (err) {
      warn();
      setError(apiError(err, 'Could not save this food. Try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={food ? 'Edit food' : 'Add from label'} subtitle={food ? 'Meals you already logged keep their old values' : 'Copy the numbers from the pack'} showClose>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <View style={styles.row}>
          <Field label="Food" placeholder="Paneer" value={name} onChangeText={setName} maxLength={80} error={show('name')} style={styles.flex} />
          <Field label="Brand" placeholder="Amul" value={brand} onChangeText={setBrand} maxLength={60} style={styles.flex} autoCapitalize="words" />
        </View>

        <View>
          <Text style={styles.label}>The label shows values</Text>
          <Segmented options={BASIS} value={basis} onChange={setBasis} />
        </View>

        <View>
          <Text style={styles.label}>You eat it by the</Text>
          <View style={styles.chips}>
            {(UNITS.includes(unit) ? UNITS : [...UNITS, unit]).map(u => <Chip key={u} label={u} capitalize={false} selected={unit === u} onPress={() => setUnit(u)} />)}
          </View>
        </View>

        {(basis === 'serving' || unit !== 'g') && (
          <Field
            label={unit === 'g' ? 'Serving size' : `One ${unit} weighs`}
            placeholder="e.g. 40"
            value={serving}
            onChangeText={setServing}
            keyboardType="decimal-pad"
            right={<Text style={styles.unit}>g</Text>}
            error={show('serving')}
          />
        )}

        <View>
          <Text style={styles.label}>{basis === '100g' ? 'Per 100 g' : `Per serving${servingG > 0 ? ` (${servingG} g)` : ''}`}</Text>
          <View style={styles.grid}>
            <Field placeholder="Calories" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" right={<Text style={[styles.unit, { color: Palette.kcal }]}>kcal</Text>} error={show('kcal')} style={styles.cell} />
            <Field placeholder="Protein" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" right={<Text style={[styles.unit, { color: Palette.protein }]}>g P</Text>} error={show('protein')} style={styles.cell} />
            <Field placeholder="Carbs" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" right={<Text style={[styles.unit, { color: Palette.carbs }]}>g C</Text>} error={show('carbs')} style={styles.cell} />
            <Field placeholder="Fat" value={fat} onChangeText={setFat} keyboardType="decimal-pad" right={<Text style={[styles.unit, { color: Palette.fat }]}>g F</Text>} error={show('fat')} style={styles.cell} />
          </View>
        </View>

        <Text style={styles.hint}>Only you can see foods you add. Search finds them by name or brand.</Text>
        <FormError message={error} />
        <PrimaryButton title={saving ? 'Saving…' : food ? 'Save changes' : 'Save and log it'} icon="checkmark" onPress={save} />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  body:   { gap: Spacing.lg, paddingBottom: Spacing.sm },
  flex:   { flex: 1 },
  row:    { flexDirection: 'row', gap: Spacing.md },
  label:  { ...Type.label, color: Palette.textSub, marginBottom: Spacing.sm },
  chips:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  grid:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  cell:   { width: '47%', flexGrow: 1 },
  unit:   { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.textSub },
  hint:   { ...Type.small, color: Palette.textDim },
});
