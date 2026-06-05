import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';

const SETTINGS_KEY = 'aroha_settings';

const DEFAULT_SETTINGS = {
  waterReminders:   true,
  sleepReminders:   true,
  missionReminders: true,
  language:         'en',
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
];

function SettingRow({ icon, label, children }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={Colors.accentGold} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowControl}>{children}</View>
    </View>
  );
}

export default function SettingsScreen({ visible, onClose }) {
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

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
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {}
  }

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={Colors.textSub} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Notifications */}
        <Text style={styles.section}>{t('notifications')}</Text>
        <View style={styles.card}>
          <SettingRow icon="water-outline" label={t('waterReminders')}>
            <Switch
              value={settings.waterReminders}
              onValueChange={v => updateSetting('waterReminders', v)}
              trackColor={{ false: Colors.cardBorder, true: Colors.accentGold }}
              thumbColor={Colors.text}
            />
          </SettingRow>
          <View style={styles.divider} />
          <SettingRow icon="moon-outline" label={t('sleepReminders')}>
            <Switch
              value={settings.sleepReminders}
              onValueChange={v => updateSetting('sleepReminders', v)}
              trackColor={{ false: Colors.cardBorder, true: Colors.accentGold }}
              thumbColor={Colors.text}
            />
          </SettingRow>
          <View style={styles.divider} />
          <SettingRow icon="flag-outline" label={t('missionReminders')}>
            <Switch
              value={settings.missionReminders}
              onValueChange={v => updateSetting('missionReminders', v)}
              trackColor={{ false: Colors.cardBorder, true: Colors.accentGold }}
              thumbColor={Colors.text}
            />
          </SettingRow>
        </View>

        {/* Language */}
        <Text style={styles.section}>{t('language')}</Text>
        <View style={styles.card}>
          {LANGUAGES.map((lang, idx) => {
            const selected = language === lang.code;
            return (
              <View key={lang.code}>
                <TouchableOpacity
                  style={styles.langRow}
                  onPress={() => setLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langLabel, selected && styles.langLabelActive]}>
                    {lang.label}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.accentGold} />
                  )}
                </TouchableOpacity>
                {idx < LANGUAGES.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {/* About */}
        <Text style={styles.section}>{t('about')}</Text>
        <View style={styles.card}>
          <SettingRow icon="leaf-outline" label={t('app')}>
            <Text style={styles.aboutValue}>Aroha</Text>
          </SettingRow>
          <View style={styles.divider} />
          <SettingRow icon="code-slash-outline" label={t('version')}>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </SettingRow>
          <View style={styles.divider} />
          <SettingRow icon="person-outline" label={t('builtBy')}>
            <Text style={styles.aboutValue}>Soham</Text>
          </SettingRow>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll:      { flex: 1, paddingHorizontal: 20 },

  section: { fontSize: 13, fontWeight: '700', color: Colors.textSub, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 10 },
  card:    { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: Colors.cardBorder, marginHorizontal: 16 },

  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon:    { marginRight: 12 },
  rowLabel:   { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  rowControl: { alignItems: 'flex-end' },

  langRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  langLabel:      { fontSize: 15, color: Colors.textSub, fontWeight: '500' },
  langLabelActive:{ color: Colors.text, fontWeight: '700' },

  aboutValue: { fontSize: 14, color: Colors.textSub, fontWeight: '600' },
  hint:       { fontSize: 12, color: Colors.textMuted, marginTop: 8, marginLeft: 4, fontStyle: 'italic' },
});
