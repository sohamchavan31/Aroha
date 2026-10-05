import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, FlatList, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import IconButton from '../components/ui/IconButton';
import PrimaryButton from '../components/ui/PrimaryButton';
import Segmented from '../components/ui/Segmented';
import Stepper from '../components/ui/Stepper';
import AnimatedPressable from '../components/AnimatedPressable';
import RichText, { splitSections, parseMacros } from '../components/ai/RichText';
import { ALL_GOALS } from '../constants/profile';
import { Palette, Fonts, Type, Spacing, Radius } from '../constants/theme';
import { tap, success } from '../utils/haptics';

const TABS = [
  { key: 'chat',     label: 'Coach',     icon: 'chatbubble-ellipses-outline' },
  { key: 'meal',     label: 'Meal plan', icon: 'restaurant-outline' },
  { key: 'insights', label: 'Insights',  icon: 'bulb-outline' },
];

const SUGGESTIONS = [
  'High-protein veg breakfast ideas',
  'How do I fix my squat form?',
  'Should I train or rest today?',
  'Cheap protein sources in India',
];

const MEAL_GOALS = ['lose_weight', 'gain_muscle', 'maintain', 'general_fitness'];

// ── Samples shown when the AI service can't be reached ─────────────────────
const MOCK_CHAT = "For strength, build around compound lifts: squats, deadlifts and bench press. Aim for **3–5 sets of 3–6 reps** at about 80–85% of your max and rest 2–3 minutes between sets.\n\nProgressive overload is the key: add **2.5 kg** when you finish every rep with clean form.";

const MOCK_MEAL_PLAN = `**Breakfast (7:30 AM)**
Dal paratha × 2 + curd (1 bowl)
~520 kcal | P: 18g | C: 72g | F: 16g

**Mid-morning (10:30 AM)**
Boiled chana (1 cup) + green chutney
~180 kcal | P: 10g | C: 28g | F: 3g

**Lunch (1:00 PM)**
Rajma chawal (1 cup rajma + 1.5 cup rice) + salad
~580 kcal | P: 22g | C: 96g | F: 8g

**Evening snack (4:30 PM)**
Paneer bhurji (100 g) + 1 multigrain roti
~310 kcal | P: 18g | C: 24g | F: 14g

**Dinner (8:00 PM)**
Palak dal (1 bowl) + 2 jowar rotis + sabzi
~420 kcal | P: 20g | C: 58g | F: 10g

**Total ~2010 kcal | P: 88g | C: 278g | F: 51g**`;

const MOCK_INSIGHTS = `**1. Consistency is your superpower** 🔥
You've logged habits on 18 of the last 30 days (60%). Push to 21+ days this month. That's where habits start to feel automatic.

**2. Protein gap** 💪
Your protein is running about 20 g below target. One high-protein snack (paneer, eggs or dal) closes the gap without changing your meals.

**3. Recovery is being skipped** 😴
Recovery is your lowest attribute. Log sleep tonight and add a 5-minute breathing habit. Small recovery actions add up fast.`;

const GREETING = { id: 0, role: 'ai', text: "Hi, I'm your Aroha coach. Ask me about workouts, form, food or motivation." };

// ── Shared bits ─────────────────────────────────────────────────────────────
function OfflineNote({ text = 'AI is offline. Showing a sample.' }) {
  return (
    <View style={styles.offline}>
      <Ionicons name="cloud-offline-outline" size={13} color={Palette.kcal} />
      <Text style={styles.offlineText}>{text}</Text>
    </View>
  );
}

function TypingDots() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <View style={[styles.bubble, styles.bubbleAi, styles.typing]}>
      {[0, 1, 2].map(i => (
        <Animated.View
          key={i}
          style={[styles.dot, {
            opacity: v.interpolate({
              inputRange: [0, 0.2 + i * 0.2, 0.4 + i * 0.2, 1],
              outputRange: [0.25, 1, 0.25, 0.25],
              extrapolate: 'clamp',
            }),
          }]}
        />
      ))}
    </View>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
      {Array.from({ length: rows }, (_, i) => (
        <Card key={i} style={{ gap: Spacing.sm }}>
          <View style={[styles.skel, { width: '45%' }]} />
          <View style={[styles.skel, { width: '90%' }]} />
          <View style={[styles.skel, { width: '70%' }]} />
        </Card>
      ))}
    </View>
  );
}

