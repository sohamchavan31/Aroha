import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';

function RootNavigator() {
  const { token, user, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);

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
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
