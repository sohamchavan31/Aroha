import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg from 'react-native-svg';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useScreenshotProtection } from '../utils/screenshotProtection';
import SettingsScreen from './SettingsScreen';
import LegalScreen from './LegalScreen';
import AvatarPickerScreen from './AvatarPickerScreen';
import EditProfileForm from '../components/profile/EditProfileForm';
import Avatar from '../components/Avatar';
import Card from '../components/ui/Card';
import IconButton from '../components/ui/IconButton';
import PrimaryButton from '../components/ui/PrimaryButton';
import { Ring } from '../components/ui/ProgressRing';
import Skeleton from '../components/Skeleton';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import AppInfo from '../constants/appInfo';
import { stageInfo, STAGES } from '../constants/stages';
import StageCrest from '../components/StageCrest';
import {
  ALL_GOALS, GENDERS, ACTIVITY_LEVELS, EXPERIENCE_LEVELS, DIET_PREFS,
  LOSS_SPEEDS, GAIN_SPEEDS, labelFor, bmiColor,
} from '../constants/profile';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { formatNumber } from '../utils/format';
import { tap, warn } from '../utils/haptics';

const ACCOUNT_LINKS = [
  { key: 'settings', icon: 'settings-outline',           label: 'Settings',           sub: 'Notifications, language' },
  { key: 'privacy',  icon: 'shield-checkmark-outline',   label: 'Privacy policy' },
  { key: 'terms',    icon: 'document-text-outline',      label: 'Terms & conditions' },
  { key: 'about',    icon: 'information-circle-outline', label: 'About Aroha' },
  { key: 'rate',     icon: 'star-outline',               label: 'Rate the app',       soon: true },
];

