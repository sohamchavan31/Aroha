import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

const DAILY_QUESTS = [
  { id: '1', title: 'Walk 5000 steps', xp: 50, icon: 'walk-outline' },
  { id: '2', title: 'Drink 8 glasses of water', xp: 30, icon: 'water-outline' },
  { id: '3', title: 'No junk food today', xp: 40, icon: 'fast-food-outline' },
];

function getTodayDate() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}

export default function HomeScreen() {
  const [completedQuests, setCompletedQuests] = useState({});
  const streak = 1;
  const rank = 'E';
  const totalXP = 120;

  function toggleQuest(id) {
    setCompletedQuests(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const completedCount = Object.values(completedQuests).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Ohayo, Hunter</Text>
            <Text style={styles.date}>{getTodayDate()}</Text>
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankLabel}>RANK</Text>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        </View>

        {/* Streak + XP Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statValue}>{totalXP}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{completedCount}/{DAILY_QUESTS.length}</Text>
            <Text style={styles.statLabel}>Quests Done</Text>
          </View>
        </View>

        {/* Daily Quests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Quests</Text>
            <View style={styles.questBadge}>
              <Text style={styles.questBadgeText}>+120 XP</Text>
            </View>
          </View>

          {DAILY_QUESTS.map(quest => {
            const done = !!completedQuests[quest.id];
            return (
              <TouchableOpacity
                key={quest.id}
                style={[styles.questCard, done && styles.questCardDone]}
                onPress={() => toggleQuest(quest.id)}
                activeOpacity={0.7}
              >
                <View style={styles.questLeft}>
                  <View style={[styles.questCheck, done && styles.questCheckDone]}>
                    {done && <Ionicons name="checkmark" size={14} color={Colors.background} />}
                  </View>
                  <View style={styles.questIconBox}>
                    <Ionicons name={quest.icon} size={20} color={done ? Colors.textMuted : Colors.accentGold} />
                  </View>
                  <Text style={[styles.questTitle, done && styles.questTitleDone]}>
                    {quest.title}
                  </Text>
                </View>
                <Text style={[styles.questXP, done && styles.questXPDone]}>+{quest.xp} XP</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rank Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rank Progress</Text>
          <View style={styles.rankCard}>
            <View style={styles.rankRow}>
              <View style={styles.currentRank}>
                <Text style={styles.currentRankLabel}>Current</Text>
                <View style={[styles.rankCircle, { backgroundColor: Colors.rankE }]}>
                  <Text style={styles.rankCircleText}>E</Text>
                </View>
              </View>
              <View style={styles.rankProgressBar}>
                <View style={styles.rankProgressTrack}>
                  <View style={[styles.rankProgressFill, { width: '12%' }]} />
                </View>
                <Text style={styles.rankProgressText}>120 / 1000 XP</Text>
              </View>
              <View style={styles.nextRank}>
                <Text style={styles.currentRankLabel}>Next</Text>
                <View style={[styles.rankCircle, styles.rankCircleLocked]}>
                  <Text style={styles.rankCircleText}>D</Text>
                </View>
              </View>
            </View>
            <Text style={styles.rankMotivation}>Your next rank awaits, Hunter. Keep grinding.</Text>
          </View>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 13,
    color: Colors.textSub,
    marginTop: 4,
  },
  rankBadge: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  rankText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSub,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  questBadge: {
    backgroundColor: 'rgba(226, 183, 20, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 183, 20, 0.3)',
    marginBottom: 14,
  },
  questBadgeText: {
    fontSize: 12,
    color: Colors.accentGold,
    fontWeight: '700',
  },
  questCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  questCardDone: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(46, 204, 113, 0.05)',
  },
  questLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  questCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questCheckDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  questIconBox: {
    marginRight: 12,
  },
  questTitle: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  questTitleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  questXP: {
    fontSize: 13,
    color: Colors.accentGold,
    fontWeight: '700',
    marginLeft: 8,
  },
  questXPDone: {
    color: Colors.textMuted,
  },
  rankCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 20,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentRank: {
    alignItems: 'center',
  },
  nextRank: {
    alignItems: 'center',
  },
  currentRankLabel: {
    fontSize: 10,
    color: Colors.textSub,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rankCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankCircleLocked: {
    backgroundColor: Colors.textMuted,
  },
  rankCircleText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  rankProgressBar: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  rankProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  rankProgressFill: {
    height: '100%',
    backgroundColor: Colors.accentPurple,
    borderRadius: 3,
  },
  rankProgressText: {
    fontSize: 11,
    color: Colors.textSub,
    fontWeight: '600',
  },
  rankMotivation: {
    fontSize: 13,
    color: Colors.accentGold,
    fontStyle: 'italic',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 14,
  },
  bottomPad: {
    height: 20,
  },
});
