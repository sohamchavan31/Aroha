# Aroha — Work Progress Log

**Stack:** React Native (Expo) | Spring Boot | Python Flask | PostgreSQL | MongoDB
**Identity:** AI-powered wellness evolution platform — grow physically, mentally, consistently
**Dev:** Soham | Solo | 2–4 hrs/day

---

## Current Status
> Phase 8 + 8b COMPLETE. Edit Profile, Meal Slots, Notifications, and Net Calories all shipped (2026-06-10).
>
> **Completed:**
> ✅ Edit Profile Screen — all onboarding fields editable, macros recomputed on save
> ✅ Meal Slots — Breakfast / Lunch / Dinner / Snack sections with calorie subtotals + slot picker in modal
> ✅ Notifications — water (2h), meals (8am/1pm/7pm), workout (6:30pm), missions (8pm); wired to SettingsScreen toggles
> ✅ Calories Burned → Net Calories — MET-based burn estimate per workout session, Consumed/Burned/Net row in MacrosScreen, weekly burned stat in ProgressScreen
>
> **Next 6 tasks (resuming next session):**
> 5. Progressive Overload Tracking
> 6. Body Measurements (chest/waist/hips/arms/thighs)
> 7. Barcode Scanner
> 8. Goal Date (targetDate + on-track/behind-schedule indicator)
> 9. Progress Photos
> 10. Google Login

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
| Navigation | React Navigation v7, 6 tabs — Home / Macros / Workout / Habits / Planner / Progress |
| Theme | src/constants/colors.js — dark palette (black, gold, purple) |
| Home Screen | Stage badge (SP), greeting, EP display, daily missions, evolution progress bar, water widget, AI button |
| Backend scaffold | Spring Boot 3.3, Java 17, Maven — web, security, JPA, JWT |
| User entity | email, bcrypt password, name, evolutionStage, evolutionPoints, streak |
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
| MacrosScreen | Search, serving size modal (unit stepper + gram presets), recipe builder, daily log, calorie ring |
| Serving unit stepper | Unit-based foods (katori, piece, cup, etc.) show − qty + stepper; grams auto-computed |
| Recipe builder | Create recipe by searching ingredients, set qty per ingredient, live macro preview, servings divider |
| Personalised macro goals | MacrosScreen loads dailyCalorieGoal/Protein/Carb/Fat from /profile instead of hardcoded values |
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
| Onboarding — Phase 1 | 3-step: body stats → health goal → water goal |
| Onboarding — Phase 2 | 5-step: gender/stats → activity level → 9 health goals → preferences → water |
| Onboarding fields | gender, age, weightKg, targetWeightKg, heightCm, activityLevel, healthGoal, weightChangeSpeed, experienceLevel, dietaryPreference, waterGoalGlasses |
| Personalised BMR/TDEE | Mifflin-St Jeor (gender-aware) × activity multiplier → stored TDEE |
| Macro pipeline | TDEE + goal + bulk/cut speed → dailyCalorieGoal, dailyProteinGoal, dailyCarbGoal, dailyFatGoal (stored in DB) |
| Bulk/Cut speeds | Slow/Moderate/Aggressive Cut (−200/−400/−600); Slow/Lean/Aggressive Bulk (+150/+250/+400) |
| Experience level | Beginner / Intermediate / Advanced — stored for future AI workout personalisation |
| Dietary preference | Vegetarian / Eggetarian / Non-Vegetarian / Vegan / Jain — stored for AI meal plans |
| Target weight | targetWeightKg stored — used for goal progress % in ProgressScreen |
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
| WeightLog entity | weight_logs — upsert by date (one entry per day per user) |
| WeightLogController | POST /api/weight-logs (upsert), GET /api/weight-logs/history?days=30 |
| AnalyticsController | GET /api/analytics/summary — avg calories 7d, macro split, workouts this week, habit rate, weight, goal progress % |
| Goal progress | goalProgressPct in analytics — (currentWeight − startWeight) / (targetWeight − startWeight) |
| ProgressScreen | 6th tab — goal progress card, weight cards, 30-day line chart, this-week stats, 7-day macro split |
| profileComplete fix | LoginScreen + RegisterScreen now pass profileComplete to login() — onboarding no longer repeats on re-login |
| Edit Profile Screen | All onboarding fields editable post-onboarding; Profile Details + Macro Targets cards in view mode |
| Meal Slots | Breakfast / Lunch / Dinner / Snack sections in MacrosScreen with calorie subtotals; slot picker in serving modal |
| Notifications | Water (2h interval), meals (8am/1pm/7pm), workout (6:30pm), missions (8pm); wired to SettingsScreen toggles |

