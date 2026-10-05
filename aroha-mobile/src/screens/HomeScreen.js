import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Modal,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg from 'react-native-svg';
import client from '../api/client';
import { apiError } from '../utils/apiError';
import ProfileScreen from './ProfileScreen';
import AiScreen from './AiScreen';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Skeleton from '../components/Skeleton';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import AnimatedCounter from '../components/AnimatedCounter';
import Avatar from '../components/Avatar';
import Card from '../components/ui/Card';
import ProgressRings, { Ring } from '../components/ui/ProgressRing';
import SegmentBar from '../components/ui/SegmentBar';
import PrimaryButton from '../components/ui/PrimaryButton';
import IconButton from '../components/ui/IconButton';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { stageInfo } from '../constants/stages';
import { formatNumber } from '../utils/format';
import { on } from '../utils/events';
import { tap, success, warn } from '../utils/haptics';

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'goodMorning';
  if (h < 17) return 'goodAfternoon';
  return 'goodEvening';
}

function firstName(name) {
  return (name || '').trim().split(/\s+/)[0] || 'there';
}

// Mission categories come from MissionService on the backend
const MISSION_ICON = {
  STRENGTH: 'barbell', DISCIPLINE: 'flag', RECOVERY: 'moon', NUTRITION: 'restaurant',
};

