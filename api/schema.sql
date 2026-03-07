-- TapToSpeak Analytics Database Schema
-- Run this against your Neon Postgres database.
-- Required env var: DATABASE_URL (set in Vercel project settings)

CREATE TABLE IF NOT EXISTS analytics_pings (
  id SERIAL PRIMARY KEY,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  schema_version INTEGER NOT NULL,
  app_version TEXT,
  platform TEXT,
  os_version TEXT,
  locale TEXT,
  button_size TEXT,
  voice_speed REAL,
  smart_suggestions_enabled BOOLEAN,
  premium_voice_enabled BOOLEAN,
  location_feature_enabled BOOLEAN,
  prebuilt_total_spoken INTEGER,
  prebuilt_unique_spoken INTEGER,
  custom_total_spoken INTEGER,
  custom_unique_spoken INTEGER,
  custom_avg_char_length REAL,
  custom_max_char_length INTEGER,
  device_voice_requests INTEGER,
  device_voice_successes INTEGER,
  device_voice_failures INTEGER,
  premium_voice_requests INTEGER,
  premium_voice_successes INTEGER,
  premium_voice_failures INTEGER,
  premium_voice_avg_latency_ms REAL,
  premium_voice_cache_hits INTEGER,
  suggestions_shown INTEGER,
  suggestions_accepted INTEGER,
  suggestions_dismissed INTEGER,
  sessions_today INTEGER,
  total_active_minutes INTEGER
);

CREATE TABLE IF NOT EXISTS phrase_usage (
  id SERIAL PRIMARY KEY,
  ping_id INTEGER NOT NULL REFERENCES analytics_pings(id),
  phrase_id TEXT NOT NULL,
  spoken_count INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phrase_usage_phrase_id ON phrase_usage(phrase_id);
CREATE INDEX IF NOT EXISTS idx_pings_received_at ON analytics_pings(received_at);
