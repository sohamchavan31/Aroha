import React, { forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Fonts, Type, Radius, Spacing } from '../../constants/theme';

// Text input in the kit's style. Optional label above, icon inside and error below.
const Field = forwardRef(function Field({ label, icon, right, error, style, inputStyle, ...inputProps }, ref) {
  return (
    <View style={style}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.box, !!error && styles.boxError]}>
        {!!icon && <Ionicons name={icon} size={17} color={error ? Palette.danger : Palette.textDim} />}
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
      {!!error && <Text style={styles.error}>{error}</Text>}
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
  boxError: { borderColor: Palette.danger + '99' },
  error: { ...Type.small, color: Palette.danger, marginTop: 6 },
  input: { flex: 1, minWidth: 0, fontFamily: Fonts.bodySemi, fontSize: 15, color: Palette.text, paddingVertical: Spacing.md },
});
