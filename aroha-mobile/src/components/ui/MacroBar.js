import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { Palette, Fonts, Motion } from '../../constants/theme';

// Compact macro column: label, value/goal, and a bar that fills on change.
export default function MacroBar({ label, value, goal, color, unit = 'g' }) {
  const pct = goal > 0 ? Math.max(0, Math.min(value / goal, 1)) : 0;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: Motion.ring, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct, anim]);

  const over = goal > 0 && value > goal;

  return (
    <View style={styles.col}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {Math.round(value)}
        <Text style={styles.goal}>/{goal}{unit}</Text>
      </Text>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: over ? Palette.danger : color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  col:   { flex: 1, minWidth: 0 },
  label: { fontFamily: Fonts.bodySemi, fontSize: 11, color: Palette.textSub },
  value: { fontFamily: Fonts.num, fontSize: 18, color: Palette.text, marginTop: 2 },
  goal:  { fontFamily: Fonts.num, fontSize: 12, color: Palette.textSub },
  track: { height: 5, borderRadius: 3, backgroundColor: Palette.track, overflow: 'hidden', marginTop: 6 },
  fill:  { height: '100%', borderRadius: 3 },
});
