import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from '../ui/Sheet';
import { BODY_INFO } from '../../constants/body';
import { Palette, Fonts, Type, Spacing, Radius } from '../../constants/theme';

// What a body number means, how it's worked out, and its limits.
export default function BodyInfoSheet({ infoKey, onClose }) {
  const info = BODY_INFO[infoKey];
  return (
    <Sheet visible={Boolean(info)} onClose={onClose} title={info?.title} showClose>
      {!!info && (
        <View style={styles.body}>
          <Text style={styles.what}>{info.what}</Text>
          <View style={styles.formula}>
            <Text style={styles.label}>How it's worked out</Text>
            <Text style={styles.formulaText}>{info.formula}</Text>
          </View>
          {!!info.ranges && (
            <View style={styles.ranges}>
              {info.ranges.map(([range, label]) => (
                <View key={range + label} style={styles.rangeRow}>
                  <Text style={styles.range}>{range}</Text>
                  <Text style={styles.rangeLabel}>{label}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.caveat}>{info.caveat}</Text>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body:        { gap: Spacing.lg },
  what:        { ...Type.body, fontSize: 15, lineHeight: 22, color: Palette.text },
  formula:     { backgroundColor: Palette.surface2, borderRadius: Radius.md, padding: Spacing.md, gap: 6 },
  label:       { ...Type.label, color: Palette.textSub },
  formulaText: { fontFamily: Fonts.bodySemi, fontSize: 14, lineHeight: 20, color: Palette.text },
  ranges:      { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  rangeRow:    { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Palette.lineSoft },
  range:       { ...Type.body, color: Palette.textSub, flex: 1 },
  rangeLabel:  { ...Type.bodyB, color: Palette.text },
  caveat:      { ...Type.small, fontSize: 13, lineHeight: 19, color: Palette.textSub },
});
