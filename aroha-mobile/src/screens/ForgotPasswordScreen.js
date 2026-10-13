import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell';
import CodeInput from '../components/auth/CodeInput';
import PasswordField from '../components/auth/PasswordField';
import FormError from '../components/auth/FormError';
import Field from '../components/ui/Field';
import PrimaryButton from '../components/ui/PrimaryButton';
import AnimatedPressable from '../components/AnimatedPressable';
import { apiError, EMAIL_RE } from '../utils/apiError';
import { userFromAuth } from '../utils/authUser';
import { useCountdown } from '../utils/useCountdown';
import { success, warn, tap } from '../utils/haptics';
import { Palette, Fonts, Type } from '../constants/theme';

// Two steps: ask for a code by email, then enter it with a new password.
// A successful reset signs the user straight in.
export default function ForgotPasswordScreen({ navigation, route }) {
  const { login } = useAuth();
  const [step, setStep]         = useState('email');
  const [email, setEmail]       = useState(route?.params?.email ?? '');
  const [code, setCode]         = useState('');
  const [password, setPassword] = useState('');
  const [tried, setTried]       = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [wait, setWait]         = useCountdown(0);
  const passwordRef = useRef(null);

  const cleanEmail = email.trim().toLowerCase();
  const emailError = !cleanEmail ? 'Enter your email' : !EMAIL_RE.test(cleanEmail) ? 'Enter a valid email address' : '';
  const codeError  = code.length !== 6 ? 'Enter the 6-digit code' : '';
  const passError  = password.length < 8 ? 'Use at least 8 characters' : password.length > 72 ? 'Use 72 characters or fewer' : '';

  async function sendCode() {
    if (loading || wait > 0) return;
    setTried(true);
    setError('');
    if (emailError) { warn(); return; }
    setLoading(true);
    try {
      await client.post('/auth/password/forgot', { email: cleanEmail });
      setStep('code');
      setTried(false);
      setCode('');
      setWait(60);
    } catch (err) {
      warn();
      setError(apiError(err, "Couldn't send the code. Try again."));
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    if (loading) return;
    setTried(true);
    setError('');
    if (codeError || passError) { warn(); return; }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/password/reset', { email: cleanEmail, code, password });
      success();
      await login(data.token, userFromAuth(data, cleanEmail), data.refreshToken);
    } catch (err) {
      warn();
      setError(apiError(err, "That code didn't work. Try again."));
      setLoading(false);
    }
  }

  if (step === 'email') {
    return (
      <AuthShell
        title="Forgot password?"
        subtitle="Enter the email you signed up with and we'll send you a code to set a new password."
        footerText="Remembered it?"
        footerAction="Back to log in"
        onFooter={() => navigation.goBack()}
      >
        <Field
          label="Email"
          icon="mail-outline"
          placeholder="you@example.com"
          value={email}
          onChangeText={t => { setEmail(t); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={sendCode}
          autoFocus={!email}
          error={tried ? emailError : ''}
        />
        <FormError message={error} />
        <PrimaryButton title={loading ? 'Sending…' : 'Send code'} icon="mail-outline" onPress={sendCode} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle={`If ${cleanEmail} has an Aroha account, a 6-digit code is on its way. Check your spam folder too.`}
      footerText="Wrong email?"
      footerAction="Change it"
      onFooter={() => { tap(); setStep('email'); setError(''); setTried(false); }}
    >
      <View>
        <Text style={styles.label}>Code</Text>
        <CodeInput value={code} onChange={c => { setCode(c); setError(''); }} onComplete={() => passwordRef.current?.focus()} error={tried ? codeError : ''} />
      </View>
      <PasswordField
        ref={passwordRef}
        label="New password"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={t => { setPassword(t); setError(''); }}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={reset}
        error={tried ? passError : ''}
      />
      <FormError message={error} />
      <PrimaryButton title={loading ? 'Saving…' : 'Save and log in'} icon="lock-closed-outline" onPress={reset} />

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn't get it?</Text>
        {wait > 0 ? (
          <Text style={styles.resendWait}>Resend in {wait}s</Text>
        ) : (
          <AnimatedPressable onPress={() => { tap(); sendCode(); }} scaleTo={0.96} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }} accessibilityRole="button">
            <Text style={styles.resendAction}>Resend code</Text>
          </AnimatedPressable>
        )}
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  label:        { ...Type.label, color: Palette.textSub, marginBottom: 8 },
  resendRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  resendText:   { ...Type.body, fontSize: 14, color: Palette.textSub },
  resendWait:   { fontFamily: Fonts.bodyBold, fontSize: 14, color: Palette.textDim },
  resendAction: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Palette.text, textDecorationLine: 'underline' },
});
