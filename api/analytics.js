// Vercel Serverless Function: POST /api/analytics
// Receives anonymous aggregate analytics pings and stores them in Postgres.
// No user IDs, no device IDs, no IP retention.

import { neon } from '@neondatabase/serverless';
import { checkRateLimit } from './lib/rateLimit.js';

const ALLOWED_ORIGINS = [
  'https://taptospeak.app',
  'https://www.taptospeak.app',
];

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || req.headers.Origin || '';

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(origin));
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { ...corsHeaders(origin), 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  // Set CORS headers for the response
  const cors = corsHeaders(origin);
  for (const [k, v] of Object.entries(cors)) {
    res.setHeader(k, v);
  }

  // Rate limit: 10 requests per IP per hour
  const { allowed, remaining, resetIn } = checkRateLimit(req, 10, 3600_000);
  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetIn / 1000)));

  if (!allowed) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Rate limited' }));
  }

  // Parse body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid JSON' }));
  }

  // Validate
  if (!body || typeof body.schema_version !== 'number') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing schema_version' }));
  }
  if (typeof body.app_version !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing app_version' }));
  }

  // Store in database
  if (!process.env.DATABASE_URL) {
    // No database configured — accept but don't store
    res.writeHead(204);
    return res.end();
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Insert ping into analytics_pings
    const ss = body.settings_snapshot || {};
    const pu = body.phrase_usage || {};
    const preb = pu.prebuilt || {};
    const cust = pu.custom || {};
    const vu = body.voice_usage || {};
    const dv = vu.device_voice || {};
    const pv = vu.premium_voice || {};
    const sug = body.suggestions || {};
    const ses = body.session || {};

    // Build phrase_usage arrays for atomic insert
    const byPhraseId = preb.by_phrase_id || {};
    const phraseEntries = Object.entries(byPhraseId);
    const phraseIds = phraseEntries.map(([id]) => id);
    const spokenCounts = phraseEntries.map(([, count]) => count);

    // Single atomic CTE: inserts the ping row, then inserts phrase_usage rows
    // referencing the new ping_id. When phraseEntries is empty, UNNEST produces
    // zero rows so no phrase_usage rows are inserted, but the CTE still executes.
    await sql`
      WITH new_ping AS (
        INSERT INTO analytics_pings (
          schema_version, app_version, platform, os_version, locale,
          button_size, voice_speed, smart_suggestions_enabled, premium_voice_enabled, location_feature_enabled,
          prebuilt_total_spoken, prebuilt_unique_spoken,
          custom_total_spoken, custom_unique_spoken, custom_avg_char_length, custom_max_char_length,
          device_voice_requests, device_voice_successes, device_voice_failures,
          premium_voice_requests, premium_voice_successes, premium_voice_failures,
          premium_voice_avg_latency_ms, premium_voice_cache_hits,
          suggestions_shown, suggestions_accepted, suggestions_dismissed,
          sessions_today, total_active_minutes
        ) VALUES (
          ${body.schema_version}, ${body.app_version}, ${body.platform || null}, ${body.os_version || null}, ${body.locale || null},
          ${ss.button_size || null}, ${ss.voice_speed || null}, ${ss.smart_suggestions_enabled ?? null}, ${ss.premium_voice_enabled ?? null}, ${ss.location_feature_enabled ?? null},
          ${preb.total_spoken || 0}, ${preb.unique_spoken || 0},
          ${cust.total_spoken || 0}, ${cust.unique_spoken || 0}, ${cust.avg_character_length || null}, ${cust.max_character_length || null},
          ${dv.requests || 0}, ${dv.successes || 0}, ${dv.failures || 0},
          ${pv.requests || 0}, ${pv.successes || 0}, ${pv.failures || 0},
          ${pv.avg_latency_ms || null}, ${pv.cache_hits || 0},
          ${sug.shown || 0}, ${sug.accepted || 0}, ${sug.dismissed || 0},
          ${ses.sessions_today || 0}, ${ses.total_active_minutes || 0}
        ) RETURNING id
      )
      INSERT INTO phrase_usage (ping_id, phrase_id, spoken_count)
      SELECT new_ping.id, u.phrase_id, u.spoken_count
      FROM new_ping, UNNEST(${phraseIds}::text[], ${spokenCounts}::int[]) AS u(phrase_id, spoken_count)
    `;

    res.writeHead(204);
    return res.end();
  } catch (err) {
    console.error('Analytics ingestion error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
