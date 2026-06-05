# Aroha — Work Progress Log

**Stack:** React Native (Expo) | Spring Boot | Python Flask | PostgreSQL | MongoDB
**Identity:** AI-powered wellness evolution platform — grow physically, mentally, consistently
**Dev:** Soham | Solo | 2–4 hrs/day

---

## Current Status
> Phase 12 COMPLETE (2026-06-05) — Health Attributes, Evolution History, Settings, Language Toggle.
> Phase 10 COMPLETE (2026-06-05) — Flask AI (meal plan, chat, insights) + Spring Boot proxy + AiScreen modal.
> Phase 6 partial COMPLETE (2026-06-05) — AI Workout Generator + Session Timer added.
> Phase 5 partial COMPLETE (2026-06-05) — Serving size modal, custom food builder, 170+ Indian food DB.
> **OPEN PRs:** feat/phase-12-evolution-history · feat/phase-12-settings-language · feat/phase-10-flask-ai · feat/phase-5-nutrition
> **New tweaks queued:** AI Screen upgrades · Workout custom exercise in session · More exercises + foods

---

## Evolution System Reference

| Old (Nira) | New (Aroha) |
|---|---|
| Hunter Rank E→S | Evolution Stage: Spark → Awakened → Ascender → Guardian → Titan → Apex → Legend |
| XP | Evolution Points (EP) |
| Daily Quests | Missions (Daily + Weekly) |
| Streak counter | Consistency Score |
| Rank badge | Health Attributes: Strength / Discipline / Recovery / Nutrition |

**Evolution Stage EP Thresholds:**

| Stage | EP Range |
|---|---|
| Spark | 0 – 999 |
| Awakened | 1,000 – 2,999 |
| Ascender | 3,000 – 5,999 |
| Guardian | 6,000 – 10,999 |
| Titan | 11,000 – 17,999 |
| Apex | 18,000 – 27,999 |
| Legend | 28,000+ |

---

## Rebrand Checklist — Nira → Aroha ✅ COMPLETE

### GitHub
- [x] Rename repo Nira → Aroha on GitHub
- [ ] Update repo description and About section (manual — GitHub UI)
- [x] Update README.md — project name, vision, stack

### Mobile (aroha-mobile/)
- [x] Rename folder nira-mobile → aroha-mobile
- [x] app.json — name: "Aroha", slug: "aroha", package: "com.aroha"
- [x] LoginScreen.js — "The Hunter's Path Begins Here" → "Your Evolution Begins Here"
- [x] RegisterScreen.js — "NEW HUNTER" → "NEW MEMBER"
- [x] OnboardingScreen.js — "Begin the Hunt" → "Begin Your Evolution"
- [x] HomeScreen.js — "Daily Quests" → "Daily Missions"
- [x] HomeScreen.js — XP → EP, Rank badge → Evolution Stage badge (SP/AW etc.)
- [x] HomeScreen.js — "Rank Progress" → "Evolution Progress"
- [x] HomeScreen.js — code comments updated (XP Row, Daily Quests, Rank Progress)
- [x] ProfileScreen.js — "E RANK" → "Spark", "Total XP" → "Evolution Points"
- [x] AuthContext.js — nira_token/nira_user → aroha_token/aroha_user
- [x] LoginScreen.js / RegisterScreen.js — data.rank/totalXp → data.evolutionStage/evolutionPoints

### Backend (aroha-backend/)
- [x] Rename folder nira-backend → aroha-backend
- [x] pom.xml — groupId: com.aroha, artifactId: aroha-backend
- [x] Rename Java package com.nira → com.aroha across all files
- [x] application.properties — DB: aroha_db, user: aroha_user, app name: aroha-backend
- [x] User.java — rename rank → evolutionStage, totalXp → evolutionPoints
- [x] AuthResponse.java — evolutionStage + evolutionPoints fields
- [x] AuthService.java — new users start at "Spark" + 0 EP
- [x] ProfileController.java — returns evolutionStage + evolutionPoints
- [x] NiraBackendApplication.java → ArohaBackendApplication.java
- [x] NiraBackendApplicationTests.java → ArohaBackendApplicationTests.java
- [x] backend-ci.yml — paths updated to aroha-backend
- [ ] PostgreSQL — create aroha_db + aroha_user, migrate data (manual step)

