import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { initNotifications } from './src/utils/notifications';

function RootNavigator() {
  const { token, user, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    if (token && !loading) {
      initNotifications().catch(() => {});
    }
  }, [token, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#E2B714" size="large" />
      </View>
    );
  }

  if (!token) return <AuthNavigator />;

  // Logged in but profile not yet complete — show onboarding
  if (!onboardingDone && user && !user.profileComplete) {
    return <OnboardingScreen onComplete={() => setOnboardingDone(true)} />;
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
