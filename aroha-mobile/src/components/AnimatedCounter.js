import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text } from 'react-native';
import { Motion } from '../constants/theme';
import { formatNumber } from '../utils/format';

export default function AnimatedCounter({ value, style, format = formatNumber, duration = Motion.slow }) {
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(Math.round(value));

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [value]);

  return <Text style={style}>{format(display)}</Text>;
}
