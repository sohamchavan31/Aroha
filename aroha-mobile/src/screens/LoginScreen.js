import React, { useRef, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell';
import PasswordField from '../components/auth/PasswordField';
import FormError from '../components/auth/FormError';
import Field from '../components/ui/Field';
import PrimaryButton from '../components/ui/PrimaryButton';
import { apiError, EMAIL_RE } from '../utils/apiError';
import { warn } from '../utils/haptics';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [tried, setTried]       = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const passwordRef = useRef(null);

  const cleanEmail = email.trim().toLowerCase();
  const emailError = !cleanEmail ? 'Enter your email' : !EMAIL_RE.test(cleanEmail) ? 'Enter a valid email address' : '';
  const passError  = !password ? 'Enter your password' : '';

  async function handleLogin() {
    if (loading) return;
    setTried(true);
    setError('');
    if (emailError || passError) { warn(); return; }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', { email: cleanEmail, password });
      await login(data.token, { name: data.name, evolutionStage: data.evolutionStage, evolutionPoints: data.evolutionPoints, profileComplete: data.profileComplete });
    } catch (err) {
      warn();
      setError(apiError(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep your streak going."
      footerText="New to Aroha?"
      footerAction="Create an account"
      onFooter={() => navigation.navigate('Register')}
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
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={tried ? emailError : ''}
      />
      <PasswordField
        ref={passwordRef}
        label="Password"
        placeholder="Your password"
        value={password}
        onChangeText={t => { setPassword(t); setError(''); }}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
        error={tried ? passError : ''}
      />
      <FormError message={error} />
      <PrimaryButton title={loading ? 'Logging in…' : 'Log in'} onPress={handleLogin} />
    </AuthShell>
  );
}