export default function HomeScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [today, setToday]         = useState({ calories: 0, protein: 0 });
  const [water, setWater]         = useState({ glasses: 0, dailyGoal: 8 });
  const [missions, setMissions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [showAi, setShowAi]           = useState(false);
  const [stageUp, setStageUp]         = useState(null); // { oldStage, newStage }

  const scaleAnim = useRef(new Animated.Value(0)).current;

  // ── Data ────────────────────────────────────────────────────────────────────
  const loadWater = useCallback(async () => {
    try {
      const { data } = await client.get('/wellness/water/today');
      setWater({ glasses: data.glasses ?? 0, dailyGoal: data.dailyGoal || 8 });
    } catch {}
  }, []);

  const loadAll = useCallback(async () => {
    const [p, l, m] = await Promise.allSettled([
      client.get('/profile'),
      client.get('/logs/today'),
      client.get('/missions/today'),
      loadWater(),
    ]);
    if (p.status === 'fulfilled') setProfile(p.value.data);
    if (l.status === 'fulfilled') {
      setToday({ calories: l.value.data.totalCalories || 0, protein: l.value.data.totalProtein || 0 });
    }
    if (m.status === 'fulfilled') setMissions(m.value.data || []);
    setLoading(false);
  }, [loadWater]);

  // Refresh whenever Home comes back into focus (e.g. after logging food)
  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  // Water added from the quick-log sheet
  useEffect(() => on('water-changed', loadWater), [loadWater]);

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  useEffect(() => {
    if (stageUp) {
      scaleAnim.setValue(0.85);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
    }
  }, [stageUp]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function completeMission(id) {
    const oldStage = profile?.evolutionStage;
    setMissions(ms => ms.map(m => (m.id === id ? { ...m, completed: true } : m)));
    success();
    try {
      const { data } = await client.post(`/missions/${id}/complete`);
      setProfile(p => (p ? { ...p, evolutionPoints: data.totalEP, evolutionStage: data.evolutionStage } : p));
      if (data.stagedUp) setStageUp({ oldStage, newStage: data.newStage || data.evolutionStage });
    } catch (err) {
      setMissions(ms => ms.map(m => (m.id === id ? { ...m, completed: false } : m)));
      warn();
      const msg = apiError(err, 'Check your connection and try again.');
      Alert.alert("Couldn't complete mission", msg);
    }
  }

  async function changeWater(delta) {
    if (delta > 0 && water.glasses >= water.dailyGoal * 2) return;
    if (delta < 0 && water.glasses <= 0) return;
    tap();
    setWater(w => ({ ...w, glasses: w.glasses + delta }));
    try {
      await client.post(delta > 0 ? '/wellness/water/add' : '/wellness/water/remove');
    } catch {
      setWater(w => ({ ...w, glasses: w.glasses - delta }));
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const name       = firstName(profile?.name || user?.name);
  const ep         = profile?.evolutionPoints ?? 0;
  const stage      = stageInfo(profile?.evolutionStage, ep);
  const streak     = profile?.streak ?? 0;
  const kcalGoal   = profile?.dailyCalorieGoal || 2000;
  const proteinGoal = profile?.dailyProteinGoal || 100;
  const waterGoal  = water.dailyGoal || profile?.waterGoalGlasses || 8;

  const doneCount  = missions.filter(m => m.completed).length;
  const epEarned   = missions.filter(m => m.completed).reduce((s, m) => s + (m.epReward || 0), 0);
  const epTotal    = missions.reduce((s, m) => s + (m.epReward || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.textSub} colors={[Palette.brass]} progressBackgroundColor={Palette.surface2} />}
      >
        {/* Header */}
        <FadeInView index={0} style={styles.header}>
          <AnimatedPressable onPress={() => { tap(); setShowProfile(true); }} scaleTo={0.94} accessibilityLabel="Open profile">
            <View style={styles.avatarWrap}>
              <Svg width={48} height={48} style={StyleSheet.absoluteFill}>
                <Ring cx={24} cy={24} r={22} stroke={2.5} progress={stage.progress} color={Palette.brass} />
              </Svg>
              <Avatar avatarKey={profile?.avatarKey} size={38} style={styles.avatar} />
            </View>
          </AnimatedPressable>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{t(greetingKey())}</Text>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
          </View>
          <IconButton name="sparkles-outline" onPress={() => setShowAi(true)} accessibilityLabel="Open Aroha AI" />
        </FadeInView>

        {/* Stage hero */}
        <FadeInView index={1}>
          <Card variant="hero">
            <View style={styles.row}>
              <Text style={styles.label}>Stage {stage.number} of {stage.total}</Text>
              {streak > 0 && (
                <View style={styles.chip}>
                  <Ionicons name="flame-outline" size={11} color={Palette.textSub} />
                  <Text style={styles.chipText}>{streak}-day streak</Text>
                </View>
              )}
            </View>
            <View style={[styles.row, styles.stageRow]}>
              <Text style={styles.stageName}>{stage.name.toUpperCase()}</Text>
              {loading ? (
                <Skeleton width={90} height={22} />
              ) : (
                <View style={styles.epWrap}>
                  <AnimatedCounter value={ep} style={styles.epValue} />
                  <Text style={styles.epOf}> / {formatNumber(stage.nextMin)} EP</Text>
                </View>
              )}
            </View>
            <SegmentBar progress={stage.progress} style={styles.segBar} />
            <Text style={styles.heroFoot}>
              {stage.next
                ? <>{formatNumber(stage.epToNext)} EP until <Text style={styles.heroFootStrong}>{stage.next.name}</Text></>
                : 'Highest stage reached. Keep your streak alive.'}
            </Text>
          </Card>
        </FadeInView>

        {/* Today rings */}
        <FadeInView index={2}>
          <Card style={styles.todayCard}>
            <ProgressRings
              size={104}
              stroke={9}
              rings={[
                { progress: today.calories / kcalGoal,  color: Palette.kcal },
                { progress: today.protein / proteinGoal, color: Palette.protein },
                { progress: water.glasses / waterGoal,  color: Palette.water },
              ]}
            />
            <View style={styles.legend}>
              <Text style={styles.label}>Today</Text>
              <LegendRow color={Palette.kcal}    value={formatNumber(today.calories)} goal={`/ ${formatNumber(kcalGoal)} kcal`} loading={loading} />
              <LegendRow color={Palette.protein} value={Math.round(today.protein)}    goal={`/ ${proteinGoal} g protein`}       loading={loading} />
              <View style={styles.legendWaterRow}>
                <LegendRow color={Palette.water} value={water.glasses} goal={`/ ${waterGoal} glasses`} loading={loading} />
                <View style={styles.stepper}>
                  <AnimatedPressable onPress={() => changeWater(-1)} style={styles.stepBtn} scaleTo={0.88} accessibilityLabel="Remove a glass of water">
                    <Ionicons name="remove" size={14} color={Palette.textSub} />
                  </AnimatedPressable>
                  <AnimatedPressable onPress={() => changeWater(1)} style={[styles.stepBtn, styles.stepBtnAdd]} scaleTo={0.88} accessibilityLabel="Add a glass of water">
                    <Ionicons name="add" size={14} color={Palette.water} />
                  </AnimatedPressable>
                </View>
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* Primary action */}
        <FadeInView index={3}>
          <PrimaryButton
            title="Start a workout"
            subtitle="Generate a plan or log your own"
            onPress={() => navigation.navigate('Workout')}
          />
        </FadeInView>

        {/* Missions */}
        <FadeInView index={4}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.label}>{t('dailyMissions')}</Text>
              {!loading && missions.length > 0 && (
                <Text style={styles.cardMeta}>{doneCount} of {missions.length} done · {epEarned}/{epTotal} EP</Text>
              )}
            </View>
            <View style={styles.missionList}>
              {loading ? (
                [0, 1, 2].map(i => <Skeleton key={i} height={18} style={{ marginTop: Spacing.md }} />)
              ) : missions.length === 0 ? (
                <Text style={styles.empty}>{t('noMissions')} New missions arrive tomorrow morning.</Text>
              ) : (
                missions.map((m, i) => (
                  <AnimatedPressable
                    key={m.id}
                    scaleTo={0.98}
                    disabled={m.completed}
                    onPress={() => completeMission(m.id)}
                    style={[styles.mission, i > 0 && styles.missionDivider]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: !!m.completed }}
                  >
                    <View style={[styles.check, m.completed && styles.checkOn]}>
                      {m.completed && <Ionicons name="checkmark" size={13} color={Palette.text} />}
                    </View>
                    <Ionicons
                      name={MISSION_ICON[(m.category || '').toUpperCase()] || 'ellipse-outline'}
                      size={14}
                      color={m.completed ? Palette.textDim : Palette.textSub}
                    />
                    <Text style={[styles.missionTitle, m.completed && styles.missionTitleDone]} numberOfLines={2}>
                      {m.title}
                    </Text>
                    <Text style={[styles.missionEp, m.completed && styles.missionEpDone]}>+{m.epReward} EP</Text>
                  </AnimatedPressable>
                ))
              )}
            </View>
            {!loading && missions.length > 0 && doneCount === missions.length && (
              <Text style={styles.allDone}>{t('missionsDone')}</Text>
            )}
          </Card>
        </FadeInView>

        {/* My day */}
        <FadeInView index={5}>
          <Text style={[styles.label, styles.sectionLabel]}>My day</Text>
          <View style={styles.tiles}>
            <DayTile icon="checkmark-done" color={Palette.success} title="Habits" sub="Track your streaks" onPress={() => navigation.navigate('Habits')} />
            <DayTile icon="calendar-clear" color={Palette.carbs}   title="Planner" sub="Tasks and time blocks" onPress={() => navigation.navigate('Planner')} />
          </View>
        </FadeInView>
      </ScrollView>

      <ProfileScreen visible={showProfile} onClose={() => { setShowProfile(false); loadAll(); }} />
      <Modal visible={showAi} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAi(false)}>
        <AiScreen visible={showAi} onClose={() => setShowAi(false)} />
      </Modal>

      {/* Stage-up celebration */}
      <Modal visible={!!stageUp} transparent animationType="fade" onRequestClose={() => setStageUp(null)}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.stageUpCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.label}>Evolution complete</Text>
            <Text style={styles.stageUpOld}>{stageUp?.oldStage}</Text>
            <Ionicons name="arrow-down" size={18} color={Palette.textDim} style={{ marginVertical: Spacing.sm }} />
            <Text style={styles.stageUpNew}>{(stageUp?.newStage || '').toUpperCase()}</Text>
            <Text style={styles.stageUpSub}>You reached a new stage. Keep going.</Text>
            <PrimaryButton title="Continue" icon="checkmark" onPress={() => setStageUp(null)} containerStyle={{ alignSelf: 'stretch' }} />
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function LegendRow({ color, value, goal, loading }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {loading ? <Skeleton width={70} height={14} /> : (
        <>
          <Text style={styles.legendValue}>{value}</Text>
          <Text style={styles.legendGoal} numberOfLines={1}>{goal}</Text>
        </>
      )}
    </View>
  );
}

