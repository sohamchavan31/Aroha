import React, { forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Fonts, Type, Radius, Spacing } from '../../constants/theme';

// Text input in the kit's style. Optional label above and icon inside.
const Field = forwardRef(function Field({ label, icon, right, style, inputStyle, ...inputProps }, ref) {
  return (
    <View style={style}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.box}>
        {!!icon && <Ionicons name={icon} size={17} color={Palette.textDim} />}
        <TextInput
          ref={ref}
          placeholderTextColor={Palette.textDim}
          selectionColor={Palette.brass}
          cursorColor={Palette.text}
          autoCorrect={false}
          {...inputProps}
          style={[styles.input, inputStyle]}
        />
        {right}
      </View>
    </View>
  );
});

export default Field;

const styles = StyleSheet.create({
  label: { ...Type.label, color: Palette.textSub, marginBottom: Spacing.sm },
  box: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Palette.surface2,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft,
    paddingHorizontal: Spacing.md + 2,
    minHeight: 48,
  },
  input: { flex: 1, fontFamily: Fonts.bodySemi, fontSize: 15, color: Palette.text, paddingVertical: Spacing.md },
});
