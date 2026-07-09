import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

// Android: real black-out via FLAG_SECURE while the screen is mounted.
// iOS: Apple provides no API to block screenshots, so we only detect and warn.
export function useScreenshotProtection(active = true) {
  useEffect(() => {
    if (!active) return;

    ScreenCapture.preventScreenCaptureAsync();

    const sub = ScreenCapture.addScreenshotListener(() => {
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Screenshot Detected',
          'This screen may contain personal health data. Please avoid sharing screenshots from here.'
        );
      }
    });

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
      sub.remove();
    };
  }, [active]);
}
