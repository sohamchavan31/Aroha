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

const GOAL_LABELS = {
  lose_weight:         'Lose Weight',
  gain_muscle:         'Gain Muscle',
  stay_fit:            'Stay Fit',
  improve_flexibility: 'Improve Flexibility',
};

const GOAL_COLORS = {
  lose_weight:         '#E74C3C',
  gain_muscle:         '#E67E22',
  stay_fit:            '#2ECC71',
  improve_flexibility: '#2E86AB',
};

function StatBox({ label, value, unit, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, color && { color }]}>{value ?? '—'}</Text>
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ visible, onClose }) {
  const { user, logout } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [heightUnit, setHeightUnit] = useState('cm');

  const [form, setForm] = useState({
    age: '', weightKg: '', heightCm: '', feet: '', inches: '', healthGoal: '', waterGoalGlasses: '',
  });

  useEffect(() => {
    if (visible) loadProfile();
  }, [visible]);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data } = await client.get('/profile');
      setProfile(data);
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
      age:              String(profile?.age ?? ''),
      weightKg:         String(profile?.weightKg ?? ''),
      heightCm:         String(storedCm),
      feet:             ftIn.feet,
      inches:           ftIn.inches,
      healthGoal:       profile?.healthGoal ?? '',
      waterGoalGlasses: String(profile?.waterGoalGlasses ?? '8'),
    });
    setEditing(true);
  }

  async function saveEdit() {
    const heightCm = getHeightCm();
    if (!form.age || !form.weightKg || !heightCm || !form.healthGoal) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (isNaN(heightCm) || heightCm < 50) {
      Alert.alert('Invalid height', 'Height must be at least 50 cm.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await client.patch('/profile', {
        age:              parseInt(form.age),
        weightKg:         parseFloat(form.weightKg),
        heightCm,
        healthGoal:       form.healthGoal,
        waterGoalGlasses: parseInt(form.waterGoalGlasses) || 8,
      });
      setProfile(data);
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); onClose(); } },
    ]);
  }

  const goalColor = profile?.healthGoal ? GOAL_COLORS[profile.healthGoal] : Colors.accentGold;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{editing ? 'Edit Profile' : 'Profile'}</Text>
          <View style={styles.headerRight}>
            {!editing && !loading && (
              <TouchableOpacity onPress={openEdit} hitSlop={{ top:10,bottom:10,left:10,right:10 }} style={{ marginRight: 16 }}>
                <Ionicons name="pencil-outline" size={20} color={Colors.accentGold} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={editing ? () => setEditing(false) : onClose} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
              <Ionicons name="close" size={24} color={Colors.textSub} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.accentGold} style={{ marginTop: 60 }} />
        ) : editing ? (
          // ── Edit Mode ──────────────────────────────────────────────────────
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.editSection}>Body Stats</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={form.age}
                  onChangeText={v => setForm(f => ({ ...f, age: v }))}
                  keyboardType="numeric"
                  placeholder="e.g. 22"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={form.weightKg}
                  onChangeText={v => setForm(f => ({ ...f, weightKg: v }))}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 70"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.heightHeader}>
              <Text style={styles.inputLabel}>Height</Text>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitBtn, heightUnit === 'cm' && styles.unitBtnActive]}
                  onPress={() => setHeightUnit('cm')}
                >
                  <Text style={[styles.unitBtnText, heightUnit === 'cm' && styles.unitBtnTextActive]}>cm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitBtn, heightUnit === 'ft' && styles.unitBtnActive]}
                  onPress={() => setHeightUnit('ft')}
                >
                  <Text style={[styles.unitBtnText, heightUnit === 'ft' && styles.unitBtnTextActive]}>ft / in</Text>
                </TouchableOpacity>
              </View>
            </View>

            {heightUnit === 'cm' ? (
              <TextInput
                style={styles.input}
                value={form.heightCm}
                onChangeText={v => setForm(f => ({ ...f, heightCm: v }))}
                keyboardType="decimal-pad"
                placeholder="e.g. 175"
                placeholderTextColor={Colors.textMuted}
              />
            ) : (
              <View style={styles.ftRow}>
                <TextInput
                  style={[styles.input, styles.ftInput]}
                  value={form.feet}
                  onChangeText={v => setForm(f => ({ ...f, feet: v }))}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.ftLabel}>ft</Text>
                <TextInput
                  style={[styles.input, styles.ftInput]}
                  value={form.inches}
                  onChangeText={v => setForm(f => ({ ...f, inches: v }))}
                  keyboardType="numeric"
                  placeholder="9"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.ftLabel}>in</Text>
              </View>
            )}

            <View style={[styles.inputRow, { marginTop: 16 }]}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Water Goal (glasses)</Text>
                <TextInput
                  style={styles.input}
                  value={form.waterGoalGlasses}
                  onChangeText={v => setForm(f => ({ ...f, waterGoalGlasses: v }))}
                  keyboardType="numeric"
                  placeholder="e.g. 8"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <Text style={styles.editSection}>Health Goal</Text>
            <View style={styles.goalGrid}>
              {Object.entries(GOAL_LABELS).map(([key, label]) => {
                const selected = form.healthGoal === key;
                const color = GOAL_COLORS[key];
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.goalOption, selected && { borderColor: color, backgroundColor: color + '22' }]}
                    onPress={() => setForm(f => ({ ...f, healthGoal: key }))}
                  >
                    <Text style={[styles.goalOptionText, selected && { color }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={saving} activeOpacity={0.8}>
              {saving
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={styles.saveBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        ) : (
          // ── View Mode ──────────────────────────────────────────────────────
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Avatar + Name */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color={Colors.textSub} />
              </View>
              <Text style={styles.userName}>{profile?.name || user?.name}</Text>
              <View style={[styles.rankBadge, { backgroundColor: Colors.accentPurple }]}>
                <Text style={styles.rankText}>{profile?.evolutionStage || 'Spark'}</Text>
              </View>
            </View>

            {/* EP + Streak */}
            <View style={styles.xpRow}>
              <View style={styles.xpCard}>
                <Text style={styles.xpValue}>{profile?.evolutionPoints ?? 0}</Text>
                <Text style={styles.xpLabel}>Evolution Points</Text>
              </View>
              <View style={styles.xpCard}>
                <Text style={styles.xpValue}>{profile?.streak ?? 0}</Text>
                <Text style={styles.xpLabel}>Day Streak</Text>
              </View>
            </View>

            {/* Health Stats */}
            {profile?.weightKg && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Body Stats</Text>
                <View style={styles.statsGrid}>
                  <StatBox label="Weight" value={profile.weightKg} unit="kg" />
                  <StatBox label="Height" value={profile.heightCm} unit="cm" />
                  <StatBox label="Age"    value={profile.age}      unit="yrs" />
                  <StatBox label="BMI"    value={profile.bmi}      color={
                    profile.bmi < 18.5 ? '#2E86AB'
                    : profile.bmi < 25  ? '#2ECC71'
                    : profile.bmi < 30  ? '#E67E22'
                    : '#E74C3C'
                  } />
                </View>
                {profile.bmiCategory && (
                  <Text style={styles.bmiCategory}>BMI: {profile.bmiCategory}</Text>
                )}
                {profile.tdee && (
                  <Text style={styles.tdeeText}>
                    Estimated TDEE: <Text style={{ color: Colors.accentGold }}>{profile.tdee} kcal/day</Text>
                  </Text>
                )}
              </View>
            )}

            {/* Health Goal */}
            {profile?.healthGoal && (
              <View style={[styles.card, { borderColor: goalColor + '44' }]}>
                <Text style={styles.cardTitle}>Health Goal</Text>
                <View style={styles.goalRow}>
                  <View style={[styles.goalDot, { backgroundColor: goalColor }]} />
                  <Text style={[styles.goalText, { color: goalColor }]}>
                    {GOAL_LABELS[profile.healthGoal]}
                  </Text>
                </View>
              </View>
            )}

            {/* Health Attributes */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Health Attributes</Text>
              {[
                { key: 'strengthAttr',   label: 'Strength',   color: '#E74C3C', icon: 'barbell-outline' },
                { key: 'disciplineAttr', label: 'Discipline', color: '#7B2FBE', icon: 'medal-outline' },
                { key: 'recoveryAttr',   label: 'Recovery',   color: '#2E86AB', icon: 'bed-outline' },
                { key: 'nutritionAttr',  label: 'Nutrition',  color: '#2ECC71', icon: 'leaf-outline' },
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

            {/* Water Goal */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily Water Goal</Text>
              <View style={styles.goalRow}>
                <Ionicons name="water" size={16} color="#2E86AB" />
                <Text style={[styles.goalText, { color: '#2E86AB' }]}>
                  {profile?.waterGoalGlasses ?? 8} glasses per day
                </Text>
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={18} color="#E74C3C" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  scroll: { flex: 1, paddingHorizontal: 20 },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.accentPurple, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  rankBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5 },
  rankText: { fontSize: 11, fontWeight: '800', color: Colors.text, letterSpacing: 1.5 },

  xpRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  xpCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 16, alignItems: 'center' },
  xpValue: { fontSize: 24, fontWeight: '900', color: Colors.accentGold },
  xpLabel: { fontSize: 11, color: Colors.textSub, marginTop: 4 },

  card: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSub, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.8 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statBox: { flex: 1, minWidth: '40%', backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statUnit: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  statLabel: { fontSize: 11, color: Colors.textSub, marginTop: 4 },
  bmiCategory: { fontSize: 13, color: Colors.textSub, textAlign: 'center' },
  tdeeText: { fontSize: 13, color: Colors.textSub, marginTop: 6, textAlign: 'center' },

  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalDot: { width: 10, height: 10, borderRadius: 5 },
  goalText: { fontSize: 15, fontWeight: '700' },

  attrRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  attrLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSub, width: 72 },
  attrBarBg: { flex: 1, height: 6, backgroundColor: Colors.background, borderRadius: 3, overflow: 'hidden' },
  attrBarFill: { height: 6, borderRadius: 3 },
  attrValue: { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: '#E74C3C33', padding: 16, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#E74C3C' },

  // Edit mode
  editSection: { fontSize: 13, fontWeight: '700', color: Colors.textSub, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputHalf: { flex: 1 },
  inputLabel: { fontSize: 12, color: Colors.textSub, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, color: Colors.text, fontSize: 15 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  goalOption: { flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, alignItems: 'center' },
  goalOptionText: { fontSize: 13, fontWeight: '700', color: Colors.textSub },
  saveBtn: { backgroundColor: Colors.accentGold, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: Colors.background },

  heightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  unitToggle: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 5 },
  unitBtnActive: { backgroundColor: Colors.accentGold },
  unitBtnText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  unitBtnTextActive: { color: Colors.background },
  ftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  ftInput: { flex: 1, marginBottom: 0 },
  ftLabel: { fontSize: 15, color: Colors.textSub, fontWeight: '600' },
});
