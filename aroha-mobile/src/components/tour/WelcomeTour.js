import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, useWindowDimensions, Animated, Easing, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../AnimatedPressable';
import PrimaryButton from '../ui/PrimaryButton';
import StageCrest from '../StageCrest';
import { WELCOME } from '../../constants/tour';
import { Palette, Fonts, Type, Spacing, Radius } from '../../constants/theme';
import { tap, success } from '../../utils/haptics';

// Four swipeable cards shown once, the first time the app opens after onboarding.
export default function WelcomeTour({ visible, onDone }) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scroll = useRef(null);
  const last = page === WELCOME.length - 1;

  useEffect(() => { if (visible) { setPage(0); scroll.current?.scrollTo({ x: 0, animated: false }); } }, [visible]);

  function next() {
    tap();
    if (last) { success(); onDone(); return; }
    scroll.current?.scrollTo({ x: (page + 1) * width, animated: true });
    setPage(page + 1);
  }

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onDone}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Text style={styles.brand}>AROHA</Text>
          {!last && (
            <AnimatedPressable onPress={() => { tap(); onDone(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button">
              <Text style={styles.skip}>Skip</Text>
            </AnimatedPressable>
          )}
        </View>

        <ScrollView
          ref={scroll}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={styles.flex}
        >
          {WELCOME.map((card, i) => (
            <View key={card.key} style={[styles.page, { width }]}>
              <Art card={card} active={page === i} />
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.text}>{card.text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {WELCOME.map((c, i) => <View key={c.key} style={[styles.dot, i === page && styles.dotOn]} />)}
          </View>
          <PrimaryButton title={last ? "Let's go" : 'Next'} icon={last ? 'checkmark' : 'arrow-forward'} onPress={next} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// A big emblem per card that pops in when its page is shown.
function Art({ card, active }) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const color = Palette[card.color] ?? Palette.text;
  const style = {
    opacity: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
  };
  return (
    <Animated.View style={[styles.art, { borderColor: color + '55', backgroundColor: color + '14' }, style]}>
      {card.icon === 'crest'
        ? <StageCrest stage={6} size={110} />
        : <Ionicons name={card.icon} size={card.icon === 'add' ? 84 : 72} color={color} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Palette.ink },
  flex:   { flex: 1 },
  top:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  brand:  { fontFamily: Fonts.display, fontSize: 14, letterSpacing: 4, color: Palette.textDim },
  skip:   { fontFamily: Fonts.bodyBold, fontSize: 14, color: Palette.textSub },
  page:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  art:    { width: 180, height: 180, borderRadius: 90, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title:  { fontFamily: Fonts.display, fontSize: 26, lineHeight: 34, color: Palette.text, textAlign: 'center' },
  text:   { ...Type.body, fontSize: 15, lineHeight: 23, color: Palette.textSub, textAlign: 'center', maxWidth: 340 },
  bottom: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.xl },
  dots:   { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.line },
  dotOn:  { width: 22, backgroundColor: Palette.ivory },
});
