import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Colors from '../constants/colors';
import client from '../api/client';

// ─── Time picker (simple HH:MM selector) ─────────────────────────────────────
const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function TimePicker({ value, onChange, label }) {
  const [hh, mm] = (value || '22:00').split(':');
  return (
    <View style={styles.timePicker}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <View style={styles.timePickerRow}>
        <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
          {HOURS.map(h => (
            <TouchableOpacity key={h} onPress={() => onChange(`${h}:${mm}`)}>
              <Text style={[styles.timeItem, hh === h && styles.timeItemActive]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.timeColon}>:</Text>
        <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
          {MINUTES.map(m => (
            <TouchableOpacity key={m} onPress={() => onChange(`${hh}:${m}`)}>
              <Text style={[styles.timeItem, mm === m && styles.timeItemActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Voice Reminders ──────────────────────────────────────────────────────────
const REMINDERS = [
  { id: 'water_hi',    lang: 'hi-IN', text: 'Bhai, paani pi le!',         label: 'Paani (Hindi)' },
  { id: 'water_mr',    lang: 'mr-IN', text: 'Chala, paani pi!',            label: 'Pani (Marathi)' },
  { id: 'workout_hi',  lang: 'hi-IN', text: 'Workout karne ka waqt aa gaya!', label: 'Workout (Hindi)' },
  { id: 'workout_mr',  lang: 'mr-IN', text: 'Chala, workout chya veli zali!', label: 'Workout (Marathi)' },
  { id: 'sleep_hi',    lang: 'hi-IN', text: 'So ja bhai, kal phir grind!', label: 'Sleep (Hindi)' },
];

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function WellnessModal({ visible, onClose }) {
  const [tab, setTab]           = useState('sleep');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime]   = useState('06:30');
  const [quality, setQuality]     = useState(3);
  const [sleepLog, setSleepLog]   = useState(null);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (visible) loadSleep();
  }, [visible]);

  async function loadSleep() {
    try {
      const { data } = await client.get('/wellness/sleep/today');
      if (data) {
        setSleepLog(data);
        setSleepTime(data.sleepTime || '23:00');
        setWakeTime(data.wakeTime || '06:30');
        setQuality(data.qualityRating || 3);
      }
    } catch {}
  }

  async function saveSleep() {
    setSaving(true);
    try {
      await client.post('/wellness/sleep', { sleepTime, wakeTime, qualityRating: quality });
      Alert.alert('Saved', 'Sleep log updated.');
      loadSleep();
    } catch {
      Alert.alert('Error', 'Could not save sleep log.');
    } finally {
      setSaving(false);
    }
  }

  function speak(text, lang) {
    Speech.speak(text, { language: lang, rate: 0.85, pitch: 1.0 });
  }

  function scheduleNotification(text, lang) {
    // Full notification scheduling requires a dev build — for now just speak
    speak(text, lang);
    Alert.alert('Coming soon', 'Scheduled notifications will work in the full APK build.');
  }

  const durationHours = sleepLog?.durationHours || null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Wellness</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
              <Ionicons name="close" size={22} color={Colors.textSub} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {[
              { key: 'sleep', icon: 'moon-outline',  label: 'Sleep' },
              { key: 'voice', icon: 'mic-outline',    label: 'Voice' },
            ].map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, tab === t.key && styles.tabActive]}
                onPress={() => setTab(t.key)}
              >
                <Ionicons name={t.icon} size={14} color={tab === t.key ? Colors.background : Colors.textSub} />
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

            {tab === 'sleep' && (
              <>
                {durationHours && (
                  <View style={styles.durationBadge}>
                    <Ionicons name="moon" size={16} color={Colors.accentPurple} />
                    <Text style={styles.durationText}>{durationHours}h last night</Text>
                    <View style={[styles.sleepQualityDot, { backgroundColor: quality >= 4 ? Colors.success : quality >= 3 ? Colors.accentGold : '#E74C3C' }]} />
                  </View>
                )}

                <View style={styles.timeRow}>
                  <TimePicker value={sleepTime} onChange={setSleepTime} label="Slept at" />
                  <TimePicker value={wakeTime}  onChange={setWakeTime}  label="Woke at" />
                </View>

                <Text style={styles.qualityLabel}>Sleep Quality</Text>
                <View style={styles.qualityRow}>
                  {[1, 2, 3, 4, 5].map(q => (
                    <TouchableOpacity key={q} onPress={() => setQuality(q)} style={styles.qualityBtn}>
                      <Text style={[styles.qualityEmoji, quality >= q && styles.qualityEmojiActive]}>
                        {['😴','😪','😐','😊','🤩'][q - 1]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={saveSleep}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Sleep Log'}</Text>
                </TouchableOpacity>
              </>
            )}

            {tab === 'voice' && (
              <>
                <Text style={styles.voiceHint}>Tap to hear the reminder. Long press to schedule daily.</Text>
                {REMINDERS.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.voiceRow}
                    onPress={() => speak(r.text, r.lang)}
                    onLongPress={() => scheduleNotification(r.text, r.lang)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="mic" size={18} color={Colors.accentGold} />
                    <View style={styles.voiceInfo}>
                      <Text style={styles.voiceLabel}>{r.label}</Text>
                      <Text style={styles.voiceText}>{r.text}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
                <Text style={styles.voiceHint}>Long press any reminder to schedule it daily at 8:00 AM.</Text>
              </>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: Colors.cardBorder, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },

  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.background },
  tabActive: { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  tabText: { fontSize: 12, color: Colors.textSub, fontWeight: '600' },
  tabTextActive: { color: Colors.background },

  body: { paddingHorizontal: 20 },

  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 12, marginBottom: 16 },
  durationText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '600' },
  sleepQualityDot: { width: 10, height: 10, borderRadius: 5 },

  timeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  timePicker: { flex: 1 },
  timePickerLabel: { fontSize: 12, color: Colors.textSub, fontWeight: '600', marginBottom: 8 },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden', height: 100 },
  timeScroll: { flex: 1 },
  timeItem: { textAlign: 'center', paddingVertical: 8, fontSize: 16, color: Colors.textMuted },
  timeItemActive: { color: Colors.accentGold, fontWeight: '700' },
  timeColon: { fontSize: 20, color: Colors.textSub, paddingHorizontal: 4 },

  qualityLabel: { fontSize: 13, color: Colors.textSub, fontWeight: '600', marginBottom: 10 },
  qualityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  qualityBtn: { padding: 8 },
  qualityEmoji: { fontSize: 28, opacity: 0.3 },
  qualityEmojiActive: { opacity: 1 },

  saveBtn: { backgroundColor: Colors.accentPurple, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: Colors.text },

  voiceHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, marginBottom: 8, gap: 12 },
  voiceInfo: { flex: 1 },
  voiceLabel: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  voiceText: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
});