function fmtKg(n) {
  const v = Math.round(Number(n) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export default function ProfileScreen({ visible, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(false);
  const [evoHistory, setEvoHistory] = useState([]);
  const [editing, setEditing]       = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [legalType, setLegalType]   = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useScreenshotProtection(visible);

  useEffect(() => {
    if (visible) { setEditing(false); loadProfile(); }
  }, [visible]);

  async function loadProfile() {
    setLoading(true);
    setLoadError(false);
    try {
      const [profileRes, historyRes] = await Promise.all([
        client.get('/profile'),
        client.get('/evolution/history'),
      ]);
      setProfile(profileRes.data);
      setEvoHistory(historyRes.data ?? []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  async function selectAvatar(avatarKey) {
    const prev = profile?.avatarKey;
    setProfile(p => ({ ...p, avatarKey }));
    setShowAvatarPicker(false);
    try {
      await client.patch('/profile/avatar', { avatarKey });
    } catch {
      warn();
      setProfile(p => ({ ...p, avatarKey: prev }));
      Alert.alert("Couldn't change avatar", 'Check your connection and try again.');
    }
  }

  function confirmLogout() {
    Alert.alert('Log out?', "You'll need your email and password to sign back in.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => { logout(); onClose(); } },
    ]);
  }

  function openLink(key) {
    tap();
    if (key === 'settings') setShowSettings(true);
    else setLegalType(key);
  }

  const ep = profile?.evolutionPoints ?? 0;
  const stage = stageInfo(profile?.evolutionStage, ep);
  const goal = profile?.healthGoal ? ALL_GOALS[profile.healthGoal] : null;

  const details = profile ? [
    profile.healthGoal        && { icon: 'flag-outline',        label: 'Goal',       value: goal?.label ?? profile.healthGoal, dot: goal?.color },
    profile.targetWeightKg    && { icon: 'locate-outline',      label: 'Target',     value: `${fmtKg(profile.targetWeightKg)} kg` },
    profile.weightChangeSpeed && { icon: 'speedometer-outline', label: 'Pace',       value: labelFor([...LOSS_SPEEDS, ...GAIN_SPEEDS], profile.weightChangeSpeed) },
    profile.activityLevel     && { icon: 'walk-outline',        label: 'Activity',   value: labelFor(ACTIVITY_LEVELS, profile.activityLevel) },
    profile.experienceLevel   && { icon: 'barbell-outline',     label: 'Experience', value: labelFor(EXPERIENCE_LEVELS, profile.experienceLevel) },
    profile.dietaryPreference && { icon: 'leaf-outline',        label: 'Diet',       value: labelFor(DIET_PREFS, profile.dietaryPreference) },
    profile.gender            && { icon: 'person-outline',      label: 'Gender',     value: labelFor(GENDERS, profile.gender) },
    { icon: 'water-outline', label: 'Water goal', value: `${profile.waterGoalGlasses ?? 8} glasses` },
  ].filter(Boolean) : [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={editing ? () => setEditing(false) : onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />

        <View style={styles.header}>
          {editing
            ? <IconButton name="chevron-back" onPress={() => setEditing(false)} accessibilityLabel="Back to profile" />
            : <View style={styles.headerSpacer} />}
          <Text style={styles.headerTitle}>{editing ? 'Edit profile' : t('profile')}</Text>
          <IconButton name="close" onPress={onClose} accessibilityLabel="Close profile" />
        </View>

        {loading ? (
          <View style={styles.content}>
            <Skeleton height={180} radius={Radius.xl} />
            <Skeleton height={56} radius={Radius.md} />
            <Skeleton height={140} radius={Radius.lg} />
          </View>
        ) : loadError ? (
          <View style={styles.errorWrap}>
            <Ionicons name="cloud-offline-outline" size={30} color={Palette.textDim} />
            <Text style={styles.errorText}>Couldn't load your profile.</Text>
            <AnimatedPressable onPress={loadProfile}><Text style={styles.link}>Try again</Text></AnimatedPressable>
          </View>
        ) : editing ? (
          <EditProfileForm profile={profile} onSaved={data => { setProfile(data); setEditing(false); }} />
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Identity */}
            <FadeInView index={0}>
              <Card variant="hero" style={styles.identity}>
                <AnimatedPressable onPress={() => { tap(); setShowAvatarPicker(true); }} scaleTo={0.94} accessibilityLabel="Change avatar">
                  <View style={styles.avatarWrap}>
                    <Svg width={104} height={104} style={StyleSheet.absoluteFill}>
                      <Ring cx={52} cy={52} r={49} stroke={3} progress={stage.progress} color={Palette.brass} />
                    </Svg>
                    <Avatar avatarKey={profile?.avatarKey} size={86} style={styles.avatar} />
                    <View style={styles.avatarEdit}>
                      <Ionicons name="camera" size={12} color={Palette.onIvory} />
                    </View>
                  </View>
                </AnimatedPressable>
                <Text style={styles.name} numberOfLines={1}>{profile?.name || user?.name}</Text>
                <Text style={styles.email} numberOfLines={1}>{profile?.email || user?.email}</Text>
                <View style={styles.stageLine}>
                  <StageCrest stage={stage.name} size={22} />
                  <Text style={styles.stage}>{stage.name.toUpperCase()}</Text>
                </View>

                {/* Evolution path: reached crests in brass, the rest locked */}
                <View style={styles.path} accessibilityLabel={`Stage ${stage.number} of ${stage.total}`}>
                  {STAGES.map((st, i) => (
                    <StageCrest key={st.name} stage={i} size={i === stage.number - 1 ? 34 : 24} locked={i > stage.number - 1} />
                  ))}
                </View>

                <View style={styles.idStats}>
                  <IdStat value={formatNumber(ep)} label="EP" brass />
                  <View style={styles.idDivider} />
                  <IdStat value={String(profile?.streak ?? 0)} label="Day streak" />
                  <View style={styles.idDivider} />
                  <IdStat value={`${stage.number}/${stage.total}`} label="Stage" />
                </View>
              </Card>
            </FadeInView>

            <FadeInView index={1}>
              <PrimaryButton title="Edit profile" subtitle="Body stats, goal, pace and diet" icon="create-outline" onPress={() => setEditing(true)} />
            </FadeInView>

            {/* Body */}
            {!!profile?.weightKg && (
              <FadeInView index={2}>
                <Card>
                  <Text style={styles.label}>Body</Text>
                  <View style={styles.bodyGrid}>
                    <BodyStat label="Weight" value={fmtKg(profile.weightKg)} unit="kg" />
                    <BodyStat label="Height" value={profile.heightCm ? String(Math.round(profile.heightCm)) : '—'} unit="cm" />
                    <BodyStat label="Age" value={profile.age ?? '—'} unit="yrs" />
                    <BodyStat label="BMI" value={profile.bmi ?? '—'} color={bmiColor(profile.bmi)} />
                  </View>
                  {(profile.bmiCategory || profile.tdee) && (
                    <View style={styles.bodyFoot}>
                      {!!profile.bmiCategory && <Text style={styles.bodyFootText}>{profile.bmiCategory}</Text>}
                      {!!profile.tdee && <Text style={styles.bodyFootText}>Burns ~<Text style={styles.bodyFootStrong}>{formatNumber(profile.tdee)}</Text> kcal/day</Text>}
                    </View>
                  )}
                </Card>
              </FadeInView>
            )}

            {/* Daily targets */}
            {!!profile?.dailyCalorieGoal && (
              <FadeInView index={3}>
                <Card>
                  <Text style={styles.label}>Daily targets</Text>
                  <View style={styles.targets}>
                    <Target label="Calories" value={formatNumber(profile.dailyCalorieGoal)} unit="kcal" color={Palette.kcal} />
                    <Target label="Protein"  value={profile.dailyProteinGoal} unit="g" color={Palette.protein} />
                    <Target label="Carbs"    value={profile.dailyCarbGoal}    unit="g" color={Palette.carbs} />
                    <Target label="Fat"      value={profile.dailyFatGoal}     unit="g" color={Palette.fat} />
                  </View>
                  <Text style={styles.note}>Worked out from your body, activity and goal.</Text>
                </Card>
              </FadeInView>
            )}

            {/* Goal & plan */}
            {details.length > 0 && (
              <FadeInView index={4}>
                <Card style={styles.listCard}>
                  <Text style={[styles.label, styles.listLabel]}>Goal and plan</Text>
                  {details.map((d, i) => (
                    <View key={d.label} style={[styles.detail, i > 0 && styles.divider]}>
                      <Ionicons name={d.icon} size={16} color={Palette.textSub} />
                      <Text style={styles.detailLabel}>{d.label}</Text>
                      <View style={styles.detailValueWrap}>
                        {!!d.dot && <View style={[styles.goalDot, { backgroundColor: d.dot }]} />}
                        <Text style={styles.detailValue} numberOfLines={1}>{d.value}</Text>
                      </View>
                    </View>
                  ))}
                </Card>
              </FadeInView>
            )}

            {/* Attributes */}
            <FadeInView index={5}>
              <Card>
                <Text style={styles.label}>{t('healthAttributes')}</Text>
                {[
                  { key: 'strengthAttr',   label: t('strength'),   color: Palette.danger,  icon: 'barbell-outline' },
                  { key: 'disciplineAttr', label: t('discipline'), color: Palette.protein, icon: 'medal-outline' },
                  { key: 'recoveryAttr',   label: t('recovery'),   color: Palette.water,   icon: 'bed-outline' },
                  { key: 'nutritionAttr',  label: t('nutrition'),  color: Palette.success, icon: 'leaf-outline' },
                ].map(a => {
                  const val = Math.max(0, Math.min(100, profile?.[a.key] ?? 0));
                  return (
                    <View key={a.key} style={styles.attr}>
                      <Ionicons name={a.icon} size={15} color={a.color} />
                      <Text style={styles.attrLabel}>{a.label}</Text>
                      <View style={styles.attrTrack}>
                        <View style={[styles.attrFill, { width: `${val}%`, backgroundColor: a.color }]} />
                      </View>
                      <Text style={styles.attrValue}>{val}</Text>
                    </View>
                  );
                })}
              </Card>
            </FadeInView>

            {/* Evolution history */}
            <FadeInView index={6}>
              <Card>
                <Text style={styles.label}>{t('evolutionHistory')}</Text>
                {evoHistory.length === 0 ? (
                  <Text style={styles.empty}>{t('noStageUps')}</Text>
                ) : (
                  <View style={styles.timeline}>
                    {evoHistory.map((entry, i) => {
                      const date = new Date(entry.stagedUpAt);
                      const when = isNaN(date) ? '' : `${date.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]} ${date.getFullYear()}`;
                      return (
                        <View key={entry.id ?? i} style={styles.evo}>
                          <View style={styles.evoRail}>
                            <View style={styles.evoDot} />
                            {i < evoHistory.length - 1 && <View style={styles.evoLine} />}
                          </View>
                          <View style={styles.evoBody}>
                            <Text style={styles.evoStages}>{entry.fromStage} → <Text style={styles.evoTo}>{entry.toStage}</Text></Text>
                            <Text style={styles.evoMeta}>{when}{when ? ' · ' : ''}{formatNumber(entry.epAtStageUp)} EP</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </Card>
            </FadeInView>

            {/* Account */}
            <FadeInView index={7}>
              <Card style={styles.listCard}>
                {ACCOUNT_LINKS.map((l, i) => (
                  <AnimatedPressable
                    key={l.key}
                    disabled={l.soon}
                    scaleTo={0.98}
                    onPress={() => openLink(l.key)}
                    style={[styles.link_, i > 0 && styles.divider, l.soon && styles.soon]}
                  >
                    <Ionicons name={l.icon} size={18} color={Palette.textSub} />
                    <View style={styles.linkText}>
                      <Text style={styles.linkLabel}>{l.label}</Text>
                      {!!l.sub && <Text style={styles.linkSub}>{l.sub}</Text>}
                    </View>
                    {l.soon
                      ? <Text style={styles.soonTag}>Soon</Text>
                      : <Ionicons name="chevron-forward" size={16} color={Palette.textDim} />}
                  </AnimatedPressable>
                ))}
                <AnimatedPressable onPress={() => { tap(); confirmLogout(); }} scaleTo={0.98} style={[styles.link_, styles.divider]}>
                  <Ionicons name="log-out-outline" size={18} color={Palette.danger} />
                  <Text style={[styles.linkLabel, styles.logout]}>{t('logout')}</Text>
                </AnimatedPressable>
              </Card>
            </FadeInView>

            <View style={styles.brand}>
              <Text style={styles.brandMark}>AROHA</Text>
              <Text style={styles.brandVersion}>{AppInfo.displayVersion}</Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal visible={showSettings} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSettings(false)}>
        <SettingsScreen visible={showSettings} onClose={() => setShowSettings(false)} />
      </Modal>
      <LegalScreen visible={!!legalType} type={legalType} onClose={() => setLegalType(null)} />
      <AvatarPickerScreen
        visible={showAvatarPicker}
        selectedKey={profile?.avatarKey}
        onClose={() => setShowAvatarPicker(false)}
        onSelect={selectAvatar}
      />
    </Modal>
  );
}

function IdStat({ value, label, brass }) {
  return (
    <View style={styles.idStat}>
      <Text style={[styles.idStatValue, brass && { color: Palette.brass }]}>{value}</Text>
      <Text style={styles.idStatLabel}>{label}</Text>
    </View>
  );
}

function BodyStat({ label, value, unit, color }) {
  return (
    <View style={styles.bodyStat}>
      <Text style={styles.bodyStatLabel}>{label}</Text>
      <Text style={[styles.bodyStatValue, color && { color }]}>
        {value}{!!unit && <Text style={styles.bodyStatUnit}> {unit}</Text>}
      </Text>
    </View>
  );
}

function Target({ label, value, unit, color }) {
  return (
    <View style={styles.target}>
      <View style={[styles.targetBar, { backgroundColor: color }]} />
      <Text style={styles.targetValue}>{value ?? '—'}<Text style={styles.targetUnit}> {unit}</Text></Text>
      <Text style={styles.targetLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Palette.ink },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerSpacer: { width: 38 },
  headerTitle:  { fontFamily: Fonts.display, fontSize: 17, color: Palette.text },
  content:      { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
  label:        { ...Type.label, color: Palette.textSub },
  divider:      { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  note:         { ...Type.small, color: Palette.textDim, marginTop: Spacing.md },
  empty:        { ...Type.body, color: Palette.textSub, marginTop: Spacing.md },
  link:         { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.text, textDecorationLine: 'underline' },
  errorWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  errorText:    { ...Type.body, color: Palette.textSub },

  // Identity
  identity:   { alignItems: 'center', paddingTop: Spacing.xl },
  avatarWrap: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  avatar:     { borderWidth: 0 },
  avatarEdit: { position: 'absolute', right: 4, bottom: 4, width: 26, height: 26, borderRadius: 13, backgroundColor: Palette.ivory, borderWidth: 2, borderColor: Palette.hero, alignItems: 'center', justifyContent: 'center' },
  name:       { fontFamily: Fonts.bodyHeavy, fontSize: 22, color: Palette.text, marginTop: Spacing.md },
  email:      { ...Type.small, color: Palette.textSub, marginTop: 2 },
  stage:      { fontFamily: Fonts.display, fontSize: 13, letterSpacing: 1.2, color: Palette.brass },
  stageLine:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  path:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  idStats:    { flexDirection: 'row', alignSelf: 'stretch', marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  idStat:     { flex: 1, alignItems: 'center', gap: 2 },
  idStatValue:{ fontFamily: Fonts.num, fontSize: 22, color: Palette.text },
  idStatLabel:{ ...Type.small, color: Palette.textSub },
  idDivider:  { width: 1, backgroundColor: Palette.lineSoft },

  // Body
  bodyGrid:      { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.md, rowGap: Spacing.lg },
  bodyStat:      { width: '50%', gap: 2 },
  bodyStatLabel: { ...Type.small, color: Palette.textSub },
  bodyStatValue: { fontFamily: Fonts.numHeavy, fontSize: 28, color: Palette.text },
  bodyStatUnit:  { fontFamily: Fonts.num, fontSize: 13, color: Palette.textSub },
  bodyFoot:      { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  bodyFootText:  { ...Type.small, color: Palette.textSub },
  bodyFootStrong:{ fontFamily: Fonts.bodyBold, color: Palette.text },

  // Targets
  targets:     { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  target:      { flex: 1, gap: 4 },
  targetBar:   { height: 3, borderRadius: 2, width: 22, marginBottom: 4 },
  targetValue: { fontFamily: Fonts.num, fontSize: 20, color: Palette.text },
  targetUnit:  { fontSize: 11, color: Palette.textSub },
  targetLabel: { ...Type.small, color: Palette.textSub },

  // Lists
  listCard:    { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.lg },
  listLabel:   { marginTop: Spacing.md, marginBottom: Spacing.xs },
  detail:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  detailLabel: { ...Type.body, color: Palette.textSub, width: 86 },
  detailValueWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.sm },
  detailValue: { ...Type.bodyB, color: Palette.text, flexShrink: 1, textAlign: 'right' },
  goalDot:     { width: 8, height: 8, borderRadius: 3 },

  // Attributes
  attr:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, marginTop: Spacing.md },
  attrLabel: { ...Type.small, color: Palette.textSub, width: 72 },
  attrTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Palette.track, overflow: 'hidden' },
  attrFill:  { height: '100%', borderRadius: 3 },
  attrValue: { fontFamily: Fonts.num, fontSize: 15, color: Palette.text, width: 28, textAlign: 'right' },

  // Evolution timeline
  timeline:  { marginTop: Spacing.md },
  evo:       { flexDirection: 'row', gap: Spacing.md },
  evoRail:   { alignItems: 'center', width: 12 },
  evoDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: Palette.brass, marginTop: 5 },
  evoLine:   { flex: 1, width: 2, backgroundColor: Palette.line, marginVertical: 2 },
  evoBody:   { flex: 1, paddingBottom: Spacing.lg },
  evoStages: { ...Type.bodyB, color: Palette.textSub },
  evoTo:     { color: Palette.text },
  evoMeta:   { ...Type.small, color: Palette.textDim, marginTop: 2 },

  // Account
  link_:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md + 2 },
  linkText:  { flex: 1 },
  linkLabel: { ...Type.body, color: Palette.text },
  linkSub:   { ...Type.small, color: Palette.textSub, marginTop: 1 },
  soon:      { opacity: 0.55 },
  soonTag:   { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: Palette.textSub, textTransform: 'uppercase' },
  logout:    { color: Palette.danger },

  brand:        { alignItems: 'center', marginTop: Spacing.lg, gap: 4 },
  brandMark:    { fontFamily: Fonts.display, fontSize: 14, letterSpacing: 4, color: Palette.textDim },
  brandVersion: { ...Type.small, color: Palette.textDim },
});
