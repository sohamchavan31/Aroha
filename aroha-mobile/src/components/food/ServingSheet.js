import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '../ui/Sheet';
import Chip from '../ui/Chip';
import Field from '../ui/Field';
import PrimaryButton from '../ui/PrimaryButton';
import AnimatedPressable from '../AnimatedPressable';
import { SLOTS, getDefaultSlot, isUnitFood, macrosFor } from '../../constants/food';
import { Palette, Fonts, Type, Radius, Spacing } from '../../constants/theme';
import { tap } from '../../utils/haptics';

const PRESETS = [
  { mult: 0.5, label: '½×' },
  { mult: 1,   label: '1×' },
  { mult: 1.5, label: '1½×' },
  { mult: 2,   label: '2×' },
];

// Pick how much of a food and which meal it belongs to, then add it.
export default function ServingSheet({ meal, initialSlot, onClose, onAdd }) {
  const [slot, setSlot]         = useState('BREAKFAST');
  const [grams, setGrams]       = useState('');
  const [pieces, setPieces]     = useState(1);
  const [custom, setCustom]     = useState(false);
  const [adding, setAdding]     = useState(false);

  useEffect(() => {
    if (!meal) return;
    setSlot(initialSlot || getDefaultSlot());
    setGrams(String(meal.typicalServing));
    setPieces(1);
    setCustom(false);
    setAdding(false);
  }, [meal]);

  const unitFood = isUnitFood(meal);
  const typical  = meal?.typicalServing || 0;
  const g        = Number(grams) || 0;
  const m        = macrosFor(meal, g);
  const slotInfo = SLOTS.find(s => s.key === slot);

  function stepPieces(delta) {
    const next = Math.max(1, pieces + delta);
    tap();
    setPieces(next);
    setGrams(String(Math.round(typical * next)));
    setCustom(false);
  }

  async function add() {
    if (!g || adding) return;
    setAdding(true);
    const ok = await onAdd(meal, g, slot);
    if (!ok) setAdding(false);
  }

  return (
    <Sheet
      visible={!!meal}
      onClose={onClose}
      title={meal?.brand ? `${meal.brand} ${meal.name}` : meal?.name}
      subtitle={unitFood ? `${typical} g per ${meal?.servingUnit}` : `Typical serving ${typical} g`}
      showClose
    >
      <View style={styles.slots}>
        {SLOTS.map(s => (
          <Chip key={s.key} label={s.label} color={s.color} selected={slot === s.key} onPress={() => setSlot(s.key)} containerStyle={styles.flex1} />
        ))}
      </View>

      {unitFood && !custom ? (
        <View style={styles.stepper}>
          <StepBtn icon="remove" onPress={() => stepPieces(-1)} label="One less" />
          <View style={styles.stepCenter}>
            <Text style={styles.stepNum}>{pieces}</Text>
            <Text style={styles.stepUnit}>{meal?.servingUnit}{pieces !== 1 ? 's' : ''} · {Math.round(typical * pieces)} g</Text>
          </View>
          <StepBtn icon="add" onPress={() => stepPieces(1)} label="One more" />
        </View>
      ) : !unitFood ? (
        <View style={styles.presets}>
          {PRESETS.map(p => {
            const pg = Math.round(typical * p.mult);
            return (
              <Chip
                key={p.mult}
                label={p.label}
                sublabel={`${pg} g`}
                selected={!custom && g === pg}
                onPress={() => { setGrams(String(pg)); setCustom(false); }}
                containerStyle={styles.flex1}
              />
            );
          })}
          <Chip label="Custom" sublabel="grams" selected={custom} onPress={() => { setCustom(true); setGrams(''); }} containerStyle={styles.flex1} />
        </View>
      ) : null}

      {custom && (
        <Field
          value={grams}
          onChangeText={setGrams}
          placeholder="Enter grams"
          keyboardType="numeric"
          autoFocus
          right={<Text style={styles.gUnit}>g</Text>}
          inputStyle={styles.gInput}
          style={styles.customField}
        />
      )}
      {unitFood && (
        <AnimatedPressable
          onPress={() => { tap(); setCustom(c => !c); setGrams(custom ? String(Math.round(typical * pieces)) : ''); }}
          style={styles.switchLink}
        >
          <Text style={styles.switchLinkText}>{custom ? `Count in ${meal?.servingUnit}s instead` : 'Enter grams instead'}</Text>
        </AnimatedPressable>
      )}

      <View style={styles.preview}>
        <View>
          <Text style={styles.previewLabel}>This adds</Text>
          <Text style={styles.previewKcal}>{g ? Math.round(m.cal) : '–'}<Text style={styles.previewUnit}> kcal</Text></Text>
        </View>
        <View style={styles.previewMacros}>
          <MacroPill label="P" value={m.p} color={Palette.protein} show={!!g} />
          <MacroPill label="C" value={m.c} color={Palette.carbs}   show={!!g} />
          <MacroPill label="F" value={m.f} color={Palette.fat}     show={!!g} />
        </View>
      </View>

      <PrimaryButton
        title={adding ? 'Adding…' : `Add to ${slotInfo?.label || 'log'}`}
        icon="add"
        onPress={add}
        style={!g && styles.disabled}
      />
    </Sheet>
  );
}

function StepBtn({ icon, onPress, label }) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.9} style={styles.stepBtn} accessibilityLabel={label}>
      <Ionicons name={icon} size={22} color={Palette.text} />
    </AnimatedPressable>
  );
}

function MacroPill({ label, value, color, show }) {
  return (
    <View style={styles.pill}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={styles.pillText}>{label} {show ? Math.round(value) : '–'}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1:   { flex: 1 },
  slots:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  presets: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },

  stepper:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  stepBtn:    { width: 52, height: 52, borderRadius: 18, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.lineSoft, alignItems: 'center', justifyContent: 'center' },
  stepCenter: { alignItems: 'center' },
  stepNum:    { fontFamily: Fonts.numHeavy, fontSize: 52, lineHeight: 56, color: Palette.text },
  stepUnit:   { ...Type.small, color: Palette.textSub },

  customField: { marginBottom: Spacing.sm },
  gInput:      { fontFamily: Fonts.num, fontSize: 22 },
  gUnit:       { fontFamily: Fonts.num, fontSize: 16, color: Palette.textSub },
  switchLink:     { alignSelf: 'center', paddingVertical: Spacing.sm },
  switchLinkText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.textSub, textDecorationLine: 'underline' },

  preview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Palette.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft,
    padding: Spacing.md + 2, marginTop: Spacing.sm, marginBottom: Spacing.lg,
  },
  previewLabel:  { ...Type.label, color: Palette.textSub },
  previewKcal:   { fontFamily: Fonts.numHeavy, fontSize: 30, color: Palette.text, marginTop: 2 },
  previewUnit:   { fontFamily: Fonts.num, fontSize: 14, color: Palette.textSub },
  previewMacros: { gap: 4, alignItems: 'flex-start' },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillDot:  { width: 6, height: 6, borderRadius: 2 },
  pillText: { fontFamily: Fonts.num, fontSize: 14, color: Palette.text },
  disabled: { opacity: 0.4 },
});
