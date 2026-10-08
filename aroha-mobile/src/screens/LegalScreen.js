import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import IconButton from '../components/ui/IconButton';
import AppInfo, { WEBSITE, SUPPORT_EMAIL } from '../constants/appInfo';
import AnimatedPressable from '../components/AnimatedPressable';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';

// In-app summaries; the full documents live on the website (website/ in the repo).
const CONTENT = {
  privacy: {
    title: 'Privacy policy',
    url: `${WEBSITE}/privacy/`,
    paragraphs: [
      'Aroha collects only what you enter (your profile, meals, workouts, water, sleep and weight) to run your tracking, targets and Evolution. No ads, no third-party analytics, and we never sell your data.',
      'Your data is stored on encrypted connections with our hosting providers. You can export it or delete your account at any time from Settings → Your data.',
    ],
  },
  terms: {
    title: 'Terms & conditions',
    url: `${WEBSITE}/terms/`,
    paragraphs: [
      'Aroha is for personal fitness tracking, for people aged 13 and over (under 18 with a parent\'s or guardian\'s consent).',
      'Aroha gives general guidance, not medical advice. Calorie targets, food values and AI replies are estimates. Talk to a doctor before starting a new diet or exercise programme.',
    ],
  },
  about: {
    title: 'About Aroha',
    paragraphs: [
      'Aroha is a wellness companion that makes healthy habits feel like progress you can see. It tracks workouts, meals, water and sleep alongside an evolution system that rewards consistency over perfection.',
      'Made by SOHREX Labs in India. Thanks for being part of the journey.',
    ],
    url: WEBSITE,
    linkLabel: 'Visit the website',
  },
};

export default function LegalScreen({ visible, onClose, type }) {
  if (!visible) return null;
  const content = CONTENT[type] ?? CONTENT.about;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />

        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>{content.title}</Text>
          <IconButton name="close" onPress={onClose} accessibilityLabel="Close" />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {content.paragraphs.map((p, i) => (
            <Text key={i} style={styles.body}>{p}</Text>
          ))}
          {content.url && (
            <AnimatedPressable onPress={() => Linking.openURL(content.url).catch(() => {})} scaleTo={0.98} style={styles.link} accessibilityRole="link">
              <Text style={styles.linkText}>{content.linkLabel || 'Read the full document'}</Text>
              <Ionicons name="open-outline" size={16} color={Palette.text} />
            </AnimatedPressable>
          )}
          <Text style={styles.meta}>Questions? {SUPPORT_EMAIL}</Text>
          <Text style={styles.meta}>Aroha {AppInfo.displayVersion}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Palette.ink },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerSpacer: { width: 38 },
  headerTitle:  { fontFamily: Fonts.display, fontSize: 17, color: Palette.text },
  content:      { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  link:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderRadius: Radius.md, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  linkText:     { fontFamily: Fonts.bodyBold, fontSize: 15, color: Palette.text },
  body:         { ...Type.body, fontSize: 15, lineHeight: 24, color: Palette.textSub, maxWidth: 560 },
  meta:         { ...Type.small, color: Palette.textDim },
});
