import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import Card from '../components/ui/Card';
import PrimaryButton from '../components/ui/PrimaryButton';
import Skeleton from '../components/Skeleton';
import FadeInView from '../components/FadeInView';
import AnimatedPressable from '../components/AnimatedPressable';
import FormError from '../components/auth/FormError';
import BodyInfoSheet from '../components/body/BodyInfoSheet';
import MeasurementsSheet from '../components/body/MeasurementsSheet';
import { MEASUREMENTS, categoryColor } from '../constants/body';
import { apiError } from '../utils/apiError';
import { formatNumber } from '../utils/format';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { tap } from '../utils/haptics';

const NEED_LABEL = { sex: 'your sex (in Profile)', waist: 'waist', neck: 'neck', hip: 'hips' };

function signed(n, digits = 0) {
  if (n == null) return '—';
  const v = digits ? Math.abs(n).toFixed(digits) : formatNumber(Math.abs(Math.round(n)));
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${v}`;
}

function fmtDay(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function listNeeds(needs) {
  const words = needs.map(n => NEED_LABEL[n] ?? n);
  return words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

// Body numbers: composition, energy, weekly pace and tape measurements,
// each with an ⓘ that explains what it means.
export default function BodyScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(null);
  const [measuring, setMeasuring] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/body');
      setData(res.data);
      setError('');
    } catch (err) {
      setError(apiError(err, "Couldn't load your body numbers."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function openInfo(key) { tap(); setInfo(key); }

  const d = data || {};
  const needs = d.bodyFatNeeds || [];
  const tape = d.measurements || {};
  const hasTape = Object.keys(tape).length > 0;

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.textSub} colors={[Palette.brass]} progressBackgroundColor={Palette.surface2} />}
      >
        <FormError message={error} />

        {/* Composition */}
        <FadeInView index={0}>
          <Text style={styles.section}>Composition</Text>
          <View style={styles.tiles}>
            <Metric loading={loading} label="BMI" value={d.bmi?.toFixed(1)} tag={d.bmiCategory} onInfo={() => openInfo('bmi')} />
            <Metric loading={loading} label="Body fat" value={d.bodyFatPct?.toFixed(1)} unit="%" tag={d.bodyFatCategory} onInfo={() => openInfo('bodyFat')} />
            <Metric loading={loading} label="Lean mass" value={d.leanMassKg?.toFixed(1)} unit="kg" onInfo={() => openInfo('leanMass')} />
            <Metric loading={loading} label="Fat mass" value={d.fatMassKg?.toFixed(1)} unit="kg" onInfo={() => openInfo('fatMass')} />
            <Metric loading={loading} label="Waist ÷ height" value={d.waistToHeight?.toFixed(2)} tag={d.waistToHeightCategory} onInfo={() => openInfo('waistToHeight')} />
            <Metric loading={loading} label="Waist ÷ hip" value={d.waistToHip?.toFixed(2)} tag={d.waistToHipCategory} onInfo={() => openInfo('waistToHip')} />
          </View>
        </FadeInView>

        {!loading && needs.length > 0 && (
          <FadeInView index={1}>
            <AnimatedPressable scaleTo={0.98} onPress={() => { tap(); setMeasuring(true); }} style={styles.prompt} accessibilityRole="button">
              <View style={styles.promptIcon}><Ionicons name="resize-outline" size={18} color={Palette.carbs} /></View>
              <View style={styles.flex1}>
                <Text style={styles.promptTitle}>Unlock body fat %</Text>
                <Text style={styles.promptText}>Add your {listNeeds(needs)}. A tape measure is all you need.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Palette.textDim} />
            </AnimatedPressable>
          </FadeInView>
        )}

        {/* Energy */}
        <FadeInView index={2}>
          <Card>
            <Text style={styles.label}>Energy · per day</Text>
            {loading ? <Skeleton height={140} radius={Radius.md} style={{ marginTop: Spacing.md }} /> : (
              <View style={styles.rows}>
                <Row label="BMR" hint="At complete rest" value={d.bmr != null ? formatNumber(d.bmr) : '—'} unit="kcal" onInfo={() => openInfo('bmr')} />
                <Row label="TDEE" hint="With your activity" value={d.tdee != null ? formatNumber(d.tdee) : '—'} unit="kcal" onInfo={() => openInfo('tdee')} />
                <Row label="Your target" hint="What Food counts toward" value={d.calorieGoal != null ? formatNumber(d.calorieGoal) : '—'} unit="kcal" />
                <Row
                  last
                  label={d.calorieBalance > 50 ? 'Surplus' : d.calorieBalance < -50 ? 'Deficit' : 'Balance'}
                  hint={d.calorieBalance == null ? 'Needs your age, height and weight' : Math.abs(d.calorieBalance) <= 50 ? 'Eating at maintenance' : d.calorieBalance > 0 ? 'Above TDEE: building' : 'Below TDEE: cutting'}
                  value={signed(d.calorieBalance)}
                  unit="kcal"
                  color={d.calorieBalance == null ? Palette.text : d.calorieBalance > 50 ? Palette.success : d.calorieBalance < -50 ? Palette.kcal : Palette.text}
                  onInfo={() => openInfo('balance')}
                />
              </View>
            )}
          </Card>
        </FadeInView>

        {/* Pace */}
        <FadeInView index={3}>
          <Card>
            <View style={styles.row}>
              <View style={styles.titleRow}>
                <Text style={styles.label}>Weekly pace · 4 weeks</Text>
                <InfoButton onPress={() => openInfo('pace')} label="Weekly pace" />
              </View>
              {!!d.paceStatus && <Tag label={d.paceStatus} />}
            </View>
            {loading ? <Skeleton height={90} radius={Radius.md} style={{ marginTop: Spacing.md }} /> : d.kgPerWeek == null ? (
              <View style={styles.empty}>
                <Ionicons name="trending-up-outline" size={26} color={Palette.textDim} />
                <Text style={styles.emptyText}>
                  {d.weighInsUsed > 0 ? 'Keep weighing in. Your pace shows once your weigh-ins span a week.' : 'Log your weight in Progress. Your pace shows once your weigh-ins span a week.'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.paceRow}>
                  <Text style={styles.big}>{signed(d.kgPerWeek, 2)}</Text>
                  <Text style={styles.bigUnit}>kg / week</Text>
                  <Text style={styles.pct}>{signed(d.pctPerWeek, 2)}% of body weight</Text>
                </View>
                <PaceBand pct={d.pctPerWeek} target={d.targetPctPerWeek} />
                <Text style={styles.note}>
                  Target for your goal: {signed(d.targetPctPerWeek?.[0], 2)}% to {signed(d.targetPctPerWeek?.[1], 2)}% a week · from {d.weighInsUsed} weigh-ins
                </Text>
              </>
            )}
          </Card>
        </FadeInView>

        {/* Measurements */}
        <FadeInView index={4}>
          <Card>
            <Text style={styles.label}>Tape measurements</Text>
            {loading ? <Skeleton height={120} radius={Radius.md} style={{ marginTop: Spacing.md }} /> : hasTape ? (
              <View style={styles.rows}>
                {MEASUREMENTS.filter(m => tape[m.key]).map((m, i, all) => {
                  const e = tape[m.key];
                  return (
                    <View key={m.key} style={[styles.tapeRow, i === all.length - 1 && styles.noLine]}>
                      <Text style={styles.tapeLabel}>{m.label}</Text>
                      <Text style={styles.tapeDate}>{fmtDay(e.date)}</Text>
                      <Text style={styles.tapeChange}>{e.change ? `${signed(e.change, 1)}` : ''}</Text>
                      <Text style={styles.tapeValue}>{e.value.toFixed(1)}<Text style={styles.unit}> cm</Text></Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="resize-outline" size={26} color={Palette.textDim} />
                <Text style={styles.emptyText}>Muscle shows on the tape before the scale. Measure every 2–4 weeks.</Text>
              </View>
            )}
          </Card>
        </FadeInView>

        <FadeInView index={5}>
          <PrimaryButton title={hasTape ? 'Update measurements' : 'Add measurements'} icon="resize-outline" onPress={() => setMeasuring(true)} />
          <Text style={styles.footer}>Estimates for tracking your own trend, not a medical diagnosis.</Text>
        </FadeInView>
      </ScrollView>

      <BodyInfoSheet infoKey={info} onClose={() => setInfo(null)} />
      <MeasurementsSheet
        visible={measuring}
        sex={d.sex}
        latest={tape}
        onClose={() => setMeasuring(false)}
        onSaved={next => { setData(next); setMeasuring(false); }}
      />
    </View>
  );
}

function InfoButton({ onPress, label }) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.85} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel={`What is ${label}?`}>
      <Ionicons name="information-circle-outline" size={16} color={Palette.textDim} />
    </AnimatedPressable>
  );
}

function Tag({ label }) {
  const color = categoryColor(label);
  return (
    <View style={[styles.tag, { borderColor: color + '55', backgroundColor: color + '14' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

function Metric({ label, value, unit, tag, onInfo, loading }) {
  return (
    <View style={styles.tile}>
      <View style={styles.row}>
        <Text style={styles.tileLabel}>{label}</Text>
        <InfoButton onPress={onInfo} label={label} />
      </View>
      {loading ? <Skeleton width={70} height={30} style={{ marginTop: 4 }} /> : (
        <Text style={[styles.tileValue, value == null && styles.dim]}>
          {value ?? '—'}{value != null && !!unit && <Text style={styles.unit}> {unit}</Text>}
        </Text>
      )}
      {!loading && (tag ? <Tag label={tag} /> : <View style={styles.tagSpace} />)}
    </View>
  );
}

function Row({ label, hint, value, unit, color = Palette.text, onInfo, last }) {
  return (
    <View style={[styles.energyRow, last && styles.noLine]}>
      <View style={styles.flex1}>
        <View style={styles.titleRow}>
          <Text style={styles.rowLabel}>{label}</Text>
          {!!onInfo && <InfoButton onPress={onInfo} label={label} />}
        </View>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      <Text style={[styles.rowValue, { color }]}>{value}<Text style={styles.unit}> {unit}</Text></Text>
    </View>
  );
}

// A track with the goal's healthy band shaded and a marker that slides to your pace.
function PaceBand({ pct, target }) {
  const [width, setWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const lo = target?.[0] ?? -0.1;
  const hi = target?.[1] ?? 0.1;
  const min = Math.min(-1.25, lo - 0.25, pct - 0.15);
  const max = Math.max(0.5, hi + 0.25, pct + 0.15);
  const at = v => ((v - min) / (max - min)) * width;
  const color = categoryColor(pct >= lo && pct <= hi ? 'On track' : 'Too fast');

  useEffect(() => {
    if (!width) return;
    slide.setValue(at(0));
    Animated.timing(slide, { toValue: at(pct), duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [width, pct]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.band} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.track} />
      {width > 0 && (
        <>
          <View style={[styles.zone, { left: at(lo), width: Math.max(4, at(hi) - at(lo)) }]} />
          <View style={[styles.zero, { left: at(0) }]} />
          <Animated.View style={[styles.marker, { backgroundColor: color, transform: [{ translateX: Animated.add(slide, -7) }] }]} />
          <Text style={[styles.zeroLabel, { left: at(0) - 10 }]}>0</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:     { flex: 1, backgroundColor: Palette.ink },
  flex1:    { flex: 1 },
  content:  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl, gap: Spacing.md },
  section:  { ...Type.label, color: Palette.textSub, marginBottom: Spacing.sm },
  label:    { ...Type.label, color: Palette.textSub },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unit:     { fontFamily: Fonts.num, fontSize: 13, color: Palette.textSub },
  dim:      { color: Palette.textDim },
  note:     { ...Type.small, color: Palette.textDim, marginTop: Spacing.md },
  footer:   { ...Type.small, color: Palette.textDim, textAlign: 'center', marginTop: Spacing.md },

  tiles:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile:      { width: '48%', flexGrow: 1, backgroundColor: Palette.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.lineSoft, padding: Spacing.md + 2, gap: 6 },
  tileLabel: { ...Type.small, color: Palette.textSub },
  tileValue: { fontFamily: Fonts.numHeavy, fontSize: 30, lineHeight: 32, color: Palette.text },
  tag:       { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.pill, borderWidth: 1 },
  tagText:   { fontFamily: Fonts.bodyBold, fontSize: 11 },
  tagSpace:  { height: 20 },

  prompt:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md + 2, borderRadius: Radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: Palette.carbs + '66', backgroundColor: Palette.carbs + '0D' },
  promptIcon:  { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.carbs + '1F' },
  promptTitle: { ...Type.bodyB, color: Palette.text },
  promptText:  { ...Type.small, color: Palette.textSub, marginTop: 2 },

  rows:      { marginTop: Spacing.sm },
  energyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Palette.lineSoft },
  noLine:    { borderBottomWidth: 0, paddingBottom: 0 },
  rowLabel:  { ...Type.bodyB, color: Palette.text },
  rowHint:   { ...Type.small, color: Palette.textSub, marginTop: 1 },
  rowValue:  { fontFamily: Fonts.num, fontSize: 22, color: Palette.text },

  paceRow:   { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', columnGap: Spacing.sm, marginTop: Spacing.sm },
  big:       { fontFamily: Fonts.numHeavy, fontSize: 44, lineHeight: 46, color: Palette.text },
  bigUnit:   { fontFamily: Fonts.num, fontSize: 16, color: Palette.textSub, marginBottom: 6 },
  pct:       { ...Type.small, color: Palette.textSub, marginBottom: 7, marginLeft: 'auto' },
  band:      { height: 34, marginTop: Spacing.lg, justifyContent: 'center' },
  track:     { position: 'absolute', left: 0, right: 0, top: 10, height: 6, borderRadius: 3, backgroundColor: Palette.track },
  zone:      { position: 'absolute', top: 10, height: 6, borderRadius: 3, backgroundColor: Palette.success + '88' },
  zero:      { position: 'absolute', top: 6, width: 1, height: 14, backgroundColor: Palette.textDim },
  zeroLabel: { position: 'absolute', top: 22, width: 20, textAlign: 'center', ...Type.small, fontSize: 10, color: Palette.textDim },
  marker:    { position: 'absolute', left: 0, top: 6, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Palette.ink },

  empty:     { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  emptyText: { ...Type.small, color: Palette.textSub, textAlign: 'center', maxWidth: 260 },

  tapeRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Palette.lineSoft },
  tapeLabel:  { ...Type.bodyB, color: Palette.text, flex: 1 },
  tapeDate:   { ...Type.small, color: Palette.textDim },
  tapeChange: { fontFamily: Fonts.num, fontSize: 14, color: Palette.textSub, width: 44, textAlign: 'right' },
  tapeValue:  { fontFamily: Fonts.num, fontSize: 18, color: Palette.text, width: 76, textAlign: 'right' },
});
