import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import client, { TOKEN_KEY, REFRESH_KEY } from '../api/client';
import { on } from '../utils/events';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token on app launch

  // On app launch, check if a JWT token is already saved on the device
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser  = await AsyncStorage.getItem('aroha_user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        // If reading fails, just start logged out
      } finally {
        setLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  // The API client signed the user out (refresh token refused or account gone).
  useEffect(() => on('auth-expired', () => { setToken(null); setUser(null); }), []);

  // The user object is cached from login; refresh it from the server once per
  // app start so name, stage, EP, avatar and onboarding state stay current.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    client.get('/profile').then(async ({ data }) => {
      if (cancelled || !data) return;
      const fresh = {
        name: data.name,
        evolutionStage: data.evolutionStage,
        evolutionPoints: data.evolutionPoints,
        profileComplete: data.profileComplete,
        avatarKey: data.avatarKey,
        waterGoalGlasses: data.waterGoalGlasses,
      };
      setUser(prev => {
        const next = { ...(prev || {}), ...fresh };
        AsyncStorage.setItem('aroha_user', JSON.stringify(next)).catch(() => {});
        return next;
      });
    }).catch(err => {
      // Expired or deleted account: the client already cleared storage, so go to Login.
      const status = err?.response?.status;
      if (!cancelled && (status === 401 || status === 403)) {
        setToken(null);
        setUser(null);
      }
    });
    return () => { cancelled = true; };
  }, [token]);

  async function login(tokenValue, userData, refreshToken) {
    await SecureStore.setItemAsync(TOKEN_KEY, tokenValue);
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    await AsyncStorage.setItem('aroha_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }

  async function logout() {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY).catch(() => null);
    if (refreshToken) client.post('/auth/logout', { refreshToken }).catch(() => {}); // sign this device out on the server
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
    await AsyncStorage.removeItem('aroha_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
