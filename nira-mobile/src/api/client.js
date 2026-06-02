import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 10.0.2.2 is how the Android emulator reaches your PC's localhost
// Change this to your actual server IP when testing on a physical device
const BASE_URL = 'http://10.0.2.2:8080/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('nira_token');
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
      await AsyncStorage.removeItem('nira_token');
      await AsyncStorage.removeItem('nira_user');
      // Reloading the app bundle will cause RootNavigator to re-render
      // and show the Login screen since token is now cleared
    }
    return Promise.reject(error);
  }
);

export default client;
