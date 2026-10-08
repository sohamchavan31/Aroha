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

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Aroha Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

// Asks the system for permission (only shows the prompt the first time).
export async function requestPermissions() {
  await ensureChannel();
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// 'granted' | 'denied' | 'undetermined' — without prompting.
export async function permissionStatus() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return 'undetermined';
  }
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

// Called on app launch. Never prompts: the permission is asked from the
// reminders card on Home (or a Settings toggle), when the user has context.
export async function initNotifications() {
  if ((await permissionStatus()) !== 'granted') return;
  await rescheduleAll();
}

// User said yes to reminders: ask once, then schedule what Settings has on.
export async function enableReminders() {
  const granted = await requestPermissions();
  if (granted) await rescheduleAll();
  return granted;
}

async function rescheduleAll() {
  await ensureChannel();
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
