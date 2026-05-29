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

// Automatically attach JWT token to every request if one is stored
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('nira_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
