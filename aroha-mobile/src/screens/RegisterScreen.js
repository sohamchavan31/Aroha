import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell';
import PasswordField from '../components/auth/PasswordField';
import FormError from '../components/auth/FormError';
import Field from '../components/ui/Field';
import PrimaryButton from '../components/ui/PrimaryButton';
import SegmentBar from '../components/ui/SegmentBar';
import { apiError, EMAIL_RE } from '../utils/apiError';
import { Palette, Type } from '../constants/theme';
import { warn } from '../utils/haptics';

const MIN_PASSWORD = 8;

// 0–3: length ≥ 8, mixes letters and numbers, 12+ chars or a symbol.
function strength(pw) {
  if (pw.length < MIN_PASSWORD) return pw ? 1 : 0;
  let s = 1;
  if (/[a-z]/i.test(pw) && /\d/.test(pw)) s++;
  if (pw.length >= 12 || /[^a-z0-9]/i.test(pw)) s++;
  return s;
}
const STRENGTH = [
  null,
  { label: 'Weak', color: Palette.danger },
  { label: 'Okay', color: Palette.kcal },
  { label: 'Strong', color: Palette.success },
];

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [tried, setTried]       = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const emailRef    = useRef(null);
  const passwordRef = useRef(null);

  const cleanName  = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const nameError  = !cleanName ? 'Enter your name' : cleanName.length > 60 ? 'Keep it under 60 characters' : '';
  const emailError = !cleanEmail ? 'Enter your email' : !EMAIL_RE.test(cleanEmail) ? 'Enter a valid email address' : '';
  const passError  = password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : password.length > 72 ? 'Keep it under 72 characters' : '';

  const level = strength(password);
  const meta  = STRENGTH[Math.min(level, 3)];

  async function handleRegister() {
    if (loading) return;
    setTried(true);
    setError('');
    if (nameError || emailError || passError) { warn(); return; }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/register', { name: cleanName, email: cleanEmail, password });
      await login(data.token, { name: data.name, evolutionStage: data.evolutionStage, evolutionPoints: data.evolutionPoints, profileComplete: data.profileComplete }, data.refreshToken);
    } catch (err) {
      warn();
      setError(apiError(err, 'Could not create your account. Try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track food, training and habits, and watch yourself evolve."
      footerText="Already have an account?"
      footerAction="Log in"
      onFooter={() => navigation.navigate('Login')}
    >
      <Field
        label="Name"
        icon="person-outline"
        placeholder="Your name"
        value={name}
        onChangeText={t => { setName(t); setError(''); }}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={60}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        error={tried ? nameError : ''}
      />
      <Field
        ref={emailRef}
        label="Email"
        icon="mail-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={t => { setEmail(t); setError(''); }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={tried ? emailError : ''}
      />
      <View>
        <PasswordField
          ref={passwordRef}
          label="Password"
          placeholder={`At least ${MIN_PASSWORD} characters`}
          value={password}
          onChangeText={t => { setPassword(t); setError(''); }}
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={72}
          returnKeyType="go"
          onSubmitEditing={handleRegister}
          error={tried ? passError : ''}
        />
        {!!password && !(tried && passError) && (
          <View style={styles.strength}>
            <SegmentBar progress={level / 3} segments={3} color={meta.color} height={4} style={styles.bar} />
            <Text style={[styles.strengthText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        )}
      </View>
      <FormError message={error} />
      <PrimaryButton title={loading ? 'Creating account…' : 'Create account'} onPress={handleRegister} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  strength:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  bar:          { flex: 1 },
  strengthText: { ...Type.small, fontSize: 11, width: 44, textAlign: 'right' },
});
