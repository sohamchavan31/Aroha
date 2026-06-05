import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Colors from '../constants/colors';
import client from '../api/client';
import WellnessModal from '../components/WellnessModal';
import ProfileScreen from './ProfileScreen';
import { useLanguage } from '../context/LanguageContext';

function getTodayDate() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}

const STAGE_ABBR = {
  Spark: 'SP', Awakened: 'AW', Ascender: 'AS',
  Guardian: 'GD', Titan: 'TI', Apex: 'AP', Legend: 'LG',
};

const STAGE_COLOR = {
  Spark: Colors.accentGold,
  Awakened: '#00BFFF',
  Ascender: '#7B2FBE',
  Guardian: '#2ECC71',
  Titan: '#E74C3C',
  Apex: '#FF6B35',
  Legend: '#FFD700',
};

const EP_NEXT = { Spark: 1000, Awakened: 3000, Ascender: 6000, Guardian: 11000, Titan: 18000, Apex: 28000, Legend: 28000 };

export default function HomeScreen() {
  const { t } = useLanguage();
  const [missions, setMissions]         = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [water, setWater]               = useState({ glasses: 0, dailyGoal: 8 });
  const [showWellness, setShowWellness] = useState(false);
  const [showProfile, setShowProfile]   = useState(false);
  const [stageUp, setStageUp]           = useState(null); // { oldStage, newStage }
  const [userEP, setUserEP]             = useState(0);
  const [userStage, setUserStage]       = useState('Spark');

  const streak = 1;

  // Stage-up animation
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  const loadWater = useCallback(async () => {
    try {
      const { data } = await client.get('/wellness/water/today');
      setWater({ glasses: data.glasses, dailyGoal: data.dailyGoal });
    } catch {}
  }, []);

  const loadMissions = useCallback(async () => {
    try {
      setMissionsLoading(true);
      const { data } = await client.get('/missions/today');
      setMissions(data);
      const earned = data.filter(m => m.completed).reduce((s, m) => s + m.epReward, 0);
      setUserEP(prev => prev === 0 ? earned : prev);
    } catch {
      setMissions([]);
    } finally {
      setMissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWater();
    loadMissions();
  }, [loadWater, loadMissions]);

  // Animate stage-up modal in
  useEffect(() => {
    if (stageUp) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      glowAnim.setValue(0);
    }
  }, [stageUp]);

  async function completeMission(id) {
    const prev = missions.map(m => m.id === id ? { ...m, completed: true } : m);
    setMissions(prev);
    try {
      const { data } = await client.post(`/missions/${id}/complete`);
      setUserEP(data.totalEP);
      setUserStage(data.evolutionStage);
      setMissions(ms => ms.map(m => m.id === id ? { ...m, completed: true } : m));
      if (data.stagedUp) {
        setStageUp({ oldStage: userStage, newStage: data.newStage });
      }
    } catch {
      setMissions(ms => ms.map(m => m.id === id ? { ...m, completed: false } : m));
    }
  }

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

  const completedCount = missions.filter(m => m.completed).length;
  const stageColor = STAGE_COLOR[userStage] || Colors.accentGold;
  const epNext = EP_NEXT[userStage] || 28000;
  const epProgress = Math.min(userEP / epNext, 1);

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
          <TouchableOpacity
            style={[styles.stageBadge, { backgroundColor: stageColor + '22', borderColor: stageColor }]}
            onPress={() => setShowProfile(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.stageLabel, { color: stageColor }]}>STAGE</Text>
            <Text style={[styles.stageText, { color: stageColor }]}>{userStage}</Text>
          </TouchableOpacity>
        </View>

        {/* Streak + EP Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>{t('streak')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statValue}>{userEP}</Text>
            <Text style={styles.statLabel}>Total {t('ep')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{completedCount}/{missions.length}</Text>
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
            <TouchableOpacity onPress={removeGlass} style={styles.waterCtrlBtn} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
              <Ionicons name="remove" size={20} color={Colors.textSub} />
            </TouchableOpacity>
            <View style={styles.waterCounterBlock}>
              <Text style={styles.waterGlasses}>{water.glasses}</Text>
              <Text style={styles.waterGoalText}>/ {water.dailyGoal} glasses</Text>
            </View>
            <TouchableOpacity onPress={addGlass} style={[styles.waterCtrlBtn, styles.waterAddBtn]} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
              <Ionicons name="add" size={20} color={Colors.background} />
            </TouchableOpacity>
          </View>

          <View style={styles.waterTrack}>
            <View style={[styles.waterFill, { width: `${Math.min((water.glasses / water.dailyGoal) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.waterHint}>Goal set in Profile · Long press − to reset</Text>
        </View>

        {/* Daily Missions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dailyMissions')}</Text>
            <View style={styles.epBadge}>
              <Text style={styles.epBadgeText}>
                +{missions.reduce((s, m) => s + m.epReward, 0)} EP
              </Text>
            </View>
          </View>

          {missionsLoading ? (
            <Text style={styles.loadingText}>{t('dailyMissions')}...</Text>
          ) : missions.map(mission => (
            <TouchableOpacity
              key={mission.id}
              style={[styles.missionCard, mission.completed && styles.missionCardDone]}
              onPress={() => !mission.completed && completeMission(mission.id)}
              activeOpacity={0.7}
            >
              <View style={styles.missionLeft}>
                <View style={[styles.missionCheck, mission.completed && styles.missionCheckDone]}>
                  {mission.completed && <Ionicons name="checkmark" size={14} color={Colors.background} />}
                </View>
                <View style={styles.missionCategoryDot}>
                  <Text style={styles.missionCategoryText}>{mission.category[0]}</Text>
                </View>
                <Text style={[styles.missionTitle, mission.completed && styles.missionTitleDone]}>
                  {mission.title}
                </Text>
              </View>
              <Text style={[styles.missionEP, mission.completed && styles.missionEPDone]}>
                +{mission.epReward} EP
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Evolution Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('evolutionProgress')}</Text>
          <View style={styles.evolutionCard}>
            <View style={styles.stageRow}>
              <View style={styles.stageCircleBlock}>
                <Text style={styles.stageCircleLabel}>Current</Text>
                <View style={[styles.stageCircle, { backgroundColor: stageColor }]}>
                  <Text style={styles.stageCircleText}>{STAGE_ABBR[userStage] || 'SP'}</Text>
                </View>
              </View>
              <View style={styles.stageProgressBar}>
                <View style={styles.stageProgressTrack}>
                  <View style={[styles.stageProgressFill, { width: `${Math.round(epProgress * 100)}%`, backgroundColor: stageColor }]} />
                </View>
                <Text style={styles.stageProgressText}>{userEP} / {epNext} EP</Text>
              </View>
              <View style={styles.stageCircleBlock}>
                <Text style={styles.stageCircleLabel}>Next</Text>
                <View style={[styles.stageCircle, styles.stageCircleLocked]}>
                  <Text style={styles.stageCircleText}>
                    {STAGE_ABBR[Object.keys(STAGE_ABBR)[Object.keys(STAGE_ABBR).indexOf(userStage) + 1]] || 'LG'}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.stageMotivation}>Your next stage awaits. Keep evolving.</Text>
          </View>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <WellnessModal visible={showWellness} onClose={() => setShowWellness(false)} />
      <ProfileScreen visible={showProfile} onClose={() => setShowProfile(false)} />

      {/* Stage-up Celebration Modal */}
      <Modal visible={!!stageUp} transparent animationType="fade">
        <View style={styles.stageUpOverlay}>
          <Animated.View style={[styles.stageUpCard, { transform: [{ scale: scaleAnim }] }]}>
            <Animated.Text style={[styles.stageUpGlow, { opacity: glowAnim }]}>✦</Animated.Text>
            <Text style={styles.stageUpLabel}>EVOLUTION COMPLETE</Text>
            <Text style={styles.stageUpOld}>{stageUp?.oldStage}</Text>
            <Text style={styles.stageUpArrow}>↓</Text>
            <Text style={[styles.stageUpNew, { color: STAGE_COLOR[stageUp?.newStage] || Colors.accentGold }]}>
              {stageUp?.newStage}
            </Text>
            <Text style={styles.stageUpSub}>You have ascended. Keep pushing.</Text>
            <TouchableOpacity style={styles.stageUpBtn} onPress={() => setStageUp(null)}>
              <Text style={styles.stageUpBtnText}>CONTINUE</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginTop: 20, marginBottom: 24,
  },
  greeting: { fontSize: 24, fontWeight: '700', color: Colors.text, letterSpacing: 0.5 },
  date:     { fontSize: 13, color: Colors.textSub, marginTop: 4 },
  stageBadge: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
  },
  stageLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  stageText:  { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 14, alignItems: 'center',
  },
  statIcon:  { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textSub, marginTop: 2, textAlign: 'center' },

  // Water
  waterCard: {
    backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: 14, marginBottom: 20,
  },
  waterHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  waterTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  waterTitle:     { fontSize: 14, fontWeight: '700', color: Colors.text },
  waterActions:   { flexDirection: 'row', gap: 12 },
  waterBody:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  waterCtrlBtn:   { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  waterAddBtn:    { backgroundColor: '#2E86AB', borderColor: '#2E86AB' },
  waterCounterBlock: { alignItems: 'center' },
  waterGlasses:   { fontSize: 32, fontWeight: '900', color: '#2E86AB' },
  waterGoalText:  { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  waterTrack:     { height: 6, backgroundColor: Colors.cardBorder, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  waterFill:      { height: '100%', backgroundColor: '#2E86AB', borderRadius: 3 },
  waterHint:      { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },

  // Sections
  section:       { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: Colors.text, letterSpacing: 0.3, marginBottom: 14 },
  epBadge:       { backgroundColor: 'rgba(226, 183, 20, 0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(226, 183, 20, 0.3)', marginBottom: 14 },
  epBadgeText:   { fontSize: 12, color: Colors.accentGold, fontWeight: '700' },
  loadingText:   { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 20 },

  // Mission cards
  missionCard: {
    backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  missionCardDone:  { borderColor: Colors.success, backgroundColor: 'rgba(46, 204, 113, 0.05)' },
  missionLeft:      { flexDirection: 'row', alignItems: 'center', flex: 1 },
  missionCheck:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.textMuted, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  missionCheckDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  missionCategoryDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accentPurple + '33', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  missionCategoryText:{ fontSize: 10, fontWeight: '800', color: Colors.accentPurple },
  missionTitle:     { fontSize: 15, color: Colors.text, fontWeight: '500', flex: 1 },
  missionTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  missionEP:        { fontSize: 13, color: Colors.accentGold, fontWeight: '700', marginLeft: 8 },
  missionEPDone:    { color: Colors.textMuted },

  // Evolution progress
  evolutionCard:    { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 20 },
  stageRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stageCircleBlock: { alignItems: 'center' },
  stageCircleLabel: { fontSize: 10, color: Colors.textSub, marginBottom: 6, fontWeight: '600', letterSpacing: 0.5 },
  stageCircle:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stageCircleLocked:{ backgroundColor: Colors.textMuted },
  stageCircleText:  { fontSize: 13, fontWeight: '900', color: Colors.text },
  stageProgressBar: { flex: 1, marginHorizontal: 16, alignItems: 'center' },
  stageProgressTrack:{ width: '100%', height: 6, backgroundColor: Colors.cardBorder, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  stageProgressFill: { height: '100%', borderRadius: 3 },
  stageProgressText: { fontSize: 11, color: Colors.textSub, fontWeight: '600' },
  stageMotivation:   { fontSize: 13, color: Colors.accentGold, fontStyle: 'italic', textAlign: 'center', borderTopWidth: 1, borderTopColor: Colors.cardBorder, paddingTop: 14 },

  // Stage-up modal
  stageUpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  stageUpCard:    { backgroundColor: Colors.card, borderRadius: 24, padding: 40, alignItems: 'center', width: '80%', borderWidth: 1, borderColor: Colors.accentGold },
  stageUpGlow:    { fontSize: 48, color: Colors.accentGold, marginBottom: 8 },
  stageUpLabel:   { fontSize: 11, fontWeight: '800', color: Colors.accentGold, letterSpacing: 3, marginBottom: 24 },
  stageUpOld:     { fontSize: 18, color: Colors.textSub, fontWeight: '600' },
  stageUpArrow:   { fontSize: 24, color: Colors.accentGold, marginVertical: 8 },
  stageUpNew:     { fontSize: 32, fontWeight: '900', letterSpacing: 1, marginBottom: 16 },
  stageUpSub:     { fontSize: 13, color: Colors.textSub, textAlign: 'center', marginBottom: 28 },
  stageUpBtn:     { backgroundColor: Colors.accentGold, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  stageUpBtnText: { fontSize: 14, fontWeight: '800', color: Colors.background, letterSpacing: 1 },

  bottomPad: { height: 20 },
});
