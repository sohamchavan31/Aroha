# Aroha — Work Progress Log

**Stack:** React Native (Expo) | Spring Boot | Python Flask | PostgreSQL | MongoDB
**Identity:** AI-powered wellness evolution platform — grow physically, mentally, consistently
**Dev:** Soham | Solo | 2–4 hrs/day

---

## Current Status
> Phase 12 COMPLETE — Health Attributes, Evolution History, Settings, Language Toggle.
> Phase 10 COMPLETE — Flask AI (meal plan, chat, insights) + Spring Boot proxy + AiScreen modal.
> Phase 6 session save COMPLETE — Workout session saved to backend, custom exercise mid-session.
> Phase 5 partial COMPLETE — Serving size modal, custom food builder, 170+ Indian food DB.
> Cloud DB COMPLETE — Migrated to Neon PostgreSQL (Singapore). Both office + home PC share one DB.
> All open PRs merged to dev.
> Next: Phase 8 (Analytics + Body Tracking) → Phase 9 (Notifications) → Auth upgrades

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

## What's Done

| Area | What was built |
|------|---------------|
| Repo & Git | GitHub repo, branch protection on main, GitHub Flow |
| Environment | Java 17 (Temurin), Android Studio, emulator (Pixel 7, API 34, x86_64) |
| Multi-machine | Office PC + Home PC both running. Neon cloud DB shared across both. |
| Mobile scaffold | Expo SDK 56, blank template, JavaScript |
| Navigation | React Navigation v7, 5 tabs icons-only — Home / Macros / Workout / Habits / Planner |
| Theme | src/constants/colors.js — dark palette (black, gold, purple) |
| Home Screen | Stage badge (SP), greeting, EP display, daily missions, evolution progress bar, water widget, AI button |
| Backend scaffold | Spring Boot 3.3, Java 17, Maven — web, security, JPA, JWT, H2 for tests |
| User entity | User.java — email, bcrypt password, name, evolutionStage, evolutionPoints, streak |
| Auth endpoints | POST /api/auth/register + POST /api/auth/login — returns JWT |
| JWT security | JwtUtil, JwtFilter, SecurityConfig — stateless Bearer token |
| Backend CI | backend-ci.yml — mvn verify on push/PR |
| Cloud DB | Neon PostgreSQL (Singapore) — shared DB for all machines + future EC2 |
| Auth screens | LoginScreen.js + RegisterScreen.js — dark UI, gold buttons, validation |
| API client | src/api/client.js — Axios with JWT interceptor, auto-logout on 401/403 |
| AuthContext | aroha_token/aroha_user — AsyncStorage persistence |
| End-to-end auth | Register → Spring Boot → Neon → JWT → Home. Working. |
| Meal entity | Meal.java — name, category, region, macros per 100g, serving, isCustom |
| Indian food DB | 170+ foods — dals, rice, roti, sabzi, snacks, dairy, Konkan, street food, proteins |
| Meal endpoints | GET /api/meals/search, /category/{cat}, /all, POST /api/meals/custom |
| DailyLog entity | daily_logs — pre-calculated macros per entry |
| Daily log endpoints | POST /api/logs, GET /api/logs/today, DELETE /api/logs/{id} |
| MacrosScreen | Search, serving size modal, custom food builder, daily log, calorie ring |
| Exercise library | 34 exercises — strength, cardio, yoga, flexibility |
| WorkoutScreen | Category tabs, log modal, session summary, AI Generate button |
| AI Workout Generator | Duration → type → preview → live session timer with rest phases |
| WorkoutSession entity | workout_sessions — userId, type, duration, sets, exerciseNames, completedAt |
| Session save API | POST /api/workout/sessions + GET /api/workout/sessions/recent |
| Session save mobile | onFinish() → POST to backend, custom exercise mid-session, richer done screen |
| Habit entity | Habit.java + HabitLog.java — userId, name, color, icon, daily log |
| HabitScreen | Weekly grid, week nav, metrics table, chart (Day/Week/Month) |
| Task entity | Task.java — title, date, time slot, completed, carriedForward |
| PlannerScreen | Date nav, stats bar, time-blocked schedule, to-do, carry forward, FAB |
| WaterLog entity | Daily glasses count + goal per user |
| SleepLog entity | Sleep/wake time, quality (1–5), duration |
| Water widget | Home screen counter, +/- buttons, progress bar, voice mic |
| Hindi/Marathi voice | expo-speech — 5 regional reminder phrases |
| WellnessModal | Sleep tab + Voice tab |
| User profile fields | age, weightKg, heightCm, healthGoal, waterGoalGlasses, profileComplete |
| OnboardingScreen | 3-step: body stats → health goal → water goal → Begin Your Evolution |
| ProfileScreen | Stage, EP, BMI grid, TDEE, health goal, attributes, evolution history, settings |
| Evolution Engine | Mission entity, daily generation, EP award, stage auto-advance, attributes (0–100) |
| Live Missions | HomeScreen pulls missions from backend, completeMission API, stagedUp flag |
| Health Attributes | Strength/Discipline/Recovery/Nutrition progress bars in ProfileScreen |
| Evolution History | EvolutionLog entity, GET /api/evolution/history, ProfileScreen timeline |
| Settings Screen | Notification toggles, EN/HI/MR language selector, About |
| Language Toggle | LanguageContext (EN/HI/MR), useLanguage hook, t(key) translations |
| Flask AI service | app.py + routes: POST /ai/meal-plan, /ai/chat, /ai/insights — Ollama (llama3.2) |
| AiScreen modal | 3-tab modal: Chat, Meal Plan, Insights — accessed via sparkle on HomeScreen |
| Rebrand | Nira → Aroha — all folders, packages, UI strings, field names, storage keys |

