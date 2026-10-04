import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Unbounded_600SemiBold } from '@expo-google-fonts/unbounded';
import { BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { initNotifications } from './src/utils/notifications';
import { Palette } from './src/constants/theme';

const NavTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: Palette.ink, card: Palette.ink, border: Palette.line, primary: Palette.ivory, text: Palette.text },
};

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: Palette.ink, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Palette.brass} size="large" />
    </View>
  );
}

function RootNavigator() {
  const { token, user, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    if (token && !loading) {
      initNotifications().catch(() => {});
    }
  }, [token, loading]);

  if (loading) return <Splash />;

  if (!token) return <AuthNavigator />;

  // Logged in but profile not yet complete — show onboarding
  if (!onboardingDone && user && !user.profileComplete) {
    return <OnboardingScreen onComplete={() => setOnboardingDone(true)} />;
  }

  return <AppNavigator />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
    Unbounded_600SemiBold,
    BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold,
  });

  // If a font fails to load, carry on with system fonts rather than block the app.
  if (!fontsLoaded && !fontError) return <Splash />;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <NavigationContainer theme={NavTheme}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
