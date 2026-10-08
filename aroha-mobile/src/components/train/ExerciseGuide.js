import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MuscleMap from './MuscleMap';
import AnimatedPressable from '../AnimatedPressable';
import { guideFor } from '../../constants/exerciseGuide';
import { Palette, Fonts, Type, Spacing, Radius } from '../../constants/theme';
import { tap } from '../../utils/haptics';

// Compact "feel it in" row that opens into the body map and form cues.
export default function ExerciseGuide({ exercise, style }) {
  const [open, setOpen] = useState(false);
  const guide = guideFor(exercise);
  if (!guide) return null;

  return (
    <View style={[styles.box, style]}>
      <AnimatedPressable
        onPress={() => { tap(); setOpen(o => !o); }}
        scaleTo={0.98}
        style={styles.head}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`How to do it. Feel it in: ${guide.feel}`}
      >
        {!open && <MuscleMap primary={guide.primary} secondary={guide.secondary} height={44} labels={false} />}
        <View style={styles.headText}>
          <Text style={styles.label}>Feel it in</Text>
          <Text style={styles.feel} numberOfLines={2}>{guide.feel}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Palette.textSub} />
      </AnimatedPressable>

      {open && (
        <View style={styles.body}>
          <MuscleMap primary={guide.primary} secondary={guide.secondary} height={160} />
          {guide.cues.map((c, i) => (
            <View key={i} style={styles.cue}>
              <Text style={styles.cueNum}>{i + 1}</Text>
              <Text style={styles.cueText}>{c}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box:      { borderRadius: Radius.md, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.lineSoft },
  head:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  headText: { flex: 1 },
  label:    { ...Type.label, color: Palette.textSub },
  feel:     { ...Type.bodyB, color: Palette.text, marginTop: 2 },
  body:     { gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  cue:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  cueNum:   { width: 20, height: 20, borderRadius: 10, textAlign: 'center', lineHeight: 20, fontFamily: Fonts.num, fontSize: 12, color: Palette.text, backgroundColor: Palette.surface, overflow: 'hidden' },
  cueText:  { ...Type.body, color: Palette.text, flex: 1 },
});
