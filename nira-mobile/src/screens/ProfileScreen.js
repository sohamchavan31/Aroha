import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Modal, Alert, ActivityIndicator,
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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
            <Ionicons name="close" size={24} color={Colors.textSub} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.accentGold} style={{ marginTop: 60 }} />
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Avatar + Name */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color={Colors.textSub} />
              </View>
              <Text style={styles.userName}>{profile?.name || user?.name}</Text>
              <View style={[styles.rankBadge, { backgroundColor: Colors.accentPurple }]}>
                <Text style={styles.rankText}>{profile?.rank || 'E'} RANK</Text>
              </View>
            </View>

            {/* XP + Streak */}
            <View style={styles.xpRow}>
              <View style={styles.xpCard}>
                <Text style={styles.xpValue}>{profile?.totalXp ?? 0}</Text>
                <Text style={styles.xpLabel}>Total XP</Text>
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

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: '#E74C3C33', padding: 16, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#E74C3C' },
});
