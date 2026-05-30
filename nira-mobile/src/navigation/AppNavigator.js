import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import MacrosScreen from '../screens/MacrosScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
<<<<<<< Updated upstream
import ProfileScreen from '../screens/ProfileScreen';
=======
import HabitScreen from '../screens/HabitScreen';
import PlannerScreen from '../screens/PlannerScreen';
>>>>>>> Stashed changes
import Colors from '../constants/colors';

const Tab = createBottomTabNavigator();

<<<<<<< Updated upstream
=======
const TAB_ICONS = {
  Home:    { active: 'home',      inactive: 'home-outline' },
  Macros:  { active: 'nutrition', inactive: 'nutrition-outline' },
  Workout: { active: 'barbell',   inactive: 'barbell-outline' },
  Habits:  { active: 'calendar',  inactive: 'calendar-outline' },
  Planner: { active: 'today',     inactive: 'today-outline' },
};

>>>>>>> Stashed changes
export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.accentGold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Macros') {
            iconName = focused ? 'nutrition' : 'nutrition-outline';
          } else if (route.name === 'Workout') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Macros" component={MacrosScreen} />
      <Tab.Screen name="Workout" component={WorkoutScreen} />
<<<<<<< Updated upstream
      <Tab.Screen name="Profile" component={ProfileScreen} />
=======
      <Tab.Screen name="Habits"  component={HabitScreen} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
>>>>>>> Stashed changes
    </Tab.Navigator>
  );
}