### AI Service (aroha-ai/)
- [x] Rename folder nira-ai → aroha-ai

### Docs
- [x] NIRA_DEV_JOURNEY.md → AROHA_DEV_JOURNEY.md
- [x] AROHA_DEV_JOURNEY.md — all Nira references replaced with Aroha throughout
- [x] workprogress.md updated

---

## What's Done

| Area | What was built |
|------|---------------|
| Repo & Git | GitHub repo, branch protection on main, GitHub Flow |
| Environment | Java 17 (Temurin), Android Studio, emulator (Pixel 7, API 34, x86_64) |
| Mobile scaffold | Expo SDK 56, blank template, JavaScript |
| Navigation | React Navigation v7, 5 tabs icons-only — Home / Macros / Workout / Habits / Planner |
| Theme | src/constants/colors.js — dark palette (black, gold, purple) |
| Home Screen | Stage badge (SP), greeting, EP display, daily missions, evolution progress bar, water widget |
| Backend scaffold | Spring Boot 3.3, Java 17, Maven — web, security, JPA, JWT, H2 for tests |
| User entity | User.java — email, bcrypt password, name, evolutionStage, evolutionPoints, streak |
| Auth endpoints | POST /api/auth/register + POST /api/auth/login — returns JWT |
| JWT security | JwtUtil, JwtFilter, SecurityConfig — stateless Bearer token |
| Backend CI | backend-ci.yml — mvn verify on push/PR |
| Auth screens | LoginScreen.js + RegisterScreen.js — dark UI, gold buttons, validation |
| API client | src/api/client.js — Axios with JWT interceptor |
| AuthContext | aroha_token/aroha_user — AsyncStorage persistence across sessions |
| End-to-end auth | Register → Spring Boot → PostgreSQL → JWT → Home. Working. |
| Meal entity | Meal.java — name, category, region, macros per 100g, serving, isCustom, createdBy |
| Indian food DB | 170+ foods — dals, rice, roti, sabzi, snacks, dairy, Konkan, street food, proteins, beverages |
| Meal endpoints | GET /api/meals/search (auth-aware), /category/{cat}, /all, POST /api/meals/custom |
| DailyLog entity | daily_logs table — pre-calculated macros per entry |
| Daily log endpoints | POST /api/logs, GET /api/logs/today, DELETE /api/logs/{id} |
| MacrosScreen | Search, serving size modal (½×/1×/1½×/2×/custom + live preview), custom food builder, daily log, calorie ring |
| Exercise library | 34 exercises — strength, cardio, yoga, flexibility (Surya Namaskar included) |
| WorkoutScreen | Category tabs, log modal (sets/reps/weight), today's session summary, AI Generate button |
| AI Workout Generator | 4-step flow: duration → type → preview → live session timer (work/rest phases) |
| Habit entity | Habit.java + HabitLog.java — userId, name, color, icon, daily log |
| Habit endpoints | POST/GET/DELETE /api/habits, toggle, monthly |
| HabitScreen | Weekly grid, week nav, metrics table, chart (Day/Week/Month) |
| Task entity | Task.java — title, date, time slot, completed, carriedForward |
| Task endpoints | POST/GET/PATCH/DELETE tasks, carry-forward |
| PlannerScreen | Date nav, stats bar, time-blocked schedule, to-do, carry forward, FAB |
| WaterLog entity | Daily glasses count + goal per user |
| SleepLog entity | Sleep/wake time, quality (1–5), duration |
| Wellness endpoints | water today/add/remove, sleep |
| Water widget | Home screen counter, +/- buttons, progress bar, voice mic |
| Hindi/Marathi voice | expo-speech — 5 regional reminder phrases |
| WellnessModal | Sleep tab + Voice tab |
| User profile fields | age, weightKg, heightCm, healthGoal, waterGoalGlasses, profileComplete |
| Profile endpoints | GET /api/profile (BMI + TDEE), PATCH /api/profile |
| OnboardingScreen | 3-step: body stats → health goal → water goal → Begin Your Evolution |
| ProfileScreen | Stage, EP, BMI grid, TDEE, health goal, health attributes, evolution history, settings gear |
| Rebrand | Nira → Aroha — all folders, packages, UI strings, field names, storage keys, README, dev journal |
| Evolution Engine | Mission entity, daily generation, EP award, stage auto-advance, health attributes (0–100), stage-up animation |
| Live Missions | HomeScreen pulls missions from backend, completeMission API, stagedUp flag handling |
| Edit Profile | ProfileScreen edit mode — age, weight, height (cm/ft toggle), water goal, health goal |
| Health Attributes | ProfileScreen displays Strength/Discipline/Recovery/Nutrition progress bars |
| Evolution History | EvolutionLog entity, EvolutionController GET /api/evolution/history, ProfileScreen timeline |
| Settings Screen | Notification toggles, EN/HI/MR language selector, About — persisted to AsyncStorage |
| Language Toggle | LanguageContext (EN/HI/MR), useLanguage hook, t(key) translations, HomeScreen + ProfileScreen + SettingsScreen |
| Flask AI service | app.py + routes: POST /ai/meal-plan, /ai/chat, /ai/insights — Ollama (llama3.2) |
| Spring Boot AI proxy | AiService + AiController — /api/ai/meal-plan, /api/ai/chat, /api/ai/insights (JWT-protected) |
| AiScreen modal | 3-tab modal: Chat (bubbles), Meal Plan (generate), Insights — accessed via ✨ on HomeScreen |

