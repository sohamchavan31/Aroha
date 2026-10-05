import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import client from '../api/client';
import Sheet from './ui/Sheet';
import Card from './ui/Card';
import Chip from './ui/Chip';
import Segmented from './ui/Segmented';
import PrimaryButton from './ui/PrimaryButton';
import AnimatedPressable from './AnimatedPressable';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { tap, success, warn } from '../utils/haptics';

const TABS = [
  { key: 'sleep', label: 'Sleep', icon: 'moon-outline' },
  { key: 'voice', label: 'Voice', icon: 'mic-outline' },
];

const QUALITY = [
  { value: 1, label: 'Poor' },
  { value: 2, label: 'Restless' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

const REMINDERS = [
  { id: 'water_hi',   lang: 'hi-IN', group: 'Hindi',   icon: 'water-outline',   color: Palette.water,   label: 'Water',   text: 'Bhai, paani pi le!' },
  { id: 'workout_hi', lang: 'hi-IN', group: 'Hindi',   icon: 'barbell-outline', color: Palette.protein, label: 'Workout', text: 'Workout karne ka waqt aa gaya!' },
  { id: 'sleep_hi',   lang: 'hi-IN', group: 'Hindi',   icon: 'moon-outline',    color: Palette.violet,  label: 'Sleep',   text: 'So ja bhai, kal phir grind!' },
  { id: 'water_mr',   lang: 'mr-IN', group: 'Marathi', icon: 'water-outline',   color: Palette.water,   label: 'Water',   text: 'Chala, paani pi!' },
  { id: 'workout_mr', lang: 'mr-IN', group: 'Marathi', icon: 'barbell-outline', color: Palette.protein, label: 'Workout', text: 'Chala, workout chya veli zali!' },
];

// ── Time helpers ("HH:MM" 24h strings, which is what the API stores) ────────
const toMin  = t => { const [h, m] = (t || '00:00').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const toTime = min => { const v = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; };
const pretty = t => {
  const [h, m] = t.split(':').map(Number);
  return { time: `${h % 12 || 12}:${String(m).padStart(2, '0')}`, ampm: h < 12 ? 'AM' : 'PM' };
};
const span = (from, to) => { const d = toMin(to) - toMin(from); return d <= 0 ? d + 1440 : d; };
const hm = min => `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`;

function TimeCard({ label, icon, value, onChange }) {
  const p = pretty(value);
  const step = dir => { tap(); onChange(toTime(Math.round(toMin(value) / 15) * 15 + dir * 15)); };
  return (
    <Card style={styles.timeCard}>
      <View style={styles.timeHead}>
        <Ionicons name={icon} size={14} color={Palette.textSub} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.timeValue}>{p.time}<Text style={styles.timeAmpm}> {p.ampm}</Text></Text>
      <View style={styles.timeBtns}>
        <AnimatedPressable scaleTo={0.9} onPress={() => step(-1)} containerStyle={styles.flex} style={styles.timeBtn} accessibilityLabel={`${label} 15 minutes earlier`}>
          <Ionicons name="remove" size={18} color={Palette.text} />
        </AnimatedPressable>
        <AnimatedPressable scaleTo={0.9} onPress={() => step(1)} containerStyle={styles.flex} style={styles.timeBtn} accessibilityLabel={`${label} 15 minutes later`}>
          <Ionicons name="add" size={18} color={Palette.text} />
        </AnimatedPressable>
      </View>
    </Card>
  );
}

function SleepTab() {
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime]   = useState('06:30');
  const [quality, setQuality]     = useState(3);
  const [saved, setSaved]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    client.get('/wellness/sleep/today').then(({ data }) => {
      if (!data) return;
      setSaved(data);
      if (data.sleepTime) setSleepTime(data.sleepTime);
      if (data.wakeTime) setWakeTime(data.wakeTime);
      if (data.qualityRating) setQuality(data.qualityRating);
    }).catch(() => {});
  }, []);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await client.post('/wellness/sleep', { sleepTime, wakeTime, qualityRating: quality });
      setSaved(data);
      success();
    } catch {
      warn();
      setError('Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  const mins  = span(sleepTime, wakeTime);
  const tone  = mins >= 420 ? Palette.success : mins >= 360 ? Palette.kcal : Palette.danger;
  const dirty = !saved || saved.sleepTime !== sleepTime || saved.wakeTime !== wakeTime || saved.qualityRating !== quality;

  return (
    <View>
      <Card variant="hero" style={styles.summary}>
        <View style={styles.flex}>
          <Text style={styles.label}>{saved ? 'Logged for last night' : 'Time asleep'}</Text>
          <Text style={styles.duration}>{hm(mins)}</Text>
          <Text style={styles.durationSub}>{mins >= 420 ? 'Right in the 7–9 h sweet spot' : mins >= 360 ? 'A little short of 7 h' : 'Well under 7 h. Go easy today'}</Text>
        </View>
        <View style={[styles.moon, { backgroundColor: tone + '1F' }]}>
          <Ionicons name="moon" size={22} color={tone} />
        </View>
      </Card>

      <View style={styles.timeRow}>
        <TimeCard label="Bedtime" icon="bed-outline" value={sleepTime} onChange={setSleepTime} />
        <TimeCard label="Woke up" icon="sunny-outline" value={wakeTime} onChange={setWakeTime} />
      </View>

      <Text style={[styles.label, styles.section]}>How did you sleep?</Text>
      <View style={styles.quality}>
        {QUALITY.map(q => (
          <Chip
            key={q.value}
            label={q.label}
            selected={quality === q.value}
            color={Palette.violet}
            onPress={() => setQuality(q.value)}
            containerStyle={styles.flex}
            style={styles.qualityChip}
          />
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton
        title={saving ? 'Saving…' : saved && !dirty ? 'Saved' : saved ? 'Update sleep' : 'Save sleep'}
        icon={saved && !dirty ? 'checkmark' : 'arrow-forward'}
        onPress={saved && !dirty ? undefined : save}
        containerStyle={{ marginTop: Spacing.xl }}
      />
    </View>
  );
}

function VoiceTab() {
  const [playing, setPlaying] = useState(null);

  useEffect(() => () => { Speech.stop(); }, []);

  function play(r) {
    tap();
    Speech.stop();
    if (playing === r.id) { setPlaying(null); return; }
    setPlaying(r.id);
    const done = () => setPlaying(p => (p === r.id ? null : p));
    Speech.speak(r.text, { language: r.lang, rate: 0.85, pitch: 1.0, onDone: done, onStopped: done, onError: done });
  }

  const groups = [...new Set(REMINDERS.map(r => r.group))];

  return (
    <View>
      <Text style={styles.intro}>Friendly nudges in your language. Tap one to hear it.</Text>
      {groups.map(g => (
        <View key={g}>
          <Text style={[styles.label, styles.section]}>{g}</Text>
          <Card style={styles.list}>
            {REMINDERS.filter(r => r.group === g).map((r, i) => {
              const on = playing === r.id;
              return (
                <AnimatedPressable
                  key={r.id}
                  scaleTo={0.98}
                  onPress={() => play(r)}
                  style={[styles.voiceRow, i > 0 && styles.divider]}
                  accessibilityRole="button"
                  accessibilityLabel={`${on ? 'Stop' : 'Play'} ${r.label} reminder in ${g}`}
                >
                  <View style={[styles.voiceIcon, { backgroundColor: r.color + '1F' }]}>
                    <Ionicons name={r.icon} size={16} color={r.color} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.voiceLabel}>{r.label}</Text>
                    <Text style={styles.voiceText}>“{r.text}”</Text>
                  </View>
                  <View style={[styles.play, on && styles.playOn]}>
                    <Ionicons name={on ? 'stop' : 'play'} size={13} color={on ? Palette.onIvory : Palette.text} style={!on && { marginLeft: 2 }} />
                  </View>
                </AnimatedPressable>
              );
            })}
          </Card>
        </View>
      ))}
      <View style={styles.soon}>
        <Ionicons name="time-outline" size={14} color={Palette.textDim} />
        <Text style={styles.soonText}>Daily voice reminders on a schedule are coming in a later update.</Text>
      </View>
    </View>
  );
}

export default function WellnessModal({ visible, onClose }) {
  const [tab, setTab] = useState('sleep');

  function close() {
    Speech.stop();
    onClose?.();
  }

  return (
    <Sheet visible={visible} onClose={close} title="Sleep & voice" subtitle="Log last night, hear a nudge" showClose>
      <Segmented options={TABS} value={tab} onChange={setTab} style={{ marginBottom: Spacing.lg }} />
      <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: Spacing.sm }}>
        {visible && (tab === 'sleep' ? <SleepTab /> : <VoiceTab />)}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1 },
  label:   { ...Type.label, color: Palette.textSub },
  section: { marginTop: Spacing.xl, marginBottom: Spacing.sm },

  summary:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  duration:    { fontFamily: Fonts.numHeavy, fontSize: 40, color: Palette.text, marginTop: 2 },
  durationSub: { ...Type.small, color: Palette.textSub },
  moon:        { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  timeRow:  { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  timeCard: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  timeHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeValue:{ fontFamily: Fonts.numHeavy, fontSize: 30, color: Palette.text },
  timeAmpm: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.textSub },
  timeBtns: { flexDirection: 'row', gap: Spacing.sm },
  timeBtn:  { height: 36, borderRadius: Radius.sm + 2, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.lineSoft, alignItems: 'center', justifyContent: 'center' },

  quality:     { flexDirection: 'row', gap: 6 },
  qualityChip: { paddingHorizontal: 2, paddingVertical: Spacing.sm + 2 },

  error: { ...Type.small, color: Palette.danger, marginTop: Spacing.md },

  intro:     { ...Type.body, fontSize: 14, color: Palette.textSub },
  list:      { paddingVertical: 0, paddingHorizontal: Spacing.md },
  voiceRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  divider:   { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  voiceIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  voiceLabel:{ ...Type.bodyB, color: Palette.text },
  voiceText: { ...Type.small, color: Palette.textSub, marginTop: 2 },
  play:      { width: 32, height: 32, borderRadius: 16, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.line, alignItems: 'center', justifyContent: 'center' },
  playOn:    { backgroundColor: Palette.ivory, borderColor: Palette.ivory },
  soon:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  soonText:  { ...Type.small, color: Palette.textDim, flex: 1 },
});
