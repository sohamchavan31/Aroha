import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.avatarBox}>
          <Ionicons name="person-outline" size={48} color={Colors.textSub} />
        </View>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>E RANK HUNTER</Text>
        </View>
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.hint}>Auth system, health goals, and personal stats coming once the backend is live.</Text>
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
  avatarBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rankBadge: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 20,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: 20,
  },
});
