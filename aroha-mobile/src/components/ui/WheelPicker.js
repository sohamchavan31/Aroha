import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { Palette, Fonts, Type, Radius, Spacing } from '../../constants/theme';
import { tick } from '../../utils/tick';

const ITEM = 46;
const VISIBLE = 5;          // odd: the middle row is the selection
const PAD = ITEM * Math.floor(VISIBLE / 2);

// One scrolling column of numbers, like a phone's date wheel. Rows tilt and
// fade away from the centre, and every row that passes the centre ticks.
export function WheelColumn({ items, index, onIndexChange, width = 72, format = String, align = 'center', accessibilityLabel }) {
  const scrollY = useRef(new Animated.Value(index * ITEM)).current;
  const ref = useRef(null);
  const lastIdx = useRef(index);
  const settling = useRef(false);
  const placed = useRef(false);
  const idleTimer = useRef(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  const changeRef = useRef(onIndexChange);
  changeRef.current = onIndexChange;
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  // Follow the value from outside (e.g. a +/- elsewhere) without fighting a drag.
  useEffect(() => {
    if (settling.current) return;
    if (index !== lastIdx.current) {
      lastIdx.current = index;
      ref.current?.scrollTo({ y: index * ITEM, animated: false });
    }
  }, [index]);

  const onScroll = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: e => {
        const y = e.nativeEvent.contentOffset.y;
        const i = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM)));
        if (i !== lastIdx.current) {
          lastIdx.current = i;
          tick();
        }
        // Backstop for platforms that skip the scroll-end events: settle once
        // the wheel has been still for a moment.
        clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => settleAt(y), 180);
      },
    },
  ), [items.length, scrollY]);

  function settleAt(y) {
    clearTimeout(idleTimer.current);
    const i = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM)));
    settling.current = false;
    lastIdx.current = i;
    if (i !== indexRef.current) changeRef.current(i);
  }
  const settle = e => settleAt(e.nativeEvent.contentOffset.y);

  return (
    <View style={{ width, height: ITEM * VISIBLE }} accessible accessibilityRole="adjustable" accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: format(items[index]) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => {
        const i = index + (e.nativeEvent.actionName === 'increment' ? 1 : -1);
        if (i >= 0 && i < items.length) { onIndexChange(i); tick(); }
      }}
    >
      <Animated.ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.985}
        contentOffset={{ x: 0, y: index * ITEM }}
        onLayout={() => {
          // contentOffset isn't honoured everywhere: put the wheel on the value once it has a size.
          if (!placed.current) { placed.current = true; ref.current?.scrollTo({ y: index * ITEM, animated: false }); }
        }}
        contentContainerStyle={{ paddingVertical: PAD }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => { settling.current = true; }}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={e => { if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) settle(e); }}
        nestedScrollEnabled
      >
        {items.map((v, i) => {
          const input = [(i - 2) * ITEM, (i - 1) * ITEM, i * ITEM, (i + 1) * ITEM, (i + 2) * ITEM];
          return (
            <Animated.View
              key={i}
              style={[styles.row, {
                opacity: scrollY.interpolate({ inputRange: input, outputRange: [0.15, 0.4, 1, 0.4, 0.15], extrapolate: 'clamp' }),
                transform: [
                  { perspective: 400 },
                  { rotateX: scrollY.interpolate({ inputRange: input, outputRange: ['50deg', '25deg', '0deg', '-25deg', '-50deg'], extrapolate: 'clamp' }) },
                  { scale: scrollY.interpolate({ inputRange: input, outputRange: [0.8, 0.9, 1, 0.9, 0.8], extrapolate: 'clamp' }) },
                ],
              }]}
            >
              <Text style={[styles.value, { textAlign: align }]}>{format(v)}</Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

function range(min, max, step = 1) {
  const out = [];
  for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 10) / 10);
  return out;
}

// A number on wheels: whole part, and optionally one decimal (80 . 5 kg).
// The selection band sits behind the middle row; the unit sits to the right.
export default function WheelPicker({ value, onChange, min, max, decimals = 0, unit, label, wholeWidth = 88 }) {
  const wholes = useMemo(() => range(Math.floor(min), Math.floor(max)), [min, max]);
  const tenths = useMemo(() => range(0, 9), []);
  const v = Math.min(max, Math.max(min, Number(value) || min));
  const whole = Math.floor(v + 1e-9);
  const tenth = decimals > 0 ? Math.round((v - whole) * 10) % 10 : 0;

  function set(w, t) {
    const n = Math.min(max, Math.max(min, Math.round((w + (decimals > 0 ? t / 10 : 0)) * 10) / 10));
    onChange(n);
  }

  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.wheels}>
        <View pointerEvents="none" style={styles.band} />
        <WheelColumn
          items={wholes}
          index={Math.max(0, wholes.indexOf(whole))}
          onIndexChange={i => set(wholes[i], tenth)}
          width={wholeWidth}
          align={decimals > 0 ? 'right' : 'center'}
          accessibilityLabel={label || unit}
        />
        {decimals > 0 && (
          <>
            <Text style={styles.dot}>.</Text>
            <WheelColumn
              items={tenths}
              index={tenth}
              onIndexChange={i => set(whole, tenths[i])}
              width={34}
              align="left"
              accessibilityLabel={`${label || unit} decimal`}
            />
          </>
        )}
        {!!unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:   { alignItems: 'center' },
  label:  { ...Type.label, color: Palette.textSub, marginBottom: Spacing.sm },
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: ITEM * VISIBLE, alignSelf: 'stretch' },
  band:   { position: 'absolute', left: 0, right: 0, top: PAD, height: ITEM, borderRadius: Radius.md, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.line },
  row:    { height: ITEM, justifyContent: 'center', paddingHorizontal: 4 },
  value:  { fontFamily: Fonts.numHeavy, fontSize: 32, color: Palette.text },
  dot:    { fontFamily: Fonts.numHeavy, fontSize: 32, color: Palette.text, marginHorizontal: 1 },
  unit:   { fontFamily: Fonts.bodyBold, fontSize: 15, color: Palette.textSub, marginLeft: Spacing.sm, minWidth: 34 },
});
