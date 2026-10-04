import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../AnimatedPressable';
import { Palette, Radius } from '../../constants/theme';
import { tap } from '../../utils/haptics';

export default function IconButton({ name, onPress, size = 38, color = Palette.textSub, style, accessibilityLabel }) {
  return (
    <AnimatedPressable
      onPress={() => { tap(); onPress?.(); }}
      scaleTo={0.92}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.btn, { width: size, height: size, borderRadius: Radius.md - 2 }, style]}
    >
      <Ionicons name={name} size={Math.round(size * 0.47)} color={color} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Palette.surface2,
    borderWidth: 1,
    borderColor: Palette.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
