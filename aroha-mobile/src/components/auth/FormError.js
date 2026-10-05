import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Type, Spacing, Radius } from '../../constants/theme';

// Server-side error shown above the main button.
export default function FormError({ message }) {
  if (!message) return null;
  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle-outline" size={16} color={Palette.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' },
  text: { ...Type.small, fontSize: 13, color: Palette.text, flex: 1 },
});
