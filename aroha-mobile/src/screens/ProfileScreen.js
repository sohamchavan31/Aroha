import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Modal, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import SettingsScreen from './SettingsScreen';
import LegalScreen from './LegalScreen';
import AvatarPickerScreen from './AvatarPickerScreen';
import Avatar from '../components/Avatar';
import AnimatedPressable from '../components/AnimatedPressable';
import { useLanguage } from '../context/LanguageContext';
import { useScreenshotProtection } from '../utils/screenshotProtection';
import AppInfo from '../constants/appInfo';

const FOOTER_LINKS = [
  { key: 'privacy', icon: 'shield-checkmark-outline', label: 'Privacy Policy' },
  { key: 'terms',   icon: 'document-text-outline',    label: 'Terms & Conditions' },
  { key: 'rate',    icon: 'star-outline',              label: 'Rate App' },
  { key: 'about',   icon: 'information-circle-outline', label: 'About Us' },
];

// ── Constants ──────────────────────────────────────────────────────────────
const ALL_GOALS = {
  lose_weight:         { label: 'Lose Weight',         color: '#E74C3C' },
  reduce_body_fat:     { label: 'Reduce Body Fat',     color: '#FF6B6B' },
  gain_muscle:         { label: 'Gain Muscle',         color: '#E67E22' },
  gain_weight:         { label: 'Gain Weight',         color: '#F39C12' },
  increase_strength:   { label: 'Increase Strength',   color: '#E2B714' },
  general_fitness:     { label: 'General Fitness',     color: '#2ECC71' },
  maintain:            { label: 'Maintain Weight',     color: '#1ABC9C' },
  endurance:           { label: 'Endurance',           color: '#2E86AB' },
  improve_flexibility: { label: 'Improve Flexibility', color: '#9B59B6' },
};

const ACTIVITY_LEVELS = [
  { key: 'sedentary',         label: 'Sedentary',          sub: 'Desk job, little movement' },
  { key: 'lightly_active',    label: 'Lightly Active',     sub: 'Light exercise 1–3×/week' },
  { key: 'moderately_active', label: 'Moderately Active',  sub: 'Moderate exercise 3–5×/week' },
  { key: 'very_active',       label: 'Very Active',        sub: 'Hard training 6–7×/week' },
  { key: 'athlete',           label: 'Athlete',            sub: 'Twice-daily or physical job' },
];

const EXPERIENCE_LEVELS = [
  { key: 'beginner',     label: 'Beginner',     sub: '< 1 year' },
  { key: 'intermediate', label: 'Intermediate', sub: '1–3 years' },
  { key: 'advanced',     label: 'Advanced',     sub: '3+ years' },
];

const DIET_PREFS = [
  { key: 'vegetarian',     label: 'Vegetarian' },
  { key: 'eggetarian',     label: 'Eggetarian' },
  { key: 'non_vegetarian', label: 'Non-Veg' },
  { key: 'vegan',          label: 'Vegan' },
  { key: 'jain',           label: 'Jain' },
];

const LOSS_SPEEDS = [
  { key: 'slow_cut',       label: 'Slow Cut',       sub: '−200 kcal/day' },
  { key: 'moderate_cut',   label: 'Moderate Cut',   sub: '−400 kcal/day' },
  { key: 'aggressive_cut', label: 'Aggressive Cut', sub: '−600 kcal/day' },
];

const GAIN_SPEEDS = [
  { key: 'slow_bulk',       label: 'Slow Bulk',       sub: '+150 kcal/day' },
  { key: 'lean_bulk',       label: 'Lean Bulk',       sub: '+250 kcal/day' },
  { key: 'aggressive_bulk', label: 'Aggressive Bulk', sub: '+400 kcal/day' },
];

const LOSS_GOALS = new Set(['lose_weight', 'reduce_body_fat']);
const GAIN_GOALS = new Set(['gain_muscle', 'gain_weight']);

