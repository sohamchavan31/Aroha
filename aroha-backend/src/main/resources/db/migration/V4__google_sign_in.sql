-- Google sign-in: the Google account an Aroha account is linked to, and
-- whether the user has a password of their own (Google-only accounts don't).
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub character varying(255);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_key ON users (google_sub);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_set boolean NOT NULL DEFAULT TRUE;
