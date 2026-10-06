import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, StatusBar, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/ui/Card';
import IconButton from '../components/ui/IconButton';
import AnimatedPressable from '../components/AnimatedPressable';
import { useLanguage } from '../context/LanguageContext';
import AppInfo from '../constants/appInfo';
import client from '../api/client';
import DeleteAccountSheet from '../components/settings/DeleteAccountSheet';
import { apiError } from '../utils/apiError';
import { Palette, Fonts, Type, Spacing } from '../constants/theme';
import { tap } from '../utils/haptics';
import {
  scheduleWaterReminders,
  scheduleMealReminders,
  scheduleWorkoutReminder,
  scheduleMissionReminder,
} from '../utils/notifications';

const SETTINGS_KEY = 'aroha_settings';

const DEFAULT_SETTINGS = {
  waterReminders:   true,
  mealReminders:    true,
  workoutReminder:  true,
  missionReminders: true,
  language:         'en',
};

const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English' },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी' },
  { code: 'mr', label: 'Marathi',  native: 'मराठी' },
];

// Setting key → notification schedule function
const NOTIF_HANDLERS = {
  waterReminders:   scheduleWaterReminders,
  mealReminders:    scheduleMealReminders,
  workoutReminder:  scheduleWorkoutReminder,
  missionReminders: scheduleMissionReminder,
};

export default function SettingsScreen({ visible, onClose }) {
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [exporting, setExporting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (visible) loadSettings();
  }, [visible]);

  async function loadSettings() {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {}
  }

  async function updateSetting(key, value) {
    tap();
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {}
    const handler = NOTIF_HANDLERS[key];
    if (handler) handler(value).catch(() => {});
  }

  // A copy of everything the server holds about the user, shared as JSON.
  async function exportData() {
    if (exporting) return;
    tap();
    setExporting(true);
    try {
      const { data } = await client.get('/account/export');
      await Share.share({ title: 'Aroha data export', message: JSON.stringify(data, null, 2) });
    } catch (err) {
      Alert.alert("Couldn't export your data", apiError(err, 'Try again in a moment.'));
    } finally {
      setExporting(false);
    }
  }

  if (!visible) return null;

  const reminders = [
    { key: 'waterReminders',   icon: 'water-outline',      color: Palette.water,   label: t('waterReminders'),   sub: 'Every 2 hours' },
    { key: 'mealReminders',    icon: 'restaurant-outline', color: Palette.kcal,    label: 'Meal reminders',      sub: '8 AM · 1 PM · 7 PM' },
    { key: 'workoutReminder',  icon: 'barbell-outline',    color: Palette.protein, label: 'Workout reminder',    sub: 'Daily at 6:30 PM' },
    { key: 'missionReminders', icon: 'flag-outline',       color: Palette.success, label: t('missionReminders'), sub: 'Daily at 8 PM' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />

      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <IconButton name="close" onPress={onClose} accessibilityLabel="Close settings" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>{t('notifications')}</Text>
        <Card style={styles.list}>
          {reminders.map((r, i) => (
            <View key={r.key} style={[styles.row, i > 0 && styles.divider]}>
              <View style={[styles.icon, { backgroundColor: r.color + '1F' }]}>
                <Ionicons name={r.icon} size={17} color={r.color} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowSub}>{r.sub}</Text>
              </View>
              <Switch
                value={!!settings[r.key]}
                onValueChange={v => updateSetting(r.key, v)}
                trackColor={{ false: Palette.line, true: Palette.violet }}
                thumbColor={Palette.text}
                ios_backgroundColor={Palette.line}
                accessibilityLabel={r.label}
              />
            </View>
          ))}
          <View style={[styles.row, styles.divider, styles.disabled]}>
            <View style={[styles.icon, { backgroundColor: Palette.violet + '1F' }]}>
              <Ionicons name="moon-outline" size={17} color={Palette.violet} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('sleepReminders')}</Text>
              <Text style={styles.rowSub}>Coming soon</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.section}>{t('language')}</Text>
        <Card style={styles.list}>
          {LANGUAGES.map((lang, i) => {
            const selected = language === lang.code;
            return (
              <AnimatedPressable
                key={lang.code}
                scaleTo={0.98}
                onPress={() => { tap(); setLanguage(lang.code); }}
                style={[styles.row, i > 0 && styles.divider]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{lang.native}</Text>
                  {lang.native !== lang.label && <Text style={styles.rowSub}>{lang.label}</Text>}
                </View>
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected && <Ionicons name="checkmark" size={12} color={Palette.onIvory} />}
                </View>
              </AnimatedPressable>
            );
          })}
        </Card>
        <Text style={styles.hint}>Language applies to screens that are translated so far.</Text>

        <Text style={styles.section}>Your data</Text>
        <Card style={styles.list}>
          <AnimatedPressable scaleTo={0.98} onPress={exportData} style={styles.row} accessibilityRole="button">
            <View style={[styles.icon, { backgroundColor: Palette.carbs + '1F' }]}>
              <Ionicons name="download-outline" size={17} color={Palette.carbs} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{exporting ? 'Preparing export…' : 'Export my data'}</Text>
              <Text style={styles.rowSub}>Everything you've logged, as a JSON file</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Palette.textDim} />
          </AnimatedPressable>
          <AnimatedPressable scaleTo={0.98} onPress={() => { tap(); setShowDelete(true); }} style={[styles.row, styles.divider]} accessibilityRole="button">
            <View style={[styles.icon, { backgroundColor: Palette.danger + '1F' }]}>
              <Ionicons name="trash-outline" size={17} color={Palette.danger} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: Palette.danger }]}>Delete account</Text>
              <Text style={styles.rowSub}>Permanently remove your account and data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Palette.textDim} />
          </AnimatedPressable>
        </Card>

        <Text style={styles.section}>{t('about')}</Text>
        <Card style={styles.list}>
          <InfoRow label={t('app')} value="Aroha" first />
          <InfoRow label={t('version')} value={AppInfo.displayVersion} />
          <InfoRow label={t('builtBy')} value="Soham" />
        </Card>
      </ScrollView>
      <DeleteAccountSheet visible={showDelete} onClose={() => setShowDelete(false)} />
    </SafeAreaView>
  );
}

function InfoRow({ label, value, first }) {
  return (
    <View style={[styles.row, !first && styles.divider]}>
      <Text style={[styles.rowLabel, styles.rowText]}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Palette.ink },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerSpacer: { width: 38 },
  headerTitle:  { fontFamily: Fonts.display, fontSize: 17, color: Palette.text },
  content:      { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  section:      { ...Type.label, color: Palette.textSub, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  hint:         { ...Type.small, color: Palette.textDim, marginTop: Spacing.sm },

  list:     { paddingVertical: 0, paddingHorizontal: Spacing.lg },
  row:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md + 2, minHeight: 56 },
  divider:  { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  disabled: { opacity: 0.55 },
  icon:     { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowText:  { flex: 1 },
  rowLabel: { ...Type.body, color: Palette.text },
  rowSub:   { ...Type.small, color: Palette.textSub, marginTop: 1 },
  radio:    { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Palette.textDim, alignItems: 'center', justifyContent: 'center' },
  radioOn:  { backgroundColor: Palette.ivory, borderColor: Palette.ivory },
  infoValue:{ ...Type.bodyB, color: Palette.textSub },
});
