// GET /api/dashboard/suggestions?from=DATE&to=DATE
// Returns suggestion metrics: accepted vs dismissed with acceptance rate.

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
    return res.end(JSON.stringify({ daily: [], total_shown: 0, total_accepted: 0, total_dismissed: 0, acceptance_rate: 0 }));
  }

  try {
    // Daily breakdown
    const daily = await sql`
      SELECT
        received_at::date AS date,
        SUM(suggestions_shown)::int AS shown,
        SUM(suggestions_accepted)::int AS accepted,
        SUM(suggestions_dismissed)::int AS dismissed
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
      GROUP BY received_at::date
      ORDER BY received_at::date
    `;

    // Totals
    const totals = await sql`
      SELECT
        COALESCE(SUM(suggestions_shown), 0)::int AS total_shown,
        COALESCE(SUM(suggestions_accepted), 0)::int AS total_accepted,
        COALESCE(SUM(suggestions_dismissed), 0)::int AS total_dismissed
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
    `;

    const t = totals[0] || {};
    const shown = t.total_shown || 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      daily: daily.map((r) => ({ date: r.date, shown: r.shown, accepted: r.accepted, dismissed: r.dismissed })),
      total_shown: shown,
      total_accepted: t.total_accepted || 0,
      total_dismissed: t.total_dismissed || 0,
      acceptance_rate: shown > 0 ? Math.round(1000 * (t.total_accepted || 0) / shown) / 10 : 0,
    }));
  } catch (err) {
    console.error('Dashboard suggestions error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
