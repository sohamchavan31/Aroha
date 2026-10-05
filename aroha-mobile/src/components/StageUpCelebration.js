import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Easing, AccessibilityInfo, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from './ui/PrimaryButton';
import { STAGES, stageInfo } from '../constants/stages';
import { formatNumber } from '../utils/format';
import { Palette, Fonts, Type, Spacing } from '../constants/theme';
import { success, press } from '../utils/haptics';

const LINES = {
  Spark:    'Every legend starts small.',
  Awakened: "You've proven you can show up. Now make it a habit.",
  Ascender: 'Consistency is turning into strength.',
  Guardian: 'Discipline protects your progress now.',
  Titan:    'Few get this far. Your work shows.',
  Apex:     'Near the top. Stay hungry.',
  Legend:   'The final stage. You are the proof.',
};

const RINGS = [0, 1, 2];

// Full-screen moment when the user reaches a new evolution stage.
// Matte: brass outlines and type only — no glow, no gradient.
export default function StageUpCelebration({ visible, oldStage, newStage, ep = 0, onClose }) {
  const info = stageInfo(newStage, ep);
  const [reduce, setReduce] = useState(false);

  const oldOut = useRef(new Animated.Value(0)).current;  // 0 → 1: old name fades away
  const reveal = useRef(new Animated.Value(0)).current;  // 0 → 1: new name lands
  const rings  = useRef(RINGS.map(() => new Animated.Value(0))).current;
  const rest   = useRef(new Animated.Value(0)).current;  // details + button

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduce).catch(() => {});
  }, []);

  useEffect(() => {
    if (!visible) return;
    const all = [oldOut, reveal, rest, ...rings];
    if (reduce) {
      all.forEach(v => v.setValue(1));
      success();
      return;
    }
    all.forEach(v => v.setValue(0));
    const ease = Easing.out(Easing.cubic);
    const anim = Animated.sequence([
      Animated.delay(250),
      Animated.timing(oldOut, { toValue: 1, duration: 600, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(reveal, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.stagger(140, rings.map(r => Animated.timing(r, { toValue: 1, duration: 1100, easing: ease, useNativeDriver: true }))),
      ]),
      Animated.timing(rest, { toValue: 1, duration: 400, easing: ease, useNativeDriver: true }),
    ]);
    const t = setTimeout(success, 850); // haptic as the new name lands
    anim.start();
    return () => { clearTimeout(t); anim.stop(); };
  }, [visible, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    press();
    onClose?.();
  }

  const oldStyle = {
    opacity: oldOut.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [{ translateY: oldOut.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) }],
  };
  const newStyle = {
    opacity: reveal,
    transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
  };
  const restStyle = {
    opacity: rest,
    transform: [{ translateY: rest.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={close} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Text style={styles.kicker}>Evolution</Text>
          <Text style={styles.count}>Stage {info.number} of {info.total}</Text>
        </View>

        <View style={styles.stage}>
          {RINGS.map((_, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[styles.ring, {
                width: 180 + i * 70, height: 180 + i * 70, borderRadius: (180 + i * 70) / 2,
                opacity: rings[i].interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.55 - i * 0.15, 0.25 - i * 0.07] }),
                transform: [{ scale: rings[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
              }]}
            />
          ))}

          {!!oldStage && oldStage !== newStage && (
            <Animated.Text style={[styles.oldName, oldStyle]}>{oldStage}</Animated.Text>
          )}
          <Animated.View style={[styles.newWrap, newStyle]} accessible accessibilityLabel={`You reached ${newStage}`}>
            <Text style={styles.reached}>You reached</Text>
            <Text style={styles.newName} numberOfLines={1} adjustsFontSizeToFit>{(newStage || '').toUpperCase()}</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.bottom, restStyle]}>
          <Text style={styles.line}>{LINES[newStage] || 'You reached a new stage. Keep going.'}</Text>

          <View style={styles.track}>
            {STAGES.map((s, i) => {
              const done = i < info.number - 1;
              const current = i === info.number - 1;
              return <View key={s.name} style={[styles.pip, done && styles.pipDone, current && styles.pipNow]} />;
            })}
          </View>

          <Text style={styles.meta}>
            <Text style={styles.metaNum}>{formatNumber(ep)}</Text> EP
            {info.next ? <>  ·  <Text style={styles.metaNum}>{formatNumber(info.epToNext)}</Text> to {info.next.name}</> : '  ·  Final stage'}
          </Text>

          <PrimaryButton title="Keep going" icon="arrow-forward" onPress={close} containerStyle={styles.cta} />
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Palette.ink, paddingHorizontal: Spacing.xl },
  top:    { alignItems: 'center', paddingTop: Spacing.xl, gap: 4 },
  kicker: { ...Type.label, color: Palette.brass },
  count:  { fontFamily: Fonts.num, fontSize: 15, color: Palette.textSub },

  stage:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring:    { position: 'absolute', borderWidth: 1, borderColor: Palette.brass },
  oldName: { position: 'absolute', fontFamily: Fonts.display, fontSize: 26, color: Palette.textDim },
  newWrap: { alignItems: 'center', alignSelf: 'stretch' },
  reached: { ...Type.body, fontSize: 14, color: Palette.textSub, marginBottom: Spacing.sm },
  newName: { fontFamily: Fonts.display, fontSize: 44, letterSpacing: 3, color: Palette.brass, textAlign: 'center' },

  bottom:  { paddingBottom: Spacing.lg, alignItems: 'center' },
  line:    { fontFamily: Fonts.bodySemi, fontSize: 17, lineHeight: 25, color: Palette.text, textAlign: 'center', maxWidth: 320 },
  track:   { flexDirection: 'row', gap: 6, marginTop: Spacing.xl },
  pip:     { width: 22, height: 4, borderRadius: 2, backgroundColor: Palette.track },
  pipDone: { backgroundColor: Palette.brass + '80' },
  pipNow:  { width: 36, backgroundColor: Palette.brass },
  meta:    { ...Type.small, fontSize: 13, color: Palette.textSub, marginTop: Spacing.md },
  metaNum: { fontFamily: Fonts.num, fontSize: 15, color: Palette.text },
  cta:     { alignSelf: 'stretch', marginTop: Spacing.xl },
});
