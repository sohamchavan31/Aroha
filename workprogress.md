# Nira — Work Progress Log

**Stack:** React Native (Expo) | Spring Boot | Python Flask | PostgreSQL | MongoDB
**Style:** Solo Leveling — daily quests, hunter ranks, intentional screen time
**Dev:** Soham | Solo | 2–4 hrs/day

---

## Current Status
> Phase 2 — Mobile scaffold live. Backend is next.

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

---

## What's Left (Ordered by Priority)

### Phase 3 — Spring Boot Backend
- [ ] Initialize Spring Boot project (Spring Web, Security, JPA, PostgreSQL, JWT)
- [ ] Connect to PostgreSQL — create `nira_db` database
- [ ] Create User entity + repository
- [ ] Add health check endpoint (`GET /api/health`)
- [ ] Set up JWT — register + login endpoints
- [ ] Secure routes with JWT filter

### Phase 4 — Auth Flow (Mobile)
- [ ] Build Register screen UI
- [ ] Build Login screen UI
- [ ] Install Axios for HTTP calls
- [ ] Store JWT token in AsyncStorage
- [ ] Create AuthContext to share login state across screens
- [ ] Protect tabs — redirect to login if not authenticated

### Phase 5 — Macro Tracker
- [ ] Create Meal entity in Spring Boot (name, calories, protein, carbs, fat, cuisine)
- [ ] Seed 50+ Indian foods into PostgreSQL (dal, chawal, roti, sabji, etc.)
- [ ] Build `GET /api/meals/search?q=` endpoint
- [ ] Build MacrosScreen — search + add meals + daily total display
- [ ] Daily macro summary (calories, protein, carbs, fat)

### Phase 6 — Workout Logger
- [ ] Create Workout + WorkoutLog entities
- [ ] Seed common home exercises (push-ups, squats, surya namaskar, etc.)
- [ ] Build WorkoutScreen — log today's exercises + sets/reps
- [ ] Weekly workout summary

### Phase 7 — Python Flask AI Layer
- [ ] Set up Python virtual environment in `nira-ai/`
- [ ] Install Flask, requests, python-dotenv
- [ ] Connect to Ollama (local LLM)
- [ ] Build meal planning endpoint (`POST /ai/meal-plan`) — takes macros goal, returns Indian meal plan
- [ ] Build CBT chatbot endpoint (`POST /ai/chat`) — mental wellness check-in
- [ ] Spring Boot calls Flask via HTTP — AI features exposed through backend

### Phase 8 — Dynamic Quest Engine
- [ ] Quest model in Spring Boot — daily quest generation based on user's history
- [ ] XP system — complete quest → earn XP → rank up
- [ ] Rank calculation: E (0–999 XP) → D (1000–2499) → C (2500–4999) → B (5000–9999) → A (10000+) → S
- [ ] Streak persistence — store in PostgreSQL, reset if day missed
- [ ] Home screen pulls live quests from backend (not hardcoded)

### Phase 9 — Profile & Health Stats
- [ ] Profile screen — name, age, weight, height, health goal
- [ ] Onboarding flow (first launch: collect health data)
- [ ] BMI / TDEE calculator (Indian body composition context)
- [ ] Hindi/Marathi language toggle (i18n setup)

### Phase 10 — Deployment
- [ ] Docker containerize Spring Boot backend
- [ ] Deploy to AWS EC2
- [ ] PostgreSQL on RDS or EC2
- [ ] Build release APK for testing

---

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Dev environment ready (Java 17, Android Studio, emulator) | ✅ Done |
| 2 | React Native app scaffolded and running on emulator | ✅ Done |
| 3 | Home screen — Solo Leveling UI with daily quests | ✅ Done |
| 4 | Bottom tab navigation (Home, Macros, Workout, Profile) | ✅ Done |
| 5 | Spring Boot backend scaffold + health endpoint | ⏳ Next |
| 6 | Auth flow — register/login screens + JWT | Pending |
| 7 | Macro calculator — Indian food database | Pending |
| 8 | Workout logger screen | Pending |
| 9 | Flask AI service + Ollama connected | Pending |
| 10 | Dynamic quest engine (live quests from backend) | Pending |
| 11 | Full deployment (EC2 + APK) | Pending |

---

## Notes & Decisions
- Indian context always comes first — food, language, culture, regional specifics
- Less screen = good health: notifications minimal and purposeful
- JavaScript (not TypeScript) for now — add TS when the app is stable
- React Navigation (not Expo Router) — simpler for beginner, better docs
- No emulator dependency for future builds — will test on physical Android device too

---
_Updated after every work session — 2026-05-28_
