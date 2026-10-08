import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import Svg from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '../ui/Sheet';
import Segmented from '../ui/Segmented';
import PrimaryButton from '../ui/PrimaryButton';
import { Ring } from '../ui/ProgressRing';
import AnimatedPressable from '../AnimatedPressable';
import FormError from '../auth/FormError';
import client from '../../api/client';
import { apiError } from '../../utils/apiError';
import { Palette, Fonts, Type, Spacing, Radius } from '../../constants/theme';
import { tap, press, success, warn } from '../../utils/haptics';

const EXERCISES = [
  { key: 'pushups', label: 'Push-ups' },
  { key: 'pullups', label: 'Pull-ups' },
];
const DIAL = 200;
const SHARDS = [0, 1, 2, 3, 4, 5, 6, 7];

// Thaw a frozen streak: do the extra reps, tapping the dial once per rep.
// On success the ice cracks apart and the flame relights.
export default function ThawSheet({ visible, streak, reps: target = 15, onClose, onThawed }) {
  const [exercise, setExercise] = useState('pushups');
  const [count, setCount]       = useState(0);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [thawed, setThawed]     = useState(null); // new streak once saved

  useEffect(() => {
    if (!visible) return;
    setExercise('pushups'); setCount(0); setSaving(false); setError(''); setThawed(null);
  }, [visible]);

  const done = count >= target;
  const label = exercise === 'pushups' ? 'push-ups' : 'pull-ups';

  function addRep() {
    if (thawed) return;
    tap();
    setCount(c => {
      const next = Math.min(c + 1, 500);
      if (next === target) success();
      return next;
    });
  }

  async function thaw() {
    if (!done || saving) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await client.post('/streak/thaw', { exercise, reps: count });
      setThawed(data.streak);
      onThawed?.(data);
    } catch (err) {
      warn();
      setError(apiError(err, "Couldn't thaw your streak. Try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={thawed ? null : 'Thaw your streak'}
      subtitle={thawed ? null : `${target} extra ${label} bring your ${streak}-day streak back`}
      showClose={!thawed}
    >
      {thawed ? (
        <Relit streak={thawed} onDone={onClose} />
      ) : (
        <View style={styles.body}>
          <Segmented options={EXERCISES} value={exercise} onChange={setExercise} />

          <AnimatedPressable
            onPress={addRep}
            scaleTo={0.95}
            style={styles.dial}
            accessibilityRole="button"
            accessibilityLabel={`Count a rep. ${count} of ${target}`}
          >
            <Svg width={DIAL} height={DIAL} style={StyleSheet.absoluteFill}>
              <Ring cx={DIAL / 2} cy={DIAL / 2} r={DIAL / 2 - 8} stroke={8} progress={count / target} color={done ? Palette.kcal : Palette.water} />
            </Svg>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.of}>of {target}</Text>
            <Text style={styles.hint}>{done ? 'Target hit' : 'Tap for each rep'}</Text>
          </AnimatedPressable>

          <View style={styles.undoRow}>
            <AnimatedPressable
              onPress={() => { if (count > 0) { tap(); setCount(c => c - 1); } }}
              disabled={count === 0}
              style={[styles.undo, count === 0 && styles.undoOff]}
              accessibilityLabel="Undo a rep"
            >
              <Ionicons name="arrow-undo" size={14} color={Palette.textSub} />
              <Text style={styles.undoText}>Undo</Text>
            </AnimatedPressable>
          </View>

          <FormError message={error} />
          {done ? (
            <PrimaryButton title={saving ? 'Thawing…' : 'Thaw my streak'} subtitle={`${count} ${label}`} icon="flame" onPress={thaw} />
          ) : (
            <View style={styles.pending}>
              <Text style={styles.pendingText}>{target - count} to go</Text>
            </View>
          )}
        </View>
      )}
    </Sheet>
  );
}

// The ice shakes, cracks into shards, and the flame springs back.
function Relit({ streak, onDone }) {
  const shake  = useRef(new Animated.Value(0)).current;
  const crack  = useRef(new Animated.Value(0)).current;
  const flame  = useRef(new Animated.Value(0)).current;
  const text   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.().then(reduce => {
      if (cancelled) return;
      if (reduce) { [shake, crack, flame, text].forEach(v => v.setValue(1)); success(); return; }
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 420, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(crack, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(flame, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(text, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]).start();
      setTimeout(() => !cancelled && press(), 420);
      setTimeout(() => !cancelled && success(), 940);
    }).catch(() => { [shake, crack, flame, text].forEach(v => v.setValue(1)); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const iceStyle = {
    opacity: crack.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0.6, 0] }),
    transform: [
      { translateX: shake.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -6, 6, -5, 4, 0] }) },
      { scale: crack.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) },
    ],
  };
  const flameStyle = {
    opacity: flame.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 1] }),
    transform: [{ scale: flame.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
  };

  return (
    <View style={styles.relit}>
      <View style={styles.stage}>
        {SHARDS.map(i => {
          const a = (i / SHARDS.length) * 2 * Math.PI;
          return (
            <Animated.View
              key={i}
              style={[styles.shard, {
                opacity: crack.interpolate({ inputRange: [0, 0.05, 0.8, 1], outputRange: [0, 1, 0.6, 0] }),
                transform: [
                  { translateX: crack.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * 70] }) },
                  { translateY: crack.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * 70] }) },
                  { rotate: `${(i * 45 + 20)}deg` },
                ],
              }]}
            />
          );
        })}
        <Animated.View style={[styles.layer, iceStyle]}>
          <Ionicons name="snow" size={84} color={Palette.water} />
        </Animated.View>
        <Animated.View style={[styles.layer, flameStyle]}>
          <Ionicons name="flame" size={92} color={Palette.kcal} />
        </Animated.View>
      </View>

      <Animated.View style={[styles.relitText, { opacity: text }]}>
        <Text style={styles.saved}>Streak saved</Text>
        <Text style={styles.days}>{streak}-day streak</Text>
        <Text style={styles.sub}>The ice is gone. Keep showing up.</Text>
        <PrimaryButton title="Keep going" icon="arrow-forward" onPress={onDone} containerStyle={styles.cta} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  body:    { gap: Spacing.lg },
  dial:    { width: DIAL, height: DIAL, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  count:   { fontFamily: Fonts.numHeavy, fontSize: 64, lineHeight: 66, color: Palette.text },
  of:      { fontFamily: Fonts.num, fontSize: 18, color: Palette.textSub },
  hint:    { ...Type.small, color: Palette.textDim, marginTop: 4 },
  undoRow: { alignItems: 'center' },
  undo:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.pill, borderWidth: 1, borderColor: Palette.line },
  undoOff: { opacity: 0.35 },
  undoText:{ fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.textSub },
  pending: { alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: Radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: Palette.line },
  pendingText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Palette.textSub },

  relit:   { alignItems: 'center', paddingTop: Spacing.lg },
  stage:   { width: 180, height: 160, alignItems: 'center', justifyContent: 'center' },
  layer:   { position: 'absolute' },
  shard:   { position: 'absolute', width: 4, height: 16, borderRadius: 2, backgroundColor: Palette.water },
  relitText: { alignItems: 'center', alignSelf: 'stretch', marginTop: Spacing.md },
  saved:   { ...Type.label, color: Palette.kcal },
  days:    { fontFamily: Fonts.display, fontSize: 26, color: Palette.text, marginTop: Spacing.xs },
  sub:     { ...Type.body, color: Palette.textSub, marginTop: Spacing.xs },
  cta:     { alignSelf: 'stretch', marginTop: Spacing.xl },
});
