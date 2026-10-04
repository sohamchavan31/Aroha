import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from '../ui/Sheet';
import Stepper from '../ui/Stepper';
import PrimaryButton from '../ui/PrimaryButton';
import Skeleton from '../Skeleton';
import client from '../../api/client';
import { Palette, Fonts, Type, Radius, Spacing } from '../../constants/theme';

function fmtKg(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Log sets × reps × weight for one exercise, with last time and best shown for reference.
export default function LogSetSheet({ exercise, onClose, onSave }) {
  const [sets, setSets]       = useState(3);
  const [reps, setReps]       = useState(10);
  const [weight, setWeight]   = useState(0);
  const [history, setHistory] = useState(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!exercise) return;
    setSets(exercise.defaultSets || 3);
    setReps(exercise.defaultReps || 10);
    setWeight(0);
    setSaving(false);
    setHistory(null);

    let cancelled = false;
    client.get(`/workouts/history/${exercise.id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setHistory(data);
        // Start from what they did last time
        const last = data?.entries?.[data.entries.length - 1];
        if (last) {
          setSets(last.sets || exercise.defaultSets || 3);
          setReps(last.reps || exercise.defaultReps || 10);
          setWeight(last.weightKg || 0);
        }
      })
      .catch(() => { if (!cancelled) setHistory({ entries: [] }); });
    return () => { cancelled = true; };
  }, [exercise]);

  const last = history?.entries?.[history.entries.length - 1];

  async function save() {
    if (saving) return;
    setSaving(true);
    const ok = await onSave({ sets, reps, weightKg: weight });
    if (!ok) setSaving(false);
  }

  return (
    <Sheet
      visible={!!exercise}
      onClose={onClose}
      title={exercise?.name}
      subtitle={[exercise?.muscleGroup, exercise?.equipment].filter(Boolean).join(' · ')}
      showClose
    >
      <View style={styles.refRow}>
        <View style={styles.ref}>
          <Text style={styles.refLabel}>Last time</Text>
          {history === null ? <Skeleton width={70} height={18} /> : (
            <Text style={styles.refValue}>
              {last ? `${last.sets} × ${last.reps}${last.weightKg > 0 ? ` · ${fmtKg(last.weightKg)} kg` : ''}` : '—'}
            </Text>
          )}
        </View>
        <View style={[styles.ref, styles.refRight]}>
          <Text style={styles.refLabel}>Best</Text>
          {history === null ? <Skeleton width={50} height={18} /> : (
            <Text style={styles.refValue}>
              {history?.bestWeightKg > 0 ? `${fmtKg(history.bestWeightKg)} kg` : history?.bestReps > 0 ? `${history.bestReps} reps` : '—'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.steppers}>
        <Stepper label="Sets" value={sets} onChange={setSets} min={1} max={20} />
        <Stepper label="Reps" value={reps} onChange={setReps} min={1} max={100} />
        <Stepper label="Weight" value={weight} onChange={setWeight} min={0} max={500} step={2.5} decimals={1} unit="kg" />
      </View>
      <Text style={styles.hint}>Leave weight at 0 for bodyweight exercises.</Text>

      <PrimaryButton
        title={saving ? 'Saving…' : 'Log it'}
        subtitle={`${sets} × ${reps}${weight > 0 ? ` · ${fmtKg(weight)} kg` : ' · bodyweight'}`}
        icon="checkmark"
        onPress={save}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  refRow:   { flexDirection: 'row', backgroundColor: Palette.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft, padding: Spacing.md + 2, marginBottom: Spacing.xl },
  ref:      { flex: 1, gap: 4 },
  refRight: { alignItems: 'flex-end' },
  refLabel: { ...Type.label, color: Palette.textSub },
  refValue: { fontFamily: Fonts.num, fontSize: 18, color: Palette.text },
  steppers: { flexDirection: 'row', gap: Spacing.sm },
  hint:     { ...Type.small, color: Palette.textDim, textAlign: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
});
