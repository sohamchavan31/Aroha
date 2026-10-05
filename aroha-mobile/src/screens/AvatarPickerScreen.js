import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '../components/ui/Sheet';
import Avatar from '../components/Avatar';
import AnimatedPressable from '../components/AnimatedPressable';
import { AVATAR_OPTIONS } from '../constants/avatars';
import { Palette, Spacing } from '../constants/theme';
import { tap } from '../utils/haptics';

// Preset avatar grid in a bottom sheet. Tapping one selects it and closes.
export default function AvatarPickerScreen({ visible, selectedKey, onClose, onSelect }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Choose your avatar" subtitle="Shown on Home and in your profile" showClose>
      <View style={styles.grid}>
        {AVATAR_OPTIONS.map(option => {
          const selected = option.key === selectedKey;
          return (
            <AnimatedPressable
              key={option.key}
              containerStyle={styles.cell}
              style={[styles.ring, selected && styles.ringOn]}
              scaleTo={0.9}
              onPress={() => { tap(); onSelect(option.key); }}
              accessibilityRole="button"
              accessibilityLabel={`Avatar ${option.key}`}
              accessibilityState={{ selected }}
            >
              <Avatar avatarKey={option.key} size={60} style={styles.avatar} />
              {selected && (
                <View style={styles.check}>
                  <Ionicons name="checkmark" size={12} color={Palette.onIvory} />
                </View>
              )}
            </AnimatedPressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid:   { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.lg, paddingBottom: Spacing.sm },
  cell:   { width: '25%', alignItems: 'center' },
  ring:   { padding: 3, borderRadius: 40, borderWidth: 2, borderColor: 'transparent' },
  ringOn: { borderColor: Palette.ivory },
  avatar: { borderWidth: 0 },
  check:  {
    position: 'absolute', right: -2, bottom: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Palette.ivory, borderWidth: 2, borderColor: Palette.surface,
    alignItems: 'center', justifyContent: 'center',
  },
});
