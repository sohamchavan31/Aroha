# Nira — Work Progress Log

**Stack:** React Native (Expo) | Spring Boot | Python Flask | PostgreSQL | MongoDB
**Style:** Solo Leveling — daily quests, hunter ranks, intentional screen time
**Dev:** Soham | Solo | 2–4 hrs/day

---

## Current Status
> Phase 5 complete — Nutrition system live. 52 Indian foods, macro tracker, daily log working end-to-end.
> Next: Workout Logger (Phase 6).

---

## What's Done ✅

| Area | What was built |
|------|---------------|
| Repo & Git | GitHub repo, branch protection on `main`, GitHub Flow (feature → dev → main) |
| Environment | Java 17 (Temurin), Android Studio, Nira_Dev emulator (Pixel 7, API 34, x86_64) |
| Mobile scaffold | Expo SDK 56, blank template, JavaScript (no TypeScript) |
| Navigation | React Navigation v7, bottom tabs — Home / Macros / Workout / Profile |
| Theme | `src/constants/colors.js` — Solo Leveling dark palette (black, gold, purple) |
| Home Screen | Rank badge (E), greeting, streak counter, XP display, 3 daily quests (toggleable), rank progress bar E→D |
| Placeholder screens | Macros, Workout, Profile — styled with dark theme, not blank |
| App config | `app.json` — name "Nira", dark UI, black background |
| Backend scaffold | Spring Boot 3.3, Java 17, Maven — pom.xml with web, security, JPA, validation, JWT, H2 for tests |
| User entity | `User.java` → users table — email, bcrypt password, name, rank, totalXp, streak |
| Auth endpoints | `POST /api/auth/register` (201) + `POST /api/auth/login` (200) — returns JWT token |
| Health endpoint | `GET /api/health` — public, no auth required |
| JWT security | `JwtUtil`, `JwtFilter`, `SecurityConfig` — stateless, Bearer token on every protected request |
| Backend CI | `backend-ci.yml` — mvn verify on push/PR, H2 in-memory DB so no PostgreSQL needed in CI |
| PostgreSQL | `nira_db` database live on local PostgreSQL 16, `nira_user` configured |
| Auth screens | `LoginScreen.js` + `RegisterScreen.js` — Solo Leveling dark UI, gold buttons, form validation |
| API client | `src/api/client.js` — Axios with auto JWT header interceptor, points to `10.0.2.2:8080` |
| AuthContext | `src/context/AuthContext.js` — token + user state, persisted via AsyncStorage across sessions |
| Route protection | `App.js` — gold spinner on launch, Login/Register if no token, tabs if logged in |
| AuthNavigator | `src/navigation/AuthNavigator.js` — stack navigator for Login ↔ Register |
| End-to-end auth | Register → Spring Boot → PostgreSQL → JWT → Home screen. Full flow tested and working. |
| Meal entity | `Meal.java` → meals table — name, category, region, macros per 100g, serving unit + size |
| Indian food DB | 52 foods seeded via `data.sql` — dals, rice, roti, sabzi, snacks, dairy, fruits, Konkan specials |
| Meal endpoints | `GET /api/meals/search?q=`, `/category/{cat}`, `/all` |
| DailyLog entity | `DailyLog.java` → daily_logs table — pre-calculated macros per entry for instant totals |
| Daily log endpoints | `POST /api/logs`, `GET /api/logs/today`, `DELETE /api/logs/{id}` |
| MacrosScreen | Full UI — search bar, meal results with macro preview, daily log list, calorie ring + macro progress bars |

---

## What's Left (Ordered by Priority)

### Phase 3 — Spring Boot Backend ✅
- [x] Initialize Spring Boot project
- [x] Connect to PostgreSQL — `nira_db` running on PostgreSQL 16
- [x] User entity + repository
- [x] Health check endpoint
- [x] JWT register + login endpoints
- [x] JWT filter + security config

---

### Phase 4 — Auth Flow (Mobile) ✅
- [x] Build Register screen UI
- [x] Build Login screen UI
- [x] Install Axios for HTTP calls
- [x] Store JWT token in AsyncStorage
- [x] Create AuthContext to share login state across screens
- [x] Protect tabs — redirect to login if not authenticated

---

### Phase 5 — Nutrition System ✅
- [x] Create Meal entity in Spring Boot
- [x] Seed 52 Indian foods into PostgreSQL
- [x] `GET /api/meals/search?q=` endpoint
- [x] MacrosScreen — search + add meals + daily total display
- [x] Daily macro summary with calorie ring + macro bars
- [ ] Serving size modal on meal add — adjust grams/pieces before logging (like workout sets/reps modal)
- [ ] Custom dish builder — user creates their own meal with custom macros
- [ ] Indian food database expansion to 500+ items (Konkan cuisine priority)
- [ ] Support non-standard quantities — "1 bowl", "half plate", user-defined units

