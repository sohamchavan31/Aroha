import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token on app launch

  // On app launch, check if a JWT token is already saved on the device
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await AsyncStorage.getItem('aroha_token');
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

  async function login(tokenValue, userData) {
    await AsyncStorage.setItem('aroha_token', tokenValue);
    await AsyncStorage.setItem('aroha_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }

  async function logout() {
    await AsyncStorage.removeItem('aroha_token');
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
