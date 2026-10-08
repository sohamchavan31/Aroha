import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../AnimatedPressable';
import { Palette, Fonts, Type, Radius, Spacing } from '../../constants/theme';
import { tap } from '../../utils/haptics';

function clean(n, decimals) {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

// − value + with an editable number in the middle.
export default function Stepper({ label, value, onChange, step = 1, min = 0, max = 999, decimals = 0, unit }) {
  const [text, setText] = useState(String(value));
  const editing = useRef(false);

  // Follow outside changes, but never overwrite what the user is typing.
  useEffect(() => { if (!editing.current) setText(String(value)); }, [value]);

  function bump(dir) {
    const next = clean(Math.min(max, Math.max(min, (Number(value) || 0) + dir * step)), decimals);
    if (next !== value) { tap(); editing.current = false; setText(String(next)); onChange(next); }
  }

  // Typed numbers count straight away: on Android, hiding the keyboard or
  // tapping Save doesn't blur the field, so waiting for blur lost the value.
  function type(t) {
    setText(t);
    const n = parseFloat(t.replace(',', '.'));
    if (Number.isFinite(n) && n >= min && n <= max) onChange(clean(n, decimals));
  }

  // Leaving the field: clamp whatever is there (or restore the last good value).
  function commit() {
    editing.current = false;
    const n = parseFloat(text.replace(',', '.'));
    const next = Number.isFinite(n) ? clean(Math.min(max, Math.max(min, n)), decimals) : value;
    if (next !== value) onChange(next);
    setText(String(next));
  }

  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <AnimatedPressable onPress={() => bump(-1)} scaleTo={0.88} style={styles.btn} accessibilityLabel={`Decrease ${label || 'value'}`}>
          <Ionicons name="remove" size={18} color={Palette.text} />
        </AnimatedPressable>
        <View style={styles.valueBox}>
          <TextInput
            value={text}
            onChangeText={type}
            onFocus={() => { editing.current = true; }}
            onEndEditing={commit}
            onBlur={commit}
            keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
            selectTextOnFocus
            selectionColor={Palette.brass}
            style={styles.input}
            accessibilityLabel={label}
          />
          {!!unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
        <AnimatedPressable onPress={() => bump(1)} scaleTo={0.88} style={styles.btn} accessibilityLabel={`Increase ${label || 'value'}`}>
          <Ionicons name="add" size={18} color={Palette.text} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { flex: 1, minWidth: 0 },
  label:    { ...Type.label, color: Palette.textSub, marginBottom: Spacing.sm, textAlign: 'center' },
  row:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft, padding: 4 },
  btn:      { width: 32, height: 40, borderRadius: Radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
  valueBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  input:    { fontFamily: Fonts.numHeavy, fontSize: 26, color: Palette.text, textAlign: 'center', padding: 0, minWidth: 40 },
  unit:     { fontFamily: Fonts.bodySemi, fontSize: 10, color: Palette.textSub, marginTop: -2 },
});