---

## What's Left (Ordered by Priority)

### 1 — Edit Profile Screen ✅ DONE (2026-06-09)
- [x] ProfileScreen view mode — Profile Details card + Macro Targets card
- [x] Editable fields: gender, age, weight, target weight, height, activity level, 9 health goals, bulk/cut speed, experience level, dietary preference, water goal
- [x] On save → PATCH /profile → recomputes and stores new macro targets in DB
- [x] All 9 goals shown with color dots

---

### 2 — Meal Slots ✅ DONE (2026-06-09)
- [x] `mealSlot` field added to DailyLog entity (nullable, backward compat)
- [x] MacrosScreen — 4 collapsible sections (Breakfast / Lunch / Dinner / Snack)
- [x] Each section shows calorie subtotal + entry count badge
- [x] Slot picker in serving modal (4 chips); auto-selects by time of day
- [x] "Add to Lunch" button label reflects chosen slot

---

### 3 — Notifications ✅ DONE (2026-06-09)
- [x] expo-notifications permissions requested on login (App.js)
- [x] Water reminder — TIME_INTERVAL every 2 hours
- [x] Meal reminders — DAILY at 8am, 1pm, 7pm
- [x] Workout reminder — DAILY at 6:30pm
- [x] Mission reminder — DAILY at 8pm
- [x] SettingsScreen — meal + workout toggles added with time sub-labels
- [x] All toggles immediately reschedule/cancel their notification
- [ ] Step counter — expo-sensors Pedometer → EP reward (future)

---

### 4 — Calories Burned → Net Calories ✅ DONE (2026-06-10)
Already have workout sessions with duration + type. Use MET values to estimate burn.
- [x] Add calorie burn estimate to WorkoutSession (MET × weight × duration) — `caloriesBurned` field, computed in `WorkoutGeneratorController.saveSession` via MET table per workoutType
- [x] MacrosScreen / ProgressScreen — show Consumed / Burned / Net / Target row — `/logs/today` returns `caloriesBurned` + `netCalories`, displayed in MacroCard
- [x] Net calorie row added below the calorie ring (Consumed → Burned → Net), shown when a workout was logged today
- [x] ProgressScreen — weekly "Burned" stat card via `/analytics/summary` `caloriesBurnedWeek`

---

### 5 — Progressive Overload Tracking
For gym users this is more motivating than calorie counting. One of Aroha's strongest potential differentiators.
- [ ] WorkoutSession sets store exercise name, weight (kg), reps, sets
- [ ] PR detection — compare today's top set per exercise vs all-time best
- [ ] "New PR" badge on WorkoutScreen when a record is beaten
- [ ] Per-exercise history view — e.g. Bench Press: 60×8 → 65×8 (+5kg)
- [ ] Progressive overload chart (weight over time per exercise)

---

### 6 — Body Measurements
Easier to enter than body fat %, gives visible progress when scale weight stalls. Especially valuable for fat-loss users whose weight doesn't change but waist shrinks.
- [ ] BodyMeasurements entity — chest, waist, hips, arms, thighs (cm), loggedDate
- [ ] ProgressScreen — Measurements tab or card (last entry + change from first)
- [ ] Add measurement entry modal (like weight log)
- [ ] Trend chart per measurement (waist over 30 days etc.)

---

### 7 — Barcode Scanner
- [ ] expo-camera → Open Food Facts API (Indian packaged foods)
- [ ] Scan barcode → auto-fill meal search in MacrosScreen
- [ ] Fallback to manual search if barcode not found

---

### 8 — Goal Date
Creates urgency and retention. Shows whether user is on track or behind.
- [ ] Add `targetDate` field to User entity (ISO date string)
- [ ] Collect in onboarding Step 4 (optional, shown for gain/loss goals)
- [ ] Edit Profile — add targetDate picker
- [ ] ProgressScreen Goal Progress card shows:
  - X kg remaining · Y days left
  - Required pace: Zkg/week to hit goal
  - "On Track ✅" or "Behind Schedule ⚠️" based on current pace
- [ ] AnalyticsController returns `targetDate`, `daysRemaining`, `requiredWeeklyDelta`, `onTrack`

---

