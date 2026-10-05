import React from 'react';
import { View, Text, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../AnimatedPressable';
import { Palette, Fonts, Type, Spacing, Radius } from '../../constants/theme';

// Shared frame for Login and Register: wordmark, title, form slot, footer link.
export default function AuthShell({ title, subtitle, children, footerText, footerAction, onFooter }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <View style={styles.mark}><Ionicons name="flame" size={22} color={Palette.text} /></View>
            <Text style={styles.wordmark}>AROHA</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          <View style={styles.form}>{children}</View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{footerText} </Text>
            <AnimatedPressable onPress={onFooter} scaleTo={0.96} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }} accessibilityRole="link">
              <Text style={styles.footerAction}>{footerAction}</Text>
            </AnimatedPressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Palette.ink },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl },

  brand:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  mark:     { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.lineSoft, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontFamily: Fonts.display, fontSize: 18, letterSpacing: 4, color: Palette.text },

  title:    { fontFamily: Fonts.display, fontSize: 28, lineHeight: 36, color: Palette.text },
  subtitle: { ...Type.body, fontSize: 15, lineHeight: 22, color: Palette.textSub, marginTop: Spacing.sm },

  form:   { marginTop: Spacing.xl, gap: Spacing.lg },

  footer:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: Spacing.xl },
  footerText:   { ...Type.body, fontSize: 14, color: Palette.textSub },
  footerAction: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Palette.text, textDecorationLine: 'underline' },
});
