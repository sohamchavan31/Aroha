import React, { useState, useEffect, useCallback } from 'react';
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
import { stageInfo, STAGES } from '../constants/stages';
import StageUpCelebration from '../components/StageUpCelebration';
import StageCrest from '../components/StageCrest';
import StreakFlame from '../components/StreakFlame';
import EpFlyUp from '../components/EpFlyUp';
import ThawSheet from '../components/streak/ThawSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatNumber } from '../utils/format';
import { on } from '../utils/events';
import { tap, success, warn } from '../utils/haptics';
import RemindersCard from '../components/RemindersCard';

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

const LAST_STAGE_KEY = 'aroha_last_stage';

export default function HomeScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [today, setToday]         = useState({ calories: 0, protein: 0, sets: 0, minutes: 0, burned: 0 });
  const [water, setWater]         = useState({ glasses: 0, dailyGoal: 8 });
  const [missions, setMissions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [showAi, setShowAi]           = useState(false);
  const [stageUp, setStageUp]         = useState(null); // { oldStage, newStage, ep }
  const [flyUp, setFlyUp]             = useState(null); // { id, amount, key }
  const [showThaw, setShowThaw]       = useState(false);

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
      const d = l.value.data;
      setToday({
        calories: d.totalCalories || 0, protein: d.totalProtein || 0,
        sets: d.setsToday || 0, minutes: d.trainingMinutes || 0, burned: d.caloriesBurned || 0,
      });
    }
    if (m.status === 'fulfilled') setMissions(m.value.data || []);
    setLoading(false);
  }, [loadWater]);

  // Missions, streak and EP can change on the server after any log
  // (auto-completed missions), so re-read them after actions taken here.
  const refreshProgress = useCallback(async () => {
    const [p, m] = await Promise.allSettled([client.get('/profile'), client.get('/missions/today')]);
    if (p.status === 'fulfilled') setProfile(p.value.data);
    if (m.status === 'fulfilled') setMissions(m.value.data || []);
  }, []);

  // Refresh whenever Home comes back into focus (e.g. after logging food)
  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  // Water added from the quick-log sheet
  useEffect(() => on('water-changed', () => { loadWater(); refreshProgress(); }), [loadWater, refreshProgress]);

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  // Catch a stage-up from anywhere (not just missions): compare against the
  // last stage this device saw. The first load only records it.
  useEffect(() => {
    const stage = profile?.evolutionStage;
    if (!stage) return;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(LAST_STAGE_KEY);
        await AsyncStorage.setItem(LAST_STAGE_KEY, stage);
        const rank = name => STAGES.findIndex(st => st.name === name);
        if (seen && rank(stage) > rank(seen)) {
          setStageUp(cur => cur || { oldStage: seen, newStage: stage, ep: profile.evolutionPoints || 0 });
        }
      } catch {}
    })();
  }, [profile?.evolutionStage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function completeMission(id) {
    const oldStage = profile?.evolutionStage;
    const mission = missions.find(m => m.id === id);
    setMissions(ms => ms.map(m => (m.id === id ? { ...m, completed: true } : m)));
    if (mission?.epReward) setFlyUp({ id, amount: mission.epReward, key: Date.now() });
    success();
    try {
      const { data } = await client.post(`/missions/${id}/complete`);
      setProfile(p => (p ? { ...p, evolutionPoints: data.totalEP, evolutionStage: data.evolutionStage } : p));
      if (data.stagedUp) {
        const newStage = data.newStage || data.evolutionStage;
        AsyncStorage.setItem(LAST_STAGE_KEY, newStage).catch(() => {});
        setStageUp({ oldStage, newStage, ep: data.totalEP || 0 });
      }
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
      if (delta > 0) refreshProgress();
    } catch {
      setWater(w => ({ ...w, glasses: w.glasses - delta }));
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const name       = firstName(profile?.name || user?.name);
  const ep         = profile?.evolutionPoints ?? 0;
  const stage      = stageInfo(profile?.evolutionStage, ep);
  const streak     = profile?.streak ?? 0;
  const frozen     = profile?.streakState === 'FROZEN';
  const thawReps   = profile?.streakThawReps || 15;
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
              {streak > 0 && <StreakFlame streak={streak} frozen={frozen} />}
            </View>
            <View style={[styles.row, styles.stageRow]}>
              <View style={styles.stageLeft}>
                <StageCrest stage={stage.name} size={40} />
                <Text style={styles.stageName} numberOfLines={1}>{stage.name.toUpperCase()}</Text>
              </View>
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

        {/* Frozen streak: thaw it today or it breaks at midnight */}
        {frozen && (
          <FadeInView index={1}>
            <AnimatedPressable onPress={() => { tap(); setShowThaw(true); }} scaleTo={0.98} style={styles.ice} accessibilityRole="button">
              <View style={styles.iceIcon}>
                <Ionicons name="snow" size={22} color={Palette.water} />
              </View>
              <View style={styles.iceText}>
                <Text style={styles.iceTitle}>Your {streak}-day streak is frozen</Text>
                <Text style={styles.iceSub}>You missed yesterday. Do {thawReps} push-ups or pull-ups today to thaw it, or it breaks at midnight.</Text>
              </View>
              <View style={styles.iceGo}>
                <Text style={styles.iceGoText}>Thaw</Text>
              </View>
            </AnimatedPressable>
          </FadeInView>
        )}

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

        {/* Training today: sets logged in Train or a generated session */}
        {!loading && (today.sets > 0 || today.minutes > 0) && (
          <FadeInView index={2}>
            <AnimatedPressable onPress={() => { tap(); navigation.navigate('Workout'); }} scaleTo={0.98} style={styles.trained} accessibilityRole="button">
              <View style={styles.trainedIcon}>
                <Ionicons name="barbell" size={16} color={Palette.protein} />
              </View>
              <Text style={styles.trainedText} numberOfLines={2}>
                <Text style={styles.trainedStrong}>Trained today</Text>
                {today.sets > 0 ? ` · ${today.sets} sets` : ''} · ~{today.minutes} min · {formatNumber(Math.round(today.burned))} kcal burned
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Palette.textDim} />
            </AnimatedPressable>
          </FadeInView>
        )}

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
                    disabled={m.completed || m.auto}
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
                    <View style={styles.missionText}>
                      <Text style={[styles.missionTitle, m.completed && styles.missionTitleDone]} numberOfLines={2}>
                        {m.title}
                      </Text>
                      {m.auto && !m.completed && <Text style={styles.missionAuto}>Ticks itself when you log it</Text>}
                    </View>
                    <Text style={[styles.missionEp, m.completed && styles.missionEpDone]}>+{m.epReward} EP</Text>
                    {flyUp?.id === m.id && (
                      <EpFlyUp key={flyUp.key} amount={flyUp.amount} style={styles.flyUp} onDone={() => setFlyUp(null)} />
                    )}
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

        {!loading && <RemindersCard index={6} />}
      </ScrollView>

      <ProfileScreen visible={showProfile} onClose={() => { setShowProfile(false); loadAll(); }} />
      <Modal visible={showAi} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAi(false)}>
        <AiScreen visible={showAi} onClose={() => setShowAi(false)} />
      </Modal>

      <ThawSheet
        visible={showThaw}
        streak={streak}
        reps={thawReps}
        onThawed={data => setProfile(p => (p ? { ...p, streak: data.streak, streakState: data.streakState } : p))}
        onClose={() => { setShowThaw(false); refreshProgress(); }}
      />

      {/* Stage-up celebration */}
      <StageUpCelebration
        visible={!!stageUp}
        oldStage={stageUp?.oldStage}
        newStage={stageUp?.newStage}
        ep={stageUp?.ep}
        onClose={() => setStageUp(null)}
      />
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
  stageRow: { alignItems: 'center', marginTop: Spacing.sm },
  stageLeft:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, flexShrink: 1 },
  stageName:{ ...Type.stage, color: Palette.brass, flexShrink: 1 },
  epWrap:   { flexDirection: 'row', alignItems: 'baseline' },
  epValue:  { fontFamily: Fonts.num, fontSize: 26, color: Palette.text },
  epOf:     { fontFamily: Fonts.num, fontSize: 14, color: Palette.textSub },
  segBar:   { marginTop: Spacing.md },
  heroFoot: { ...Type.small, color: Palette.textSub, marginTop: Spacing.sm },
  heroFootStrong: { fontFamily: Fonts.bodyBold, color: Palette.text },

  // Frozen streak
  ice:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Palette.water + '12', borderWidth: 1, borderColor: Palette.water + '40' },
  iceIcon:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.water + '1F' },
  iceText:   { flex: 1 },
  iceTitle:  { ...Type.bodyB, color: Palette.text },
  iceSub:    { ...Type.small, color: Palette.textSub, marginTop: 2 },
  iceGo:     { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Palette.water },
  iceGoText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.ink },

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

  // Training today
  trained:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.lineSoft },
  trainedIcon:   { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.protein + '1F' },
  trainedText:   { ...Type.small, color: Palette.textSub, flex: 1 },
  trainedStrong: { fontFamily: Fonts.bodyBold, color: Palette.text },

  // Missions
  cardMeta:     { ...Type.small, color: Palette.textSub },
  missionList:  { marginTop: Spacing.xs },
  mission:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: Spacing.md },
  missionDivider: { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  check:        { width: 20, height: 20, borderRadius: 7, borderWidth: 1.5, borderColor: Palette.textDim, alignItems: 'center', justifyContent: 'center' },
  checkOn:      { backgroundColor: Palette.violet, borderColor: Palette.violet },
  missionText:  { flex: 1 },
  missionTitle: { ...Type.body, color: Palette.text },
  missionAuto:  { ...Type.small, fontSize: 11, color: Palette.textDim, marginTop: 1 },
  missionTitleDone: { color: Palette.textDim, textDecorationLine: 'line-through' },
  missionEp:    { fontFamily: Fonts.num, fontSize: 15, color: Palette.brass },
  missionEpDone:{ color: Palette.textDim },
  flyUp:        { right: 0, top: 4 },
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
});
