import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, useWindowDimensions, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
const REMEASURE_MS = 250; // follow the target if the screen shifts under the tip

const TourContext = createContext(null);

// First-run guidance: the welcome cards once, then a spotlight tip the first
// time each feature is on screen. What's been seen is kept on the device.
export function TourProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [welcomeSeen, setWelcomeSeen] = useState(true);
  const [current, setCurrent] = useState(null); // { id, node, index, total }
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
      setCurrent({ id, node, index: step.current.index++, total: step.current.total });
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

// One overlay for the whole run of tips, so the spotlight can glide from one
// target to the next. The target is measured relative to the overlay itself
// (not the app window, which differs by the status bar on some phones) and
// re-measured while the tip is open, so it stays put if the screen shifts.
function Spotlight({ tip, onNext, onSkip }) {
  const { width: W, height: H } = useWindowDimensions();
  const rootRef = useRef(null);
  const [rect, setRect] = useState(null);
  const placed = useRef(false);
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const w = useRef(new Animated.Value(0)).current;
  const h = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  // Where is the target, in this overlay's coordinates? Re-checked while open.
  useEffect(() => {
    let alive = true;
    function measure() {
      const root = rootRef.current;
      const node = tip.node;
      if (!root?.measureInWindow || !node?.measureInWindow) return;
      root.measureInWindow((ox, oy) => {
        node.measureInWindow((tx, ty, tw, th) => {
          if (!alive || !tw || !th) return;
          const top = Math.max(0, ty - oy - PAD);
          const next = {
            x: Math.max(0, tx - ox - PAD),
            y: top,
            w: Math.min(W, tw + PAD * 2),
            h: Math.max(24, Math.min(th + PAD * 2, H - top - 8)), // tall cards stop at the screen edge
          };
          setRect(prev => (prev && Math.abs(prev.x - next.x) < 1 && Math.abs(prev.y - next.y) < 1
            && Math.abs(prev.w - next.w) < 1 && Math.abs(prev.h - next.h) < 1 ? prev : next));
        });
      });
    }
    const first = setTimeout(measure, 16); // after the overlay's first layout
    const id = setInterval(measure, REMEASURE_MS);
    return () => { alive = false; clearTimeout(first); clearInterval(id); };
  }, [tip.id, W, H]); // eslint-disable-line react-hooks/exhaustive-deps

  // First target: appear in place. Later ones: glide there.
  useEffect(() => {
    if (!rect) return;
    if (!placed.current) {
      placed.current = true;
      x.setValue(rect.x); y.setValue(rect.y); w.setValue(rect.w); h.setValue(rect.h);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: false }).start();
      return;
    }
    const to = v => ({ toValue: v, tension: 60, friction: 11, useNativeDriver: false });
    Animated.parallel([
      Animated.spring(x, to(rect.x)), Animated.spring(y, to(rect.y)),
      Animated.spring(w, to(rect.w)), Animated.spring(h, to(rect.h)),
    ]).start();
  }, [rect]); // eslint-disable-line react-hooks/exhaustive-deps

  // Each new tip's bubble springs in.
  useEffect(() => {
    bubble.setValue(0);
    Animated.spring(bubble, { toValue: 1, tension: 70, friction: 9, delay: 120, useNativeDriver: true }).start();
  }, [tip.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // A soft pulse around the target and a bobbing pointer, for as long as the tour runs.
  useEffect(() => {
    const ring = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }));
    const bob = Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    ring.start(); bob.start();
    return () => { ring.stop(); bob.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = TIPS[tip.id] ?? { title: '', text: '' };
  const last = tip.index + 1 >= tip.total;
  const below = rect ? H - (rect.y + rect.h) >= rect.y : true; // bubble on whichever side has more room
  const pointerLeft = rect ? Math.min(W - 40, Math.max(16, rect.x + rect.w / 2 - 12)) : 0;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onSkip}>
      <Animated.View ref={rootRef} collapsable={false} style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        {/* Dim everything but the target */}
        <Animated.View style={[styles.dim, { left: 0, top: 0, width: W, height: y }]} />
        <Animated.View style={[styles.dim, { left: 0, top: Animated.add(y, h), width: W, height: H }]} />
        <Animated.View style={[styles.dim, { left: 0, top: y, width: x, height: h }]} />
        <Animated.View style={[styles.dim, { left: Animated.add(x, w), top: y, width: W, height: h }]} />

        <Animated.View pointerEvents="none" style={[styles.ringBox, { left: x, top: y, width: w, height: h }]}>
          <Animated.View style={[styles.ring, StyleSheet.absoluteFill, {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
          }]} />
          <View style={[styles.ring, StyleSheet.absoluteFill]} />
        </Animated.View>

        {rect && (
          <Animated.View pointerEvents="none" style={[styles.pointer, below ? { top: rect.y + rect.h + 4 } : { top: rect.y - 26 }, { left: pointerLeft },
            { transform: [{ translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: below ? [4, -2] : [-4, 2] }) }] }]}>
            <Ionicons name={below ? 'caret-up' : 'caret-down'} size={22} color={Palette.ivory} />
          </Animated.View>
        )}

        {rect && (
          <Animated.View
            style={[styles.bubble, below ? { top: rect.y + rect.h + 26 } : { bottom: H - rect.y + 26 }, {
              opacity: bubble,
              transform: [
                { translateY: bubble.interpolate({ inputRange: [0, 1], outputRange: [below ? 14 : -14, 0] }) },
                { scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
              ],
            }]}
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.text}>{copy.text}</Text>
            <View style={styles.footer}>
              {tip.total > 1 && (
                <View style={styles.dots}>
                  {Array.from({ length: tip.total }, (_, i) => <View key={i} style={[styles.dot, i === tip.index && styles.dotOn]} />)}
                </View>
              )}
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
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim:      { position: 'absolute', backgroundColor: 'rgba(5,4,8,0.78)' },
  ringBox:  { position: 'absolute' },
  ring:     { borderRadius: Radius.lg, borderWidth: 2, borderColor: Palette.ivory },
  pointer:  { position: 'absolute', width: 24, alignItems: 'center' },
  dots:     { flexDirection: 'row', gap: 5 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.line },
  dotOn:    { width: 16, backgroundColor: Palette.ivory },
  bubble:   { position: 'absolute', left: Spacing.lg, right: Spacing.lg, backgroundColor: Palette.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.line, padding: Spacing.lg, gap: Spacing.sm },
  title:    { fontFamily: Fonts.display, fontSize: 16, color: Palette.text },
  text:     { ...Type.body, color: Palette.textSub },
  footer:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.xs },
  flex:     { flex: 1 },
  skip:     { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.textSub },
  next:     { backgroundColor: Palette.ivory, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  nextText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.onIvory },
});
