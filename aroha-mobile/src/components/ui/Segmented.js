import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../AnimatedPressable';
import { Palette, Fonts, Radius, Spacing } from '../../constants/theme';
import { tap } from '../../utils/haptics';

// Matte segmented control. options: [{ key, label, icon? }]
export default function Segmented({ options, value, onChange, style }) {
  return (
    <View style={[styles.track, style]} accessibilityRole="tablist">
      {options.map(o => {
        const active = o.key === value;
        return (
          <AnimatedPressable
            key={o.key}
            scaleTo={0.96}
            onPress={() => { if (!active) { tap(); onChange(o.key); } }}
            containerStyle={styles.slot}
            style={[styles.seg, active && styles.segActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            {!!o.icon && <Ionicons name={o.icon} size={14} color={active ? Palette.text : Palette.textDim} />}
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track:       { flexDirection: 'row', backgroundColor: Palette.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft, padding: 3 },
  slot:        { flex: 1 },
  seg:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm + 1, borderRadius: Radius.md - 3 },
  segActive:   { backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.line },
  label:       { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.textDim },
  labelActive: { color: Palette.text },
});
