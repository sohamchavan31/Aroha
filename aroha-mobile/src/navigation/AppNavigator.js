import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import MacrosScreen from '../screens/MacrosScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import HabitScreen from '../screens/HabitScreen';
import PlannerScreen from '../screens/PlannerScreen';
import ProgressScreen from '../screens/ProgressScreen';
import Colors from '../constants/colors';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:     { active: 'home',         inactive: 'home-outline' },
  Macros:   { active: 'nutrition',    inactive: 'nutrition-outline' },
  Workout:  { active: 'barbell',      inactive: 'barbell-outline' },
  Habits:   { active: 'calendar',     inactive: 'calendar-outline' },
  Planner:  { active: 'today',        inactive: 'today-outline' },
  Progress: { active: 'trending-up',  inactive: 'trending-up-outline' },
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.accentGold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Macros"   component={MacrosScreen} />
      <Tab.Screen name="Workout"  component={WorkoutScreen} />
      <Tab.Screen name="Habits"   component={HabitScreen} />
      <Tab.Screen name="Planner"  component={PlannerScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}
