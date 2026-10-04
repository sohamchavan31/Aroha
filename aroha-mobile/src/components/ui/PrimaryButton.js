import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../AnimatedPressable';
import { Palette, Fonts, Radius, Spacing } from '../../constants/theme';
import { press } from '../../utils/haptics';

// The one ivory action on a screen. Flat — no gradient, no glow.
export default function PrimaryButton({ title, subtitle, icon = 'arrow-forward', onPress, style, containerStyle }) {
  function handlePress() {
    press();
    onPress?.();
  }

  return (
    <AnimatedPressable onPress={handlePress} scaleTo={0.97} containerStyle={containerStyle} style={[styles.btn, style]}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.go}>
        <Ionicons name={icon} size={16} color={Palette.ivory} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.ivory,
    borderRadius: Radius.md + 2,
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
  },
  textCol:  { flex: 1 },
  title:    { fontFamily: Fonts.numHeavy, fontSize: 20, letterSpacing: 0.4, color: Palette.onIvory, textTransform: 'uppercase' },
  subtitle: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.onIvory, opacity: 0.6, marginTop: 1 },
  go: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Palette.onIvory,
    alignItems: 'center', justifyContent: 'center',
  },
});
