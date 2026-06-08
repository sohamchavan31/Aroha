import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/colors';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', { email: email.trim(), password });
      await login(data.token, { name: data.name, evolutionStage: data.evolutionStage, evolutionPoints: data.evolutionPoints });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankLabel}>STAGE</Text>
              <Text style={styles.rankText}>SPARK</Text>
            </View>
            <Text style={styles.title}>Aroha</Text>
            <Text style={styles.subtitle}>Your Evolution Begins Here</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Login</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@aroha.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={styles.buttonText}>Login</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.linkText}>
                New here?{' '}
                <Text style={styles.linkHighlight}>Create an account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  header: { alignItems: 'center', marginTop: 60, marginBottom: 48 },
  rankBadge: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    alignItems: 'center', marginBottom: 20,
  },
  rankLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.5 },
  rankText: { fontSize: 24, fontWeight: '900', color: Colors.text },
  title: { fontSize: 40, fontWeight: '900', color: Colors.text, letterSpacing: 2 },
  subtitle: { fontSize: 13, color: Colors.textSub, marginTop: 8 },

  form: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 24 },

  label: { fontSize: 13, color: Colors.textSub, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    marginBottom: 18,
  },

  error: { color: '#E74C3C', fontSize: 13, marginBottom: 14, textAlign: 'center' },

  button: {
    backgroundColor: Colors.accentGold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '800', color: Colors.background },

  link: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: Colors.textSub },
  linkHighlight: { color: Colors.accentGold, fontWeight: '600' },
});
