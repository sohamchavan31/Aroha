import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    body: `This is placeholder text — replace with your real privacy policy before launch.

Aroha collects the health and fitness information you enter (weight, workouts, meals, wellness logs) solely to power the app's tracking and recommendation features. We do not sell your personal data to third parties.

Data is stored securely and is only used to provide and improve the app experience. You can request deletion of your account and associated data at any time from Settings.`,
  },
  terms: {
    title: 'Terms & Conditions',
    body: `This is placeholder text — replace with your real terms before launch.

By using Aroha, you agree to use the app for personal, non-commercial fitness and wellness tracking. Aroha is not a substitute for professional medical advice — consult a doctor before starting any new diet or exercise program.

We may update these terms as the app evolves; continued use of the app means you accept the current terms.`,
  },
  about: {
    title: 'About Us',
    body: `Aroha is a wellness companion app built to make healthy habits feel like progress you can see — tracking workouts, meals, water, and sleep alongside an evolution system that rewards consistency over perfection.

Built by a solo indie developer. Thanks for being part of the journey.`,
  },
};

export default function LegalScreen({ visible, onClose, type }) {
  if (!visible) return null;
  const content = CONTENT[type] ?? CONTENT.about;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>{content.title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={Colors.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.body}>{content.body}</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  body: { fontSize: 14, lineHeight: 22, color: Colors.textSub },
});