### 9 — Progress Photos
High engagement — Day 1 / Day 30 / Day 60 comparisons keep users coming back.
- [ ] Date-stamped photo capture (expo-image-picker)
- [ ] Stored locally (AsyncStorage paths), AWS S3 when deployed
- [ ] Milestone prompts: Day 1 / Day 30 / Day 60 / Day 90
- [ ] Side-by-side comparison view

---

### 10 — Google Login
- [ ] "Continue with Google" on LoginScreen
- [ ] Google OAuth2 flow (expo-auth-session)
- [ ] Backend verifies Google token, creates/fetches user, returns JWT

---

### AI Integration Upgrades — QUEUED
Currently AI gets plain prompts ("create a meal plan"). It should use the stored profile context automatically.
- [ ] Flask endpoints inject user profile into every prompt: gender, age, weight, targetWeightKg, healthGoal, activityLevel, experienceLevel, dailyCalorieGoal, dailyProteinGoal, dietaryPreference
- [ ] Meal plan AI uses dietary preference (vegetarian/vegan/jain filters food types)
- [ ] Workout AI uses experienceLevel (beginner gets 3×12, advanced gets 5×5 etc.)
- [ ] Chat AI knows current macros for the day (contextual: "you've had 80g protein today, need 40g more")
- [ ] Smart meal plan saved directly to macro tracker (one tap)

---

### Auth Upgrades — QUEUED (after Google Login)
- [ ] Remove hardcoded STAGE badge from LoginScreen (user not logged in yet)
- [ ] Post-login Evolution Reveal screen — cinematic animated stage reveal before Home loads
  - Dark background, stage name animates in with glow + particles, 2.5s, auto-dismisses
  - 7 MP4 videos (one per stage) generated via Kling AI — integrated via expo-video
  - Fallback: React Native Animated cinematic screen if no video yet
- [ ] Google OAuth2 login — "Continue with Google" button on LoginScreen
- [ ] Apple login — "Continue with Apple" button (required for iOS App Store)
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

### Phase 8 — Analytics & Body Tracking ✅ COMPLETE (2026-06-09)
- [x] Body weight log — daily weight entry, weight_logs table (upsert by date)
- [x] Weight history graph — 30-day bezier line chart (react-native-chart-kit)
- [x] Analytics dashboard — avg calories 7d, macro split bars, workouts this week, habit rate %
- [x] Weight change — current weight + 30-day delta card
- [x] ProgressScreen — 6th tab (trending-up icon), stats cards, macro split horizontal bars
- [x] Goal progress card — Start / Current / Target / Remaining kg + progress bar
- [x] Personalised macro goals — BMR + TDEE + goal pipeline, stored in DB, loaded by MacrosScreen
- [x] Target weight — collected in onboarding, drives goal progress %
- [ ] Body measurements — chest, waist, hips, arms (future)
- [ ] Body fat % tracking — e.g. 22% → 15% (users care more about this than weight)
- [ ] Progress photos — date-stamped (Day 1 / Day 30 / Day 60 / Day 90) — HIGH engagement
- [ ] PR tracker — auto-detect personal records per exercise
- [ ] Workout volume chart — sets × reps per muscle group
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

### Phase 15 — Onboarding UX Improvements
- [ ] Smart Goal Wizard — replace "pick a goal" list with conversational questions:
  - "What best describes you?" → guided to the right goal category
  - Friendlier than a flat list of 9 options
- [ ] Medical Restrictions screen (simple checkbox, for meal filtering only — no medical advice):
  - Diabetes / High BP / Thyroid / None
  - Store on User entity, pass to AI meal plan prompt
- [ ] Onboarding progress save — if user exits mid-onboarding, resume where they left off
- [ ] Show calculated macro targets on final summary step (API call before finish)

---

### Phase 16 — Nutrition UX Upgrades
- [ ] Meal slots — Breakfast / Lunch / Dinner / Snacks sections in MacrosScreen
- [ ] Barcode scanner — expo-camera → Open Food Facts API (Indian packaged foods)
- [ ] Meal templates — save named combos, log all in one tap
- [ ] Net calorie display — consumed minus burned
- [ ] Macro values cross-verification against ICMR/NIN data
- [ ] Dietary preference filtering — vegetarian users don't see non-veg foods in search

---

