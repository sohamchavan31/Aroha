import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Palette } from '../../constants/theme';

// Segmented progress bar (scoreboard style). progress is 0–1;
// the segment the value falls inside is filled partially.
export default function SegmentBar({ progress = 0, segments = 10, color = Palette.brass, height = 6, style }) {
  const filled = Math.max(0, Math.min(progress, 1)) * segments;
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: segments }, (_, i) => {
        const amount = Math.max(0, Math.min(filled - i, 1));
        return (
          <View key={i} style={[styles.seg, { height, borderRadius: height / 2 }]}>
            {amount > 0 && <View style={[styles.fill, { width: `${amount * 100}%`, backgroundColor: color }]} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row:  { flexDirection: 'row', gap: 4 },
  seg:  { flex: 1, backgroundColor: Palette.track, overflow: 'hidden' },
  fill: { height: '100%' },
});
