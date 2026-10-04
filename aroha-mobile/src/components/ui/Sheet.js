import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, Animated, Easing, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from './IconButton';
import { Palette, Fonts, Radius, Spacing, Motion } from '../../constants/theme';

// Bottom sheet: dimmed backdrop, slides up with a spring, tap outside to close.
export default function Sheet({ visible, onClose, title, subtitle, children, maxHeight = '92%', showClose = false }) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, tension: 70, friction: 12 }).start();
    } else if (mounted) {
      Animated.timing(slide, { toValue: 0, duration: Motion.base, easing: Easing.in(Easing.cubic), useNativeDriver: true })
        .start(() => setMounted(false));
    }
  }, [visible]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <Animated.View style={[styles.backdrop, { opacity: slide }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { maxHeight, paddingBottom: insets.bottom + Spacing.lg, transform: [{ translateY }] }]}
        >
          <View style={styles.handle} />
          {(!!title || showClose) && (
            <View style={styles.head}>
              <View style={styles.headText}>
                {!!title && <Text style={styles.title} numberOfLines={2}>{title}</Text>}
                {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              {showClose && <IconButton name="close" size={34} onPress={onClose} accessibilityLabel="Close" />}
            </View>
          )}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex:     { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,4,8,0.7)' },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.xl + 4, borderTopRightRadius: Radius.xl + 4,
    borderWidth: 1, borderColor: Palette.lineSoft,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm,
  },
  handle:   { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Palette.line, marginBottom: Spacing.lg },
  head:     { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.lg },
  headText: { flex: 1 },
  title:    { fontFamily: Fonts.display, fontSize: 18, color: Palette.text },
  subtitle: { fontFamily: Fonts.body, fontSize: 12, color: Palette.textSub, marginTop: 4 },
});
