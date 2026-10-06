import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Where the API lives:
//  1. EXPO_PUBLIC_API_URL, if set at build time (release builds set this in
//     eas.json, e.g. https://api.aroha.sohrexlabs.com/api).
//  2. In dev, the IP Metro is serving on (Constants.expoConfig.hostUri), so it
//     works on Ethernet or Wi-Fi without hardcoding. Assumes Spring Boot runs on
//     the same machine on port 8080.
//  3. 10.0.2.2 (Android emulator) as a last resort.
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host) return `http://${host}:8080/api`;
  }
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