---

## What's Left

### Phase 11 — Evolution Engine ✅ COMPLETE
- [x] Mission entity — title, type (daily/weekly), epReward, category
- [x] Daily mission generation based on user history + weak attributes
- [x] EP award on mission completion → stage auto-advance
- [x] Consistency Score — 30-day rolling habit completion % replaces streak
- [x] Health Attributes — Strength, Discipline, Recovery, Nutrition (0–100)
- [x] Attribute update logic — missions contribute to relevant attribute
- [x] Evolution moment — stage-up celebration animation on mobile
- [x] Home screen pulls live missions from backend (replace hardcoded)
- [ ] Weekly mission generation — bigger goals, bigger EP (future)
- [ ] Achievements system (future)
- [ ] Boss Battles — large monthly goals (future)

---

### Phase 10 — Python Flask AI Layer ✅ COMPLETE
- [ ] Set up Python venv in aroha-ai/ (manual — run setup commands below)
- [x] Flask boilerplate + Ollama connection (app.py, services/ollama.py)
- [x] AI meal planner — POST /ai/meal-plan (macros + region → Indian meal plan)
- [x] AI fitness chatbot — POST /ai/chat (exercise advice, form tips, motivation)
- [x] Habit + nutrition insights — POST /ai/insights
- [x] Spring Boot calls Flask via HTTP (AiService + AiController)
- [x] Mobile UI — AiScreen modal (3 tabs: Chat, Meal Plan, Insights) via ✨ on HomeScreen

---

### Phase 5 (Remaining) — Nutrition
- [x] Serving size modal on meal add (½×/1×/1½×/2×/custom grams, live macro preview)
- [x] Custom food builder with custom macros (name, cal/prot/carb/fat, category, serving unit)
- [x] Indian food DB → 170+ items (52 seed + 120 expansion, Konkan priority)
- [ ] Meal templates — save common combos
- [ ] Non-standard quantities (1 bowl, half plate) — covered by serving size modal

---

### Phase 6 (Remaining) — Workout
- [x] AI Workout Generator — 4-step flow: duration → type → preview → session with live timer
- [x] Rest timer between sets — built into session timer (work/rest phase state machine)
- [ ] Gym machine exercises (add to exercise library)
- [ ] Muscle visualization per exercise
- [ ] Exercise form guide (animated demo)
- [ ] Weekly progress graph
- [ ] Personal records (PR) tracker
- [x] **AI Workout Generator + Session Timer**
  - Duration selector, workout type picker, generated plan preview, live session screen with rest countdown

---

### Phase 7 (Remaining) — Habits
- [ ] Consistency Score per habit
- [ ] Streak freeze (earned via EP)
- [ ] Monthly achievement badges
- [ ] Habit insights screen

---