function DayTile({ icon, color, title, sub, onPress }) {
  return (
    <AnimatedPressable containerStyle={styles.tileSlot} style={styles.tile} scaleTo={0.97} onPress={() => { tap(); onPress(); }}>
      <View style={[styles.tileIcon, { backgroundColor: color + '1F' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Palette.ink },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl, gap: Spacing.md },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:   { ...Type.label, color: Palette.textSub },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xs },
  avatarWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  avatar:     { borderWidth: 0 },
  headerText: { flex: 1 },
  greeting:   { ...Type.small, color: Palette.textSub },
  name:       { fontFamily: Fonts.bodyHeavy, fontSize: 20, color: Palette.text },

  // Hero
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Palette.line },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Palette.textSub },
  stageRow: { alignItems: 'flex-end', marginTop: Spacing.sm },
  stageName:{ ...Type.stage, color: Palette.brass, flexShrink: 1 },
  epWrap:   { flexDirection: 'row', alignItems: 'baseline' },
  epValue:  { fontFamily: Fonts.num, fontSize: 26, color: Palette.text },
  epOf:     { fontFamily: Fonts.num, fontSize: 14, color: Palette.textSub },
  segBar:   { marginTop: Spacing.md },
  heroFoot: { ...Type.small, color: Palette.textSub, marginTop: Spacing.sm },
  heroFootStrong: { fontFamily: Fonts.bodyBold, color: Palette.text },

  // Today
  todayCard:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  legend:         { flex: 1, gap: Spacing.sm, minWidth: 0 },
  legendRow:      { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 1 },
  legendWaterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  dot:            { width: 7, height: 7, borderRadius: 2, alignSelf: 'center' },
  legendValue:    { fontFamily: Fonts.num, fontSize: 20, color: Palette.text },
  legendGoal:     { ...Type.small, color: Palette.textSub, flexShrink: 1 },
  stepper:        { flexDirection: 'row', gap: 6 },
  stepBtn:        { width: 26, height: 26, borderRadius: 9, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.lineSoft, alignItems: 'center', justifyContent: 'center' },
  stepBtnAdd:     { backgroundColor: Palette.water + '1F', borderColor: Palette.water + '40' },

  // Missions
  cardMeta:     { ...Type.small, color: Palette.textSub },
  missionList:  { marginTop: Spacing.xs },
  mission:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: Spacing.md },
  missionDivider: { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  check:        { width: 20, height: 20, borderRadius: 7, borderWidth: 1.5, borderColor: Palette.textDim, alignItems: 'center', justifyContent: 'center' },
  checkOn:      { backgroundColor: Palette.violet, borderColor: Palette.violet },
  missionTitle: { ...Type.body, color: Palette.text, flex: 1 },
  missionTitleDone: { color: Palette.textDim, textDecorationLine: 'line-through' },
  missionEp:    { fontFamily: Fonts.num, fontSize: 15, color: Palette.brass },
  missionEpDone:{ color: Palette.textDim },
  empty:        { ...Type.body, color: Palette.textSub, marginTop: Spacing.md },
  allDone:      { ...Type.small, color: Palette.success, marginTop: Spacing.xs },

  // My day
  sectionLabel: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  tiles:     { flexDirection: 'row', gap: Spacing.md },
  tileSlot:  { flex: 1 },
  tile:      { flex: 1, backgroundColor: Palette.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.lineSoft, padding: Spacing.lg },
  tileIcon:  { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  tileTitle: { ...Type.bodyB, color: Palette.text },
  tileSub:   { ...Type.small, color: Palette.textSub, marginTop: 2 },

  // Stage-up
  overlay:     { flex: 1, backgroundColor: 'rgba(5,4,8,0.85)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  stageUpCard: { width: '100%', maxWidth: 360, backgroundColor: Palette.hero, borderRadius: Radius.xl, borderWidth: 1, borderColor: Palette.line, padding: Spacing.xl, alignItems: 'center' },
  stageUpOld:  { ...Type.body, color: Palette.textSub, marginTop: Spacing.lg },
  stageUpNew:  { fontFamily: Fonts.display, fontSize: 28, letterSpacing: 1, color: Palette.brass },
  stageUpSub:  { ...Type.body, color: Palette.textSub, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
});
