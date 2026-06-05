import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, KeyboardAvoidingView,
  Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import client from '../api/client';

const TABS = ['Chat', 'Meal Plan', 'Insights'];

// ── Mock responses (used until Flask + Ollama are running) ──────────────────
const MOCK_CHAT = "Great question! For building strength, focus on compound movements like squats, deadlifts, and bench press. Aim for 3-5 sets of 3-6 reps with 80-85% of your 1RM. Rest 2-3 minutes between sets. Progressive overload is key — add 2.5kg when you can complete all reps cleanly.";

const MOCK_MEAL_PLAN = `**Breakfast (7:30 AM)**
Dal Paratha × 2 + curd (1 bowl)
~520 kcal | P: 18g | C: 72g | F: 16g

**Mid-Morning Snack (10:30 AM)**
Boiled chana (1 cup) + green chutney
~180 kcal | P: 10g | C: 28g | F: 3g

**Lunch (1:00 PM)**
Rajma chawal (1 cup rajma + 1.5 cup rice) + salad
~580 kcal | P: 22g | C: 96g | F: 8g

**Evening Snack (4:30 PM)**
Paneer bhurji (100g) + 1 multigrain roti
~310 kcal | P: 18g | C: 24g | F: 14g

**Dinner (8:00 PM)**
Palak dal (1 bowl) + 2 jowar rotis + sabzi
~420 kcal | P: 20g | C: 58g | F: 10g

**Total ~2010 kcal | P: 88g | C: 278g | F: 51g**`;

const MOCK_INSIGHTS = `**1. Consistency is your superpower** 🔥
You've logged habits on 18 of the last 30 days (60%). Push to 21+ days this month — that's the threshold where habits become automatic.

**2. Protein gap** 💪
Your average protein intake is tracking ~20g below your daily target. Add one high-protein snack (paneer, eggs, or dal) to close the gap without changing your full meal structure.

**3. Recovery is being skipped** 😴
Your Recovery attribute is lowest at 12/100. Try logging sleep tonight and adding a 5-minute breathing habit. Small recovery actions compound fast.`;