---

### Phase 6 — Workout System
> Exercise library + logging + progress tracking

- [ ] Create Workout + WorkoutLog entities in Spring Boot
- [x] Exercise library — 34 exercises (strength, cardio, yoga, flexibility)
- [x] WorkoutScreen — category tabs, log sets/reps/weight, today's session summary
- [ ] Gym machine exercises — bench press, lat pulldown, leg press, cable rows, etc.
- [ ] Muscle pressure visualization — AI-generated model showing which muscles activate per exercise
- [ ] Exercise guide videos — animated/AI model demonstrating correct form
- [ ] AI workout schedule generator — user inputs goal + days/week + gym/home → gets daily/weekly/monthly plan
- [ ] Muscle variation selector — user picks 4/5/N exercises per muscle group per session
- [ ] Rest timer between sets
- [ ] Weekly workout summary + progress graph
- [ ] Personal records tracker — track best weight/reps per exercise over time

---

### Phase 7 — Habit & Routine System (Key Feature)
> Monthly calendar-style habit tracker like the image shared

- [ ] HabitTracker screen — monthly grid view
  - Month name at top (e.g. "May 2026")
  - User-defined habits (Wake up at 5, Gym, Reading, Budget, Water, etc.)
  - Columns for each day (1–31) with tap-to-check checkboxes
  - Color fill on completed days
  - Progress row at bottom (Done %, Not Done %)
- [ ] Habit entity in Spring Boot — name, userId, color, icon
- [ ] HabitLog entity — habitId, date, completed (boolean)
- [ ] Streak calculation per habit
- [ ] Insights screen — which habits you're consistent on, which are failing
- [ ] Link habits to reminders + daily planner

---

### Phase 8 — Planner & Productivity
> Daily planner + to-do list + scheduler

- [ ] Daily planner screen — time-blocked schedule for the day
- [ ] To-do list — add tasks, mark done, carry forward incomplete
- [ ] Weekly scheduler view
- [ ] Link planner tasks to habit tracker (e.g. "7:00 AM — Gym" auto-checks gym habit)

---

### Phase 9 — Reminders & Recovery
> Smart reminders + water + supplements + sleep

- [ ] Water intake reminder — set daily goal, tap to log each glass
- [ ] Supplement reminder — add supplement name + time, get notified
- [ ] Sleep & recovery tracking — log sleep time, wake time, quality rating
- [ ] Personalized regional-language reminders
  - Hindi voice reminder: "Bhai, paani pi le!" 
  - Marathi voice reminder: "Chala, workout chya veli zali!"
  - Uses Expo Notifications + Text-to-Speech

---

### Phase 10 — Python Flask AI Layer
> AI meal planner + chatbot advisor + smart insights

- [ ] Set up Python venv in `nira-ai/`
- [ ] Flask boilerplate + Ollama connection
- [ ] AI meal planner endpoint (`POST /ai/meal-plan`) — takes macros goal + region, returns Indian meal plan
- [ ] AI fitness advisor chatbot (`POST /ai/chat`) — exercise advice, form tips, motivation
- [ ] Habit & nutrition insights (`POST /ai/insights`) — pattern analysis from user data
- [ ] Smart suggestions — "You skipped leg day 3 times, here's a home routine"
- [ ] Spring Boot calls Flask via HTTP — all AI exposed through backend API

---

### Phase 11 — Dynamic Quest Engine
> Live quests from backend, XP system, rank progression

- [ ] Quest model in Spring Boot
- [ ] Daily quest generation based on user history + weak areas
- [ ] XP system — complete quest → earn XP → rank up
- [ ] Rank thresholds: E (0–999) → D (1000–2499) → C (2500–4999) → B (5000–9999) → A (10000+) → S
- [ ] Streak persistence in PostgreSQL — reset if day missed
- [ ] Rank-up animation/celebration on mobile
- [ ] Home screen pulls live quests from backend (replace hardcoded)

---

### Phase 12 — Profile, Onboarding & Health Stats
- [ ] Onboarding flow — first launch collects: name, age, weight, height, health goal
- [ ] BMI + TDEE calculator (Indian body composition context)
- [ ] Profile screen — health stats, goal progress, rank history
- [ ] Hindi/Marathi language toggle (i18n setup)
- [ ] Settings screen — notifications, language, theme, account

---

### Phase 13 — Offline-First Sync
- [ ] Local SQLite storage via WatermelonDB or AsyncStorage
- [ ] All core features work without internet
- [ ] Background sync when connection restored
- [ ] Privacy-first — sensitive data stays on device

---