### Phase 12 — Profile ✅ COMPLETE
- [x] Edit profile after onboarding
- [x] Health Attributes display (Strength / Discipline / Recovery / Nutrition)
- [x] Evolution history — log of stage-ups (EvolutionLog entity + timeline UI)
- [x] Hindi/Marathi language toggle (LanguageContext, translations EN/HI/MR, HomeScreen + ProfileScreen + SettingsScreen)
- [x] Settings screen (notifications toggles, language selector, about)
- [ ] Achievements wall (future)

---

### Phase 13 — Offline-First
- [ ] WatermelonDB or AsyncStorage local storage
- [ ] All features work without internet
- [ ] Background sync on reconnect

---

### Phase 14 — Website & Content Platform
- [ ] Aroha website — wellness knowledge hub
- [ ] Articles, guides, blogs (fitness, nutrition, recovery, habits)
- [ ] AI-recommended articles based on behavior

---

### Phase 15 — Deployment (Aroha v1.0)
- [ ] Docker containerize Spring Boot
- [ ] Deploy to AWS EC2
- [ ] PostgreSQL on RDS or EC2
- [ ] Release APK build
- [ ] Play Store setup

---

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Dev environment ready | Done |
| 2 | React Native scaffold on emulator | Done |
| 3 | Home screen — Evolution UI + missions | Done |
| 4 | 5-tab navigation | Done |
| 5 | Spring Boot + JWT auth | Done |
| 6 | Auth flow — login/register | Done |
| 7 | Nutrition — 170+ Indian foods + macro tracker | Done |
| 8 | Workout logger + 34 exercises + AI generator + session timer | Done |
| 9 | Habit tracker — weekly grid, metrics, chart | Done |
| 10 | Planner — time-blocked + to-do + carry forward | Done |
| 11 | Reminders — water, sleep, Hindi/Marathi voice | Done |
| 12 | Profile + onboarding — BMI, TDEE, health goal | Done |
| 13 | Rebrand Nira → Aroha (codebase + repo) | Done |
| 14 | Evolution Engine — missions, EP, stages, attributes | Done |
| 15 | Phase 12 — Health Attributes, Evolution History, Settings, i18n | Done |
| 16 | Phase 10 — Flask AI (meal plan, chat, insights) + AiScreen | Done |
| 17 | Phase 5 — Serving size modal, custom food builder, 170+ DB | Done |
| 18 | Flask AI — full Ollama integration + venv setup | Pending |
| 19 | Website + content platform | Pending |
| 20 | Full deployment (EC2 + APK + Play Store) | Pending |

---

## Ecosystem Vision

```
Aroha (wellness) + HealthBridge (medical) + IoT Layer
         = India's own health evolution platform
```

**Aroha** — AI wellness evolution app. Nutrition, workouts, habits, EP system, AI coaching.

**HealthBridge** — AI diagnostic assistant for underserved communities.

**IoT Layer** — Smart fitness hardware (future). ESP32 sensors → auto-log workouts.

---

## Notes & Decisions

| Decision | Why |
|---|---|
| Aroha over Nira | Unique, meaningful. Maori for love/compassion. Globally pronounceable. |
| Evolution System | Original identity. Deeper than ranks. Attributes + stages + missions = real system. |
| com.aroha | Clean, short, future-proof for Play Store. |
| JavaScript not TypeScript | Less overhead for beginner. Add TS when stable. |
| Flask AI microservice | Isolated from Spring Boot. Swap models freely. |
| Ollama | Zero API cost in dev. Full privacy. |
| Offline-first | Rural India, low connectivity. Privacy-first design. |

---

_Updated: 2026-06-05 — Phase 12 ✅, Phase 10 ✅, Phase 5 (partial) ✅, Phase 6 (partial) ✅. Open PRs: phase-12-evolution-history, phase-12-settings-language, phase-10-flask-ai, phase-5-nutrition._

