import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import Svg from 'react-native-svg';
import Sheet from '../ui/Sheet';
import PrimaryButton from '../ui/PrimaryButton';
import FormError from '../auth/FormError';
import { Ring } from '../ui/ProgressRing';
import client from '../../api/client';
import { apiError } from '../../utils/apiError';
import { Palette, Fonts, Type, Spacing } from '../../constants/theme';
import { tap, success, warn } from '../../utils/haptics';

const DIAL = 220;
const BREATH_MS = 4000; // 4 s in, 4 s out

// Guided timer for timed missions (meditate, deep breathing, stretching).
// The server records when it started and only accepts the mission once the
// minutes have passed, so the timer keeps running if the sheet is closed.
export default function MissionTimerSheet({ mission, onClose, onDone }) {
  const visible = Boolean(mission);
  const minutes = mission?.minutes || 5;
  const [startedAt, setStartedAt] = useState(null); // ms since epoch
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const breath = useRef(new Animated.Value(0)).current;
  const breathing = /breath|meditat/i.test(mission?.title || '');

  useEffect(() => {
    if (!mission) return;
    setError('');
    setBusy(false);
    // A timer started earlier (sheet closed, app reopened) carries on.
    setStartedAt(mission.startedAt ? new Date(mission.startedAt).getTime() : null);
  }, [mission?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = minutes * 60 * 1000;
  const elapsed = startedAt ? Math.min(total, now - startedAt) : 0;
  const finished = Boolean(startedAt) && elapsed >= total;
  const running = Boolean(startedAt) && !finished;

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => { if (finished) success(); }, [finished]);

  // Breathing circle: grows for 4 s, shrinks for 4 s, while the timer runs.
  useEffect(() => {
    if (!running) { breath.setValue(0); return undefined; }
    let loop;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.().then(reduce => {
      if (cancelled || reduce) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: BREATH_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: BREATH_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
      loop.start();
    }).catch(() => {});
    return () => { cancelled = true; loop?.stop(); };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    if (busy) return;
    tap();
    setBusy(true);
    setError('');
    try {
      await client.post(`/missions/${mission.id}/start`);
      setStartedAt(Date.now());
      setNow(Date.now());
    } catch (err) {
      warn();
      setError(apiError(err, "Couldn't start the timer. Try again."));
    } finally {
      setBusy(false);
    }
  }

  function complete() {
    onDone?.(mission);
  }

  const left = Math.max(0, Math.ceil((total - elapsed) / 1000));
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const inhale = Math.floor(elapsed / BREATH_MS) % 2 === 0;
  const guide = !running ? '' : breathing ? (inhale ? 'Breathe in' : 'Breathe out') : 'Keep going';

  return (
    <Sheet visible={visible} onClose={onClose} title={mission?.title} subtitle={`+${mission?.epReward ?? 0} EP · ${minutes} minutes`} showClose>
      <View style={styles.body}>
        <View style={styles.dial}>
          <Animated.View style={[styles.bloom, {
            opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.4] }),
            transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.92] }) }],
          }]} />
          <Svg width={DIAL} height={DIAL} style={StyleSheet.absoluteFill}>
            <Ring cx={DIAL / 2} cy={DIAL / 2} r={DIAL / 2 - 8} stroke={8} progress={elapsed / total} color={finished ? Palette.success : Palette.violet} />
          </Svg>
          <Text style={styles.clock}>{finished ? 'Done' : clock}</Text>
          {!!guide && <Text style={styles.guide}>{guide}</Text>}
        </View>

        <Text style={styles.note}>
          {finished
            ? 'Nicely done. Claim your EP.'
            : running
              ? 'You can close this; the timer keeps going. Come back when it ends.'
              : breathing
                ? 'Sit comfortably. Follow the circle: in as it grows, out as it shrinks.'
                : 'Neck, shoulders, back, hips, legs. Hold each stretch about 30 seconds.'}
        </Text>

        <FormError message={error} />
        {finished ? (
          <PrimaryButton title={`Complete · +${mission?.epReward ?? 0} EP`} icon="checkmark" onPress={complete} />
        ) : running ? (
          <PrimaryButton title="Close for now" icon="time-outline" onPress={onClose} />
        ) : (
          <PrimaryButton title={busy ? 'Starting…' : `Start ${minutes}-minute timer`} icon="play" onPress={start} />
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body:  { gap: Spacing.lg },
  dial:  { width: DIAL, height: DIAL, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  bloom: { position: 'absolute', width: DIAL, height: DIAL, borderRadius: DIAL / 2, backgroundColor: Palette.violet },
  clock: { fontFamily: Fonts.numHeavy, fontSize: 52, lineHeight: 56, color: Palette.text },
  guide: { ...Type.label, color: Palette.textSub, marginTop: 4 },
  note:  { ...Type.body, color: Palette.textSub, textAlign: 'center' },
});
