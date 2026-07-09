import React from 'react';
import { View, Text, StyleSheet, StatusBar, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { AVATAR_OPTIONS } from '../constants/avatars';
import Avatar from '../components/Avatar';
import AnimatedPressable from '../components/AnimatedPressable';
import FadeInView from '../components/FadeInView';

export default function AvatarPickerScreen({ visible, selectedKey, onClose, onSelect }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Avatar</Text>
          <AnimatedPressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={Colors.textSub} />
          </AnimatedPressable>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {AVATAR_OPTIONS.map((option, i) => {
              const selected = option.key === selectedKey;
              return (
                <FadeInView key={option.key} index={i} style={styles.cell}>
                  <AnimatedPressable onPress={() => onSelect(option.key)} scaleTo={0.92}>
                    <Avatar avatarKey={option.key} size={72} style={selected && styles.selectedRing} />
                    {selected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color={Colors.background} />
                      </View>
                    )}
                  </AnimatedPressable>
                </FadeInView>
              );
            })}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  cell: { width: '22%', alignItems: 'center' },
  selectedRing: { borderWidth: 3, borderColor: Colors.accentGold },
  checkBadge: {
    position: 'absolute', bottom: -2, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.accentGold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
});