### Phase 14 — Deployment (Nira v1.0)
- [ ] Docker containerize Spring Boot backend
- [ ] Deploy to AWS EC2
- [ ] PostgreSQL on RDS or EC2
- [ ] Build release APK
- [ ] Internal testing with physical Android device

---

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Dev environment ready (Java 17, Android Studio, emulator) | ✅ Done |
| 2 | React Native app scaffolded and running on emulator | ✅ Done |
| 3 | Home screen — Solo Leveling UI with daily quests | ✅ Done |
| 4 | Bottom tab navigation (Home, Macros, Workout, Profile) | ✅ Done |
| 5 | Spring Boot backend scaffold + JWT auth | ✅ Done |
| 6 | Auth flow — mobile login/register screens | ✅ Done |
| 7 | Nutrition system — macro calculator + Indian food DB | ✅ Done |
| 8 | Workout logger + exercise library | ⏳ Next |
| 9 | Habit tracker — monthly calendar grid | Pending |
| 10 | Planner + to-do + scheduler | Pending |
| 11 | Reminders — water, supplements, regional voice | Pending |
| 12 | Flask AI layer — meal planner + chatbot | Pending |
| 13 | Dynamic quest engine (live from backend) | Pending |
| 14 | Full deployment (EC2 + APK) | Pending |

---

## 🌍 Ecosystem Vision — Where Nira is Going

```
Nira (wellness) + HealthBridge (medical) + IoT Layer
         = India's own health super-app
```

### 🏋️ Nira — Indian Wellness App (This Project)
Core focus: nutrition, workouts, habits, AI coaching, mental wellness.
The foundation everything else connects to.

### 🏥 HealthBridge — AI Diagnostic Assistant (Future Project)
Built for Soham's sister (upcoming doctor) and 2+ billion people
without access to quality healthcare.

**Features:**
- Symptom checker with smart follow-up questions
- Skin condition analysis (rashes, wounds, infections)
- Eye disease detection (cataracts, diabetic retinopathy)
- Medication info + drug interactions
- First aid with videos/images
- Connect to nearby clinics when online
- Multi-language support (critical for rural India)

**AI Models:**
- Vision: MobileNetV3 / EfficientNet (image classification)
- NLP: DistilBERT (symptom understanding)
- Medical LLM: Fine-tuned LLaMA 3.2 1B

**Shared with Nira:** User profile, AI health core, sync API

### ⚡ IoT Layer — FitKonkan Hardware (Phase 3, Future)
ESP32 sensors on gym equipment + smart home fitness devices.
- Auto-log sets, reps, rest time from real equipment
- Smart scale, water bottle, posture sensor, step counter
- ESP32 → MQTT → Spring Boot → Nira app
- LoRa for offline rural use (sync when connected)
- Smart home: fan on during workout, motivational lights, voice reminders

### 🧠 Shared AI Health Core
```
┌──────────────────────────────────────────────┐
│              AI Health Core                   │
│  Symptom Understanding (DistilBERT)           │
│  Image Recognition (MobileNetV3)              │
│  Nutrition AI (Macro + Deficiency Insights)   │
│  Personalized Health Insights                 │
└──────────────────────────────────────────────┘
         ▲                        ▲
    Nira App               HealthBridge
 (wellness)               (diagnostic)
         └──────────┬───────────┘
              Shared User Profile
              Cloud / Offline Sync
```

---

## Notes & Decisions

| Decision | Why |
|---|---|
| JavaScript over TypeScript | Less overhead for beginner. Add TS once app is stable. |
| React Navigation over Expo Router | Simpler, better docs, more community answers. |
| No IoT right now | Strong mobile-only app first. IoT layer added in Phase 3. |
| Habit tracker as key feature | Differentiates Nira from generic fitness apps. Calendar grid = sticky feature. |
| Regional language reminders | Indian cultural fit — Hindi/Marathi voice feels personal, not generic. |
| Offline-first | Rural India, low connectivity areas. Privacy-first design. |
| HealthBridge as separate app | Different use case (medical vs wellness). Shared AI core, separate UI. |
| Flask as AI microservice | Isolated. Spring Boot stays clean. Swap AI models anytime. |
| Ollama for local LLM | Zero API cost during development. Full privacy. |

---

_Updated: 2026-05-29 — Feature scope expanded. Full ecosystem vision documented._

<!-- Session log -->
<!-- 2026-05-28: Mobile scaffold + Solo Leveling Home Screen done. Backend scaffold + JWT done. -->
<!-- 2026-05-29: Feature scope expanded — nutrition calculators, habit tracker grid, planner, reminders, regional voice, AI advisor, workout recorder, HealthBridge ecosystem, IoT vision documented. Auth flow (mobile) is immediate next step. -->
