import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import IconButton from '../components/ui/IconButton';
import AppInfo from '../constants/appInfo';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';

// Placeholder copy — replace privacy and terms with reviewed text before launch.
const CONTENT = {
  privacy: {
    title: 'Privacy policy',
    draft: true,
    paragraphs: [
      'Aroha collects the health and fitness information you enter (weight, workouts, meals, water and sleep logs) only to power tracking and recommendations in the app. We do not sell your personal data.',
      'Your data is stored securely and used only to provide and improve Aroha. You can ask for your account and its data to be deleted at any time.',
    ],
  },
  terms: {
    title: 'Terms & conditions',
    draft: true,
    paragraphs: [
      'By using Aroha you agree to use it for personal, non-commercial fitness and wellness tracking.',
      'Aroha is not a substitute for professional medical advice. Talk to a doctor before starting a new diet or exercise programme.',
      'These terms may change as the app evolves. Continuing to use Aroha means you accept the current terms.',
    ],
  },
  about: {
    title: 'About Aroha',
    paragraphs: [
      'Aroha is a wellness companion that makes healthy habits feel like progress you can see. It tracks workouts, meals, water and sleep alongside an evolution system that rewards consistency over perfection.',
      'Built by a solo indie developer in India. Thanks for being part of the journey.',
    ],
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
          {content.draft && (
            <View style={styles.draft}>
              <Ionicons name="document-text-outline" size={15} color={Palette.kcal} />
              <Text style={styles.draftText}>Draft. The final version will be published before launch.</Text>
            </View>
          )}
          {content.paragraphs.map((p, i) => (
            <Text key={i} style={styles.body}>{p}</Text>
          ))}
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
  draft:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: 'rgba(245,165,36,0.08)', borderWidth: 1, borderColor: 'rgba(245,165,36,0.25)' },
  draftText:    { ...Type.small, color: Palette.text, flex: 1 },
  body:         { ...Type.body, fontSize: 15, lineHeight: 24, color: Palette.textSub, maxWidth: 560 },
  meta:         { ...Type.small, color: Palette.textDim, marginTop: Spacing.lg },
});
