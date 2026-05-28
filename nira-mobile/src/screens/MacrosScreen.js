import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

export default function MacrosScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="nutrition-outline" size={48} color={Colors.accentGold} />
        </View>
        <Text style={styles.title}>Macro Tracker</Text>
        <Text style={styles.subtitle}>Indian food database coming soon.</Text>
        <Text style={styles.hint}>Dal-chawal macros, regional recipes, Konkan cuisine — all in the next build.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.accentGold,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: 20,
  },
});