### Phase 6 (Remaining) — Workout
- [ ] Workout builder — user manually picks exercises, sets, reps (own split)
- [ ] AI assist inside builder — "suggest exercises for Pull day"
- [ ] Gym machine exercises — bench press, lat pulldown, leg press, cable rows
- [ ] Exercise library expansion → 100+ (currently 34)
- [ ] Experience level used in AI workout generation (beginner vs advanced plans)
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
- [ ] AI meal plan respects dietary preference (vegetarian/vegan/jain filtering)
- [ ] AI workout plan uses experienceLevel (beginner vs advanced split)

---

### Phase 23 — Body Composition & Progress Photos (Moved Up)
> High engagement feature — people love Day 1 / Day 30 / Day 60 comparisons

- [ ] Body fat % input + tracking — separate from weight (users care more about 22% → 15%)
- [ ] Progress photos — date-stamped, stored locally (AWS S3 when deployed)
  - Day 1 / Day 30 / Day 60 / Day 90 milestone prompts
  - Side-by-side comparison view
- [ ] Body measurements log — chest, waist, hips, arms, thighs
- [ ] Measurement trend chart
- [ ] Visual body composition dial (fat% vs muscle%)

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
| 4 | 6-tab navigation | Done |
| 5 | Spring Boot + JWT auth | Done |
| 6 | Auth flow — login/register | Done |
| 7 | Nutrition — 170+ Indian foods + macro tracker | Done |
| 8 | Workout logger + AI generator + session save | Done |
| 9 | Habit tracker — weekly grid, metrics, chart | Done |
| 10 | Planner — time-blocked + to-do + carry forward | Done |
| 11 | Reminders — water, sleep, Hindi/Marathi voice | Done |
| 12 | Profile + onboarding v1 — BMI, TDEE, health goal | Done |
| 13 | Rebrand Nira → Aroha | Done |
| 14 | Evolution Engine — missions, EP, stages, attributes | Done |
| 15 | Phase 12 — Health Attributes, History, Settings, i18n | Done |
| 16 | Phase 10 — Flask AI + AiScreen modal | Done |
| 17 | Phase 5 — Serving size modal, recipe builder, 170+ DB | Done |
| 18 | Phase 6 session save — workout saved, custom exercise | Done |
| 19 | Cloud DB — Neon PostgreSQL, multi-machine setup | Done |
| 20 | Phase 8 — Analytics + Body Tracking (weight log, dashboard, goal progress) | Done |
| 21 | Onboarding v2 — gender, activity level, 9 goals, bulk/cut speed, experience, diet | Done |
| 22 | Personalised macros — Mifflin-St Jeor BMR + TDEE + goal pipeline stored in DB | Done |
| 23 | MacrosScreen — unit qty stepper + recipe builder with ingredients | Done |
| 24 | Edit Profile screen — all new onboarding fields editable | Done |
| 25 | Meal slots — Breakfast / Lunch / Dinner / Snacks in MacrosScreen | Done |
| 26 | Notifications — water/meal/workout/mission wired to SettingsScreen | Done |
| 27 | Calories Burned → Net Calories (MET-based from workout sessions) | Done |
| 28 | Progressive Overload Tracking — PR detection, per-exercise history | Pending |
| 29 | Body Measurements — chest, waist, hips, arms, thighs | Pending |
| 30 | Barcode Scanner — Open Food Facts API | Pending |
| 31 | Goal Date — targetDate + on-track/behind-schedule indicator | Pending |
| 32 | Progress Photos — date-stamped Day 1/30/60/90 | Pending |
| 33 | Google Login | Pending |
| 34 | AI profile context — inject gender/goal/macros/diet into every prompt | Pending |
| 35 | Phase 15 — Smart Goal Wizard + Medical Restrictions | Pending |
| 36 | Phase 19 — Admin Panel Phase A | Pending |
| 37 | Phase 20 — Security hardening | Pending |
| 38 | Phase 21 — EC2 deployment + Play Store launch | Pending |
| 39 | Phase 17 — Community features | Pending |
| 40 | Phase 18 — AI smart features | Pending |
| 41 | Phase 22 — Scale + Proxmox migration | Pending |

---

## Competitive Gap Analysis

**Benchmarked against:** HealthifyMe · MyFitnessPal · Nike Training Club · Cult.fit · StrongLifts

