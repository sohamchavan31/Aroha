import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { emit } from '../utils/events';

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

export const TOKEN_KEY = 'aroha_token';
export const REFRESH_KEY = 'aroha_refresh';

// Attach JWT token to every request
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
  await AsyncStorage.removeItem('aroha_user').catch(() => {});
  emit('auth-expired');
}

// One refresh at a time: requests that fail together all wait for it.
let refreshing = null;
function refreshSession() {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refreshToken) return null;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, { timeout: 10000 });
        await SecureStore.setItemAsync(TOKEN_KEY, data.token);
        await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
        return data.token;
      } catch (err) {
        // Only a definite "no" signs the user out; a network blip keeps the session.
        if (err.response?.status === 401) return null;
        throw err;
      }
    })().finally(() => { refreshing = null; });
  }
  return refreshing;
}

// Expired access token: renew it with the refresh token and retry once.
// No refresh token, or it was refused: sign out. 403 = account gone.
client.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;
    const original = error.config || {};
    const isAuthCall = (original.url || '').startsWith('/auth/');

    if (status === 401 && !isAuthCall && !original._retried) {
      original._retried = true;
      let token = null;
      try {
        token = await refreshSession();
      } catch {
        return Promise.reject(error); // offline: keep the session, fail this request
      }
      if (token) {
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
        return client(original);
      }
      await clearSession();
    } else if (status === 403 && !isAuthCall) {
      await clearSession();
    }
    return Promise.reject(error);
  }
);

export default client;
