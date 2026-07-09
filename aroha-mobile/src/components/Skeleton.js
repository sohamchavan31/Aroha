import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Colors from '../constants/colors';
import { Radius } from '../constants/theme';

export default function Skeleton({ width = '100%', height = 16, radius = Radius.sm, style }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: radius, opacity: pulse },
        style,
      ]}
    />
  );
}

export function SkeletonMissionCard() {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.left}>
        <Skeleton width={22} height={22} radius={6} />
        <Skeleton width={24} height={24} radius={12} style={{ marginLeft: 10 }} />
        <Skeleton width="55%" height={14} style={{ marginLeft: 10 }} />
      </View>
      <Skeleton width={44} height={13} />
    </View>
  );
}

export function SkeletonStatCard() {
  return (
    <View style={cardStyles.statCard}>
      <Skeleton width={20} height={20} radius={4} style={{ marginBottom: 8 }} />
      <Skeleton width={30} height={18} style={{ marginBottom: 6 }} />
      <Skeleton width={40} height={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.cardBorder,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    alignItems: 'center',
  },
});