<!-- Session log -->
<!-- 2026-05-28: Mobile scaffold + home screen + backend JWT done. -->
<!-- 2026-05-29: Auth, nutrition, workout, habits, planner, reminders, profile all built. -->
<!-- 2026-06-02: Phase 12 complete. Home PC setup done. -->
<!-- 2026-06-04: Full rebrand Nira → Aroha. Evolution System designed. -->
<!-- 2026-06-04: Rebrand executed in codebase — all packages, folders, UI strings, field names updated. -->
<!-- 2026-06-05: Rebrand checklist closed. README written. Phase 11 complete — missions, EP, stages, health attributes, stage-up animation. -->
<!-- 2026-06-05: Phase 12 complete — Evolution History, Settings, Language Toggle (EN/HI/MR). -->
<!-- 2026-06-05: Phase 10 complete — Flask AI service (meal plan, chat, insights) + Spring Boot proxy + AiScreen modal. -->
<!-- 2026-06-05: Phase 6 partial — AI Workout Generator + session timer with work/rest phases. -->
<!-- 2026-06-05: Phase 5 partial — serving size modal, custom food builder, 120 new foods (170+ total). -->
<!-- 2026-06-05 (session 2): Aroha AI modal live (Chat + Meal Plan + Insights). Workout Generator live (duration → type → preview → session timer + rest timer + complete screen). Rebrand fully visible on emulator. New tweaks queued: add custom exercise inside workout session, AI screen upgrades, gym machine exercises, more Indian foods. -->

---
## Tweaks & Upgrades Queue (added 2026-06-05)

### AI Screen (AiScreen.js) Upgrades
- [ ] Chat tab — wire to real Flask endpoint when Ollama ready (POST /api/ai/chat)
- [ ] Chat tab — streaming response (typewriter effect as AI replies)
- [ ] Chat tab — conversation history persists within session
- [ ] Chat tab — suggested quick questions ("How do I improve pull-ups?", "Best Indian protein sources?")
- [ ] Meal Plan tab — auto-fill calorie target from user's TDEE in profile
- [ ] Meal Plan tab — wire to Flask when ready (POST /api/ai/meal-plan)
- [ ] Meal Plan tab — save generated plan to use in macro tracker
- [ ] Insights tab — wire to real habit + nutrition data from backend
- [ ] Insights tab — wire to Flask when ready (POST /api/ai/insights)

### Workout Session Upgrades
- [ ] Add custom exercise inside active session — "+" button → name + sets/reps → logs with session
- [ ] Session summary saved to WorkoutLog after "Done" tapped
- [ ] Generated workout plan saved to backend (POST /api/workouts/generated)
- [ ] Session summary screen — total volume, total time, exercises done
- [ ] Share session (future — screenshot card)

### Exercise Library Expansion
- [ ] Gym machine exercises — bench press, lat pulldown, leg press, cable rows, shoulder press machine
- [ ] Dumbbell exercises — dumbbell curl, lateral raise, Romanian deadlift, goblet squat
- [ ] Indian traditional exercises — Surya Namaskar (full 12-step), Dand (Hindu push-up), Baithak
- [ ] Target: 100+ exercises (currently 34)

### Food Database Expansion
- [x] More Konkan cuisine items — Pomfret Fry, Surmai/Crab/Prawn/Tisre curries, Thalipeeth, Chakli, Pithla, Zunka, Matki Usal, Puran Poli, Shrikhand, Basundi, Rava Laddoo (Phase 5)
- [x] Street food — Vada Pav, Misal Pav, Pav Bhaji, Bhel Puri, Sev Puri, Pani Puri, Ragda, Chole Bhature, Dabeli (Phase 5)
- [x] South Indian — Rasam, Sambhar, Curd/Lemon/Tamarind Rice, Medu Vada, Uttapam, Pesarattu, Pongal, Rava Idli (Phase 5, Idli/Dosa/Vada in original seed)
- [x] North Indian — Chole Bhature, Aloo Paratha, Dal Tadka, Aloo Gobi, Shahi Paneer, Gajar Halwa, Kheer (Phase 5, Lassi/Butter Chicken in original seed)
- [ ] More Konkan remaining — Kaju curry, more fish varieties, Kombdi Vade variations
- [ ] Dry fruits, nuts, seeds — already have almonds/cashews/walnuts; add flaxseed, chia, sunflower seeds
- [ ] Protein supplements — whey, casein, plant protein (per scoop)
- [ ] Target: 500+ items (currently 170+)