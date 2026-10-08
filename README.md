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

## Run the backend in Docker

The backend can run in Docker instead of `mvn spring-boot:run`. Both ways work.
The database stays on Neon, so only the API runs in the container.

```bash
cp aroha-backend/.env.example aroha-backend/.env   # fill in DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET
docker compose up --build                           # API on http://localhost:8080
docker compose down                                 # stop it
```

- `DB_URL` uses the JDBC form: `jdbc:postgresql://<neon-host>/<db>?sslmode=require`.
- Secrets are never baked into the image; they come from `.env` (gitignored) or the host's settings.
- The image honours `PORT`, so Render (or any host) can run the same Dockerfile.
- The phone still reaches it at `http://<PC Wi-Fi IP>:8080`, just like before.

---

## Database changes (Flyway)

The schema lives in `aroha-backend/src/main/resources/db/migration`:

- `V1__baseline.sql`: every table as of the switch to Flyway. Never edit it.
- `R__reference_data.sql`: the seeded foods and exercises. Edit freely; it re-runs when it changes, and inserts only rows that are missing.
- New entity field or table: add `V2__what_changed.sql` (then V3, …). Hibernate only *validates* the schema now, so the app refuses to start if an entity and the database disagree.

---

## Dev

Solo project — Soham | 2–4 hrs/day
