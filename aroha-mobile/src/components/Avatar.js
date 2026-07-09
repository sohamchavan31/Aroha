import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAvatar } from '../constants/avatars';

export default function Avatar({ avatarKey, size = 88, iconRatio = 0.45, style }) {
  const avatar = getAvatar(avatarKey);

  return (
    <View
      style={[
        styles.base,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: avatar.color + '33',
          borderColor: avatar.color,
        },
        style,
      ]}
    >
      <Ionicons name={avatar.icon} size={Math.round(size * iconRatio)} color={avatar.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
});
