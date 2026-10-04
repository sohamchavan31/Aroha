import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { Motion } from '../constants/theme';

// `style` goes on the scaling view; `containerStyle` on the outer Pressable
// (use it for layout such as flex or percentage widths inside a row).
export default function AnimatedPressable({ children, style, containerStyle, onPress, scaleTo = 0.96, disabled, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.timing(scale, { toValue: scaleTo, duration: Motion.fast, useNativeDriver: true }).start();
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      style={containerStyle}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
