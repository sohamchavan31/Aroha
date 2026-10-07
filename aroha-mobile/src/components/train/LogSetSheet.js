import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '../ui/Sheet';
import Stepper from '../ui/Stepper';
import PrimaryButton from '../ui/PrimaryButton';
import AnimatedPressable from '../AnimatedPressable';
import Skeleton from '../Skeleton';
import client from '../../api/client';
import { formatNumber } from '../../utils/format';
import { Palette, Fonts, Type, Radius, Spacing } from '../../constants/theme';
import { tap } from '../../utils/haptics';

const MAX_SETS = 20;

export function fmtKg(n) {
  return Number.isInteger(n) ? String(n) : Number(n).toFixed(1);
}

// "60×10 · 62.5×8 · 65×6", or "10 · 10 · 8" for bodyweight sets.
export function setsSummary(sets) {
  return sets.map(s => (s.weightKg > 0 ? `${fmtKg(s.weightKg)}×${s.reps}` : `${s.reps}`)).join(' · ');
}

// Log one exercise set by set — each set has its own weight and reps
// (they can be the same). Last session and best are shown for reference.
export default function LogSetSheet({ exercise, onClose, onSave }) {
  const [rows, setRows]       = useState([]);
  const [history, setHistory] = useState(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!exercise) return;
    const defaults = Array.from({ length: exercise.defaultSets || 3 }, () => ({ weightKg: 0, reps: exercise.defaultReps || 10 }));
    setRows(defaults);
    setSaving(false);
    setHistory(null);

    let cancelled = false;
    client.get(`/workouts/history/${exercise.id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setHistory(data);
        // Start from what they did last session, set for set.
        const lastSession = data?.sessions?.[data.sessions.length - 1];
        if (lastSession?.sets?.length) {
          setRows(lastSession.sets.slice(0, MAX_SETS).map(s => ({ weightKg: s.weightKg || 0, reps: s.reps || 1 })));
        }
      })
      .catch(() => { if (!cancelled) setHistory({ sessions: [] }); });
    return () => { cancelled = true; };
  }, [exercise]);

  const lastSession = history?.sessions?.[history.sessions.length - 1];
  const totalReps = rows.reduce((s, r) => s + r.reps, 0);
  const volume    = rows.reduce((s, r) => s + r.weightKg * r.reps, 0);

  function update(i, patch) {
    setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function addSet() {
    if (rows.length >= MAX_SETS) return;
    tap();
    setRows(rs => [...rs, { ...(rs[rs.length - 1] || { weightKg: 0, reps: 10 }) }]);
  }

  function removeSet(i) {
    if (rows.length <= 1) return;
    tap();
    setRows(rs => rs.filter((_, j) => j !== i));
  }

  async function save() {
    if (saving || rows.length === 0) return;
    setSaving(true);
    const ok = await onSave(rows);
    if (!ok) setSaving(false);
  }

  return (
    <Sheet
      visible={!!exercise}
      onClose={onClose}
      title={exercise?.name}
      subtitle={[exercise?.muscleGroup?.replace(/_/g, ' '), exercise?.equipment && exercise.equipment !== 'none' ? exercise.equipment.replace(/_/g, ' ') : 'bodyweight'].filter(Boolean).join(' · ')}
      showClose
    >
      <View style={styles.refRow}>
        <View style={styles.ref}>
          <Text style={styles.refLabel}>Last time</Text>
          {history === null ? <Skeleton width={120} height={18} /> : (
            <Text style={styles.refValue} numberOfLines={2}>{lastSession ? setsSummary(lastSession.sets) : '—'}</Text>
          )}
        </View>
        <View style={[styles.ref, styles.refRight]}>
          <Text style={styles.refLabel}>Best</Text>
          {history === null ? <Skeleton width={50} height={18} /> : (
            <Text style={styles.refValue} numberOfLines={1}>
              {history?.bestWeightKg > 0 ? `${fmtKg(history.bestWeightKg)} kg` : history?.bestReps > 0 ? `${history.bestReps} reps` : '—'}
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {rows.map((r, i) => (
          <View key={i} style={[styles.setRow, i > 0 && styles.divider]}>
            <View style={styles.setNum}>
              <Text style={styles.setNumText}>{i + 1}</Text>
            </View>
            <View style={styles.steppers}>
              <Stepper value={r.weightKg} onChange={v => update(i, { weightKg: v })} min={0} max={500} step={2.5} decimals={1} unit="kg" />
              <Stepper value={r.reps} onChange={v => update(i, { reps: v })} min={1} max={200} unit="reps" />
            </View>
            <AnimatedPressable
              onPress={() => removeSet(i)}
              disabled={rows.length <= 1}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              style={[styles.remove, rows.length <= 1 && styles.removeOff]}
              accessibilityLabel={`Remove set ${i + 1}`}
            >
              <Ionicons name="close" size={16} color={Palette.textDim} />
            </AnimatedPressable>
          </View>
        ))}

        {rows.length < MAX_SETS && (
          <AnimatedPressable onPress={addSet} scaleTo={0.98} style={styles.addSet} accessibilityRole="button">
            <Ionicons name="add" size={16} color={Palette.text} />
            <Text style={styles.addSetText}>Add set</Text>
            <Text style={styles.addSetHint}>copies the last one</Text>
          </AnimatedPressable>
        )}
        <Text style={styles.hint}>Leave weight at 0 for bodyweight sets.</Text>
      </ScrollView>

      <PrimaryButton
        title={saving ? 'Saving…' : `Log ${rows.length} set${rows.length === 1 ? '' : 's'}`}
        subtitle={`${totalReps} reps${volume > 0 ? ` · ${formatNumber(Math.round(volume))} kg volume` : ' · bodyweight'}`}
        icon="checkmark"
        onPress={save}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  refRow:   { flexDirection: 'row', gap: Spacing.md, backgroundColor: Palette.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft, padding: Spacing.md + 2, marginBottom: Spacing.lg },
  ref:      { flex: 1, gap: 4 },
  refRight: { flex: 0, minWidth: 64, alignItems: 'flex-end' },
  refLabel: { ...Type.label, color: Palette.textSub },
  refValue: { fontFamily: Fonts.num, fontSize: 17, color: Palette.text },

  scroll:   { flexShrink: 1, marginBottom: Spacing.lg },
  setRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  divider:  { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  setNum:   { width: 26, height: 26, borderRadius: 13, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.line, alignItems: 'center', justifyContent: 'center' },
  setNumText: { fontFamily: Fonts.numHeavy, fontSize: 14, color: Palette.text },
  steppers: { flex: 1, flexDirection: 'row', gap: Spacing.sm },
  remove:   { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  removeOff:{ opacity: 0.25 },

  addSet:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.sm, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: Palette.line },
  addSetText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Palette.text },
  addSetHint: { ...Type.small, color: Palette.textDim },
  hint:       { ...Type.small, color: Palette.textDim, textAlign: 'center', marginTop: Spacing.md },
});
