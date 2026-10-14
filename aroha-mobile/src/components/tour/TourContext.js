import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, useWindowDimensions, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedPressable from '../AnimatedPressable';
import WelcomeTour from './WelcomeTour';
import { TIPS } from '../../constants/tour';
import { Palette, Fonts, Type, Spacing, Radius } from '../../constants/theme';
import { tap } from '../../utils/haptics';

const STORE_KEY = 'aroha_tour_v1';
const PAD = 6;          // space between the target and the ring
const SETTLE_MS = 900;  // let a screen's fade-in finish before measuring

const TourContext = createContext(null);

// First-run guidance: the welcome cards once, then a spotlight tip the first
// time each feature is on screen. What's been seen is kept on the device.
export function TourProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [welcomeSeen, setWelcomeSeen] = useState(true);
  const [current, setCurrent] = useState(null); // { id, rect, index, total }
  const seen = useRef(new Set());
  const targets = useRef({});
  const queue = useRef([]);
  const busy = useRef(false);
  const timer = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY)
      .then(raw => {
        const saved = raw ? JSON.parse(raw) : {};
        (saved.tips || []).forEach(id => seen.current.add(id));
        setWelcomeSeen(Boolean(saved.welcome));
      })
      .catch(() => setWelcomeSeen(false))
      .finally(() => setLoaded(true));
    return () => clearTimeout(timer.current);
  }, []);

  const save = useCallback(welcome => {
    AsyncStorage.setItem(STORE_KEY, JSON.stringify({ welcome, tips: [...seen.current] })).catch(() => {});
  }, []);

  const register = useCallback((id, ref) => {
    if (ref) targets.current[id] = ref;
    else delete targets.current[id];
  }, []);

  // Measure the next queued target and show its tip; skip ones not on screen.
  const step = useRef({ index: 0, total: 0 });
  const showNext = useCallback(() => {
    const id = queue.current.shift();
    if (!id) { busy.current = false; setCurrent(null); return; }
    const node = targets.current[id];
    if (!node?.measureInWindow) { step.current.total--; showNext(); return; }
    node.measureInWindow((x, y, width, height) => {
      const screenH = Dimensions.get('window').height;
      // Not laid out, or scrolled out of view: try again the next time the screen opens.
      if (!width || !height || y > screenH - 24 || y + height < 24) { step.current.total--; showNext(); return; }
      setCurrent({ id, rect: { x, y, width, height }, index: step.current.index++, total: step.current.total });
    });
  }, []);

  const showTips = useCallback(ids => {
    if (busy.current) return;
    const fresh = ids.filter(id => !seen.current.has(id));
    if (fresh.length === 0) return;
    busy.current = true;
    queue.current = fresh;
    step.current = { index: 0, total: fresh.length };
    clearTimeout(timer.current);
    timer.current = setTimeout(showNext, SETTLE_MS);
  }, [showNext]);

  function done(skipRest) {
    tap();
    if (current) seen.current.add(current.id);
    if (skipRest) { queue.current.forEach(id => seen.current.add(id)); queue.current = []; }
    save(welcomeSeen);
    if (queue.current.length === 0) { busy.current = false; setCurrent(null); return; }
    showNext();
  }

  function finishWelcome() {
    setWelcomeSeen(true);
    save(true);
  }

  // Settings → Replay app tour.
  const replay = useCallback(() => {
    seen.current.clear();
    queue.current = [];
    busy.current = false;
    setCurrent(null);
    AsyncStorage.removeItem(STORE_KEY).catch(() => {});
    setWelcomeSeen(false);
  }, []);

  const ready = loaded && welcomeSeen;

  return (
    <TourContext.Provider value={{ register, showTips, replay, ready }}>
      {children}
      <WelcomeTour visible={loaded && !welcomeSeen} onDone={finishWelcome} />
      {current && <Spotlight tip={current} onNext={() => done(false)} onSkip={() => done(true)} />}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext) ?? { register: () => {}, showTips: () => {}, replay: () => {}, ready: false };
}

// Attach to the View a tip points at: <View ref={useTourTarget('my-foods')} collapsable={false}>
export function useTourTarget(id) {
  const { register } = useTour();
  return useCallback(node => register(id, node), [id, register]);
}

// Show these tips (in order) the first time the screen is focused after the welcome cards.
export function useTourTips(ids, enabled = true) {
  const { showTips, ready } = useTour();
  const key = ids.join(',');
  useFocusEffect(useCallback(() => {
    if (ready && enabled) showTips(ids);
  }, [ready, enabled, key])); // eslint-disable-line react-hooks/exhaustive-deps
}

function Spotlight({ tip, onNext, onSkip }) {
  const { width: W, height: H } = useWindowDimensions();
  const copy = TIPS[tip.id] ?? { title: '', text: '' };
  const y = Math.max(0, tip.rect.y - PAD);
  const r = {
    x: Math.max(0, tip.rect.x - PAD),
    y,
    w: Math.min(W, tip.rect.width + PAD * 2),
    h: Math.min(tip.rect.height + PAD * 2, H - y - 8), // tall cards are cut at the screen edge
  };
  const below = H - (r.y + r.h) >= r.y; // bubble on whichever side has more room
  const last = tip.index + 1 >= tip.total;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onSkip}>
      {/* Dim everything but the target */}
      <View style={[styles.dim, { left: 0, top: 0, width: W, height: r.y }]} />
      <View style={[styles.dim, { left: 0, top: r.y + r.h, width: W, height: Math.max(0, H - r.y - r.h) }]} />
      <View style={[styles.dim, { left: 0, top: r.y, width: r.x, height: r.h }]} />
      <View style={[styles.dim, { left: r.x + r.w, top: r.y, width: Math.max(0, W - r.x - r.w), height: r.h }]} />
      <View pointerEvents="none" style={[styles.ring, { left: r.x, top: r.y, width: r.w, height: r.h }]} />

      <View style={[styles.bubble, below ? { top: r.y + r.h + Spacing.md } : { bottom: H - r.y + Spacing.md }]} accessibilityLiveRegion="polite">
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.text}>{copy.text}</Text>
        <View style={styles.footer}>
          {tip.total > 1 && <Text style={styles.count}>{tip.index + 1} of {tip.total}</Text>}
          <View style={styles.flex} />
          {!last && (
            <AnimatedPressable onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button">
              <Text style={styles.skip}>Skip tips</Text>
            </AnimatedPressable>
          )}
          <AnimatedPressable onPress={onNext} scaleTo={0.95} style={styles.next} accessibilityRole="button">
            <Text style={styles.nextText}>{last ? 'Got it' : 'Next'}</Text>
          </AnimatedPressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim:      { position: 'absolute', backgroundColor: 'rgba(5,4,8,0.78)' },
  ring:     { position: 'absolute', borderRadius: Radius.lg, borderWidth: 2, borderColor: Palette.ivory },
  bubble:   { position: 'absolute', left: Spacing.lg, right: Spacing.lg, backgroundColor: Palette.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.line, padding: Spacing.lg, gap: Spacing.sm },
  title:    { fontFamily: Fonts.display, fontSize: 16, color: Palette.text },
  text:     { ...Type.body, color: Palette.textSub },
  footer:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.xs },
  flex:     { flex: 1 },
  count:    { ...Type.small, color: Palette.textDim },
  skip:     { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.textSub },
  next:     { backgroundColor: Palette.ivory, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  nextText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.onIvory },
});
