import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedPressable from './AnimatedPressable';
import FadeInView from './FadeInView';
import { permissionStatus, enableReminders } from '../utils/notifications';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { tap, success } from '../utils/haptics';

const DISMISSED_KEY = 'aroha_reminders_prompt';

// Asks for notification permission with context, once the user has seen the
// app, instead of a cold system prompt on first launch. Shown until they
// answer; "Not now" hides it for good (Settings can still turn reminders on).
export default function RemindersCard({ index = 0 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [status, dismissed] = await Promise.all([permissionStatus(), AsyncStorage.getItem(DISMISSED_KEY)]);
        if (!cancelled) setShow(status === 'undetermined' && !dismissed);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  if (!show) return null;

  async function turnOn() {
    tap();
    const granted = await enableReminders().catch(() => false);
    if (granted) success();
    AsyncStorage.setItem(DISMISSED_KEY, granted ? 'granted' : 'denied').catch(() => {});
    setShow(false);
  }

  function notNow() {
    tap();
    AsyncStorage.setItem(DISMISSED_KEY, 'dismissed').catch(() => {});
    setShow(false);
  }

  return (
    <FadeInView index={index}>
      <View style={styles.card}>
        <View style={styles.top}>
          <View style={styles.icon}>
            <Ionicons name="notifications-outline" size={20} color={Palette.text} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>Get gentle reminders?</Text>
            <Text style={styles.sub}>Water, meals, your workout and missions, so your streak never slips. Choose which ones in Settings.</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <AnimatedPressable onPress={notNow} scaleTo={0.97} style={styles.ghost}>
            <Text style={styles.ghostText}>Not now</Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={turnOn} scaleTo={0.97} style={styles.solid}>
            <Text style={styles.solidText}>Turn on</Text>
          </AnimatedPressable>
        </View>
      </View>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card:    { backgroundColor: Palette.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.lineSoft, padding: Spacing.lg, gap: Spacing.md },
  top:     { flexDirection: 'row', gap: Spacing.md },
  icon:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.surface2 },
  text:    { flex: 1 },
  title:   { ...Type.bodyB, color: Palette.text },
  sub:     { ...Type.small, color: Palette.textSub, marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  ghost:   { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill, borderWidth: 1, borderColor: Palette.line },
  ghostText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.textSub },
  solid:   { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.line },
  solidText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.text },
});
