import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Easing, AccessibilityInfo, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from './ui/PrimaryButton';
import { STAGES, stageInfo } from '../constants/stages';
import { formatNumber } from '../utils/format';
import { Palette, Fonts, Type, Spacing } from '../constants/theme';
import { success, press, tap } from '../utils/haptics';
import StageCrest from './StageCrest';

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
const CREST = 150;
// Pokémon-style flicker: old and new crest swap as white silhouettes,
// faster and faster, until the flash.
const FLICKER_MS = [320, 260, 210, 170, 140, 115, 95, 80, 68, 58, 50, 44, 40, 36];
const SWAP_MS = ms => Math.min(ms * 0.4, 60);

// Full-screen evolution moment when the user reaches a new stage.
// Matte: crests, a flat ivory flash and brass outlines — no glow, no gradient.
export default function StageUpCelebration({ visible, oldStage, newStage, ep = 0, onClose }) {
  const info = stageInfo(newStage, ep);
  const [reduce, setReduce] = useState(false);

  const intro   = useRef(new Animated.Value(0)).current;  // old crest + "is evolving"
  const morph   = useRef(new Animated.Value(0)).current;  // 0 = old silhouette, 1 = new
  const silh    = useRef(new Animated.Value(0)).current;  // 0 = coloured, 1 = white silhouettes
  const flash   = useRef(new Animated.Value(0)).current;
  const reveal  = useRef(new Animated.Value(0)).current;  // final brass crest + name
  const rings   = useRef(RINGS.map(() => new Animated.Value(0))).current;
  const rest    = useRef(new Animated.Value(0)).current;  // details + button

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduce).catch(() => {});
  }, []);

  useEffect(() => {
    if (!visible) return;
    const all = [intro, morph, silh, flash, reveal, rest, ...rings];
    if (reduce) {
      all.forEach(v => v.setValue(1));
      flash.setValue(0);
      success();
      return;
    }
    all.forEach(v => v.setValue(0));
    const ease = Easing.out(Easing.cubic);
    const flicker = FLICKER_MS.map((ms, i) =>
      Animated.timing(morph, { toValue: i % 2 === 0 ? 1 : 0, duration: SWAP_MS(ms), delay: ms * 0.6, useNativeDriver: true }));

    const anim = Animated.sequence([
      Animated.timing(intro, { toValue: 1, duration: 450, easing: ease, useNativeDriver: true }),
      Animated.delay(500),
      Animated.timing(silh, { toValue: 1, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ...flicker,
      Animated.timing(morph, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 1, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(flash, { toValue: 0, duration: 650, easing: ease, useNativeDriver: true }),
        Animated.spring(reveal, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
        Animated.stagger(140, rings.map(r => Animated.timing(r, { toValue: 1, duration: 1100, easing: ease, useNativeDriver: true }))),
      ]),
      Animated.timing(rest, { toValue: 1, duration: 400, easing: ease, useNativeDriver: true }),
    ]);

    // Haptics follow the flicker, then a big one on the flash.
    const timers = [];
    let t = 450 + 500 + 380;
    FLICKER_MS.forEach(ms => { t += ms * 0.6 + SWAP_MS(ms); timers.push(setTimeout(tap, t)); });
    timers.push(setTimeout(success, t + 40 + 140));
    anim.start();
    return () => { timers.forEach(clearTimeout); anim.stop(); };
  }, [visible, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    press();
    onClose?.();
  }

  const from = oldStage && oldStage !== newStage ? oldStage : null;
  const hide = reveal.interpolate({ inputRange: [0, 0.01, 1], outputRange: [1, 0, 0] }); // pre-evolution layers vanish at the flash

  const oldColour = { opacity: Animated.multiply(Animated.multiply(intro, hide), silh.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })) };
  const oldWhite  = { opacity: Animated.multiply(Animated.multiply(silh, hide), morph.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })) };
  const newWhite  = { opacity: Animated.multiply(Animated.multiply(silh, hide), morph) };
  const introScale = { transform: [{ scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] };
  const newStyle = {
    opacity: reveal,
    transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [1.25, 1] }) }],
  };
  const evolvingStyle = { opacity: Animated.multiply(intro, hide) };
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
          <Animated.View style={[styles.crestArea, introScale]} pointerEvents="none">
            {RINGS.map((_, i) => (
              <Animated.View
                key={i}
                style={[styles.ring, {
                  width: 200 + i * 70, height: 200 + i * 70, borderRadius: (200 + i * 70) / 2,
                  opacity: rings[i].interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.55 - i * 0.15, 0.25 - i * 0.07] }),
                  transform: [{ scale: rings[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                }]}
              />
            ))}
            {from && <Animated.View style={[styles.crestLayer, oldColour]}><StageCrest stage={from} size={CREST} /></Animated.View>}
            {from && <Animated.View style={[styles.crestLayer, oldWhite]}><StageCrest stage={from} size={CREST} color={Palette.ivory} /></Animated.View>}
            <Animated.View style={[styles.crestLayer, newWhite]}><StageCrest stage={newStage} size={CREST} color={Palette.ivory} /></Animated.View>
            <Animated.View style={[styles.crestLayer, newStyle]}><StageCrest stage={newStage} size={CREST} /></Animated.View>
          </Animated.View>

          <View style={styles.caption}>
            {from && (
              <Animated.Text style={[styles.evolving, evolvingStyle]} numberOfLines={1}>
                {from} is evolving…
              </Animated.Text>
            )}
            <Animated.View style={[styles.newWrap, newStyle]} accessible accessibilityLabel={`You reached ${newStage}`}>
              <Text style={styles.reached}>You reached</Text>
              <Text style={styles.newName} numberOfLines={1} adjustsFontSizeToFit>{(newStage || '').toUpperCase()}</Text>
            </Animated.View>
          </View>
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

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />
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
  crestArea:  { width: CREST, height: CREST, alignItems: 'center', justifyContent: 'center' },
  crestLayer: { ...StyleSheet.absoluteFillObject },
  caption: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', minHeight: 96, marginTop: Spacing.xl },
  evolving:{ position: 'absolute', ...Type.body, fontSize: 16, color: Palette.textSub },
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
  flash:   { backgroundColor: Palette.ivory },
});
