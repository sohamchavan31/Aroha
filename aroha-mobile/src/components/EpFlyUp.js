import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Palette, Fonts } from '../constants/theme';

// "+20 EP" that rises and fades from where it was earned. Mount it with a new
// key each time to replay.
export default function EpFlyUp({ amount, onDone, style }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration: 950, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start(({ finished }) => finished && onDone?.());
    return () => anim.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.Text
      pointerEvents="none"
      style={[styles.text, style, {
        opacity: v.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, -34] }) },
          { scale: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.8, 1.15, 1] }) },
        ],
      }]}
    >
      +{amount} EP
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: { position: 'absolute', fontFamily: Fonts.numHeavy, fontSize: 18, color: Palette.brass },
});
