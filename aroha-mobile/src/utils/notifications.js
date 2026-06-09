import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { SchedulableTriggerInputTypes } = Notifications;

// Show alerts when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function requestPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Aroha Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWaterReminders(enabled) {
  await Notifications.cancelScheduledNotificationAsync('water-reminder').catch(() => {});
  if (!enabled) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'water-reminder',
    content: {
      title: 'Stay Hydrated! 💧',
      body: 'Time for a glass of water. Keep going!',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2 * 60 * 60,
      repeats: true,
    },
  });
}

export async function scheduleMealReminders(enabled) {
  const ids = ['meal-breakfast', 'meal-lunch', 'meal-dinner'];
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  if (!enabled) return;
  const meals = [
    { id: 'meal-breakfast', hour: 8,  minute: 0,  title: 'Good Morning! 🌅', body: 'Log your breakfast and fuel your evolution.' },
    { id: 'meal-lunch',     hour: 13, minute: 0,  title: 'Lunch Time! 🍱',   body: "Don't forget to log your lunch." },
    { id: 'meal-dinner',    hour: 19, minute: 0,  title: 'Dinner Time! 🌙',  body: "Log your dinner and check today's macros." },
  ];
  await Promise.all(meals.map(m =>
    Notifications.scheduleNotificationAsync({
      identifier: m.id,
      content: { title: m.title, body: m.body },
      trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: m.hour, minute: m.minute },
    })
  ));
}

export async function scheduleWorkoutReminder(enabled) {
  await Notifications.cancelScheduledNotificationAsync('workout-reminder').catch(() => {});
  if (!enabled) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'workout-reminder',
    content: {
      title: 'Time to Train! 💪',
      body: 'Your workout is waiting. Keep your streak alive.',
    },
    trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 18, minute: 30 },
  });
}

export async function scheduleMissionReminder(enabled) {
  await Notifications.cancelScheduledNotificationAsync('mission-reminder').catch(() => {});
  if (!enabled) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'mission-reminder',
    content: {
      title: 'Missions Await! ⚡',
      body: 'Complete your daily missions and earn Evolution Points.',
    },
    trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
  });
}

// Called once on app launch — requests permissions then reschedules based on saved settings
export async function initNotifications() {
  const granted = await requestPermissions();
  if (!granted) return;
  try {
    const raw = await AsyncStorage.getItem('aroha_settings');
    const s = raw ? JSON.parse(raw) : {};
    await Promise.all([
      scheduleWaterReminders(s.waterReminders   !== false),
      scheduleMealReminders( s.mealReminders    !== false),
      scheduleWorkoutReminder(s.workoutReminder !== false),
      scheduleMissionReminder(s.missionReminders !== false),
    ]);
  } catch {}
}
