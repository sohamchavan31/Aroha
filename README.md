# Aroha

**AI-powered wellness evolution platform for India.**
Grow physically, mentally, consistently — through Evolution Points, Missions, and Stages.

---

## Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native (Expo SDK 56) |
| Backend | Java 17 + Spring Boot 3.3 |
| AI Service | Python + Flask + Ollama |
| Database | PostgreSQL 16 |
| Auth | Spring Security + JWT |

---

## Evolution System

| Stage | EP Range |
|-------|----------|
| Spark | 0 – 999 |
| Awakened | 1,000 – 2,999 |
| Ascender | 3,000 – 5,999 |
| Guardian | 6,000 – 10,999 |
| Titan | 11,000 – 17,999 |
| Apex | 18,000 – 27,999 |
| Legend | 28,000+ |

---

## What's Built

- JWT auth (register + login)
- Indian food macro tracker (52 foods, Konkan specials)
- Workout logger (34 exercises — strength, cardio, yoga)
- Habit tracker with weekly grid and metrics
- Planner — time-blocked schedule + carry-forward tasks
- Water tracker + Hindi/Marathi voice reminders
- Sleep log
- Profile + onboarding (BMI, TDEE, health goal)
- Evolution Stage badge, EP display, Daily Missions on Home

---

## Structure

```
Aroha/
├── aroha-mobile/     # React Native app
├── aroha-backend/    # Spring Boot API
├── aroha-ai/         # Python Flask AI service (coming soon)
└── docs/
```

---

## Run it in Docker

Everything is in `docker-compose.yml`: the backend, plus optional profiles for the
Cloudflare Tunnel (public HTTPS), the AI coach (Flask + Ollama) and a local Postgres.

```bash
cp .env.example .env                       # fill in DB_*, JWT_SECRET (and the tunnel token to go live)
docker compose up -d --build               # backend on :8080 for the phone on your Wi-Fi
docker compose --profile tunnel up -d      # + live at https://aroha-api.sohrexlabs.com
```

Going live on your PC and later on AWS Lightsail: see [docs/DEPLOY.md](docs/DEPLOY.md).

---

## Website

`website/` is the static site for **aroha.sohrexlabs.com** (landing page, Privacy Policy,
Terms, Account deletion), served by Cloudflare Pages from `main`: build output directory
`website`, no build command.

---

## Database changes (Flyway)

The schema lives in `aroha-backend/src/main/resources/db/migration`:

- `V1__baseline.sql`: every table as of the switch to Flyway. Never edit it.
- `R__reference_data.sql`: the seeded foods and exercises. Edit freely; it re-runs when it changes, and inserts only rows that are missing.
- New entity field or table: add `V2__what_changed.sql` (then V3, …). Hibernate only *validates* the schema now, so the app refuses to start if an entity and the database disagree.

---

## Dev

Solo project — Soham | 2–4 hrs/day
