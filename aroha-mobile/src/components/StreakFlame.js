import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Fonts, Radius, Spacing } from '../constants/theme';

// The flame grows with the streak: a spark under a week, then 7 / 30 / 100-day
// sizes. From a week on it flickers gently (off when Reduce Motion is on).
// A frozen streak shows ice instead, until it's thawed.
export function flameTier(streak) {
  if (streak >= 100) return { size: 17, color: Palette.kcal, solid: true, label: 'Blazing' };
  if (streak >= 30)  return { size: 15, color: Palette.kcal, solid: true, label: 'On fire' };
  if (streak >= 7)   return { size: 13, color: Palette.kcal, solid: true, label: null };
  return { size: 11, color: Palette.textSub, solid: false, label: null };
}

export default function StreakFlame({ streak, frozen = false }) {
  const tier = frozen ? { size: 12, color: Palette.water, solid: false, label: null } : flameTier(streak);
  const flicker = useRef(new Animated.Value(0)).current;
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduce).catch(() => {});
  }, []);

  useEffect(() => {
    if (!tier.solid || reduce) { flicker.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(flicker, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(flicker, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [tier.solid, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  const flameStyle = {
    transform: [
      { scaleY: flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
      { scaleX: flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) },
    ],
  };

  return (
    <View style={[styles.chip, tier.solid && styles.chipHot, frozen && styles.chipIce]} accessibilityLabel={`${streak}-day streak${frozen ? ', frozen' : ''}`}>
      <Animated.View style={flameStyle}>
        <Ionicons name={frozen ? 'snow' : tier.solid ? 'flame' : 'flame-outline'} size={tier.size} color={tier.color} />
      </Animated.View>
      <Text style={[styles.text, tier.solid && styles.textHot, frozen && styles.textIce]}>{streak}-day streak{frozen ? ' · frozen' : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Palette.line },
  chipHot: { backgroundColor: Palette.kcal + '14', borderColor: Palette.kcal + '40' },
  text:    { fontFamily: Fonts.bodyBold, fontSize: 11, color: Palette.textSub },
  textHot: { color: Palette.text },
  chipIce: { backgroundColor: Palette.water + '14', borderColor: Palette.water + '40' },
  textIce: { color: Palette.water },
});
