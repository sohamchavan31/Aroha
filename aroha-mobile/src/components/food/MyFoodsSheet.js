import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '../ui/Sheet';
import AnimatedPressable from '../AnimatedPressable';
import client from '../../api/client';
import { apiError } from '../../utils/apiError';
import { Palette, Fonts, Type, Spacing, Radius } from '../../constants/theme';
import { tap, warn } from '../../utils/haptics';

// The foods this user added: packaged foods from a label and their recipes.
// Tap one to log it; edit or delete from the row.
export default function MyFoodsSheet({ visible, onClose, onLog, onEdit, onAddLabel, onAddRecipe }) {
  const [foods, setFoods]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    client.get('/meals/mine')
      .then(({ data }) => { if (!cancelled) setFoods(data || []); })
      .catch(err => { if (!cancelled) setError(apiError(err, "Couldn't load your foods.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible]);

  function confirmDelete(food) {
    tap();
    Alert.alert(
      `Delete ${food.name}?`,
      'It disappears from search. Meals you already logged with it stay in your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const before = foods;
            setFoods(f => f.filter(x => x.id !== food.id));
            try {
              await client.delete(`/meals/custom/${food.id}`);
            } catch (err) {
              warn();
              setFoods(before);
              Alert.alert("Couldn't delete", apiError(err, 'Try again in a moment.'));
            }
          },
        },
      ],
    );
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="My foods" subtitle="Foods you added from labels and your recipes" showClose>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {loading ? (
          <ActivityIndicator color={Palette.textSub} style={styles.loading} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : foods.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pricetags-outline" size={28} color={Palette.textDim} />
            <Text style={styles.emptyTitle}>No foods of your own yet</Text>
            <Text style={styles.emptyText}>
              Your brand of paneer, oats or protein powder isn't in the list? Copy its label once and it's here for good.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {foods.map((food, i) => (
              <View key={food.id} style={[styles.row, i > 0 && styles.divider]}>
                <AnimatedPressable scaleTo={0.98} onPress={() => { tap(); onLog?.(food); }} containerStyle={styles.info} accessibilityLabel={`Log ${food.brand ? food.brand + ' ' : ''}${food.name}`}>
                  <Text style={styles.name} numberOfLines={1}>{food.brand ? `${food.brand} ` : ''}{food.name}</Text>
                  <Text style={styles.meta}>
                    {food.category === 'packaged' ? 'Label' : 'Recipe'} · per 100 g: {Math.round(food.caloriesPer100g)} kcal · P {Math.round(food.proteinPer100g * 10) / 10} g
                  </Text>
                </AnimatedPressable>
                <AnimatedPressable onPress={() => { tap(); onEdit?.(food); }} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }} accessibilityLabel={`Edit ${food.name}`}>
                  <Ionicons name="create-outline" size={18} color={Palette.textSub} />
                </AnimatedPressable>
                <AnimatedPressable onPress={() => confirmDelete(food)} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }} accessibilityLabel={`Delete ${food.name}`}>
                  <Ionicons name="trash-outline" size={18} color={Palette.textDim} />
                </AnimatedPressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <AnimatedPressable scaleTo={0.97} onPress={() => { tap(); onAddLabel?.(); }} containerStyle={styles.flex} style={styles.action}>
            <Ionicons name="pricetag-outline" size={16} color={Palette.text} />
            <Text style={styles.actionText}>Add from label</Text>
          </AnimatedPressable>
          <AnimatedPressable scaleTo={0.97} onPress={() => { tap(); onAddRecipe?.(); }} containerStyle={styles.flex} style={styles.action}>
            <Ionicons name="create-outline" size={16} color={Palette.text} />
            <Text style={styles.actionText}>Create a recipe</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll:     { flexShrink: 1 },
  body:       { gap: Spacing.lg, paddingBottom: Spacing.sm },
  loading:    { paddingVertical: Spacing.xl },
  error:      { ...Type.body, color: Palette.danger, textAlign: 'center', paddingVertical: Spacing.lg },
  empty:      { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  emptyTitle: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Palette.text },
  emptyText:  { ...Type.body, color: Palette.textSub, textAlign: 'center' },
  list:       { backgroundColor: Palette.surface2, borderRadius: Radius.lg, paddingHorizontal: Spacing.md },
  row:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  divider:    { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  info:       { flex: 1, minWidth: 0 },
  name:       { fontFamily: Fonts.bodyBold, fontSize: 14, color: Palette.text },
  meta:       { ...Type.small, color: Palette.textSub, marginTop: 2 },
  actions:    { flexDirection: 'row', gap: Spacing.md },
  flex:       { flex: 1 },
  action:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.line },
  actionText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Palette.text },
});