| Priority | Feature | Status |
|----------|---------|--------|
| Critical | Body weight log + graph | ✅ Done |
| Critical | Analytics dashboard | ✅ Done |
| Critical | Personalised macro goals (BMR/TDEE) | ✅ Done |
| Critical | Edit Profile screen | ✅ Done |
| Critical | Meal slots (Breakfast/Lunch/Dinner) | ✅ Done |
| Critical | Real push notifications | ✅ Done |
| Critical | Calories Burned → Net Calories | ✅ Done |
| Critical | Progressive Overload Tracking | #5 Next |
| Critical | Barcode scanner | #7 Next |
| Important | Goal Date + on-track indicator | #8 Next |
| Important | Body measurements (waist/chest etc.) | #6 Next |
| Important | Progress photos | #9 Next |
| Important | Google Login | #10 Next |
| Important | AI uses stored profile context | Queued |
| Important | Step counter → EP reward | Phase 9 |
| Important | Body fat % tracking | Phase 23 |
| Important | Dietary preference meal filtering | Queued |
| Important | Experience-based workout AI | Queued |
| Future | Smart Goal Wizard | Phase 15 |
| Future | Medical restrictions for meal filter | Phase 15 |
| Future | Food photo recognition | Phase 18 |
| Future | Wearable integration | Phase 18 |
| Future | Community challenges | Phase 17 |

**Aroha's unique edge:**
- Evolution System (EP/stages/missions) — no competitor has this
- Indian-first food DB (170+ regional items incl. Konkan)
- Multi-language (EN/HI/MR)
- Personalised macros from Mifflin-St Jeor + activity + goal pipeline
- Bulk/Cut pace selector (lean bulk vs aggressive bulk etc.)
- Dietary preference awareness (vegetarian/vegan/jain)
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
| Mifflin-St Jeor over Harris-Benedict | More accurate (±10% vs ±15%). Gender-aware. |
| Store macro targets in DB | Avoids recomputation on every request. AI endpoints can query directly. |
| 5-step onboarding | Gender + activity level + goal + preferences (speed/experience/diet) + water — complete picture upfront. |
| Recipe builder (not create food) | Users think in recipes, not raw macro numbers. Ingredient-based is more accurate and intuitive. |

---

_Updated: 2026-06-10 — Edit Profile, Meal Slots, Notifications, Net Calories complete. Resuming next session with #5 Progressive Overload Tracking._

<!-- Session log -->
<!-- 2026-05-28: Mobile scaffold + home screen + backend JWT done. -->
<!-- 2026-05-29: Auth, nutrition, workout, habits, planner, reminders, profile all built. -->
<!-- 2026-06-02: Phase 12 complete. Home PC setup done. -->
<!-- 2026-06-04: Full rebrand Nira → Aroha. Evolution System designed. -->
<!-- 2026-06-05: All phases 10/11/12 complete. Flask AI, AiScreen, workout generator, serving size modal. -->
<!-- 2026-06-07: Workout session save complete. All PRs merged. Competitive analysis done. -->
<!-- 2026-06-08: Neon cloud PostgreSQL live (Singapore). Both office + home PC sharing one DB. Auth upgrades planned. -->
<!-- 2026-06-10: Net Calories (WorkoutSession.caloriesBurned via MET formula, /logs/today returns caloriesBurned + netCalories, MacrosScreen Consumed/Burned/Net row, ProgressScreen weekly Burned stat via /analytics/summary caloriesBurnedWeek). Resuming next session at #5 Progressive Overload Tracking. -->
<!-- 2026-06-09: Phase 8 complete — weight log, analytics dashboard, goal progress card. Onboarding v2 — 5 steps, gender, activity level, 9 goals, bulk/cut pace, experience level, dietary preference. Mifflin-St Jeor BMR pipeline. MacrosScreen — unit qty stepper, recipe builder from ingredients. profileComplete login fix. -->
<!-- 2026-06-09: Priority order revised. Next 10 tasks locked: Edit Profile → Meal Slots → Notifications → Net Calories → Progressive Overload → Body Measurements → Barcode → Goal Date → Progress Photos → Google Login. Goal Date, progressive overload, body measurements, net calories, meal slots, AI profile context all registered as new features. -->
<!-- 2026-06-09: Edit Profile (ProfileScreen full rewrite — view + edit, all onboarding fields), Meal Slots (DailyLog.mealSlot, 4 collapsible sections in MacrosScreen, slot picker in modal), Notifications (notifications.js utility, water/meals/workout/missions scheduled, SettingsScreen wired). Resuming tomorrow at #4 Calories Burned / Net Calories. -->
