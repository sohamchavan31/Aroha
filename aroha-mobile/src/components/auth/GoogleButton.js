import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AnimatedPressable from '../AnimatedPressable';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { apiError } from '../../utils/apiError';
import { userFromAuth } from '../../utils/authUser';
import { Palette, Fonts, Spacing, Radius } from '../../constants/theme';
import { press, success, warn } from '../../utils/haptics';

// The OAuth *Web* client ID from Google Cloud: Google issues the ID token for
// it, and the backend checks the token was meant for it. Set per build in eas.json.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
export const googleSignInAvailable = Platform.OS === 'android' && Boolean(WEB_CLIENT_ID);

let configured = false;
function googleSignin() {
  // Loaded lazily: the native module only exists in Android builds.
  const mod = require('@react-native-google-signin/google-signin');
  if (!configured) {
    mod.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    configured = true;
  }
  return mod;
}

// "Continue with Google" for Login and Register, plus an "or" divider.
export default function GoogleButton({ onError }) {
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!googleSignInAvailable) return null;

  async function signIn() {
    if (busy) return;
    press();
    setBusy(true);
    onError?.('');
    try {
      const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = googleSignin();
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        // Show the account picker every time, so switching accounts is possible.
        await GoogleSignin.signOut().catch(() => {});
        const res = await GoogleSignin.signIn();
        if (!isSuccessResponse(res)) return; // cancelled
        const idToken = res.data?.idToken;
        if (!idToken) throw new Error('No ID token from Google');
        const { data } = await client.post('/auth/google', { idToken });
        success();
        await login(data.token, userFromAuth(data, res.data.user?.email?.toLowerCase()), data.refreshToken);
      } catch (err) {
        if (isErrorWithCode(err) && (err.code === statusCodes.SIGN_IN_CANCELLED || err.code === statusCodes.IN_PROGRESS)) return;
        warn();
        if (isErrorWithCode(err) && err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          onError?.('Google Play services are missing or out of date on this phone.');
        } else {
          onError?.(err?.response ? apiError(err, "Couldn't sign in with Google.") : "Couldn't sign in with Google. Try again.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <AnimatedPressable onPress={signIn} scaleTo={0.97} style={styles.button} accessibilityRole="button" accessibilityLabel="Continue with Google">
        {busy ? <ActivityIndicator color={Palette.text} /> : <GoogleMark />}
        <Text style={styles.label}>Continue with Google</Text>
      </AnimatedPressable>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>or with email</Text>
        <View style={styles.line} />
      </View>
    </View>
  );
}

// Google's four-colour "G".
function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap:    { gap: Spacing.lg },
  button:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, minHeight: 52, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.surface },
  label:   { fontFamily: Fonts.bodyBold, fontSize: 15, color: Palette.text },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  line:    { flex: 1, height: 1, backgroundColor: Palette.lineSoft },
  or:      { fontFamily: Fonts.body, fontSize: 12, color: Palette.textDim },
});
