l# 🌿 Nira — Complete Build Journal
### How I built an Indian Health & Fitness App from scratch — solo, step by step.
> Written like a tutorial. Every step, every command, every mistake and fix.
> If you're reading this later, you can follow this exactly and rebuild the whole thing.

---

## 🎯 What is Nira?
Nira is a culturally rooted Indian health and fitness app. Think macros for dal-chawal,
workouts designed for home, Hindi/Marathi voice support, and a Solo Leveling inspired
daily quest system that pushes you to put the phone down and actually move.

**Solo dev. 2–4 hours a day. Grinding daily.**

---

## 🧱 Tech Stack (What we're building with)

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Mobile     | React Native (Expo)                       |
| Backend    | Java 17 + Spring Boot                     |
| AI Layer   | Python + Flask + Ollama + TFLite          |
| Database   | PostgreSQL + MongoDB                      |
| Auth       | Spring Security + JWT                     |
| Deployment | EC2 + Vercel → Docker on Proxmox (later)  |

---

# 📦 PART 1 — Setting Up the Project

## Step 1 — Create the GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name it `Nira`
3. Add a README during creation (so the repo isn't empty)
4. Copy the repo URL: `https://github.com/sohamchavan31/Nira.git`

---

## Step 2 — Clone the Repo to Your Machine

Open terminal in the folder where you want the project (we used `D:\Nira`):

```bash
git clone https://github.com/sohamchavan31/Nira.git
cd Nira
```

---

## Step 3 — Set Up Branch Strategy

We follow **GitHub Flow**. The rules are simple:
- `main` — always working, never push here directly
- `dev` — where all work gets integrated
- `feature/*` — one branch per feature, merged into dev via PR

Create and push the `dev` branch:

```bash
git checkout -b dev
git push -u origin dev
git checkout main
```

---

## Step 4 — Protect the Main Branch

This stops you from accidentally pushing broken code to main.

1. Go to your GitHub repo → **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Enable these:
   - ✅ Require a pull request before merging
   - ✅ Require at least 1 approval
   - ✅ Do not allow bypassing the above rules
5. Click **Save changes**

> 💡 Even as a solo dev, this forces you to review your own code before merging. Good habit.

---

## Step 5 — Create the Project Folder Structure

Inside `D:\Nira\Nira\`, run these commands:

```bash
mkdir nira-mobile
mkdir nira-backend
mkdir nira-ai
mkdir docs

echo. > nira-mobile\.gitkeep
echo. > nira-backend\.gitkeep
echo. > nira-ai\.gitkeep
echo. > docs\.gitkeep
```

> 💡 `.gitkeep` is an empty file that tricks Git into tracking empty folders.
> Git ignores empty folders by default — this fixes that.

Your structure now looks like:
```
Nira/
├── nira-mobile/       # React Native app will live here
├── nira-backend/      # Spring Boot API will live here
├── nira-ai/           # Python Flask AI service will live here
├── docs/              # Notes, diagrams, decisions
└── README.md
```

---

## Step 6 — Create the .gitignore File

Create a file called `.gitignore` at the root of your project.
This tells Git which files to never commit (secrets, build files, dependencies).

```gitignore
# ─── Node / React Native ───────────────────────────
node_modules/
.expo/
dist/
build/
*.lock
.env
.env.local

# ─── Java / Spring Boot ────────────────────────────
nira-backend/target/
*.class
*.jar
*.war
nira-backend/.env

# ─── Python / Flask ────────────────────────────────
__pycache__/
*.pyc
*.pyo
nira-ai/venv/
nira-ai/.env
*.egg-info/

# ─── OS & Editor ───────────────────────────────────
.DS_Store
Thumbs.db
.vscode/settings.json
.idea/

# ─── Secrets (NEVER commit these) ──────────────────
*.pem
*.key
secrets.yml
application-secret.properties
```

---

## Step 7 — First Commit to Dev

```bash
git checkout dev
git add .
git commit -m "chore: initial project scaffold — folder structure, gitignore, README"
git push origin dev
```

> 💡 We commit to `dev` directly here because we're just creating folders — no logic yet.
> Logic always goes in a `feature/*` branch.

---

# 🛠️ PART 2 — Setting Up the Development Environment

## Step 8 — Install Java 17

React Native requires Java 17. It does NOT work with Java 21 or 25 yet.

### Why Java 17?
- React Native's build tools (Gradle) are tested against Java 17
- Spring Boot 3.x works perfectly on Java 17
- Most stable choice for the whole project

### Download and Install
1. Go to [adoptium.net/temurin/releases/?version=17](https://adoptium.net/temurin/releases/?version=17)
2. Select: Version **17**, OS **Windows**, Architecture **x64**
3. Download the `.msi` installer and run it
4. Install location will be:
   ```
   C:\Users\SOHAM\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.19.10-hotspot
   ```
5. During Custom Setup screen:
   - Click the ❌ next to **"Set or override JAVA_HOME variable"**
   - Select **"Will be installed on local hard drive"**
6. If you see a registry write error → click **Ignore** (safe, we'll set it manually)

### Set JAVA_HOME Manually
Open PowerShell as Administrator and run:

```powershell
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Users\SOHAM\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.19.10-hotspot", "Machine")
```

Add Java 17 to the front of your User PATH:

```powershell
$current = [System.Environment]::GetEnvironmentVariable("PATH", "User")
[System.Environment]::SetEnvironmentVariable("PATH", "C:\Users\SOHAM\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.19.10-hotspot\bin;" + $current, "User")
```

### Problem We Hit: Java 25 kept overriding Java 17
We had Oracle Java 25 installed. Even after setting JAVA_HOME and PATH,
`java -version` kept showing Java 25. Here's how we fixed it:

**Check what java is being used:**
```powershell
Get-Command java | Select-Object -ExpandProperty Source
# Showed: C:\Program Files\Java\jdk-25.0.2\bin\java.exe
```

**Fix — rename Java 25 bin folder so it can't be found:**
```powershell
Rename-Item "C:\Program Files\Java\jdk-25.0.2\bin" "C:\Program Files\Java\jdk-25.0.2\bin_disabled"
```

> 💡 We rename instead of uninstall — keeps Java 25 safe if ever needed,
> just stops it from interfering.

### Verify Java 17 is Working
Open a fresh PowerShell window and run:

```powershell
java -version
```

Expected output:
```
openjdk version "17.0.19" 2026-04-21
OpenJDK Runtime Environment Temurin-17.0.19+10
OpenJDK 64-Bit Server VM Temurin-17.0.19+10
```
✅ Done!

---

## Step 9 — Install Android Studio

We need Android Studio to run the Android emulator and build the app.

### Download and Install
1. Go to [developer.android.com/studio](https://developer.android.com/studio)
2. Download and run the installer
3. During setup make sure these are installed:
   - ✅ Android SDK
   - ✅ SDK Platform 34
   - ✅ Android Virtual Device

### Set ANDROID_HOME Environment Variable
Open PowerShell as Administrator:

```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\SOHAM\AppData\Local\Android\Sdk", "Machine")

$current = [System.Environment]::GetEnvironmentVariable("PATH", "User")
[System.Environment]::SetEnvironmentVariable("PATH", "C:\Users\SOHAM\AppData\Local\Android\Sdk\platform-tools;" + $current, "User")
```

### Verify ADB is Working
Open a fresh PowerShell:

```powershell
where.exe adb
# Should show: C:\Users\SOHAM\AppData\Local\Android\Sdk\platform-tools\adb.exe
```
✅ Done!

---

## Step 10 — Create the Android Emulator

This is the virtual phone we'll run Nira on during development.

1. Open Android Studio
2. Click **More Actions** → **Virtual Device Manager**
3. Click **Create Device**
4. Select hardware: **Pixel 7** → Next
5. Select system image:
   - API Level: **34**
   - ABI: **x86_64**
   - Name your AVD: `Nira_Dev`
6. Click **Finish**
7. Hit the ▶️ **Play button** next to `Nira_Dev` to boot it

### What you should see:
A Pixel 7 phone screen boots up showing Android 14 home screen.

> 🔥 This is the Hunter's phone. Nira will live here during development.

✅ Emulator running — `Nira_Dev | Android 14 | API 34 | x86_64`

---

# 📱 PART 3 — React Native Mobile App

## Step 11 — Verify Node.js

Node.js is the JavaScript runtime that powers all your dev tools — Metro bundler, Expo CLI, npm. It does NOT run inside your app. It's a build tool.

Open a fresh PowerShell and run:

```powershell
node -v
npm -v
```

Expected output: `v20.x.x` and `10.x.x`. If Node isn't installed: go to **nodejs.org** and download the **LTS** version.

✅ Node verified.

---

## Step 12 — Initialize the React Native App with Expo

**Why Expo?** Without Expo you'd manually set up Android build files, Gradle configs, signing keystores, and more. Expo handles all of that. You just write screens.

Delete the placeholder file, then initialize inside `nira-mobile/`:
```powershell
Remove-Item nira-mobile\.gitkeep
cd nira-mobile
npx create-expo-app@latest . --template blank
```

When asked "Skip initializing a new git repository?" → press Enter (Yes). We already have a git repo.

What Expo creates:
```
nira-mobile/
├── App.js       ← root component — what the phone shows first
├── app.json     ← app config: name, icon, colors, orientation
├── package.json ← dependency list
├── index.js     ← entry point
└── assets/      ← icon and splash screen images
```

✅ Expo app initialized.

---

## Step 13 — Install Navigation Dependencies

React Navigation handles moving between screens. We use the **bottom tabs** pattern — four tabs at the bottom: Home, Macros, Workout, Profile.

We use `npx expo install` instead of plain `npm install`:

> 💡 `npx expo install` is Expo-aware. It checks your Expo SDK version and installs the exact compatible version of each package. Using plain `npm install` can grab incompatible versions and cause hard-to-debug crashes.

```bash
npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```

| Package | What it does |
|---------|-------------|
| `@react-navigation/native` | Core navigation engine — manages screen transitions |
| `@react-navigation/bottom-tabs` | Creates the bottom tab bar |
| `react-native-screens` | Uses your phone's native screen layer for better performance |
| `react-native-safe-area-context` | Keeps content away from notches, status bars, and home indicators |

✅ Navigation dependencies installed.

---

## Step 14 — Create the Folder Structure

Expo's blank template dumps everything in the root. We organize code into `src/` from day one so the project doesn't become a mess as it grows.

```powershell
mkdir src\constants
mkdir src\navigation
mkdir src\screens
```

Final structure inside `nira-mobile/`:
```
nira-mobile/
├── src/
│   ├── constants/
│   │   └── colors.js        ← every color in the app defined here
│   ├── navigation/
│   │   └── AppNavigator.js  ← tab bar setup, connects screens to tabs
│   └── screens/
│       ├── HomeScreen.js    ← rank badge, quests, streak, XP
│       ├── MacrosScreen.js  ← Indian food macro tracker
│       ├── WorkoutScreen.js ← workout logger
│       └── ProfileScreen.js ← user profile + health stats
├── App.js                   ← entry point: loads the navigator
└── app.json                 ← Expo config: name, dark mode, colors
```

> 💡 Having a `constants/` folder means you never write `'#E2B714'` in 20 different files. You write it once as `Colors.accentGold` and use the name everywhere. One color change = one line changed.

✅ Folder structure created.

---

## Step 15 — Create the Theme (colors.js)

Create `src/constants/colors.js`:

```javascript
const Colors = {
  background: '#0A0A0A',       // deep black — the hunter's world
  card: '#1A1A2E',             // dark navy card backgrounds
  cardBorder: '#2A2A4A',       // subtle card borders
  accentGold: '#E2B714',       // Solo Leveling power aura gold
  accentPurple: '#7B2FBE',     // hunter rank purple
  accentPurpleLight: '#9B4FDE',
  text: '#FFFFFF',
  textSub: '#8B8B9E',          // secondary text, labels
  textMuted: '#555568',        // inactive / disabled elements
  success: '#2ECC71',          // quest completed green
  tabBar: '#111120',
  tabBarBorder: '#2A2A4A',
  // Rank colors — each rank has its own identity color
  rankE: '#7B2FBE',
  rankD: '#2E86AB',
  rankC: '#27AE60',
  rankB: '#E2B714',
  rankA: '#E67E22',
  rankS: '#E74C3C',
};

export default Colors;
```

**Why dark theme?** The app's "less screen = good health" philosophy means the UI should feel calm, not stimulating. Dark theme reduces eye strain — especially important in India where most phone use happens at night or indoors. The gold and purple are used only for important moments (quest completion, rank display, XP gains) so they retain their impact.

✅ Theme created.

---

## Step 16 — Build the Navigator (AppNavigator.js)

The navigator is the shell of the whole app. It creates the tab bar and connects each tab to a screen.

Create `src/navigation/AppNavigator.js`:

```javascript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import MacrosScreen from '../screens/MacrosScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Colors from '../constants/colors';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.accentGold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Home')    iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Macros')  iconName = focused ? 'nutrition' : 'nutrition-outline';
          if (route.name === 'Workout') iconName = focused ? 'barbell' : 'barbell-outline';
          if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Macros"  component={MacrosScreen} />
      <Tab.Screen name="Workout" component={WorkoutScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

> 💡 `headerShown: false` removes the default white header bar at the top. We build custom headers inside each screen instead.
> 💡 `Ionicons` comes bundled with Expo for free — no extra install needed.

✅ Navigator built.

---

## Step 17 — Build the Home Screen

This is the app's most important screen. Everything about Nira lives here first.

Create `src/screens/HomeScreen.js`:

```javascript
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

const DAILY_QUESTS = [
  { id: '1', title: 'Walk 5000 steps',          xp: 50, icon: 'walk-outline' },
  { id: '2', title: 'Drink 8 glasses of water', xp: 30, icon: 'water-outline' },
  { id: '3', title: 'No junk food today',        xp: 40, icon: 'fast-food-outline' },
];

function getTodayDate() {
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}

export default function HomeScreen() {
  const [completedQuests, setCompletedQuests] = useState({});
  const streak = 1;
  const rank   = 'E';
  const totalXP = 120;

  function toggleQuest(id) {
    setCompletedQuests(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const completedCount = Object.values(completedQuests).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Ohayo, Hunter</Text>
            <Text style={styles.date}>{getTodayDate()}</Text>
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankLabel}>RANK</Text>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { icon: '🔥', value: streak,         label: 'Day Streak' },
            { icon: '⚡', value: totalXP,        label: 'Total XP' },
            { icon: '🎯', value: `${completedCount}/${DAILY_QUESTS.length}`, label: 'Quests Done' },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Daily Quests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Quests</Text>
            <View style={styles.questBadge}>
              <Text style={styles.questBadgeText}>+120 XP</Text>
            </View>
          </View>
          {DAILY_QUESTS.map(quest => {
            const done = !!completedQuests[quest.id];
            return (
              <TouchableOpacity
                key={quest.id}
                style={[styles.questCard, done && styles.questCardDone]}
                onPress={() => toggleQuest(quest.id)}
                activeOpacity={0.7}
              >
                <View style={styles.questLeft}>
                  <View style={[styles.questCheck, done && styles.questCheckDone]}>
                    {done && <Ionicons name="checkmark" size={14} color={Colors.background} />}
                  </View>
                  <Ionicons
                    name={quest.icon} size={20}
                    color={done ? Colors.textMuted : Colors.accentGold}
                    style={{ marginRight: 12 }}
                  />
                  <Text style={[styles.questTitle, done && styles.questTitleDone]}>
                    {quest.title}
                  </Text>
                </View>
                <Text style={[styles.questXP, done && styles.questXPDone]}>+{quest.xp} XP</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rank Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rank Progress</Text>
          <View style={styles.rankCard}>
            <View style={styles.rankRow}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.rankSmallLabel}>Current</Text>
                <View style={[styles.rankCircle, { backgroundColor: Colors.rankE }]}>
                  <Text style={styles.rankCircleText}>E</Text>
                </View>
              </View>
              <View style={{ flex: 1, marginHorizontal: 16, alignItems: 'center' }}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '12%' }]} />
                </View>
                <Text style={styles.progressLabel}>120 / 1000 XP</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.rankSmallLabel}>Next</Text>
                <View style={[styles.rankCircle, { backgroundColor: Colors.textMuted }]}>
                  <Text style={styles.rankCircleText}>D</Text>
                </View>
              </View>
            </View>
            <Text style={styles.rankMotivation}>Your next rank awaits, Hunter. Keep grinding.</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 20, marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: '700', color: Colors.text },
  date: { fontSize: 13, color: Colors.textSub, marginTop: 4 },
  rankBadge: { backgroundColor: Colors.accentPurple, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  rankLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.5 },
  rankText: { fontSize: 22, fontWeight: '900', color: Colors.text },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textSub, marginTop: 2, textAlign: 'center' },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  questBadge: { backgroundColor: 'rgba(226,183,20,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(226,183,20,0.3)', marginBottom: 14 },
  questBadgeText: { fontSize: 12, color: Colors.accentGold, fontWeight: '700' },
  questCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  questCardDone: { borderColor: Colors.success, backgroundColor: 'rgba(46,204,113,0.05)' },
  questLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  questCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.textMuted, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  questCheckDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  questTitle: { fontSize: 15, color: Colors.text, fontWeight: '500', flex: 1 },
  questTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  questXP: { fontSize: 13, color: Colors.accentGold, fontWeight: '700', marginLeft: 8 },
  questXPDone: { color: Colors.textMuted },
  rankCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, padding: 20 },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rankSmallLabel: { fontSize: 10, color: Colors.textSub, marginBottom: 6, fontWeight: '600' },
  rankCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rankCircleText: { fontSize: 18, fontWeight: '900', color: Colors.text },
  progressTrack: { width: '100%', height: 6, backgroundColor: Colors.cardBorder, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: Colors.accentPurple, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: Colors.textSub, fontWeight: '600' },
  rankMotivation: { fontSize: 13, color: Colors.accentGold, fontStyle: 'italic', textAlign: 'center', borderTopWidth: 1, borderTopColor: Colors.cardBorder, paddingTop: 14 },
});
```

Key patterns used here:
| Pattern | What it does |
|---------|-------------|
| `useState({})` | Tracks which quests are tapped — object with quest IDs as keys, true/false as values |
| `TouchableOpacity` | Pressable element — dims to 70% opacity when tapped |
| `ScrollView` | Makes the screen scroll when content is taller than the phone |
| `StyleSheet.create()` | Defines all layout and colors, like CSS but for React Native |
| `SafeAreaView` | Keeps content below the status bar / phone notch |

✅ Home Screen built. The Hunter has awakened.

---

## Step 18 — Create Placeholder Screens

Macros, Workout, and Profile are built in later milestones. For now each gets a styled screen so the tab bar works and the app feels complete, not broken.

Create `src/screens/MacrosScreen.js`:

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

export default function MacrosScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="nutrition-outline" size={48} color={Colors.accentGold} />
        </View>
        <Text style={styles.title}>Macro Tracker</Text>
        <Text style={styles.subtitle}>Indian food database coming soon.</Text>
        <Text style={styles.hint}>
          Dal-chawal macros, regional recipes, Konkan cuisine — all in the next build.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconBox: { width: 88, height: 88, borderRadius: 24, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.accentGold, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  hint: { fontSize: 13, color: Colors.textSub, textAlign: 'center', lineHeight: 20 },
});
```

Create the same structure for `WorkoutScreen.js` (use `barbell-outline` icon, purple accent) and `ProfileScreen.js` (use `person-outline` icon, add a rank badge).

✅ Placeholder screens created.

---

## Step 19 — Update App.js (The Root)

Replace the generated `App.js` entirely:

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

The three wrapper layers explained:
1. `SafeAreaProvider` — gives all screens access to notch/status bar measurements
2. `NavigationContainer` — the navigation system's root. Must wrap all navigators
3. `AppNavigator` — our bottom tab bar, which loads each screen

Also update `app.json` — change the app name and enable dark mode:
```json
{
  "expo": {
    "name": "Nira",
    "slug": "nira",
    "userInterfaceStyle": "dark",
    "backgroundColor": "#0A0A0A"
  }
}
```

✅ App.js and app.json updated.

---

## Step 20 — Run on the Android Emulator

1. Open **Android Studio** → **Virtual Device Manager** → click ▶️ next to `Nira_Dev`
2. Wait for the emulator to boot fully (Android home screen must be visible)
3. In a terminal inside `nira-mobile/`:

```bash
npm run android
```

Metro Bundler starts and installs the app on the emulator automatically:
```
Starting Metro Bundler
› Opening exp://192.168.x.x:8081 on Nira_Dev
```

### What you should see:
- Deep black background
- "Ohayo, Hunter" with today's date
- Purple **E RANK** badge top right
- Three stat cards: 🔥 Day Streak | ⚡ Total XP | 🎯 Quests Done
- Three quest cards you can tap — they turn green with a checkmark on completion
- Rank progress bar (E → D, 12% filled)
- Dark tab bar, gold icon on the active tab

🔥 **This is the Hunter awakening moment. Nira is alive.**

✅ Part 3 complete.

---

# ⚙️ PART 4 — Spring Boot Backend

> **Status: Up Next**

The Spring Boot backend is the brain of Nira. The mobile app will call it for auth, meal data, workout logs, quest states, and user profiles. Right now the quests and XP on the Home Screen are hardcoded. Once the backend is live, that data comes from a real database.

## Step 21 — Create the Spring Boot Project

Go to **start.spring.io** and configure:

| Field | Value |
|-------|-------|
| Project | Maven |
| Language | Java |
| Spring Boot | 3.x (latest stable) |
| Group | com.nira |
| Artifact | nira-backend |
| Packaging | Jar |
| Java | 17 |

**Add these dependencies:**
- Spring Web
- Spring Security
- Spring Data JPA
- PostgreSQL Driver
- Lombok
- Validation

Click **Generate** → download the zip → extract into the `nira-backend/` folder.

Your structure will look like:
```
nira-backend/
├── src/main/java/com/nira/
│   ├── NiraBackendApplication.java   ← main class, starts the server
│   ├── controller/                   ← API endpoints live here
│   ├── service/                      ← business logic
│   ├── repository/                   ← database queries
│   ├── model/                        ← Java classes that map to DB tables
│   ├── dto/                          ← request/response data shapes
│   └── security/                     ← JWT + Spring Security config
├── src/main/resources/
│   └── application.properties        ← database URL, JWT secret, port
└── pom.xml                           ← dependency list (like package.json)
```

---

## Step 22 — Set Up PostgreSQL

Install PostgreSQL if you haven't. Then create the database:

```sql
CREATE DATABASE nira_db;
CREATE USER nira_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE nira_db TO nira_user;
```

Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/nira_db
spring.datasource.username=nira_user
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
server.port=8080
```

> 💡 `ddl-auto=update` tells Spring to automatically create or update tables based on your Java classes. You don't write SQL for table creation — Spring does it from your code.

---

## Step 23 — Create the User Model

`src/main/java/com/nira/model/User.java`:

```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;  // stored as bcrypt hash — never plain text

    private String name;
    private String rank = "E";
    private int totalXp = 0;
    private int streak = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
```

Spring Data JPA reads this class and automatically creates a `users` table in PostgreSQL with these columns.

---

## Step 24 — Add a Health Check Endpoint

Before building auth, verify the server is running and can connect to the database.

`src/main/java/com/nira/controller/HealthController.java`:

```java
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Nira backend is running 🟢");
    }
}
```

Run the backend:
```bash
cd nira-backend
mvn spring-boot:run
```

Test it:
```bash
curl http://localhost:8080/api/health
# Expected: Nira backend is running 🟢
```

✅ Backend running.

---

# 🔐 PART 5 — Auth: Register & Login with JWT

> **Status: Upcoming**

JWT (JSON Web Token) is how the mobile app proves who the user is on every request. The flow:
1. User registers or logs in → backend returns a JWT token
2. App stores the token on the phone
3. Every future API call includes the token in the header
4. Backend validates the token before responding

## Step 25 — Add JWT Dependency

Add to `pom.xml`:
```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
```

Add to `application.properties`:
```properties
jwt.secret=your-256-bit-secret-key-here
jwt.expiration=86400000
```

---

## Step 26 — JWT Utility Class

`src/main/java/com/nira/security/JwtUtil.java`:

```java
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(String email) {
        return Jwts.builder()
            .setSubject(email)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()), SignatureAlgorithm.HS256)
            .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes()))
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            extractEmail(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

---

## Step 27 — Register and Login Endpoints

`src/main/java/com/nira/controller/AuthController.java`:

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
}
```

`AuthResponse` returns: `{ "token": "eyJ...", "name": "Soham", "rank": "E" }`

Test with curl:
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"soham@nira.com","password":"hunter123","name":"Soham"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"soham@nira.com","password":"hunter123"}'
```

✅ Auth endpoints live.

---

# 📲 PART 6 — Connecting the Mobile App to the Backend

> **Status: Upcoming**

The mobile app needs to call the Spring Boot APIs. We use **Axios** for HTTP requests and **AsyncStorage** to save the JWT token on the phone between sessions.

## Step 28 — Install Axios and AsyncStorage

```bash
npx expo install axios @react-native-async-storage/async-storage
```

---

## Step 29 — Create the API Client

Create `src/api/client.js`:

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://10.0.2.2:8080/api'; // 10.0.2.2 = your PC from inside the Android emulator

const client = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request automatically
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('nira_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
```

> 💡 `10.0.2.2` is a special Android emulator address. When the emulator wants to reach your PC's localhost, it uses `10.0.2.2` instead of `127.0.0.1`.

---

## Step 30 — Build the Login Screen

Create `src/screens/LoginScreen.js` with:
- Email and password text inputs
- Login button that calls `POST /api/auth/login`
- On success: saves the JWT token to AsyncStorage and navigates to the main app
- Error message if login fails

---

## Step 31 — Build the Register Screen

Create `src/screens/RegisterScreen.js` with:
- Name, email, password inputs
- Register button → `POST /api/auth/register`
- Auto-login after successful registration

---

## Step 32 — Auth Context (Share Login State)

Create `src/context/AuthContext.js`:

```javascript
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);

  async function login(tokenValue, userData) {
    await AsyncStorage.setItem('nira_token', tokenValue);
    setToken(tokenValue);
    setUser(userData);
  }

  async function logout() {
    await AsyncStorage.removeItem('nira_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

Wrap `App.js` in `<AuthProvider>`. Now every screen can call `useContext(AuthContext)` to know if the user is logged in.

---

## Step 33 — Protect the Tab Navigator

If no token exists, show the Login screen. If logged in, show the main app (tab navigator).

Update `App.js`:
```javascript
const { token } = useContext(AuthContext);

return token ? <AppNavigator /> : <AuthNavigator />;
```

✅ Mobile app connected to backend.

---

# 🍛 PART 7 — Macro Tracker (Indian Food Database)

> **Status: Upcoming**

The macro tracker is where Nira's Indian-first identity shows up most clearly. No more Googling "how much protein in 1 cup dal". Nira knows.

## Step 34 — Meal Model in Spring Boot

```java
@Entity
@Table(name = "meals")
public class Meal {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;          // "Masoor Dal", "Jowar Bhakri"
    private String nameHindi;     // "मसूर दाल"
    private String category;      // "dal", "roti", "rice", "sabji", "snack"
    private String region;        // "konkan", "punjabi", "south_indian", "general"
    private double caloriesPer100g;
    private double proteinPer100g;
    private double carbsPer100g;
    private double fatPer100g;
    private double fiberPer100g;
    private String servingUnit;   // "katori", "piece", "cup"
    private double typicalServing; // grams in one typical serving
}
```

---

## Step 35 — Seed the Indian Food Database

Create a `data.sql` file in `src/main/resources/` with INSERT statements for 100+ Indian foods:

```sql
INSERT INTO meals (name, name_hindi, category, region, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_unit, typical_serving)
VALUES
('Masoor Dal',  'मसूर दाल',  'dal',   'general', 116, 9.0, 20.1, 0.4, 3.2, 'katori', 150),
('Toor Dal',    'तूर दाल',   'dal',   'general', 118, 8.4, 21.0, 0.5, 3.0, 'katori', 150),
('Steamed Rice','उकडा भात',  'rice',  'general',  86, 1.8, 19.0, 0.1, 0.3, 'katori', 150),
('Jowar Bhakri','ज्वारी भाकरी','roti', 'konkan',   85, 2.7, 17.1, 0.8, 1.2, 'piece',  60),
('Chapati',     'चपाती',     'roti',  'general',  71, 2.7, 15.0, 0.4, 1.9, 'piece',  40),
-- ... 95 more rows
;
```

Start with staples: dal varieties, roti types, rice preparations, common sabzis. Expand over time.

---

## Step 36 — Macro Search Endpoint

```java
@GetMapping("/meals/search")
public ResponseEntity<List<Meal>> search(@RequestParam String q) {
    return ResponseEntity.ok(mealRepository.findByNameContainingIgnoreCase(q));
}

@GetMapping("/meals/category/{category}")
public ResponseEntity<List<Meal>> byCategory(@PathVariable String category) {
    return ResponseEntity.ok(mealRepository.findByCategory(category));
}
```

---

## Step 37 — Build the MacrosScreen UI

The MacrosScreen becomes a full tracker:
- Search bar → type "dal" → shows all dal options
- Tap a meal → adds to today's log with a default serving size
- Adjust serving size with a slider
- Running total: Calories | Protein | Carbs | Fat
- Daily goal progress bars (based on user's TDEE set in Profile)

---

# 🏋️ PART 8 — Workout Logger

> **Status: Upcoming**

## Step 38 — Workout Models

Two tables: `exercises` (the library) and `workout_logs` (what you did today).

```java
@Entity
public class Exercise {
    private Long id;
    private String name;         // "Push-ups", "Surya Namaskar"
    private String category;     // "strength", "cardio", "yoga", "flexibility"
    private String equipment;    // "none", "dumbbell", "mat"
    private String muscleGroup;  // "chest", "legs", "core", "full_body"
}

@Entity
public class WorkoutLog {
    private Long id;
    private Long userId;
    private Long exerciseId;
    private int sets;
    private int reps;
    private double weightKg;     // 0 for bodyweight exercises
    private LocalDate date;
}
```

---

## Step 39 — Workout Endpoints

```
GET  /api/exercises            → full exercise library
GET  /api/exercises?category=yoga
POST /api/workouts/log         → log today's exercise
GET  /api/workouts/today       → get today's logged exercises
GET  /api/workouts/week        → weekly summary
```

---

## Step 40 — Build the WorkoutScreen UI

- Browse exercises by category (Strength, Cardio, Yoga, Flexibility)
- Tap exercise → log sets/reps
- Today's workout summary at the top
- XP reward shown on each exercise (completing a workout gives XP)

---

# 🤖 PART 9 — Python Flask AI Layer

> **Status: Upcoming**

The AI layer is a separate microservice. Spring Boot calls it — the mobile app never talks to Flask directly. This keeps the AI layer isolated and swappable.

## Step 41 — Set Up Python Environment

```bash
cd nira-ai
python -m venv venv
venv\Scripts\activate        # Windows
pip install flask requests python-dotenv
pip freeze > requirements.txt
```

Create `app.py`:
```python
from flask import Flask
app = Flask(__name__)

@app.route('/health')
def health():
    return {'status': 'Nira AI running'}

if __name__ == '__main__':
    app.run(port=5000, debug=True)
```

Run: `python app.py`

---

## Step 42 — Connect to Ollama

Install Ollama from **ollama.ai**. Pull a model:
```bash
ollama pull llama3.2
```

In Flask, call it via HTTP:
```python
import requests

def ask_ollama(prompt):
    response = requests.post('http://localhost:11434/api/generate', json={
        'model': 'llama3.2',
        'prompt': prompt,
        'stream': False
    })
    return response.json()['response']
```

---

## Step 43 — Meal Planner Endpoint

```python
@app.route('/ai/meal-plan', methods=['POST'])
def meal_plan():
    data = request.json
    goal_calories = data['goalCalories']
    preference    = data.get('preference', 'vegetarian')
    region        = data.get('region', 'konkan')

    prompt = f"""
    Create a 1-day Indian meal plan.
    Target calories: {goal_calories} kcal
    Preference: {preference}
    Regional cuisine: {region}
    Include: breakfast, lunch, evening snack, dinner.
    Use common Indian household ingredients.
    Format as JSON with meal name, ingredients, and macros.
    """

    result = ask_ollama(prompt)
    return {'meal_plan': result}
```

---

## Step 44 — CBT Wellness Chatbot Endpoint

```python
@app.route('/ai/chat', methods=['POST'])
def chat():
    user_message = request.json['message']

    prompt = f"""
    You are a warm, supportive wellness companion for an Indian health app called Nira.
    You use CBT (Cognitive Behavioral Therapy) techniques.
    You understand Indian family stress, work pressure, and cultural context.
    Keep responses short, practical, and grounded.

    User says: {user_message}
    """

    return {'reply': ask_ollama(prompt)}
```

---

## Step 45 — Spring Boot Calls Flask

In Spring Boot, create an `AIService` that calls Flask:

```java
@Service
@RequiredArgsConstructor
public class AIService {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:5000}")
    private String aiBaseUrl;

    public String getMealPlan(int goalCalories, String region) {
        Map<String, Object> body = Map.of(
            "goalCalories", goalCalories,
            "region", region
        );
        return restTemplate.postForObject(aiBaseUrl + "/ai/meal-plan", body, String.class);
    }
}
```

The mobile app calls Spring Boot (`/api/ai/meal-plan`) → Spring Boot calls Flask → Flask calls Ollama → response flows back.

---

# ⚔️ PART 10 — Dynamic Quest Engine & Ranking

> **Status: Upcoming**

Right now quests are hardcoded in the mobile app. This milestone makes quests dynamic — generated by the backend based on your history, rank, and health goals.

## Step 46 — Quest Model

```java
@Entity
public class Quest {
    private Long id;
    private String title;
    private String description;
    private String type;        // "steps", "water", "workout", "nutrition", "sleep"
    private int xpReward;
    private String difficulty;  // "E", "D", "C" (based on user's current rank)
}

@Entity
public class UserQuestLog {
    private Long id;
    private Long userId;
    private Long questId;
    private LocalDate date;
    private boolean completed;
    private LocalDateTime completedAt;
}
```

---

## Step 47 — Daily Quest Generation

```java
@Scheduled(cron = "0 0 0 * * *")  // runs at midnight every day
public void generateDailyQuests() {
    List<User> allUsers = userRepository.findAll();
    for (User user : allUsers) {
        List<Quest> quests = questService.generateForUser(user);
        // save 3 quests to UserQuestLog for today
    }
}
```

Quest generation logic:
- Pull user's current rank and weak areas (e.g. skipped workouts 3 days in a row → more workout quests)
- Higher rank → harder quests + more XP
- Mix of quest types each day (never 3 of the same type)

---

## Step 48 — XP and Rank Calculation

```java
public String calculateRank(int totalXp) {
    if (totalXp < 1000)  return "E";
    if (totalXp < 2500)  return "D";
    if (totalXp < 5000)  return "C";
    if (totalXp < 10000) return "B";
    if (totalXp < 20000) return "A";
    return "S";
}
```

When a quest is marked complete: add XP to user → recalculate rank → if rank changed, return a rank-up event to the mobile app → show a celebration animation.

---

## Step 49 — Home Screen Pulls Live Quests

Update `HomeScreen.js` to fetch today's quests from the backend:

```javascript
useEffect(() => {
  async function loadQuests() {
    const { data } = await client.get('/quests/today');
    setQuests(data);
  }
  loadQuests();
}, []);
```

The hardcoded `DAILY_QUESTS` array is replaced with real data. Rank badge, XP, and streak all come from the user's profile in the backend.

---

# 🚀 PART 11 — Deployment

> **Status: Upcoming**

## Step 50 — Dockerize the Spring Boot Backend

Create `nira-backend/Dockerfile`:
```dockerfile
FROM eclipse-temurin:17-jdk-alpine
COPY target/nira-backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

Build and test locally:
```bash
mvn clean package -DskipTests
docker build -t nira-backend .
docker run -p 8080:8080 nira-backend
```

---

## Step 51 — Deploy to AWS EC2

1. Launch an EC2 instance (Ubuntu 22.04, t3.micro for dev)
2. Install Docker on the instance
3. Copy the Docker image or build on the server
4. Set up PostgreSQL on RDS or on the same EC2 instance
5. Configure environment variables for DB credentials and JWT secret
6. Open port 8080 in the EC2 security group

---

## Step 52 — Build the Android APK

```bash
cd nira-mobile
npx expo build:android
```

Or with EAS Build (Expo's cloud build service):
```bash
npm install -g eas-cli
eas build --platform android
```

Share the APK with test users via a direct download link.

---

# 🧠 Concepts You Learned Along the Way

| Concept | Plain English Explanation |
|---|---|
| `main` branch protection | Like a lock on production — forces code review before anything goes live |
| `JAVA_HOME` | Tells every tool on your PC which Java installation to use |
| User PATH vs System PATH | User PATH loads first — putting Java 17 here overrides system-wide defaults |
| `.gitkeep` | A dummy empty file so Git tracks otherwise-empty folders |
| GitHub Flow | The simplest git strategy — feature → dev → main, all via PRs |
| ADB | Android Debug Bridge — the tool that lets your PC communicate with Android devices |
| `ANDROID_HOME` | Tells React Native where your Android SDK is installed |
| AVD | Android Virtual Device — the emulator (virtual phone) running on your PC |
| `npx` | Runs a Node package without installing it permanently |
| `npx expo install` | Expo-aware package installer — always grabs the SDK-compatible version |
| Metro Bundler | The JavaScript bundler for React Native — converts your code to run on Android/iOS |
| `useState` | React hook — stores a value that, when changed, re-renders the screen |
| `SafeAreaView` | Keeps content away from phone notches and status bars |
| `NavigationContainer` | The root wrapper required by React Navigation |
| `RestController` | Spring Boot annotation — marks a class as an HTTP API endpoint handler |
| JWT | JSON Web Token — a signed string that proves who the user is on every API call |
| `ddl-auto=update` | Spring JPA setting — auto-creates DB tables from your Java classes |
| `10.0.2.2` | Special Android emulator address that maps to your PC's localhost |
| Context API | React pattern — share state (like login status) across all screens without prop drilling |
| `@Scheduled` | Spring annotation — runs a method on a cron schedule (like daily quest generation) |

---

# 💡 Decisions We Made and Why

| Decision | Why |
|---|---|
| Java 17 over 21 or 25 | React Native + Spring Boot 3.x sweet spot. Most compatible, most stable. |
| Temurin (Adoptium) over Oracle JDK | Free, open source, no license issues. Oracle JDK has commercial restrictions. |
| Renamed Java 25 bin instead of uninstalling | Keeps Java 25 available if ever needed — just stops it from interfering. |
| Expo for React Native | Removes native config pain for a solo beginner. Managed builds, great tooling. |
| Pixel 7 + API 34 emulator | Modern device, latest stable Android — matches real Indian user devices. |
| GitHub Flow over Gitflow | Simpler. Less overhead. Perfect for a solo project. |
| JavaScript over TypeScript | TypeScript adds cognitive overhead for a beginner. Add it once the app is stable. |
| React Navigation over Expo Router | More beginner-friendly, better documentation, more StackOverflow answers. |
| `src/` folder structure from day one | Prevents root-level chaos as the project grows. One decision now saves many later. |
| Colors in a constants file | One source of truth for the theme — change once, updates everywhere. |
| Flask as separate AI microservice | Keeps AI isolated. Spring Boot stays focused on REST APIs. Swap the AI model anytime. |
| Ollama (local LLM) for AI | No API costs during development. Run the model on your own machine. |
| Indian food database seeded manually | Scraped generic food databases miss Indian context. We control the data. |

---

*📅 Last updated: Part 3 complete — React Native mobile app live on Nira_Dev emulator*
*✅ Environment, mobile scaffold, Solo Leveling Home Screen, navigation — all done*
*⏳ Next: Spring Boot backend scaffold → health endpoint → auth*
