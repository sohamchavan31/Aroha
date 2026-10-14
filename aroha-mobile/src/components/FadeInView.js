import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Motion } from '../constants/theme';

// `viewRef` reaches the underlying view (the app tour measures it).
export default function FadeInView({ children, index = 0, style, distance = 12, viewRef }) {
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
      ref={viewRef}
      collapsable={false}
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
