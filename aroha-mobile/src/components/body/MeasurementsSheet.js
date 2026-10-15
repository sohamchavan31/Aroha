import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Sheet from '../ui/Sheet';
import Field from '../ui/Field';
import PrimaryButton from '../ui/PrimaryButton';
import FormError from '../auth/FormError';
import client from '../../api/client';
import { apiError } from '../../utils/apiError';
import { MEASUREMENTS } from '../../constants/body';
import { Palette, Fonts, Type, Spacing } from '../../constants/theme';
import { success, warn } from '../../utils/haptics';

// Log tape measurements in cm. Starts from the last values; only changed
// fields are sent, and saving twice on one day updates that day's entry.
export default function MeasurementsSheet({ visible, onClose, onSaved, sex, latest }) {
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Men don't need hips for body fat, so it goes last for them.
  const fields = sex === 'male'
    ? [...MEASUREMENTS.filter(m => m.key !== 'hipCm'), MEASUREMENTS.find(m => m.key === 'hipCm')]
    : MEASUREMENTS;

  useEffect(() => {
    if (!visible) return;
    setError('');
    setBusy(false);
    const start = {};
    MEASUREMENTS.forEach(m => { if (latest?.[m.key]?.value != null) start[m.key] = String(latest[m.key].value); });
    setValues(start);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (busy) return;
    const body = {};
    for (const m of MEASUREMENTS) {
      const raw = (values[m.key] || '').replace(',', '.').trim();
      if (!raw) continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) { warn(); setError(`${m.label}: enter a number in cm.`); return; }
      if (n !== latest?.[m.key]?.value) body[m.key] = n;
    }
    if (Object.keys(body).length === 0) { warn(); setError('Change at least one measurement.'); return; }
    setBusy(true);
    setError('');
    try {
      const { data } = await client.post('/body/measurements', body);
      success();
      onSaved?.(data);
    } catch (err) {
      warn();
      setError(apiError(err, "Couldn't save. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Tape measurements" subtitle="In cm, with a soft tape, skin-tight but not pressing" showClose>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          {sex === 'female' ? 'Waist, neck and hips give your body fat %.' : 'Waist and neck give your body fat %.'} The rest track muscle. Measure in the morning, before food.
        </Text>
        {fields.map(m => (
          <View key={m.key} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.label}>{m.label}</Text>
              <Text style={styles.tip}>{m.tip}</Text>
            </View>
            <Field
              value={values[m.key] ?? ''}
              onChangeText={t => setValues(v => ({ ...v, [m.key]: t.replace(/[^0-9.,]/g, '') }))}
              placeholder="—"
              keyboardType="decimal-pad"
              maxLength={5}
              style={styles.field}
              inputStyle={styles.input}
              right={<Text style={styles.unit}>cm</Text>}
              accessibilityLabel={`${m.label} in centimetres`}
            />
          </View>
        ))}
        <FormError message={error} />
        <PrimaryButton title={busy ? 'Saving…' : 'Save measurements'} icon="checkmark" onPress={save} style={busy && { opacity: 0.6 }} />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll:  { flexGrow: 0 },
  body:    { gap: Spacing.lg, paddingBottom: Spacing.sm },
  intro:   { ...Type.small, fontSize: 13, lineHeight: 19, color: Palette.textSub },
  row:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowText: { flex: 1, gap: 2 },
  label:   { ...Type.bodyB, color: Palette.text },
  tip:     { ...Type.small, color: Palette.textSub },
  field:   { width: 104 },
  input:   { fontFamily: Fonts.num, fontSize: 18, textAlign: 'right' },
  unit:    { ...Type.small, color: Palette.textDim },
});