// ── Chat Tab ────────────────────────────────────────────────────────────────
function ChatTab() {
  const [messages, setMessages] = useState([
    { id: 0, role: 'ai', text: 'Hey! I\'m your Aroha fitness coach. Ask me anything — workouts, form tips, motivation.' },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const listRef               = useRef(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);

    setLoading(true);
    try {
      const { data } = await client.post('/ai/chat', { message: text });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: MOCK_CHAT }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => String(m.id)}
        contentContainerStyle={styles.chatList}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
            <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>
              {item.text}
            </Text>
          </View>
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />
      {loading && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={Colors.accentGold} />
          <Text style={styles.typingText}>thinking...</Text>
        </View>
      )}
      <View style={styles.chatInputRow}>
        <TextInput
          style={styles.chatInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your fitness coach..."
          placeholderTextColor={Colors.textMuted}
          multiline
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={loading} activeOpacity={0.8}>
          <Ionicons name="send" size={18} color={Colors.background} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Meal Plan Tab ────────────────────────────────────────────────────────────
function MealPlanTab() {
  const [plan, setPlan]       = useState('');
  const [loading, setLoading] = useState(false);
  const [calories, setCalories] = useState('2000');
  const [goal, setGoal]         = useState('stay_fit');

  const GOALS = [
    { key: 'lose_weight', label: 'Lose Weight' },
    { key: 'gain_muscle', label: 'Gain Muscle' },
    { key: 'stay_fit',    label: 'Stay Fit' },
  ];

  async function generate() {
    setLoading(true);
    setPlan('');
    try {
      const { data } = await client.post('/ai/meal-plan', {
        calories: parseInt(calories) || 2000,
        goal,
        region: 'Indian',
      });
      setPlan(data.mealPlan);
    } catch {
      setPlan(MOCK_MEAL_PLAN);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.tabScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.tabSectionLabel}>Daily Calorie Target</Text>
      <TextInput
        style={styles.mealInput}
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric"
        placeholder="e.g. 2000"
        placeholderTextColor={Colors.textMuted}
      />

      <Text style={styles.tabSectionLabel}>Goal</Text>
      <View style={styles.goalRow}>
        {GOALS.map(g => (
          <TouchableOpacity
            key={g.key}
            style={[styles.goalChip, goal === g.key && styles.goalChipActive]}
            onPress={() => setGoal(g.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.goalChipText, goal === g.key && styles.goalChipTextActive]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.generateBtn} onPress={generate} disabled={loading} activeOpacity={0.8}>
        {loading
          ? <ActivityIndicator color={Colors.background} />
          : <>
              <Ionicons name="sparkles-outline" size={16} color={Colors.background} />
              <Text style={styles.generateBtnText}>Generate Meal Plan</Text>
            </>
        }
      </TouchableOpacity>

      {!!plan && (
        <View style={styles.resultCard}>
          <Text style={styles.resultText}>{plan}</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Insights Tab ─────────────────────────────────────────────────────────────
function InsightsTab() {
  const [insights, setInsights] = useState('');
  const [loading, setLoading]   = useState(false);

  async function analyse() {
    setLoading(true);
    setInsights('');
    try {
      const { data } = await client.post('/ai/insights', {});
      setInsights(data.insights);
    } catch {
      setInsights(MOCK_INSIGHTS);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.insightsBanner}>
        <Ionicons name="bulb-outline" size={32} color={Colors.accentGold} />
        <Text style={styles.insightsTitle}>AI Wellness Analysis</Text>
        <Text style={styles.insightsSub}>
          Aroha analyses your habits, nutrition, and consistency to surface personalised insights.
        </Text>
      </View>

      <TouchableOpacity style={styles.generateBtn} onPress={analyse} disabled={loading} activeOpacity={0.8}>
        {loading
          ? <ActivityIndicator color={Colors.background} />
          : <>
              <Ionicons name="analytics-outline" size={16} color={Colors.background} />
              <Text style={styles.generateBtnText}>Analyse My Wellness</Text>
            </>
        }
      </TouchableOpacity>

      {!!insights && (
        <View style={styles.resultCard}>
          <Text style={styles.resultText}>{insights}</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Main AiScreen ─────────────────────────────────────────────────────────────
export default function AiScreen({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={18} color={Colors.accentGold} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>Aroha AI</Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={Colors.textSub} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 0 && <ChatTab />}
        {activeTab === 1 && <MealPlanTab />}
        {activeTab === 2 && <InsightsTab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },

  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.accentGold },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.accentGold },

  // Chat
  chatList:    { padding: 16, paddingBottom: 8 },
  bubble:      { maxWidth: '82%', borderRadius: 16, padding: 12, marginBottom: 10 },
  bubbleAi:    { backgroundColor: Colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleUser:  { backgroundColor: Colors.accentGold, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText:  { fontSize: 14, color: Colors.text, lineHeight: 20 },
  bubbleTextUser: { color: Colors.background },
  typingRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 8 },
  typingText:  { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },
  chatInputRow:{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  chatInput:   { flex: 1, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 16, paddingVertical: 10, color: Colors.text, fontSize: 14, maxHeight: 100 },
  sendBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accentGold, alignItems: 'center', justifyContent: 'center' },

  // Shared tab layout
  tabScroll: { flex: 1, paddingHorizontal: 20 },
  tabSectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSub, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 10 },

  // Meal Plan
  mealInput:   { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, color: Colors.text, fontSize: 15, marginBottom: 4 },
  goalRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  goalChip:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.card },
  goalChipActive: { borderColor: Colors.accentGold, backgroundColor: Colors.accentGold + '22' },
  goalChipText:   { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  goalChipTextActive: { color: Colors.accentGold },

  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accentGold, borderRadius: 14, padding: 16, marginTop: 20 },
  generateBtnText: { fontSize: 15, fontWeight: '800', color: Colors.background },

  resultCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, padding: 16, marginTop: 16 },
  resultText: { fontSize: 14, color: Colors.text, lineHeight: 22 },

  // Insights
  insightsBanner: { alignItems: 'center', paddingVertical: 28 },
  insightsTitle:  { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 12, marginBottom: 8 },
  insightsSub:    { fontSize: 14, color: Colors.textSub, textAlign: 'center', lineHeight: 20 },
});
