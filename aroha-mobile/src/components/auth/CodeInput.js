import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Palette, Fonts, Radius, Spacing } from '../../constants/theme';

const LENGTH = 6;

// Six boxes for an emailed code, backed by one hidden input so paste and
// the keyboard's one-time-code suggestion fill all six at once.
const CodeInput = forwardRef(function CodeInput({ value, onChange, onComplete, error, autoFocus = true }, ref) {
  const input = useRef(null);
  const [focused, setFocused] = useState(false);
  useImperativeHandle(ref, () => ({ focus }));

  // Android won't reopen a dismissed keyboard for an input that still has focus.
  function focus() {
    if (input.current?.isFocused()) {
      input.current.blur();
      setTimeout(() => input.current?.focus(), 50);
    } else {
      input.current?.focus();
    }
  }

  function change(text) {
    const digits = text.replace(/\D/g, '').slice(0, LENGTH);
    onChange(digits);
    if (digits.length === LENGTH) onComplete?.(digits);
  }

  return (
    <Pressable onPress={focus} accessibilityLabel={`Code, ${value.length} of ${LENGTH} digits`}>
      <View style={styles.row}>
        {Array.from({ length: LENGTH }, (_, i) => {
          const active = focused && (i === value.length || (i === LENGTH - 1 && value.length === LENGTH));
          return (
            <View key={i} style={[styles.box, active && styles.boxActive, !!error && styles.boxError]}>
              <Text style={styles.digit}>{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        value={value}
        onChangeText={change}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
});

export default CodeInput;

const styles = StyleSheet.create({
  row:       { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  box:       { flex: 1, maxWidth: 52, aspectRatio: 0.82, borderRadius: Radius.md, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.lineSoft, alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: Palette.ivory },
  boxError:  { borderColor: Palette.danger + '99' },
  digit:     { fontFamily: Fonts.numHeavy, fontSize: 28, color: Palette.text },
  hidden:    { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
