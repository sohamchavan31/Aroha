# Aroha — Work Progress Log

**Stack:** React Native (Expo) | Spring Boot | Python Flask | PostgreSQL | MongoDB
**Identity:** AI-powered wellness evolution platform — grow physically, mentally, consistently
**Dev:** Soham | Solo | 2–4 hrs/day

---

## Current Status
> Phase 11 Evolution Engine COMPLETE (2026-06-05). Missions, EP, stages, health attributes, live HomeScreen, stage-up animation.
> **NOW: Phase 12 — Profile** — evolution history, achievements wall, language toggle, settings screen.

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
| Meal entity | Meal.java — name, category, region, macros per 100g, serving |
| Indian food DB | 52 foods seeded — dals, rice, roti, sabzi, snacks, dairy, Konkan specials |
| Meal endpoints | GET /api/meals/search?q=, /category/{cat}, /all |
| DailyLog entity | daily_logs table — pre-calculated macros per entry |
| Daily log endpoints | POST /api/logs, GET /api/logs/today, DELETE /api/logs/{id} |
| MacrosScreen | Search, meal results, daily log, calorie ring, macro bars |
| Exercise library | 34 exercises — strength, cardio, yoga, flexibility (Surya Namaskar included) |
| WorkoutScreen | Category tabs, log modal (sets/reps/weight), today's session summary |
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
| ProfileScreen | Stage, EP, BMI grid, TDEE, health goal, logout |
| Rebrand | Nira → Aroha — all folders, packages, UI strings, field names, storage keys, README, dev journal |
| Evolution Engine | Mission entity, daily generation, EP award, stage auto-advance, health attributes (0–100), stage-up animation |
| Live Missions | HomeScreen pulls missions from backend, completeMission API, stagedUp flag handling |
| Edit Profile | ProfileScreen edit mode — age, weight, height (cm/ft toggle), water goal, health goal |
| Health Attributes | ProfileScreen displays Strength/Discipline/Recovery/Nutrition progress bars |

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

### Phase 10 — Python Flask AI Layer
- [ ] Set up Python venv in aroha-ai/
- [ ] Flask boilerplate + Ollama connection
- [ ] AI meal planner — POST /ai/meal-plan (macros + region → Indian meal plan)
- [ ] AI fitness chatbot — POST /ai/chat (exercise advice, form tips, motivation)
- [ ] Habit + nutrition insights — POST /ai/insights
- [ ] Spring Boot calls Flask via HTTP

---

### Phase 5 (Remaining) — Nutrition
- [ ] Serving size modal on meal add
- [ ] Custom food builder with custom macros
- [ ] Indian food DB → 500+ items (Konkan priority)
- [ ] Meal templates — save common combos
- [ ] Non-standard quantities (1 bowl, half plate)

---

### Phase 6 (Remaining) — Workout
- [ ] Gym machine exercises
- [ ] Muscle visualization per exercise
- [ ] Exercise form guide (animated demo)
- [ ] AI workout schedule generator
- [ ] Rest timer between sets
- [ ] Weekly progress graph
- [ ] Personal records (PR) tracker

---

### Phase 7 (Remaining) — Habits
- [ ] Consistency Score per habit
- [ ] Streak freeze (earned via EP)
- [ ] Monthly achievement badges
- [ ] Habit insights screen

---

### Phase 12 — Profile (In Progress)
- [x] Edit profile after onboarding
- [x] Health Attributes display (Strength / Discipline / Recovery / Nutrition)
- [x] Evolution history — log of stage-ups
- [ ] Achievements wall
- [x] Hindi/Marathi language toggle (LanguageContext, translations EN/HI/MR, HomeScreen + ProfileScreen + SettingsScreen)
- [x] Settings screen (notifications toggles, language selector, about)

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
| 7 | Nutrition — 52 Indian foods + macro tracker | Done |
| 8 | Workout logger + 34 exercises | Done |
| 9 | Habit tracker — weekly grid, metrics, chart | Done |
| 10 | Planner — time-blocked + to-do + carry forward | Done |
| 11 | Reminders — water, sleep, Hindi/Marathi voice | Done |
| 12 | Profile + onboarding — BMI, TDEE, health goal | Done |
| 13 | Rebrand Nira → Aroha (codebase + repo) | Done |
| 14 | Evolution Engine — missions, EP, stages, attributes | Next |
| 15 | Flask AI — meal planner, chatbot, insights | Pending |
| 16 | Website + content platform | Pending |
| 17 | Full deployment (EC2 + APK + Play Store) | Pending |

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

_Updated: 2026-06-05 — Phase 11 complete. Phase 12 in progress (edit profile + health attributes done)._

<!-- Session log -->
<!-- 2026-05-28: Mobile scaffold + home screen + backend JWT done. -->
<!-- 2026-05-29: Auth, nutrition, workout, habits, planner, reminders, profile all built. -->
<!-- 2026-06-02: Phase 12 complete. Home PC setup done. -->
<!-- 2026-06-04: Full rebrand Nira → Aroha. Evolution System designed. -->
<!-- 2026-06-04: Rebrand executed in codebase — all packages, folders, UI strings, field names updated. -->
<!-- 2026-06-05: Rebrand checklist closed. README written, AROHA_DEV_JOURNEY.md fully updated, app.json package added, HomeScreen comments fixed. Phase 11 begins. -->
<!-- 2026-06-05: Phase 11 complete. Missions, EP, stages, health attributes, stage-up animation, live HomeScreen. BOM fix committed. Profile edit + height unit toggle added. -->
<!-- 2026-06-05: Phase 12 started. Health Attributes display added to ProfileScreen. ProfileController updated to return attr values. -->
