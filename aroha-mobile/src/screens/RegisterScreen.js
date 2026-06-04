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

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      await login(data.token, { name: data.name, evolutionStage: data.evolutionStage, evolutionPoints: data.evolutionPoints });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
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
              <Text style={styles.rankLabel}>NEW MEMBER</Text>
            </View>
            <Text style={styles.title}>Aroha</Text>
            <Text style={styles.subtitle}>Begin Your Evolution</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Create Account</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />

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
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={styles.buttonText}>Begin the Journey</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>
                Already a member?{' '}
                <Text style={styles.linkHighlight}>Login</Text>
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

  header: { alignItems: 'center', marginTop: 48, marginBottom: 40 },
  rankBadge: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6,
    marginBottom: 20,
  },
  rankLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 1.5 },
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
