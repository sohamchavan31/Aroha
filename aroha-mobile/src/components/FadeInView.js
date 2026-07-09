import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Motion } from '../constants/theme';

export default function FadeInView({ children, index = 0, style, distance = 12 }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: Motion.base,
      delay: index * Motion.stagger,
      useNativeDriver: true,
    }).start();
  }, [progress, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