---

## What's Left (Ordered by Priority)

### Auth Upgrades — QUEUED
- [ ] Remove hardcoded STAGE badge from LoginScreen (user not logged in yet — don't show stage)
- [ ] Post-login Evolution Reveal screen — cinematic animated stage reveal before Home loads
  - Dark background, stage name animates in with glow + particles, 2.5s, auto-dismisses
  - 7 MP4 videos (one per stage) generated via Kling AI — integrated via expo-video
  - Fallback: React Native Animated cinematic screen if no video yet
- [ ] Google OAuth2 login — "Continue with Google" button on LoginScreen
- [ ] Apple login — "Continue with Apple" button (required for iOS App Store)
- [ ] Email + Password stays as third option
- [ ] Welcome email on registration — via Resend or SendGrid free tier
- [ ] Account deletion — GDPR requirement, deletes user + all cascaded data
- [ ] JWT refresh tokens — longer sessions without re-login
- [ ] Brute force protection — rate limit on /api/auth/login

**Login screen target:**
```
Aroha logo
"Your Evolution Begins Here"
[ Continue with Google ]
[ Continue with Apple  ]
[ Email + Password     ]
```

---

### Phase 8 — Analytics & Body Tracking
- [ ] Body weight log — daily weight entry, weight_logs table
- [ ] Weight history graph — 7/30/90 day line chart
- [ ] Body measurements — chest, waist, hips, arms (cm/inches toggle)
- [ ] Analytics dashboard — calorie avg, macro pie, workout frequency, habit rate, EP per week
- [ ] PR tracker — auto-detect personal records per exercise
- [ ] Workout volume chart — sets x reps per muscle group per week
- [ ] Progress photos — date-stamped local storage
- [ ] Calories burned from workouts → net calorie budget

---

### Phase 9 — Notifications & Engagement
- [ ] expo-notifications — request permissions on first launch
- [ ] Water reminder — configurable interval (every 1-2 hrs)
- [ ] Meal reminder — breakfast/lunch/dinner nudges
- [ ] Workout reminder — daily at user-set time
- [ ] Mission reminder — "2 missions left today" at 8 PM
- [ ] Step counter — expo-sensors Pedometer → EP reward (10k steps = 20 EP)
- [ ] Wire SettingsScreen toggles to actual notification scheduling

---

### Phase 16 — Nutrition UX Upgrades
- [ ] Meal slots — Breakfast / Lunch / Dinner / Snacks sections
- [ ] Barcode scanner — expo-camera → Open Food Facts API (Indian packaged foods)
- [ ] Meal templates — save named combos, log all in one tap
- [ ] Recipe builder — combine ingredients, log as single entry
- [ ] Net calorie display — consumed minus burned
- [ ] Macro values cross-verification against ICMR/NIN data

---

### Phase 6 (Remaining) — Workout
- [ ] Workout builder — user manually picks exercises, sets, reps (own split)
- [ ] AI assist inside builder — "suggest exercises for Pull day"
- [ ] Gym machine exercises — bench press, lat pulldown, leg press, cable rows
- [ ] Exercise library expansion → 100+ (currently 34)
- [ ] Muscle visualization per exercise
- [ ] Exercise form guide (animated demo)
- [ ] Weekly progress graph
- [ ] Progressive overload tracking

---

### Phase 7 (Remaining) — Habits
- [ ] Consistency Score per habit
- [ ] Streak freeze (earned via EP)
- [ ] Monthly achievement badges
- [ ] Habit insights screen

---

### Phase 19 — Admin Panel (for Soham)
> Full web dashboard to manage Aroha without touching code

**Phase A — Core (build before launch)**
- [ ] Admin web app — React + Tailwind, hosted on Vercel
- [ ] Admin login — your email only, separate JWT, no signup
- [ ] Food Manager — add/edit/delete foods, verify macros against ICMR data, bulk import
- [ ] Exercise Manager — add/edit exercises, set muscle groups, upload demo videos
- [ ] Basic user list — view registered users, activity status

**Phase B — Post launch**
- [ ] Analytics dashboard — DAU/MAU, feature usage, retention, most logged foods
- [ ] Push notifications — send announcements to all or specific users
- [ ] Mission builder — create new daily/weekly missions without code changes
- [ ] Evolution config — adjust EP thresholds, stage names, attributes

**Phase C — Growth**
- [ ] Content manager — add articles, guides, blogs
- [ ] Feature flags — turn features on/off per user segment
- [ ] App version control — force update prompts, maintenance mode
- [ ] Revenue analytics (when premium features added)

---

### Phase 20 — Security & Production Hardening
- [ ] HTTPS everywhere — Let's Encrypt + Nginx reverse proxy on EC2
- [ ] Rate limiting — Spring Boot + Bucket4j on all endpoints
- [ ] Input validation — sanitize all API inputs
- [ ] AWS Secrets Manager — replace .properties file secrets on EC2
- [ ] Sentry — crash reporting for mobile + backend
- [ ] Privacy policy page — required for Play Store
- [ ] Terms of service page
- [ ] GDPR compliance — data deletion, export user data on request
- [ ] Neon auto-backups verified + manual weekly export
- [ ] Hikari connection pool tuned for Neon free tier

---

### Phase 21 — Deployment (Aroha v1.0)
- [ ] AWS EC2 t2.micro (free tier) — Ubuntu 22.04, ports 8080 + 443
- [ ] Java 17 on EC2
- [ ] Build jar: mvn package -DskipTests
- [ ] Upload + run jar on EC2
- [ ] Domain: arohaapp.in (~₹800/year)
- [ ] SSL: Let's Encrypt (free)
- [ ] Nginx reverse proxy → https://api.arohaapp.in
- [ ] Update client.js → production URL
- [ ] GitHub Actions auto-deploy on push to main
- [ ] EAS Build — release APK
- [ ] Play Store developer account ($25 one-time)
- [ ] Play Store submission + review (3-7 days)
- [ ] Internal testing with 10-20 real users before public release

---

### Phase 22 — Infrastructure Scaling
> When user growth demands it

- [ ] EC2 t2.micro → t3.small (~$15/month) at ~1000 active users
- [ ] Neon free → Neon Pro ($19/month) at storage limit
- [ ] Multiple EC2 + Load Balancer + Docker at ~10,000 users
- [ ] AWS RDS or self-hosted PostgreSQL on Proxmox at scale
- [ ] Proxmox homelab migration (1-2 years) — full control, zero cloud cost

---

### Phase 17 — Community & Social (Future)
- [ ] Weekly app-wide challenge with leaderboard
- [ ] Friend system — add by username, see Evolution Stage
- [ ] Share session card — shareable workout summary image
- [ ] Community feed (opt-in)

---

### Phase 18 — AI & Smart Features (Future)
- [ ] Food photo recognition — snap meal → AI estimates macros
- [ ] AI form checker — upload workout video → feedback on form
- [ ] Wearable integration — Apple Health + Google Fit
- [ ] Personalized EP multipliers based on consistency patterns
- [ ] Smart meal plan saving — AI plan saved directly to macro tracker

---

### Phase 13 — Offline-First
- [ ] WatermelonDB local storage
- [ ] All features work without internet
- [ ] Background sync on reconnect

---

### Phase 14 — Website & Content Platform
- [ ] Aroha website — wellness knowledge hub
- [ ] Articles, guides, blogs (fitness, nutrition, recovery, habits)
- [ ] AI-recommended articles based on behavior

---

## Long Term Infrastructure Plan

```
Now (dev):
Your PC → Spring Boot (localhost) → Neon DB ✅

Month 1-2 (launch):
EC2 t2.micro → Spring Boot jar → Neon DB
https://api.arohaapp.in

Month 6-12 (growth):
EC2 t3.small + bigger Neon plan
Admin panel on Vercel
GitHub Actions auto-deploy

Year 1-2 (scale):
Multiple EC2 + Load Balancer + Docker
MongoDB added for chat logs
AWS S3 for profile photos + progress photos

Year 2+ (homelab):
Proxmox homelab takes over from EC2
Full control, zero cloud cost
Self-hosted PostgreSQL + MongoDB
```

**Launch cost breakdown:**
| Item | Cost |
|---|---|
| EC2 t2.micro | Free (1 year AWS free tier) |
| Neon PostgreSQL | Free (0.5GB) |
| Domain arohaapp.in | ~₹800/year |
| SSL certificate | Free (Let's Encrypt) |
| Play Store | ₹2100 ($25 one-time) |
| Total | ~₹3000 to launch |

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
| 8 | Workout logger + AI generator + session save | Done |
| 9 | Habit tracker — weekly grid, metrics, chart | Done |
| 10 | Planner — time-blocked + to-do + carry forward | Done |
| 11 | Reminders — water, sleep, Hindi/Marathi voice | Done |
| 12 | Profile + onboarding — BMI, TDEE, health goal | Done |
| 13 | Rebrand Nira → Aroha | Done |
| 14 | Evolution Engine — missions, EP, stages, attributes | Done |
| 15 | Phase 12 — Health Attributes, History, Settings, i18n | Done |
| 16 | Phase 10 — Flask AI + AiScreen modal | Done |
| 17 | Phase 5 — Serving size modal, custom food, 170+ DB | Done |
| 18 | Phase 6 session save — workout saved, custom exercise | Done |
| 19 | Cloud DB — Neon PostgreSQL, multi-machine setup | Done |
| 20 | Auth upgrades — Google OAuth, Apple login, reveal screen | Pending |
| 21 | Phase 8 — Analytics + Body Tracking | Pending |
| 22 | Phase 9 — Real push notifications + step counter | Pending |
| 23 | Phase 16 — Nutrition UX (meal slots + barcode) | Pending |
| 24 | Phase 19 — Admin Panel Phase A | Pending |
| 25 | Phase 20 — Security hardening | Pending |
| 26 | Phase 21 — EC2 deployment + Play Store launch | Pending |
| 27 | Phase 17 — Community features | Pending |
| 28 | Phase 18 — AI smart features | Pending |
| 29 | Phase 22 — Scale + Proxmox migration | Pending |

---

## Competitive Gap Analysis

**Benchmarked against:** HealthifyMe · MyFitnessPal · Nike Training Club · Cult.fit · StrongLifts

| Priority | Feature | Status |
|----------|---------|--------|
| Critical | Body weight log + graph | Phase 8 |
| Critical | Analytics dashboard | Phase 8 |
| Critical | Real push notifications | Phase 9 |
| Critical | Meal slots (Breakfast/Lunch/Dinner) | Phase 16 |
| Critical | Barcode scanner | Phase 16 |
| Important | PR tracker + workout volume | Phase 8 |
| Important | Step counter → EP reward | Phase 9 |
| Important | Macro cross-verification (ICMR/NIN) | Phase 16 |
| Future | Food photo recognition | Phase 18 |
| Future | Wearable integration | Phase 18 |
| Future | Community challenges | Phase 17 |

**Aroha's unique edge:**
- Evolution System (EP/stages/missions) — no competitor has this
- Indian-first food DB (170+ regional items incl. Konkan)
- Multi-language (EN/HI/MR)
- Integrated ecosystem in one dark-theme app

---

## Ecosystem Vision

```
Aroha (wellness) + HealthBridge (medical) + IoT Layer
         = India's own health evolution platform
```

---

## Notes & Decisions

| Decision | Why |
|---|---|
| Aroha over Nira | Unique, meaningful. Maori for love/compassion. Globally pronounceable. |
| Evolution System | Original identity. Deeper than ranks. No IP concerns. |
| Neon cloud DB | One DB for all machines. No local PostgreSQL needed. Free tier sufficient for dev. |
| India first | Aroha is culturally built for India. Win India, then expand. |
| Admin panel for Soham | Manage foods, exercises, missions, users without touching code. |
| EC2 for launch | Free tier 1 year. Simple. Scale later. |
| Proxmox homelab | Long term (1-2 years). Full control, zero cloud cost. |
| JavaScript not TypeScript | Less overhead for beginner. Add TS when stable. |
| Flask AI microservice | Isolated. Swap models freely. |
| Ollama | Zero API cost in dev. Full privacy. |

---

_Updated: 2026-06-08 — Cloud DB live. Auth upgrades planned. Long term infra + admin panel roadmap added._

<!-- Session log -->
<!-- 2026-05-28: Mobile scaffold + home screen + backend JWT done. -->
<!-- 2026-05-29: Auth, nutrition, workout, habits, planner, reminders, profile all built. -->
<!-- 2026-06-02: Phase 12 complete. Home PC setup done. -->
<!-- 2026-06-04: Full rebrand Nira → Aroha. Evolution System designed. -->
<!-- 2026-06-05: All phases 10/11/12 complete. Flask AI, AiScreen, workout generator, serving size modal. -->
<!-- 2026-06-07: Workout session save complete. All PRs merged. Competitive analysis done. -->
<!-- 2026-06-08: Neon cloud PostgreSQL live (Singapore). Both office + home PC sharing one DB. Auth upgrades planned (Google OAuth, Apple login, post-login evolution reveal screen with MP4 per stage). Long term infra roadmap added — EC2 launch, admin panel phases A/B/C, Proxmox homelab year 2. -->