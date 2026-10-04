import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedPressable from '../components/AnimatedPressable';
import WellnessModal from '../components/WellnessModal';
import client from '../api/client';
import { emit } from '../utils/events';
import { tap, success } from '../utils/haptics';
import { Palette, Fonts, Radius, Spacing, Motion } from '../constants/theme';

const ACTIONS = [
  { key: 'food',    label: 'Food',     sub: 'Search or scan',  icon: 'restaurant',     color: Palette.kcal },
  { key: 'water',   label: 'Water',    sub: '+1 glass',        icon: 'water',          color: Palette.water },
  { key: 'workout', label: 'Workout',  sub: 'Log or generate', icon: 'barbell',        color: Palette.protein },
  { key: 'weight',  label: 'Weight',   sub: "Today's weigh-in", icon: 'scale',         color: Palette.carbs },
  { key: 'sleep',   label: 'Sleep',    sub: 'Last night',      icon: 'moon',           color: Palette.violet },
  { key: 'habits',  label: 'Habits',   sub: 'Tick off today',  icon: 'checkmark-done', color: Palette.success },
];

export default function QuickLogSheet({ visible, onClose, navigation }) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [showWellness, setShowWellness] = useState(false);
  const [waterNote, setWaterNote] = useState(null);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setWaterNote(null);
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, tension: 70, friction: 11 }).start();
    } else if (mounted) {
      Animated.timing(slide, { toValue: 0, duration: Motion.base, easing: Easing.in(Easing.cubic), useNativeDriver: true })
        .start(() => setMounted(false));
    }
  }, [visible]);

  async function handle(key) {
    tap();
    switch (key) {
      case 'food':    onClose(); navigation.navigate('Macros'); break;
      case 'workout': onClose(); navigation.navigate('Workout'); break;
      case 'weight':  onClose(); navigation.navigate('Progress', { openWeightLog: Date.now() }); break;
      case 'habits':  onClose(); navigation.navigate('Habits'); break;
      case 'sleep':   onClose(); setShowWellness(true); break;
      case 'water':
        try {
          const { data } = await client.post('/wellness/water/add');
          success();
          setWaterNote(data?.glasses != null ? `${data.glasses} glasses today` : 'Glass added');
          emit('water-changed');
        } catch {
          setWaterNote("Couldn't reach the server. Try again.");
        }
        break;
    }
  }

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });

  return (
    <>
      <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
        <Animated.View style={[styles.backdrop, { opacity: slide }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close quick log" />
        </Animated.View>
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl, transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <View style={styles.headRow}>
            <Text style={styles.title}>Quick log</Text>
            {!!waterNote && <Text style={styles.note}>{waterNote}</Text>}
          </View>
          <View style={styles.grid}>
            {ACTIONS.map(a => (
              <AnimatedPressable key={a.key} containerStyle={styles.itemSlot} style={styles.item} scaleTo={0.95} onPress={() => handle(a.key)}>
                <View style={[styles.icon, { backgroundColor: a.color + '1F' }]}>
                  <Ionicons name={a.icon} size={20} color={a.color} />
                </View>
                <Text style={styles.itemLabel}>{a.label}</Text>
                <Text style={styles.itemSub}>{a.sub}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </Animated.View>
      </Modal>
      <WellnessModal visible={showWellness} onClose={() => setShowWellness(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,4,8,0.7)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.xl + 4, borderTopRightRadius: Radius.xl + 4,
    borderWidth: 1, borderColor: Palette.lineSoft,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm,
  },
  handle:   { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Palette.line, marginBottom: Spacing.lg },
  headRow:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title:    { fontFamily: Fonts.display, fontSize: 18, color: Palette.text },
  note:     { fontFamily: Fonts.bodyBold, fontSize: 12, color: Palette.water },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  itemSlot: { width: '31%', flexGrow: 1 },
  item: {
    flex: 1,
    backgroundColor: Palette.surface2, borderRadius: Radius.md + 2,
    borderWidth: 1, borderColor: Palette.lineSoft,
    padding: Spacing.md, gap: 2,
  },
  icon:      { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  itemLabel: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Palette.text },
  itemSub:   { fontFamily: Fonts.body, fontSize: 11, color: Palette.textSub },
});
