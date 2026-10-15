# Running Aroha live

Everything runs from `docker-compose.yml` at the repo root. Step 1 runs it on
your PC behind a Cloudflare Tunnel; step 2 moves the same setup to an AWS
Lightsail server. The app always talks to `https://aroha-api.sohrexlabs.com/api`,
so moving machines needs no app update.

```
phone ──HTTPS──▶ Cloudflare ──tunnel──▶ cloudflared ──▶ backend :8080 ──▶ Neon Postgres
                                                          └──▶ ai :5000 ──▶ ollama   (optional)
```

The website (`website/`) is separate: Cloudflare Pages serves it from `main`.

Hostnames are one level under the domain (`aroha-api.sohrexlabs.com`, not
`api.aroha.sohrexlabs.com`): Cloudflare's free certificate only covers
`*.sohrexlabs.com`, so deeper names fail with "can't provide a secure connection".

---

## 1. On your PC (Docker Desktop)

1. **Create the tunnel** (once)
   - Cloudflare dashboard → **Zero Trust → Networks → Tunnels → Create a tunnel**
     → **Cloudflared** → name it `aroha`.
   - On the install screen, copy the long **token** (the part after `--token`).
     Don't run the install command; the container does that.
   - **Public hostname** tab → Add:
     subdomain `aroha-api`, domain `sohrexlabs.com`, service **HTTP** → `backend:8080`.
2. **Fill in `.env`** (repo root): `copy .env.example .env`, then set `DB_*`,
   `JWT_SECRET` and `CLOUDFLARE_TUNNEL_TOKEN`.
3. **Start it**:
   ```powershell
   docker compose --profile tunnel up -d --build
   ```
4. **Check**: `https://aroha-api.sohrexlabs.com/api/health` →
   `{"status":"Aroha backend is running"}`.
   Logs: `docker compose logs -f backend` (Flyway runs on first start).

The API is live only while the PC is on and Docker is running. Docker Desktop →
Settings → General → "Start Docker Desktop when you sign in" keeps it coming back
after a restart (`restart: unless-stopped` brings the containers back).

**AI coach**: add `--profile ai` (and set `AI_INTERNAL_KEY`). It needs about
8 GB of free RAM; the first start downloads the model.

## 2. Moving to Lightsail

1. Lightsail → **Create instance** → Linux **Ubuntu 24.04**, region **Mumbai
   (ap-south-1)**, plan **2 GB RAM** or more (backend only). The AI profile needs
   8 GB+.
2. SSH in (browser button) and install Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker ubuntu && newgrp docker
   ```
3. Get the code and the settings:
   ```bash
   git clone https://github.com/sohamchavan31/Aroha.git && cd Aroha
   git checkout main
   nano .env          # paste the same values as on the PC
   ```
4. **Stop the tunnel on the PC** (`docker compose --profile tunnel down`), then on
   the server:
   ```bash
   docker compose --profile tunnel up -d --build
   ```
   Same tunnel token, same hostname: traffic moves to the server, nothing else
   changes. No inbound ports need opening in the Lightsail firewall.
5. **Updates** after merging to `main`:
   ```bash
   git pull && docker compose --profile tunnel up -d --build
   ```

## Settings reference

| Variable | What |
|---|---|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | Neon (`jdbc:postgresql://<host>/<db>?sslmode=require`) or local (`jdbc:postgresql://db:5432/aroha` with `--profile localdb`) |
| `JWT_SECRET` | Long random string; changing it signs everyone out |
| `CLOUDFLARE_TUNNEL_TOKEN` | From the tunnel's install command |
| `GOOGLE_CLIENT_IDS` | The OAuth **Web** client ID from Google Cloud, for "Continue with Google" (see below). Not a secret |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | The Google Workspace address that sends sign-up and password-reset codes, and an App Password for it (see below). Empty: codes go to the backend log instead |
| `AI_INTERNAL_KEY`, `OLLAMA_MODEL` | AI profile only |
| `BACKEND_PORT` | Host port for Wi-Fi testing (default 8080) |

`.env` is gitignored. Never commit it or paste it anywhere.

## Email codes (sign-up and forgot password)

The backend emails 6-digit codes through Google Workspace SMTP (`smtp.gmail.com:587`).

1. Sign in to the sending account (e.g. `soham@sohrexlabs.com`) at myaccount.google.com.
2. Security → turn on **2-Step Verification** (an admin may need to allow it in
   admin.google.com → Security → Authentication → 2-Step Verification).
3. Security → **App passwords** → create one named `Aroha backend`. Copy the 16 letters.
4. In `.env`:
   ```
   MAIL_USERNAME=soham@sohrexlabs.com
   MAIL_PASSWORD=<the 16 letters, no spaces>
   ```
5. `docker compose --profile tunnel up -d` and sign up with a test email to check it arrives.

Workspace allows about 2,000 emails a day, plenty for codes. Accounts that existed
before email verification count as verified.

## Google sign-in ("Continue with Google")

One-time setup in Google Cloud Console (console.cloud.google.com), project **Aroha**:

1. **OAuth consent screen**: External, app name Aroha, your support email. While it's in
   *Testing*, only the Google accounts listed under *Test users* can sign in.
2. **Clients → Create client → Web application** (`Aroha backend`). Copy its Client ID.
3. **Clients → Create client → Android**: package `com.sohrexlabs.aroha`, SHA-1 from
   `eas credentials -p android` (preview profile → Keystore). When the app is on Google
   Play, add a second Android client with the **App signing key** SHA-1 from Play Console.
4. Put the **Web** client ID in two places:
   - `.env`: `GOOGLE_CLIENT_IDS=<web client id>`, then `docker compose --profile tunnel up -d`
   - `aroha-mobile/eas.json`: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the build profile, then a new EAS build

The button only shows in builds that have the client ID. Google accounts are linked to
an existing Aroha account with the same email.
