import React, { useEffect, useState } from 'react';
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

  useEffect(() => { setText(String(value)); }, [value]);

  function bump(dir) {
    const next = clean(Math.min(max, Math.max(min, (Number(value) || 0) + dir * step)), decimals);
    if (next !== value) { tap(); onChange(next); }
  }

  function commit() {
    const n = parseFloat(text.replace(',', '.'));
    const next = Number.isFinite(n) ? clean(Math.min(max, Math.max(min, n)), decimals) : value;
    onChange(next);
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
            onChangeText={setText}
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
