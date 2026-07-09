import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// In dev, derive the backend host from whatever IP Metro is actually
// serving on (Constants.expoConfig.hostUri) instead of hardcoding one —
// this keeps working whether the PC is on Ethernet or Wi-Fi that day.
// Assumes the Spring Boot backend runs on the same machine as the Metro
// dev server, on port 8080. 10.0.2.2 only works for the Android emulator,
// not a physical device, so it's kept only as a last-resort fallback.
function resolveBaseUrl() {
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host) return `http://${host}:8080/api`;
  }
  // TODO: replace with the production API URL before release
  return 'http://10.0.2.2:8080/api';
}

const BASE_URL = resolveBaseUrl();

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('aroha_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-clear stale token on 401 (expired) or 403 (user deleted/not found)
client.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      await SecureStore.deleteItemAsync('aroha_token');
      await AsyncStorage.removeItem('aroha_user');
      // Reloading the app bundle will cause RootNavigator to re-render
      // and show the Login screen since token is now cleared
    }
    return Promise.reject(error);
  }
);

export default client;