// ── Coach (chat) ────────────────────────────────────────────────────────────
function ChatTab({ messages, setMessages }) {
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const listRef               = useRef(null);

  async function send(raw) {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    tap();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }]);
    setLoading(true);
    try {
      const { data } = await client.post('/ai/chat', { message: text });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: MOCK_CHAT, sample: true }]);
    } finally {
      setLoading(false);
    }
  }

  const canSend = !!input.trim() && !loading;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={60}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => String(m.id)}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => item.role === 'user' ? (
          <View style={[styles.bubble, styles.bubbleUser]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        ) : (
          <View style={styles.aiRow}>
            <View style={styles.avatar}><Ionicons name="sparkles" size={12} color={Palette.violet} /></View>
            <View style={styles.aiCol}>
              <View style={[styles.bubble, styles.bubbleAi]}>
                <RichText text={item.text} style={styles.bubbleText} />
              </View>
              {item.sample && <OfflineNote />}
            </View>
          </View>
        )}
        ListFooterComponent={
          <>
            {loading && <View style={styles.aiRow}><View style={styles.avatar}><Ionicons name="sparkles" size={12} color={Palette.violet} /></View><TypingDots /></View>}
            {messages.length === 1 && !loading && (
              <View style={styles.suggest}>
                <Text style={styles.label}>Try asking</Text>
                {SUGGESTIONS.map(s => (
                  <AnimatedPressable key={s} scaleTo={0.98} onPress={() => send(s)} style={styles.suggestRow}>
                    <Text style={styles.suggestText}>{s}</Text>
                    <Ionicons name="arrow-up-outline" size={14} color={Palette.textDim} style={styles.suggestIcon} />
                  </AnimatedPressable>
                ))}
              </View>
            )}
          </>
        }
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your coach…"
          placeholderTextColor={Palette.textDim}
          selectionColor={Palette.brass}
          cursorColor={Palette.text}
          multiline
          maxLength={1000}
          accessibilityLabel="Message"
        />
        <AnimatedPressable
          scaleTo={0.9}
          onPress={() => send()}
          disabled={!canSend}
          style={[styles.sendBtn, !canSend && styles.sendBtnOff]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Ionicons name="arrow-up" size={18} color={canSend ? Palette.onIvory : Palette.textDim} />
        </AnimatedPressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Meal plan ───────────────────────────────────────────────────────────────
function MealCard({ section }) {
  const time = section.title.match(/\(([^)]+)\)\s*$/);
  const name = section.title.replace(/\s*\([^)]*\)\s*$/, '');
  const macroLine = section.lines.find(l => parseMacros(l));
  const m = macroLine ? parseMacros(macroLine) : null;
  const foods = section.lines.filter(l => l !== macroLine);
  return (
    <Card style={styles.meal}>
      <View style={styles.mealHead}>
        <View style={styles.flex}>
          <Text style={styles.mealName}>{name}</Text>
          {!!time && <Text style={styles.mealTime}>{time[1]}</Text>}
        </View>
        {m && (
          <View style={styles.kcalBox}>
            <Text style={styles.kcalNum}>{m.kcal}</Text>
            <Text style={styles.kcalUnit}>kcal</Text>
          </View>
        )}
      </View>
      {foods.map((f, i) => <RichText key={i} text={f.replace(/^[-*•]\s*/, '')} style={styles.mealFood} />)}
      {m && (
        <View style={styles.macroRow}>
          {[['P', m.p, Palette.protein], ['C', m.c, Palette.carbs], ['F', m.f, Palette.fat]].map(([k, v, c]) => v != null && (
            <View key={k} style={styles.macroPill}>
              <View style={[styles.macroDot, { backgroundColor: c }]} />
              <Text style={styles.macroText}>{k} <Text style={styles.macroNum}>{v}g</Text></Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function MealPlanTab({ profile, state, setState }) {
  const { plan, sample, calories, goal } = state;
  const [loading, setLoading] = useState(false);
  const set = patch => setState(s => ({ ...s, ...patch }));

  async function generate() {
    setLoading(true);
    set({ plan: '', sample: false });
    try {
      const { data } = await client.post('/ai/meal-plan', {
        calories,
        protein: profile?.dailyProteinGoal || undefined,
        carbs:   profile?.dailyCarbGoal || undefined,
        fat:     profile?.dailyFatGoal || undefined,
        goal,
        region: 'Indian',
      });
      set({ plan: data.mealPlan || '' });
      success();
    } catch {
      set({ plan: MOCK_MEAL_PLAN, sample: true });
    } finally {
      setLoading(false);
    }
  }

  const sections = plan ? splitSections(plan) : [];
  const total = sections.find(s => /total/i.test(s.title) && parseMacros(s.title));
  const meals = sections.filter(s => s !== total && s.title);
  const t = total ? parseMacros(total.title) : null;

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Card style={{ gap: Spacing.lg }}>
        <View style={styles.row}>
          <Stepper label="Daily calories" value={calories} onChange={v => set({ calories: v })} step={50} min={1200} max={5000} unit="kcal" />
        </View>
        <View>
          <Text style={[styles.label, { marginBottom: Spacing.sm }]}>Goal</Text>
          <View style={styles.chips}>
            {MEAL_GOALS.map(k => (
              <Chip key={k} label={ALL_GOALS[k].label} capitalize={false} selected={goal === k} onPress={() => set({ goal: k })} />
            ))}
          </View>
        </View>
        <Text style={styles.hint}>Indian meals{profile?.dietaryPreference ? ` · ${String(profile.dietaryPreference).replace(/_/g, '-')}` : ''}. Macros come from your profile targets.</Text>
      </Card>

      <PrimaryButton
        title={loading ? 'Cooking up a plan…' : plan ? 'Generate again' : 'Generate meal plan'}
        icon={plan ? 'refresh' : 'sparkles'}
        onPress={loading ? undefined : generate}
        containerStyle={{ marginTop: Spacing.lg }}
      />

      {loading && <Skeleton rows={3} />}

      {!loading && !!plan && (
        <View style={{ marginTop: Spacing.xl, gap: Spacing.md }}>
          {sample && <OfflineNote />}
          {t && (
            <Card variant="hero" style={styles.total}>
              <View style={styles.flex}>
                <Text style={styles.label}>Day total</Text>
                <Text style={styles.totalNum}>{t.kcal}<Text style={styles.totalUnit}> kcal</Text></Text>
              </View>
              <View style={styles.totalMacros}>
                {[['Protein', t.p, Palette.protein], ['Carbs', t.c, Palette.carbs], ['Fat', t.f, Palette.fat]].map(([k, v, c]) => v != null && (
                  <View key={k} style={styles.totalMacro}>
                    <Text style={[styles.totalMacroNum, { color: c }]}>{v}g</Text>
                    <Text style={styles.totalMacroLabel}>{k}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}
          {meals.length > 0
            ? meals.map((s, i) => <MealCard key={i} section={s} />)
            : <Card><RichText text={plan} style={styles.plain} /></Card>}
        </View>
      )}

      {!loading && !plan && (
        <View style={styles.empty}>
          <Ionicons name="restaurant-outline" size={26} color={Palette.textDim} />
          <Text style={styles.emptyText}>Set your calories and goal, then generate a full day of Indian meals.</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Insights ────────────────────────────────────────────────────────────────
function InsightsTab({ profile, today, state, setState }) {
  const { insights, sample } = state;
  const [loading, setLoading] = useState(false);

  async function analyse() {
    setLoading(true);
    setState({ insights: '', sample: false });
    try {
      const { data } = await client.post('/ai/insights', {
        goal: profile?.healthGoal || 'general_fitness',
        nutritionSummary: today || {},
      });
      setState({ insights: data.insights || '', sample: false });
      success();
    } catch {
      setState({ insights: MOCK_INSIGHTS, sample: true });
    } finally {
      setLoading(false);
    }
  }

  const sections = insights ? splitSections(insights).filter(s => s.title || s.lines.length) : [];

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card variant="hero" style={styles.intro}>
        <View style={styles.introIcon}><Ionicons name="analytics-outline" size={20} color={Palette.violet} /></View>
        <Text style={styles.introTitle}>Your wellness, read back to you</Text>
        <Text style={styles.introSub}>Aroha looks at your habits, food and consistency and points out the few things that will move the needle most.</Text>
      </Card>

      <PrimaryButton
        title={loading ? 'Reading your data…' : insights ? 'Analyse again' : 'Analyse my wellness'}
        icon={insights ? 'refresh' : 'sparkles'}
        onPress={loading ? undefined : analyse}
        containerStyle={{ marginTop: Spacing.lg }}
      />

      {loading && <Skeleton rows={3} />}

      {!loading && sections.length > 0 && (
        <View style={{ marginTop: Spacing.xl, gap: Spacing.md }}>
          {sample && <OfflineNote />}
          {sections.map((s, i) => {
            const num = s.title.match(/^(\d+)[.)]\s*/);
            const title = s.title.replace(/^\d+[.)]\s*/, '');
            return (
              <Card key={i} style={styles.insight}>
                <View style={styles.insightNum}>
                  <Text style={styles.insightNumText}>{num ? num[1] : i + 1}</Text>
                </View>
                <View style={styles.flex}>
                  {!!title && <Text style={styles.insightTitle}>{title}{s.tail ? `  ${s.tail}` : ''}</Text>}
                  {s.lines.length > 0 && <RichText text={s.lines.join('\n')} style={styles.insightBody} />}
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────
export default function AiScreen({ visible, onClose }) {
  const [tab, setTab]           = useState('chat');
  const [profile, setProfile]   = useState(null);
  const [today, setToday]       = useState(null);
  const [messages, setMessages] = useState([GREETING]);
  const [meal, setMeal]         = useState({ plan: '', sample: false, calories: 2000, goal: 'general_fitness' });
  const [insights, setInsights] = useState({ insights: '', sample: false });

  useEffect(() => {
    if (!visible) return;
    client.get('/profile').then(({ data }) => {
      setProfile(data);
      setMeal(m => m.plan ? m : {
        ...m,
        calories: data?.dailyCalorieGoal || m.calories,
        goal: MEAL_GOALS.includes(data?.healthGoal) ? data.healthGoal : m.goal,
      });
    }).catch(() => {});
    client.get('/logs/today').then(({ data }) => setToday({
      calories: data.totalCalories || 0,
      protein:  data.totalProtein || 0,
      carbs:    data.totalCarbs || 0,
      fat:      data.totalFat || 0,
    })).catch(() => {});
  }, [visible]);

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.ink} />

      <View style={styles.header}>
        <View style={styles.headerMark}><Ionicons name="sparkles" size={16} color={Palette.violet} /></View>
        <View style={styles.flex}>
          <Text style={styles.headerTitle}>Aroha AI</Text>
          <Text style={styles.headerSub}>Coach · meals · insights</Text>
        </View>
        <IconButton name="close" onPress={onClose} accessibilityLabel="Close Aroha AI" />
      </View>

      <Segmented options={TABS} value={tab} onChange={setTab} style={styles.tabs} />

      <View style={styles.flex}>
        {tab === 'chat'     && <ChatTab messages={messages} setMessages={setMessages} />}
        {tab === 'meal'     && <MealPlanTab profile={profile} state={meal} setState={setMeal} />}
        {tab === 'insights' && <InsightsTab profile={profile} today={today} state={insights} setState={setInsights} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Palette.ink },
  flex:  { flex: 1 },
  row:   { flexDirection: 'row' },
  label: { ...Type.label, color: Palette.textSub },
  hint:  { ...Type.small, color: Palette.textDim },

  header:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerMark:  { width: 38, height: 38, borderRadius: Radius.md - 2, backgroundColor: Palette.violet + '1F', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.display, fontSize: 17, color: Palette.text },
  headerSub:   { ...Type.small, color: Palette.textSub, marginTop: 1 },
  tabs:        { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },

  tabContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl + Spacing.lg },

  // Chat
  chatList:   { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.md },
  aiRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  aiCol:      { flexShrink: 1, maxWidth: '86%', gap: 6 },
  avatar:     { width: 24, height: 24, borderRadius: 12, backgroundColor: Palette.violet + '1F', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  bubble:     { borderRadius: Radius.lg - 2, paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.md - 2 },
  bubbleAi:   { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.lineSoft, borderBottomLeftRadius: 6 },
  bubbleUser: { alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.violet + '40', borderBottomRightRadius: 6 },
  bubbleText: { ...Type.body, fontSize: 14, lineHeight: 21, color: Palette.text },
  typing:     { flexDirection: 'row', gap: 5, paddingVertical: Spacing.md + 2 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.textSub },

  suggest:     { marginTop: Spacing.lg, gap: Spacing.sm },
  suggestRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.lineSoft, borderRadius: Radius.md, paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.md },
  suggestText: { ...Type.body, fontSize: 14, color: Palette.text, flex: 1 },
  suggestIcon: { transform: [{ rotate: '45deg' }] },

  composer:      { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, borderTopWidth: 1, borderTopColor: Palette.lineSoft, backgroundColor: Palette.ink },
  composerInput: { flex: 1, minWidth: 0, backgroundColor: Palette.surface2, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.lineSoft, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md - 1, paddingBottom: Spacing.md - 1, fontFamily: Fonts.bodySemi, fontSize: 15, color: Palette.text, maxHeight: 120 },
  sendBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.ivory, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff:    { backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.lineSoft },

  offline:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: Spacing.sm + 2, paddingVertical: 4, borderRadius: Radius.pill, backgroundColor: 'rgba(245,165,36,0.08)', borderWidth: 1, borderColor: 'rgba(245,165,36,0.22)' },
  offlineText: { ...Type.small, fontSize: 11, color: Palette.kcal },

  skel: { height: 10, borderRadius: 5, backgroundColor: Palette.track },

  // Meal plan
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  meal:     { gap: Spacing.sm },
  mealHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: 2 },
  mealName: { fontFamily: Fonts.bodyHeavy, fontSize: 15, color: Palette.text },
  mealTime: { ...Type.small, color: Palette.textSub, marginTop: 2 },
  kcalBox:  { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  kcalNum:  { fontFamily: Fonts.numHeavy, fontSize: 24, color: Palette.kcal },
  kcalUnit: { fontFamily: Fonts.bodySemi, fontSize: 11, color: Palette.textSub },
  mealFood: { ...Type.body, fontSize: 14, lineHeight: 20, color: Palette.textSub },
  macroRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  macroPill:{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.surface2, borderRadius: Radius.pill, paddingHorizontal: Spacing.sm + 2, paddingVertical: 4 },
  macroDot: { width: 6, height: 6, borderRadius: 3 },
  macroText:{ fontFamily: Fonts.bodySemi, fontSize: 11, color: Palette.textSub },
  macroNum: { fontFamily: Fonts.num, fontSize: 13, color: Palette.text },
  plain:    { ...Type.body, fontSize: 14, lineHeight: 21, color: Palette.text },

  total:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  totalNum:       { fontFamily: Fonts.numHeavy, fontSize: 34, color: Palette.text, marginTop: 2 },
  totalUnit:      { fontFamily: Fonts.bodySemi, fontSize: 13, color: Palette.textSub },
  totalMacros:    { flexDirection: 'row', gap: Spacing.lg },
  totalMacro:     { alignItems: 'center' },
  totalMacroNum:  { fontFamily: Fonts.numHeavy, fontSize: 20 },
  totalMacroLabel:{ ...Type.small, fontSize: 11, color: Palette.textSub },

  empty:     { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyText: { ...Type.body, fontSize: 14, color: Palette.textSub, textAlign: 'center', lineHeight: 20 },

  // Insights
  intro:          { gap: Spacing.sm },
  introIcon:      { width: 40, height: 40, borderRadius: Radius.md - 2, backgroundColor: Palette.violet + '1F', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  introTitle:     { fontFamily: Fonts.display, fontSize: 17, lineHeight: 24, color: Palette.text },
  introSub:       { ...Type.body, fontSize: 14, lineHeight: 20, color: Palette.textSub },
  insight:        { flexDirection: 'row', gap: Spacing.md },
  insightNum:     { width: 28, height: 28, borderRadius: 14, backgroundColor: Palette.surface2, borderWidth: 1, borderColor: Palette.line, alignItems: 'center', justifyContent: 'center' },
  insightNumText: { fontFamily: Fonts.numHeavy, fontSize: 15, color: Palette.text },
  insightTitle:   { fontFamily: Fonts.bodyHeavy, fontSize: 15, color: Palette.text, marginBottom: 4 },
  insightBody:    { ...Type.body, fontSize: 14, lineHeight: 21, color: Palette.textSub },
});
