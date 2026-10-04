import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing } from '../../constants/theme';

// Matte surface: one shade above the background plus a hairline border.
// variant="hero" is the stage card; variant="dashed" is an empty-state slot.
export default function Card({ children, style, variant = 'default' }) {
  return (
    <View style={[styles.base, variant === 'hero' && styles.hero, variant === 'dashed' && styles.dashed, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.lineSoft,
    padding: Spacing.lg,
  },
  hero: {
    backgroundColor: Palette.hero,
    borderRadius: Radius.xl,
  },
  dashed: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: Palette.line,
  },
});
