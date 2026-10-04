import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedPressable from '../components/AnimatedPressable';
import QuickLogSheet from './QuickLogSheet';
import { Palette, Fonts, Radius, Spacing } from '../constants/theme';
import { tap, press } from '../utils/haptics';

const TABS = {
  Home:     { label: 'Home',     icon: 'home' },
  Macros:   { label: 'Food',     icon: 'restaurant' },
  Workout:  { label: 'Train',    icon: 'barbell' },
  Progress: { label: 'Progress', icon: 'stats-chart' },
};

// Floating rounded tab bar: Home · Food · (+) · Train · Progress.
// The centre button opens the quick-log sheet rather than a screen.
export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const [showQuickLog, setShowQuickLog] = useState(false);

  const routes = state.routes;
  const mid = Math.ceil(routes.length / 2);

  function renderTab(route, index) {
    const focused = state.index === index;
    const tab = TABS[route.name] || { label: route.name, icon: 'ellipse' };

    function onPress() {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        tap();
        navigation.navigate(route.name);
      }
    }

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={styles.tab}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={tab.label}
      >
        <View style={[styles.iconWrap, focused && styles.iconWrapOn]}>
          <Ionicons
            name={focused ? tab.icon : `${tab.icon}-outline`}
            size={19}
            color={focused ? Palette.text : Palette.textDim}
          />
        </View>
        <Text style={[styles.label, focused && styles.labelOn]}>{tab.label}</Text>
      </Pressable>
    );
  }

  return (
    <>
      <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, Spacing.sm) + Spacing.xs }]}>
        <View style={styles.bar}>
          {routes.slice(0, mid).map((r, i) => renderTab(r, i))}
          <View style={styles.tab}>
            <AnimatedPressable
              onPress={() => { press(); setShowQuickLog(true); }}
              scaleTo={0.9}
              style={styles.plus}
              accessibilityRole="button"
              accessibilityLabel="Quick log"
            >
              <Ionicons name="add" size={28} color={Palette.onIvory} />
            </AnimatedPressable>
          </View>
          {routes.slice(mid).map((r, i) => renderTab(r, i + mid))}
        </View>
      </View>

      <QuickLogSheet
        visible={showQuickLog}
        onClose={() => setShowQuickLog(false)}
        navigation={navigation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: Palette.ink,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.lineSoft,
    paddingVertical: Spacing.sm,
  },
  tab:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconWrap:   { width: 36, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconWrapOn: { backgroundColor: 'rgba(255,255,255,0.08)' },
  label:      { fontFamily: Fonts.bodyBold, fontSize: 10, color: Palette.textDim },
  labelOn:    { color: Palette.text },
  plus: {
    width: 50, height: 50, borderRadius: 17,
    backgroundColor: Palette.ivory,
    alignItems: 'center', justifyContent: 'center',
  },
});
