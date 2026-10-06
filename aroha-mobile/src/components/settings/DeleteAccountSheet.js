import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '../ui/Sheet';
import PasswordField from '../auth/PasswordField';
import FormError from '../auth/FormError';
import AnimatedPressable from '../AnimatedPressable';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { apiError } from '../../utils/apiError';
import { Palette, Fonts, Type, Spacing, Radius } from '../../constants/theme';
import { warn, press } from '../../utils/haptics';

const GONE = [
  'Your profile, stage and EP',
  'Every food, workout, weight, water and sleep log',
  'Habits, planner tasks and missions',
  'Custom foods you created',
];

// Permanent account deletion (Play Store / App Store requirement).
export default function DeleteAccountSheet({ visible, onClose }) {
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  useEffect(() => { if (visible) { setPassword(''); setError(''); } }, [visible]);

  async function remove() {
    if (busy) return;
    if (!password) { warn(); setError('Enter your password to confirm.'); return; }
    press();
    setBusy(true);
    setError('');
    try {
      await client.post('/account/delete', { password });
      onClose?.();
      await logout();
    } catch (err) {
      warn();
      setError(apiError(err, 'Could not delete your account. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Delete account" subtitle="This can't be undone." showClose>
      <View style={styles.box}>
        <Text style={styles.lead}>Deleting your account permanently removes:</Text>
        {GONE.map(g => (
          <View key={g} style={styles.row}>
            <Ionicons name="close-circle" size={15} color={Palette.danger} />
            <Text style={styles.item}>{g}</Text>
          </View>
        ))}
        <Text style={styles.hint}>Want a copy first? Use "Export my data" in Settings before you delete.</Text>
      </View>

      <PasswordField
        label="Confirm with your password"
        placeholder="Your password"
        value={password}
        onChangeText={t => { setPassword(t); setError(''); }}
        autoComplete="current-password"
        returnKeyType="done"
        onSubmitEditing={remove}
        style={styles.field}
      />
      <FormError message={error} />

      <AnimatedPressable
        scaleTo={0.97}
        onPress={remove}
        style={[styles.danger, busy && styles.busy]}
        accessibilityRole="button"
        accessibilityLabel="Delete my account permanently"
      >
        <Ionicons name="trash-outline" size={17} color={Palette.text} />
        <Text style={styles.dangerText}>{busy ? 'Deleting…' : 'Delete my account'}</Text>
      </AnimatedPressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  box:   { backgroundColor: 'rgba(248,113,113,0.06)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.22)', borderRadius: Radius.md, padding: Spacing.md + 2, gap: Spacing.sm },
  lead:  { ...Type.bodyB, color: Palette.text },
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  item:  { ...Type.body, fontSize: 14, color: Palette.textSub, flex: 1 },
  hint:  { ...Type.small, color: Palette.textDim, marginTop: Spacing.xs },
  field: { marginTop: Spacing.lg, marginBottom: Spacing.md },
  danger:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md, paddingVertical: Spacing.md + 2, borderRadius: Radius.md + 2, backgroundColor: Palette.danger + '26', borderWidth: 1, borderColor: Palette.danger + '80' },
  busy:       { opacity: 0.6 },
  dangerText: { fontFamily: Fonts.bodyHeavy, fontSize: 15, color: Palette.text },
});
