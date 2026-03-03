// GET /api/dashboard/overview?from=DATE&to=DATE
// Returns overview cards: daily active pings, avg phrases/day, premium adoption %, suggestion acceptance rate.

import { requireAuth, getDateRange, getSql } from './lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405);
    return res.end();
  }
  if (!requireAuth(req, res)) return;

  const range = getDateRange(req);
  if (!range) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing from/to params' }));
  }

  const sql = getSql();
  if (!sql) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ daily_active_pings: 0, avg_phrases_per_day: 0, premium_adoption_pct: 0, suggestion_acceptance_rate: 0 }));
  }

  try {
    const rows = await sql`
      SELECT
        COUNT(*)::int AS total_pings,
        COUNT(DISTINCT received_at::date)::int AS active_days,
        COALESCE(AVG(prebuilt_total_spoken + custom_total_spoken), 0)::real AS avg_phrases,
        COALESCE(
          100.0 * COUNT(*) FILTER (WHERE premium_voice_enabled = true) / NULLIF(COUNT(*), 0),
          0
        )::real AS premium_pct,
        COALESCE(
          100.0 * SUM(suggestions_accepted) / NULLIF(SUM(suggestions_shown), 0),
          0
        )::real AS suggestion_rate
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
    `;

    const r = rows[0] || {};
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      daily_active_pings: r.active_days > 0 ? Math.round(r.total_pings / r.active_days) : 0,
      avg_phrases_per_day: Math.round((r.avg_phrases || 0) * 10) / 10,
      premium_adoption_pct: Math.round((r.premium_pct || 0) * 10) / 10,
      suggestion_acceptance_rate: Math.round((r.suggestion_rate || 0) * 10) / 10,
    }));
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
