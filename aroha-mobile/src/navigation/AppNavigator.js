import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import MacrosScreen from '../screens/MacrosScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import HabitScreen from '../screens/HabitScreen';
import PlannerScreen from '../screens/PlannerScreen';
import ProgressScreen from '../screens/ProgressScreen';
import TabBar from './TabBar';
import IconButton from '../components/ui/IconButton';
import { Palette, Fonts, Spacing } from '../constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Palette.ink } }}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Macros"   component={MacrosScreen} />
      <Tab.Screen name="Workout"  component={WorkoutScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

// Habits and Planner open from Home ("My day") as pushed screens with a back bar.
function withBackBar(Screen, title) {
  return function BackBarScreen({ navigation, route }) {
    return (
      <View style={styles.flex}>
        <SafeAreaView edges={['top']} style={styles.backBar}>
          <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Back" size={36} color={Palette.text} />
          <Text style={styles.backTitle}>{title}</Text>
        </SafeAreaView>
        <View style={styles.flex}>
          <Screen navigation={navigation} route={route} />
        </View>
      </View>
    );
  };
}

const HabitsWithBack  = withBackBar(HabitScreen, 'Habits');
const PlannerWithBack = withBackBar(PlannerScreen, 'Planner');

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Palette.ink } }}>
      <Stack.Screen name="Tabs"    component={MainTabs} />
      <Stack.Screen name="Habits"  component={HabitsWithBack} />
      <Stack.Screen name="Planner" component={PlannerWithBack} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: Palette.ink },
  backBar:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xs, backgroundColor: Palette.ink },
  backTitle: { fontFamily: Fonts.display, fontSize: 16, color: Palette.text },
});
