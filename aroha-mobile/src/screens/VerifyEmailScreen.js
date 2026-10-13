import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell';
import CodeInput from '../components/auth/CodeInput';
import FormError from '../components/auth/FormError';
import PrimaryButton from '../components/ui/PrimaryButton';
import AnimatedPressable from '../components/AnimatedPressable';
import { apiError } from '../utils/apiError';
import { useCountdown } from '../utils/useCountdown';
import { success, warn, tap } from '../utils/haptics';
import { Palette, Fonts, Type, Spacing } from '../constants/theme';

// Shown after sign-up until the user enters the 6-digit code we emailed.
export default function VerifyEmailScreen() {
  const { user, updateUser, logout } = useAuth();
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');
  const [checking, setChecking] = useState(false);
  const [sending, setSending]   = useState(false);
  const [wait, setWait]         = useCountdown(60); // sign-up just sent one
  const inputRef = useRef(null);

  async function verify(value = code) {
    if (checking) return;
    if (value.length !== 6) { warn(); setError('Enter the 6-digit code.'); return; }
    setChecking(true);
    setError('');
    try {
      await client.post('/account/email/verify', { code: value });
      success();
      updateUser({ emailVerified: true });
    } catch (err) {
      warn();
      setError(apiError(err, "That code didn't work. Try again."));
      setCode('');
      inputRef.current?.focus();
    } finally {
      setChecking(false);
    }
  }

  async function resend() {
    if (wait > 0 || sending) return;
    tap();
    setSending(true);
    setError('');
    setNotice('');
    try {
      await client.post('/account/email/send-code');
      setNotice('New code sent. Check your inbox and spam folder.');
      setCode('');
      setWait(60);
    } catch (err) {
      warn();
      setError(apiError(err, "Couldn't send a new code. Try again in a minute."));
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthShell
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${user?.email || 'your email'}. Enter it to finish setting up.`}
      footerText="Wrong email?"
      footerAction="Sign up again"
      onFooter={logout}
    >
      <CodeInput ref={inputRef} value={code} onChange={c => { setCode(c); setError(''); }} onComplete={verify} error={error} />
      <FormError message={error} />
      {!!notice && !error && <Text style={styles.notice}>{notice}</Text>}
      <PrimaryButton title={checking ? 'Checking…' : 'Verify email'} onPress={() => verify()} />

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn't get it?</Text>
        {wait > 0 ? (
          <Text style={styles.resendWait}>Resend in {wait}s</Text>
        ) : (
          <AnimatedPressable onPress={resend} scaleTo={0.96} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }} accessibilityRole="button">
            <Text style={styles.resendAction}>{sending ? 'Sending…' : 'Resend code'}</Text>
          </AnimatedPressable>
        )}
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  notice:       { ...Type.small, fontSize: 13, color: Palette.success },
  resendRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  resendText:   { ...Type.body, fontSize: 14, color: Palette.textSub },
  resendWait:   { fontFamily: Fonts.bodyBold, fontSize: 14, color: Palette.textDim },
  resendAction: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Palette.text, textDecorationLine: 'underline' },
});
