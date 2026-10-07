import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Sheet from '../ui/Sheet';
import LineChart from '../ui/LineChart';
import Skeleton from '../Skeleton';
import client from '../../api/client';
import { setsSummary } from './LogSetSheet';
import { formatNumber } from '../../utils/format';
import { Palette, Fonts, Type, Radius, Spacing } from '../../constants/theme';

function fmtDate(dateStr) {
  const [, m, d] = (dateStr || '').split('-');
  return m && d ? `${parseInt(d, 10)}/${parseInt(m, 10)}` : '';
}

function fmtKg(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Progression for one exercise: best, chart of each session's top set (weight, or
// reps if bodyweight), and every session with all its sets.
export default function ExerciseHistorySheet({ exercise, onClose }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!exercise) return;
    setHistory(null);
    let cancelled = false;
    client.get(`/workouts/history/${exercise.id}`)
      .then(({ data }) => { if (!cancelled) setHistory(data); })
      .catch(() => { if (!cancelled) setHistory({ entries: [], sessions: [], bestWeightKg: 0, bestReps: 0 }); });
    return () => { cancelled = true; };
  }, [exercise]);

  const entries  = history?.sessions || [];   // one per day
  const weighted = entries.some(e => e.topWeightKg > 0) || (history?.bestWeightKg || 0) > 0;
  const metric   = e => (weighted ? e.topWeightKg : e.topReps);
  const unit     = weighted ? 'kg' : 'reps';
  const first    = entries[0];
  const last     = entries[entries.length - 1];
  const change   = first && last ? metric(last) - metric(first) : 0;
  const newest   = [...entries].reverse();

  return (
    <Sheet visible={!!exercise} onClose={onClose} title={exercise?.name} subtitle="Your progress" showClose>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.label}>Best</Text>
            {history === null ? <Skeleton width={70} height={30} /> : (
              <Text style={styles.big}>
                {weighted ? fmtKg(history?.bestWeightKg || 0) : history?.bestReps || 0}
                <Text style={styles.bigUnit}> {unit}</Text>
              </Text>
            )}
          </View>
          <View style={styles.stat}>
            <Text style={styles.label}>Since first log</Text>
            {history === null ? <Skeleton width={60} height={30} /> : (
              <Text style={[styles.big, { color: change > 0 ? Palette.success : change < 0 ? Palette.danger : Palette.text }]}>
                {change > 0 ? '+' : ''}{weighted ? fmtKg(change) : change}
                <Text style={styles.bigUnit}> {unit}</Text>
              </Text>
            )}
          </View>
          <View style={styles.stat}>
            <Text style={styles.label}>Sessions</Text>
            {history === null ? <Skeleton width={30} height={30} /> : <Text style={styles.big}>{entries.length}</Text>}
          </View>
        </View>

        {entries.length >= 2 && (
          <View style={styles.chartCard}>
            <Text style={styles.label}>{weighted ? 'Top set weight' : 'Best set reps'} over time</Text>
            <LineChart
              points={entries.map(e => ({ label: fmtDate(e.date), value: metric(e) }))}
              height={150}
              color={Palette.brass}
            />
          </View>
        )}

        {history !== null && entries.length === 0 && (
          <Text style={styles.empty}>No history yet. Log this exercise once and your progress will show up here.</Text>
        )}

        {newest.length > 0 && (
          <View style={styles.list}>
            {newest.map((item, i) => {
              const prev = newest[i + 1];
              const diff = prev ? metric(item) - metric(prev) : 0;
              return (
                <View key={item.date} style={[styles.row, i > 0 && styles.divider]}>
                  <Text style={styles.date}>{fmtDate(item.date)}</Text>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowValue}>{setsSummary(item.sets)}</Text>
                    <Text style={styles.rowSub}>
                      {item.sets.length} set{item.sets.length === 1 ? '' : 's'} · {item.totalReps} reps{item.volumeKg > 0 ? ` · ${formatNumber(Math.round(item.volumeKg))} kg volume` : ''}
                    </Text>
                  </View>
                  {!!prev && diff !== 0 && (
                    <Text style={[styles.delta, { color: diff > 0 ? Palette.success : Palette.textDim }]}>
                      {diff > 0 ? '+' : ''}{weighted ? fmtKg(diff) : diff} {unit}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll:   { flexShrink: 1 },
  body:     { gap: Spacing.lg, paddingBottom: Spacing.md },
  label:    { ...Type.label, color: Palette.textSub },
  stats:    { flexDirection: 'row', gap: Spacing.md },
  stat:     { flex: 1, gap: 4 },
  big:      { fontFamily: Fonts.numHeavy, fontSize: 28, color: Palette.text },
  bigUnit:  { fontFamily: Fonts.num, fontSize: 13, color: Palette.textSub },
  chartCard:{ backgroundColor: Palette.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft, padding: Spacing.md + 2, gap: Spacing.sm },
  empty:    { ...Type.body, color: Palette.textSub },
  list:     { backgroundColor: Palette.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.lineSoft, paddingHorizontal: Spacing.md + 2 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  divider:  { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  date:     { ...Type.small, color: Palette.textSub, width: 40 },
  rowMain:  { flex: 1, gap: 2 },
  rowValue: { fontFamily: Fonts.num, fontSize: 16, color: Palette.text },
  rowSub:   { ...Type.small, color: Palette.textSub },
  delta:    { fontFamily: Fonts.num, fontSize: 14 },
});
