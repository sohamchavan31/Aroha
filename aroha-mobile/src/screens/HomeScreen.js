import React, { useState, useEffect, useCallback } from 'react';
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
import * as Speech from 'expo-speech';
import Colors from '../constants/colors';
import client from '../api/client';
import WellnessModal from '../components/WellnessModal';
import ProfileScreen from './ProfileScreen';

const DAILY_MISSIONS = [
  { id: '1', title: 'Walk 5000 steps', ep: 50, icon: 'walk-outline' },
  { id: '2', title: 'Drink 8 glasses of water', ep: 30, icon: 'water-outline' },
  { id: '3', title: 'No junk food today', ep: 40, icon: 'fast-food-outline' },
];

function getTodayDate() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}

export default function HomeScreen() {
  const [completedMissions, setCompletedMissions] = useState({});
  const [water, setWater]               = useState({ glasses: 0, dailyGoal: 8 });
  const [showWellness, setShowWellness] = useState(false);
  const [showProfile, setShowProfile]   = useState(false);
  const streak = 1;
  const stage = 'Spark';
  const totalEP = 120;

  const loadWater = useCallback(async () => {
    try {
      const { data } = await client.get('/wellness/water/today');
      setWater({ glasses: data.glasses, dailyGoal: data.dailyGoal });
    } catch {}
  }, []);

  useEffect(() => { loadWater(); }, [loadWater]);

  async function addGlass() {
    if (water.glasses >= water.dailyGoal) return;
    setWater(prev => ({ ...prev, glasses: prev.glasses + 1 }));
    try { await client.post('/wellness/water/add'); } catch {}
  }

  async function removeGlass() {
    if (water.glasses <= 0) return;
    setWater(prev => ({ ...prev, glasses: prev.glasses - 1 }));
    try { await client.post('/wellness/water/remove'); } catch {}
  }


  function speakReminder() {
    Speech.speak('Bhai, paani pi le!', { language: 'hi-IN', rate: 0.9 });
  }

  function toggleMission(id) {
    setCompletedMissions(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const completedCount = Object.values(completedMissions).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Ohayo, Warrior</Text>
            <Text style={styles.date}>{getTodayDate()}</Text>
          </View>
          <TouchableOpacity style={styles.rankBadge} onPress={() => setShowProfile(true)} activeOpacity={0.8}>
            <Text style={styles.rankLabel}>STAGE</Text>
            <Text style={styles.rankText}>SP</Text>
          </TouchableOpacity>
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
            <Text style={styles.statValue}>{totalEP}</Text>
            <Text style={styles.statLabel}>Total EP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{completedCount}/{DAILY_MISSIONS.length}</Text>
            <Text style={styles.statLabel}>Missions Done</Text>
          </View>
        </View>

        {/* Water Tracker */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View style={styles.waterTitleRow}>
              <Ionicons name="water" size={16} color="#2E86AB" />
              <Text style={styles.waterTitle}>Water Intake</Text>
            </View>
            <View style={styles.waterActions}>
              <TouchableOpacity onPress={speakReminder} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                <Ionicons name="mic-outline" size={16} color={Colors.accentGold} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowWellness(true)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                <Ionicons name="moon-outline" size={16} color={Colors.accentPurple} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.waterBody}>
            {/* Remove */}
            <TouchableOpacity onPress={removeGlass} style={styles.waterCtrlBtn} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
              <Ionicons name="remove" size={20} color={Colors.textSub} />
            </TouchableOpacity>

            {/* Counter */}
            <View style={styles.waterCounterBlock}>
              <Text style={styles.waterGlasses}>{water.glasses}</Text>
              <Text style={styles.waterGoalText}>/ {water.dailyGoal} glasses</Text>
            </View>

            {/* Add */}
            <TouchableOpacity onPress={addGlass} style={[styles.waterCtrlBtn, styles.waterAddBtn]} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
              <Ionicons name="add" size={20} color={Colors.background} />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.waterTrack}>
            <View style={[styles.waterFill, { width: `${Math.min((water.glasses / water.dailyGoal) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.waterHint}>Goal set in Profile · Long press − to reset</Text>
        </View>

        {/* Daily Quests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Missions</Text>
            <View style={styles.questBadge}>
              <Text style={styles.questBadgeText}>+120 EP</Text>
            </View>
          </View>

          {DAILY_MISSIONS.map(mission => {
            const done = !!completedMissions[mission.id];
            return (
              <TouchableOpacity
                key={mission.id}
                style={[styles.questCard, done && styles.questCardDone]}
                onPress={() => toggleMission(mission.id)}
                activeOpacity={0.7}
              >
                <View style={styles.questLeft}>
                  <View style={[styles.questCheck, done && styles.questCheckDone]}>
                    {done && <Ionicons name="checkmark" size={14} color={Colors.background} />}
                  </View>
                  <View style={styles.questIconBox}>
                    <Ionicons name={mission.icon} size={20} color={done ? Colors.textMuted : Colors.accentGold} />
                  </View>
                  <Text style={[styles.questTitle, done && styles.questTitleDone]}>
                    {mission.title}
                  </Text>
                </View>
                <Text style={[styles.questXP, done && styles.questXPDone]}>+{mission.ep} EP</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rank Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evolution Progress</Text>
          <View style={styles.rankCard}>
            <View style={styles.rankRow}>
              <View style={styles.currentRank}>
                <Text style={styles.currentRankLabel}>Current</Text>
                <View style={[styles.rankCircle, { backgroundColor: Colors.accentGold }]}>
                  <Text style={styles.rankCircleText}>SP</Text>
                </View>
              </View>
              <View style={styles.rankProgressBar}>
                <View style={styles.rankProgressTrack}>
                  <View style={[styles.rankProgressFill, { width: '12%' }]} />
                </View>
                <Text style={styles.rankProgressText}>120 / 1000 EP</Text>
              </View>
              <View style={styles.nextRank}>
                <Text style={styles.currentRankLabel}>Next</Text>
                <View style={[styles.rankCircle, styles.rankCircleLocked]}>
                  <Text style={styles.rankCircleText}>AW</Text>
                </View>
              </View>
            </View>
            <Text style={styles.rankMotivation}>Your next stage awaits. Keep evolving.</Text>
          </View>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <WellnessModal visible={showWellness} onClose={() => setShowWellness(false)} />
      <ProfileScreen visible={showProfile} onClose={() => setShowProfile(false)} />
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
    fontSize: 13,
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

  // Water tracker
  waterCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    marginBottom: 20,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  waterTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  waterActions: { flexDirection: 'row', gap: 12 },
  waterBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  waterCtrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterAddBtn: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  waterCounterBlock: { alignItems: 'center' },
  waterGlasses: { fontSize: 32, fontWeight: '900', color: '#2E86AB' },
  waterGoalText: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  waterTrack: {
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  waterFill: {
    height: '100%',
    backgroundColor: '#2E86AB',
    borderRadius: 3,
  },
  waterHint: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
});