// ── Sub-components ─────────────────────────────────────────────────────────
function StatBox({ label, value, unit, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, color && { color }]}>{value ?? '—'}</Text>
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MacroCard({ label, value, unit, color }) {
  return (
    <View style={[styles.macroCard, { borderColor: color + '44' }]}>
      <Text style={[styles.macroValue, { color }]}>{value ?? '—'}</Text>
      <Text style={styles.macroUnit}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function DetailRow({ icon, label, value, color = Colors.accentGold }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color={color} style={{ width: 20 }} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function ProfileScreen({ visible, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [evoHistory, setEvoHistory]     = useState([]);
  const [editing, setEditing]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [legalType, setLegalType]       = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [heightUnit, setHeightUnit]     = useState('cm');

  const [form, setForm] = useState({
    gender: '', age: '', weightKg: '', targetWeightKg: '',
    heightCm: '', feet: '', inches: '',
    activityLevel: '', healthGoal: '', weightChangeSpeed: '',
    experienceLevel: '', dietaryPreference: '', waterGoalGlasses: '8',
  });

  useScreenshotProtection(visible);

  useEffect(() => {
    if (visible) loadProfile();
  }, [visible]);

  async function loadProfile() {
    setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([
        client.get('/profile'),
        client.get('/evolution/history'),
      ]);
      setProfile(profileRes.data);
      setEvoHistory(historyRes.data ?? []);
    } catch {
      Alert.alert('Error', 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }

  function cmToFtIn(cm) {
    const totalInches = cm / 2.54;
    return { feet: String(Math.floor(totalInches / 12)), inches: String(Math.round(totalInches % 12)) };
  }

  function getHeightCm() {
    if (heightUnit === 'cm') return parseFloat(form.heightCm);
    const f = parseFloat(form.feet) || 0;
    const i = parseFloat(form.inches) || 0;
    return Math.round((f * 30.48 + i * 2.54) * 10) / 10;
  }

  function openEdit() {
    const storedCm = profile?.heightCm ?? '';
    const ftIn = storedCm ? cmToFtIn(storedCm) : { feet: '', inches: '' };
    setHeightUnit('cm');
    setForm({
      gender:            profile?.gender ?? '',
      age:               String(profile?.age ?? ''),
      weightKg:          String(profile?.weightKg ?? ''),
      targetWeightKg:    String(profile?.targetWeightKg ?? ''),
      heightCm:          String(storedCm),
      feet:              ftIn.feet,
      inches:            ftIn.inches,
      activityLevel:     profile?.activityLevel ?? '',
      healthGoal:        profile?.healthGoal ?? '',
      weightChangeSpeed: profile?.weightChangeSpeed ?? '',
      experienceLevel:   profile?.experienceLevel ?? '',
      dietaryPreference: profile?.dietaryPreference ?? '',
      waterGoalGlasses:  String(profile?.waterGoalGlasses ?? '8'),
    });
    setEditing(true);
  }

  async function saveEdit() {
    const heightCm = getHeightCm();
    if (!form.gender)        { Alert.alert('Required', 'Please select a gender.');         return; }
    if (!form.age || !form.weightKg || !heightCm) { Alert.alert('Required', 'Fill in age, weight, and height.'); return; }
    if (isNaN(heightCm) || heightCm < 50) { Alert.alert('Invalid', 'Height must be at least 50 cm.'); return; }
    if (!form.activityLevel) { Alert.alert('Required', 'Please select an activity level.'); return; }
    if (!form.healthGoal)    { Alert.alert('Required', 'Please select a health goal.');    return; }

    setSaving(true);
    try {
      const payload = {
        gender:           form.gender,
        age:              parseInt(form.age),
        weightKg:         parseFloat(form.weightKg),
        heightCm,
        activityLevel:    form.activityLevel,
        healthGoal:       form.healthGoal,
        waterGoalGlasses: parseInt(form.waterGoalGlasses) || 8,
      };
      if (form.targetWeightKg)    payload.targetWeightKg    = parseFloat(form.targetWeightKg);
      if (form.weightChangeSpeed) payload.weightChangeSpeed = form.weightChangeSpeed;
      if (form.experienceLevel)   payload.experienceLevel   = form.experienceLevel;
      if (form.dietaryPreference) payload.dietaryPreference = form.dietaryPreference;

      const { data } = await client.patch('/profile', payload);
      setProfile(data);
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function selectAvatar(avatarKey) {
    const prevAvatarKey = profile?.avatarKey;
    setProfile(p => ({ ...p, avatarKey }));
    setShowAvatarPicker(false);
    try {
      await client.patch('/profile/avatar', { avatarKey });
    } catch {
      setProfile(p => ({ ...p, avatarKey: prevAvatarKey }));
      Alert.alert('Error', 'Could not save avatar.');
    }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); onClose(); } },
    ]);
  }

  const goalInfo          = profile?.healthGoal ? ALL_GOALS[profile.healthGoal] : null;
  const showTargetWeight  = LOSS_GOALS.has(form.healthGoal) || GAIN_GOALS.has(form.healthGoal);
  const showSpeed         = LOSS_GOALS.has(form.healthGoal) || GAIN_GOALS.has(form.healthGoal);
  const speedOptions      = LOSS_GOALS.has(form.healthGoal) ? LOSS_SPEEDS : GAIN_SPEEDS;

  const genderLabel = (g) => {
    if (!g) return null;
    if (g === 'prefer_not_to_say') return 'Prefer not to say';
    return g.charAt(0).toUpperCase() + g.slice(1);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{editing ? 'Edit Profile' : t('profile')}</Text>
          <View style={styles.headerRight}>
            {!editing && !loading && (
              <>
                <TouchableOpacity onPress={openEdit} hitSlop={{ top:10,bottom:10,left:10,right:10 }} style={{ marginRight: 16 }}>
                  <Ionicons name="pencil-outline" size={20} color={Colors.accentGold} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowSettings(true)} hitSlop={{ top:10,bottom:10,left:10,right:10 }} style={{ marginRight: 16 }}>
                  <Ionicons name="settings-outline" size={20} color={Colors.textSub} />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={editing ? () => setEditing(false) : onClose} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
              <Ionicons name="close" size={24} color={Colors.textSub} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.accentGold} style={{ marginTop: 60 }} />
        ) : editing ? (

          /* ── EDIT MODE ──────────────────────────────────────────────────── */
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <SectionLabel>Body Stats</SectionLabel>

            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {[
                { key: 'male',              label: 'Male' },
                { key: 'female',            label: 'Female' },
                { key: 'prefer_not_to_say', label: 'Prefer not to say' },
              ].map(({ key, label }) => {
                const sel = form.gender === key;
                return (
                  <TouchableOpacity key={key} style={[styles.chip, sel && styles.chipActive]} onPress={() => setForm(f => ({ ...f, gender: key }))}>
                    <Text style={[styles.chipText, sel && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.inputRow, { marginTop: 12 }]}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput style={styles.input} value={form.age} onChangeText={v => setForm(f => ({ ...f, age: v }))} keyboardType="numeric" placeholder="e.g. 22" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput style={styles.input} value={form.weightKg} onChangeText={v => setForm(f => ({ ...f, weightKg: v }))} keyboardType="decimal-pad" placeholder="e.g. 70" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <View style={styles.heightHeader}>
              <Text style={styles.inputLabel}>Height</Text>
              <View style={styles.unitToggle}>
                <TouchableOpacity style={[styles.unitBtn, heightUnit === 'cm' && styles.unitBtnActive]} onPress={() => setHeightUnit('cm')}>
                  <Text style={[styles.unitBtnText, heightUnit === 'cm' && styles.unitBtnTextActive]}>cm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.unitBtn, heightUnit === 'ft' && styles.unitBtnActive]} onPress={() => setHeightUnit('ft')}>
                  <Text style={[styles.unitBtnText, heightUnit === 'ft' && styles.unitBtnTextActive]}>ft / in</Text>
                </TouchableOpacity>
              </View>
            </View>
            {heightUnit === 'cm' ? (
              <TextInput style={[styles.input, { marginBottom: 4 }]} value={form.heightCm} onChangeText={v => setForm(f => ({ ...f, heightCm: v }))} keyboardType="decimal-pad" placeholder="e.g. 175" placeholderTextColor={Colors.textMuted} />
            ) : (
              <View style={styles.ftRow}>
                <TextInput style={[styles.input, styles.ftInput]} value={form.feet} onChangeText={v => setForm(f => ({ ...f, feet: v }))} keyboardType="numeric" placeholder="5" placeholderTextColor={Colors.textMuted} />
                <Text style={styles.ftLabel}>ft</Text>
                <TextInput style={[styles.input, styles.ftInput]} value={form.inches} onChangeText={v => setForm(f => ({ ...f, inches: v }))} keyboardType="numeric" placeholder="9" placeholderTextColor={Colors.textMuted} />
                <Text style={styles.ftLabel}>in</Text>
              </View>
            )}

            {/* Activity Level */}
            <SectionLabel>Activity Level</SectionLabel>
            {ACTIVITY_LEVELS.map(({ key, label, sub }) => {
              const sel = form.activityLevel === key;
              return (
                <TouchableOpacity key={key} style={[styles.optionCard, sel && styles.optionCardActive]} onPress={() => setForm(f => ({ ...f, activityLevel: key }))}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, sel && { color: Colors.accentGold }]}>{label}</Text>
                    <Text style={styles.optionSub}>{sub}</Text>
                  </View>
                  {sel && <Ionicons name="checkmark-circle" size={20} color={Colors.accentGold} />}
                </TouchableOpacity>
              );
            })}

            {/* Health Goal */}
            <SectionLabel>Health Goal</SectionLabel>
            <View style={styles.goalGrid}>
              {Object.entries(ALL_GOALS).map(([key, { label, color }]) => {
                const sel = form.healthGoal === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.goalOption, sel && { borderColor: color, backgroundColor: color + '22' }]}
                    onPress={() => setForm(f => ({ ...f, healthGoal: key, weightChangeSpeed: '' }))}
                  >
                    <View style={[styles.goalDotSmall, { backgroundColor: sel ? color : Colors.textMuted }]} />
                    <Text style={[styles.goalOptionText, sel && { color }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Target Weight — only for gain/loss goals */}
            {showTargetWeight && (
              <>
                <Text style={[styles.inputLabel, { marginTop: 4 }]}>
                  Target Weight (kg) <Text style={{ color: Colors.textMuted, fontWeight: '400' }}>optional</Text>
                </Text>
                <TextInput
                  style={[styles.input, { marginBottom: 4 }]}
                  value={form.targetWeightKg}
                  onChangeText={v => setForm(f => ({ ...f, targetWeightKg: v }))}
                  keyboardType="decimal-pad"
                  placeholder={LOSS_GOALS.has(form.healthGoal) ? 'e.g. 65' : 'e.g. 80'}
                  placeholderTextColor={Colors.textMuted}
                />
              </>
            )}

            {/* Goal Pace — conditional on goal type */}
            {showSpeed && (
              <>
                <SectionLabel>Goal Pace</SectionLabel>
                {speedOptions.map(({ key, label, sub }) => {
                  const sel = form.weightChangeSpeed === key;
                  return (
                    <TouchableOpacity key={key} style={[styles.optionCard, sel && styles.optionCardActive]} onPress={() => setForm(f => ({ ...f, weightChangeSpeed: key }))}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionLabel, sel && { color: Colors.accentGold }]}>{label}</Text>
                        <Text style={styles.optionSub}>{sub}</Text>
                      </View>
                      {sel && <Ionicons name="checkmark-circle" size={20} color={Colors.accentGold} />}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* Preferences */}
            <SectionLabel>Preferences</SectionLabel>

            <Text style={styles.inputLabel}>Experience Level</Text>
            <View style={styles.chipRow}>
              {EXPERIENCE_LEVELS.map(({ key, label, sub }) => {
                const sel = form.experienceLevel === key;
                return (
                  <TouchableOpacity key={key} style={[styles.chip, sel && styles.chipActive]} onPress={() => setForm(f => ({ ...f, experienceLevel: key }))}>
                    <Text style={[styles.chipText, sel && styles.chipTextActive]}>{label}</Text>
                    <Text style={[styles.chipSub, sel && { color: Colors.accentGold + 'AA' }]}>{sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Dietary Preference</Text>
            <View style={styles.chipRow}>
              {DIET_PREFS.map(({ key, label }) => {
                const sel = form.dietaryPreference === key;
                return (
                  <TouchableOpacity key={key} style={[styles.chip, sel && styles.chipActive]} onPress={() => setForm(f => ({ ...f, dietaryPreference: key }))}>
                    <Text style={[styles.chipText, sel && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Water Goal (glasses/day)</Text>
            <TextInput
              style={[styles.input, { marginBottom: 4 }]}
              value={form.waterGoalGlasses}
              onChangeText={v => setForm(f => ({ ...f, waterGoalGlasses: v }))}
              keyboardType="numeric"
              placeholder="e.g. 8"
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={saving} activeOpacity={0.8}>
              {saving
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={styles.saveBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>

        ) : (

          /* ── VIEW MODE ──────────────────────────────────────────────────── */
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Avatar + Name + Stage */}
            <View style={styles.avatarSection}>
              <AnimatedPressable onPress={() => setShowAvatarPicker(true)} scaleTo={0.94}>
                <Avatar avatarKey={profile?.avatarKey} size={88} />
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={13} color={Colors.background} />
                </View>
              </AnimatedPressable>
              <Text style={styles.userName}>{profile?.name || user?.name}</Text>
              <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
              <View style={[styles.rankBadge, { backgroundColor: Colors.accentPurple }]}>
                <Text style={styles.rankText}>{profile?.evolutionStage || 'Spark'}</Text>
              </View>
            </View>

            {/* EP + Streak */}
            <View style={styles.xpRow}>
              <View style={styles.xpCard}>
                <Text style={styles.xpValue}>{profile?.evolutionPoints ?? 0}</Text>
                <Text style={styles.xpLabel}>{t('evolutionPoints')}</Text>
              </View>
              <View style={styles.xpCard}>
                <Text style={styles.xpValue}>{profile?.streak ?? 0}</Text>
                <Text style={styles.xpLabel}>{t('dayStreak')}</Text>
              </View>
            </View>

            {/* Body Stats */}
            {profile?.weightKg && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Body Stats</Text>
                {profile.gender && (
                  <DetailRow icon="person-outline" label="Gender" value={genderLabel(profile.gender)} />
                )}
                <View style={styles.statsGrid}>
                  <StatBox label="Weight" value={profile.weightKg} unit="kg" />
                  <StatBox label="Height" value={profile.heightCm} unit="cm" />
                  <StatBox label="Age"    value={profile.age}      unit="yrs" />
                  <StatBox label="BMI"    value={profile.bmi}      color={
                    !profile.bmi ? undefined :
                    profile.bmi < 18.5 ? '#2E86AB' :
                    profile.bmi < 25   ? '#2ECC71' :
                    profile.bmi < 30   ? '#E67E22' : '#E74C3C'
                  } />
                </View>
                {profile.bmiCategory && (
                  <Text style={styles.bmiCategory}>BMI Category: {profile.bmiCategory}</Text>
                )}
                {profile.tdee && (
                  <Text style={styles.tdeeText}>
                    TDEE: <Text style={{ color: Colors.accentGold }}>{profile.tdee} kcal/day</Text>
                  </Text>
                )}
              </View>
            )}

            {/* Profile Details */}
            {(profile?.activityLevel || profile?.experienceLevel || profile?.dietaryPreference || profile?.targetWeightKg || profile?.weightChangeSpeed) && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Profile Details</Text>
                {profile.activityLevel && (
                  <DetailRow
                    icon="flash-outline"
                    label="Activity"
                    value={ACTIVITY_LEVELS.find(a => a.key === profile.activityLevel)?.label ?? profile.activityLevel}
                  />
                )}
                {profile.experienceLevel && (
                  <DetailRow
                    icon="barbell-outline"
                    label="Experience"
                    value={EXPERIENCE_LEVELS.find(e => e.key === profile.experienceLevel)?.label ?? profile.experienceLevel}
                  />
                )}
                {profile.dietaryPreference && (
                  <DetailRow
                    icon="leaf-outline"
                    label="Diet"
                    value={DIET_PREFS.find(d => d.key === profile.dietaryPreference)?.label ?? profile.dietaryPreference}
                  />
                )}
                {profile.targetWeightKg && (
                  <DetailRow icon="flag-outline" label="Target" value={`${profile.targetWeightKg} kg`} />
                )}
                {profile.weightChangeSpeed && (
                  <DetailRow
                    icon="speedometer-outline"
                    label="Pace"
                    value={[...LOSS_SPEEDS, ...GAIN_SPEEDS].find(s => s.key === profile.weightChangeSpeed)?.label ?? profile.weightChangeSpeed}
                  />
                )}
              </View>
            )}

            {/* Health Goal */}
            {profile?.healthGoal && goalInfo && (
              <View style={[styles.card, { borderColor: goalInfo.color + '55' }]}>
                <Text style={styles.cardTitle}>Health Goal</Text>
                <View style={styles.goalRow}>
                  <View style={[styles.goalDot, { backgroundColor: goalInfo.color }]} />
                  <Text style={[styles.goalText, { color: goalInfo.color }]}>{goalInfo.label}</Text>
                </View>
              </View>
            )}

            {/* Macro Targets */}
            {profile?.dailyCalorieGoal && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daily Macro Targets</Text>
                <View style={styles.macroGrid}>
                  <MacroCard label="Calories" value={profile.dailyCalorieGoal} unit="kcal" color="#E74C3C" />
                  <MacroCard label="Protein"  value={profile.dailyProteinGoal} unit="g"    color="#E67E22" />
                  <MacroCard label="Carbs"    value={profile.dailyCarbGoal}    unit="g"    color="#E2B714" />
                  <MacroCard label="Fat"      value={profile.dailyFatGoal}     unit="g"    color="#2E86AB" />
                </View>
                <Text style={styles.macroNote}>Calculated from your BMR, activity, and goal</Text>
              </View>
            )}

            {/* Health Attributes */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('healthAttributes')}</Text>
              {[
                { key: 'strengthAttr',   label: t('strength'),   color: '#E74C3C', icon: 'barbell-outline' },
                { key: 'disciplineAttr', label: t('discipline'), color: '#7B2FBE', icon: 'medal-outline' },
                { key: 'recoveryAttr',   label: t('recovery'),   color: '#2E86AB', icon: 'bed-outline' },
                { key: 'nutritionAttr',  label: t('nutrition'),  color: '#2ECC71', icon: 'leaf-outline' },
              ].map(({ key, label, color, icon }) => {
                const val = profile?.[key] ?? 0;
                return (
                  <View key={key} style={styles.attrRow}>
                    <Ionicons name={icon} size={16} color={color} style={{ width: 20 }} />
                    <Text style={styles.attrLabel}>{label}</Text>
                    <View style={styles.attrBarBg}>
                      <View style={[styles.attrBarFill, { width: `${val}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={[styles.attrValue, { color }]}>{val}</Text>
                  </View>
                );
              })}
            </View>

            {/* Evolution History */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('evolutionHistory')}</Text>
              {evoHistory.length === 0 ? (
                <Text style={styles.evoEmpty}>{t('noStageUps')}</Text>
              ) : (
                evoHistory.map(entry => {
                  const date = new Date(entry.stagedUpAt);
                  const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  return (
                    <View key={entry.id} style={styles.evoRow}>
                      <View style={styles.evoDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.evoStages}>{entry.fromStage} <Text style={styles.evoArrow}>→</Text> {entry.toStage}</Text>
                        <Text style={styles.evoMeta}>{label} · {entry.epAtStageUp} EP</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Water Goal */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('waterGoal')}</Text>
              <View style={styles.goalRow}>
                <Ionicons name="water" size={16} color="#2E86AB" />
                <Text style={[styles.goalText, { color: '#2E86AB' }]}>
                  {profile?.waterGoalGlasses ?? 8} {t('glassesPerDay')}
                </Text>
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={18} color="#E74C3C" />
              <Text style={styles.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>

            {/* Brand footer */}
            <View style={styles.brandFooter}>
              <Text style={styles.brandWordmark}>AROHA</Text>
              <Text style={styles.brandVersion}>{AppInfo.displayVersion}</Text>
            </View>

            <View style={styles.footerLinks}>
              {FOOTER_LINKS.map(link => {
                const disabled = link.key === 'rate';
                return (
                  <TouchableOpacity
                    key={link.key}
                    style={[styles.footerLinkRow, disabled && styles.footerLinkRowDisabled]}
                    onPress={() => !disabled && setLegalType(link.key)}
                    disabled={disabled}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={link.icon} size={18} color={disabled ? Colors.textMuted : Colors.textSub} />
                    <Text style={[styles.footerLinkText, disabled && styles.footerLinkTextDisabled]}>
                      {link.label}
                    </Text>
                    {disabled ? (
                      <Text style={styles.footerLinkBadge}>Coming soon</Text>
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 40 }} />
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

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  scroll:      { flex: 1, paddingHorizontal: 20 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.accentGold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
  userName:  { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 12, marginBottom: 4 },
  userEmail: { fontSize: 12, color: Colors.textMuted, marginBottom: 10 },
  rankBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5 },
  rankText:  { fontSize: 11, fontWeight: '800', color: Colors.text, letterSpacing: 1.5 },

  // EP/Streak row
  xpRow:   { flexDirection: 'row', gap: 12, marginBottom: 16 },
  xpCard:  { flex: 1, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 16, alignItems: 'center' },
  xpValue: { fontSize: 24, fontWeight: '900', color: Colors.accentGold },
  xpLabel: { fontSize: 11, color: Colors.textSub, marginTop: 4 },

  // Cards
  card:      { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSub, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.8 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10, marginTop: 8 },
  statBox:   { flex: 1, minWidth: '40%', backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statUnit:  { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  statLabel: { fontSize: 11, color: Colors.textSub, marginTop: 4 },
  bmiCategory: { fontSize: 13, color: Colors.textSub, textAlign: 'center', marginTop: 2 },
  tdeeText:    { fontSize: 13, color: Colors.textSub, marginTop: 6, textAlign: 'center' },

  // Detail rows
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  detailLabel: { fontSize: 13, color: Colors.textMuted, width: 72 },
  detailValue: { fontSize: 13, fontWeight: '600', color: Colors.text, flex: 1 },

  // Goal
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalDot: { width: 10, height: 10, borderRadius: 5 },
  goalText: { fontSize: 15, fontWeight: '700' },

  // Macro targets
  macroGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  macroCard:     { flex: 1, minWidth: '40%', backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center', gap: 2 },
  macroValue:    { fontSize: 20, fontWeight: '800' },
  macroUnit:     { fontSize: 11, color: Colors.textMuted },
  macroLabel:    { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  macroNote:     { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },

  // Attributes
  attrRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  attrLabel:  { fontSize: 12, fontWeight: '600', color: Colors.textSub, width: 72 },
  attrBarBg:  { flex: 1, height: 6, backgroundColor: Colors.background, borderRadius: 3, overflow: 'hidden' },
  attrBarFill:{ height: 6, borderRadius: 3 },
  attrValue:  { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },

  // Evolution history
  evoEmpty:  { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  evoRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  evoDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentGold, marginTop: 5 },
  evoStages: { fontSize: 14, fontWeight: '700', color: Colors.text },
  evoArrow:  { color: Colors.accentGold },
  evoMeta:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  // Logout
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: '#E74C3C33', padding: 16, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#E74C3C' },

  // Brand footer
  brandFooter:   { alignItems: 'center', marginTop: 32, marginBottom: 8 },
  brandWordmark: { fontSize: 16, fontWeight: '900', letterSpacing: 3, color: Colors.accentGold },
  brandVersion:  { fontSize: 11, color: Colors.textMuted, marginTop: 6 },

  footerLinks: { marginTop: 12 },
  footerLinkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  footerLinkRowDisabled: { opacity: 0.6 },
  footerLinkText:         { flex: 1, fontSize: 14, color: Colors.textSub, fontWeight: '500' },
  footerLinkTextDisabled: { color: Colors.textMuted },
  footerLinkBadge:        { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic' },

  // Edit mode — shared
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSub, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 22, marginBottom: 12 },
  inputRow:     { flexDirection: 'row', gap: 12 },
  inputHalf:    { flex: 1 },
  inputLabel:   { fontSize: 12, color: Colors.textSub, marginBottom: 6, fontWeight: '600' },
  input:        { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, color: Colors.text, fontSize: 15, marginBottom: 4 },

  // Chips
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.card, alignItems: 'center' },
  chipActive:    { borderColor: Colors.accentGold, backgroundColor: Colors.accentGold + '22' },
  chipText:      { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  chipTextActive:{ color: Colors.accentGold },
  chipSub:       { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  // Option cards (activity / pace)
  optionCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, marginBottom: 8 },
  optionCardActive: { borderColor: Colors.accentGold, backgroundColor: Colors.accentGold + '11' },
  optionLabel:      { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  optionSub:        { fontSize: 12, color: Colors.textMuted },

  // Goal grid (edit mode)
  goalGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  goalOption:     { flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 12, alignItems: 'center', gap: 6 },
  goalDotSmall:   { width: 8, height: 8, borderRadius: 4 },
  goalOptionText: { fontSize: 12, fontWeight: '700', color: Colors.textSub, textAlign: 'center' },

  saveBtn:     { backgroundColor: Colors.accentGold, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: Colors.background },

  // Height toggle
  heightHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  unitToggle:        { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  unitBtn:           { paddingHorizontal: 12, paddingVertical: 5 },
  unitBtnActive:     { backgroundColor: Colors.accentGold },
  unitBtnText:       { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  unitBtnTextActive: { color: Colors.background },
  ftRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  ftInput: { flex: 1 },
  ftLabel: { fontSize: 15, color: Colors.textSub, fontWeight: '600' },
});
