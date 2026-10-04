import React from 'react';
import { Text, StyleSheet } from 'react-native';
import AnimatedPressable from '../AnimatedPressable';
import { Palette, Fonts, Radius, Spacing } from '../../constants/theme';
import { tap } from '../../utils/haptics';

// Selectable pill. `color` tints the selected state (defaults to neutral white).
export default function Chip({ label, sublabel, selected, onPress, color, style, containerStyle }) {
  const tint = color || Palette.text;
  return (
    <AnimatedPressable
      onPress={() => { tap(); onPress?.(); }}
      scaleTo={0.95}
      containerStyle={containerStyle}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected && { borderColor: tint + '80', backgroundColor: tint + '1A' }, style]}
    >
      <Text style={[styles.label, selected && { color: tint }]}>{label}</Text>
      {!!sublabel && <Text style={[styles.sub, selected && { color: tint }]}>{sublabel}</Text>}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.sm,
    borderRadius: Radius.md - 2,
    borderWidth: 1, borderColor: Palette.line,
    backgroundColor: Palette.surface2,
  },
  label: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.textSub, textTransform: 'capitalize' },
  sub:   { fontFamily: Fonts.num, fontSize: 13, color: Palette.textDim, marginTop: 1 },
});
