import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

export default function WorkoutScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="barbell-outline" size={48} color={Colors.accentPurple} />
        </View>
        <Text style={styles.title}>Workout Logger</Text>
        <Text style={styles.subtitle}>Home workouts. No gym needed.</Text>
        <Text style={styles.hint}>Bodyweight routines, calisthenics, and Indian yoga flows — coming in the next milestone.</Text>
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
    color: Colors.accentPurpleLight,
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
