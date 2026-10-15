-- When the user started a timed mission (meditate, breathe, stretch); the
-- server only accepts it as done once the minutes have passed.
ALTER TABLE missions ADD COLUMN IF NOT EXISTS started_at timestamp(6) without time zone;
