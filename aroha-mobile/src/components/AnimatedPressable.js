import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { Motion } from '../constants/theme';

export default function AnimatedPressable({ children, style, onPress, scaleTo = 0.96, disabled, ...rest }) {
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
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
