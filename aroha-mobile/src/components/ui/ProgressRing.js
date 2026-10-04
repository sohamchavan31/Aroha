import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Palette, Motion } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// One ring that fills from empty to `progress` (0–1) when it mounts or changes.
// Rings are drawn centred on (cx, cy) so several can be nested in one Svg.
export function Ring({ cx, cy, r, stroke = 8, progress = 0, color, trackColor }) {
  const circumference = 2 * Math.PI * r;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(progress, 1)),
      duration: Motion.ring,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  const dashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor || Palette.track} strokeWidth={stroke} />
      <AnimatedCircle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashoffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </>
  );
}

// Concentric rings, outermost first: rings=[{ progress, color }, ...]
export default function ProgressRings({ size = 104, stroke = 9, gap = 3, rings = [] }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size}>
      {rings.map((ring, i) => {
        const r = c - stroke / 2 - i * (stroke + gap);
        return (
          <Ring
            key={i}
            cx={c}
            cy={c}
            r={r}
            stroke={stroke}
            progress={ring.progress}
            color={ring.color}
            trackColor={ring.color + '26'}
          />
        );
      })}
    </Svg>
  );
}
