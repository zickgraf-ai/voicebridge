// GET /api/dashboard/phrases?from=DATE&to=DATE
// Returns phrase leaderboard and prebuilt vs custom breakdown.

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
    return res.end(JSON.stringify({ leaderboard: [], prebuilt_total: 0, custom_total: 0 }));
  }

  try {
    // Phrase leaderboard (top 20)
    const leaderboard = await sql`
      SELECT
        pu.phrase_id,
        SUM(pu.spoken_count)::int AS total_count
      FROM phrase_usage pu
      JOIN analytics_pings ap ON ap.id = pu.ping_id
      WHERE ap.received_at >= ${range.from}::timestamptz
        AND ap.received_at < (${range.to}::date + interval '1 day')
      GROUP BY pu.phrase_id
      ORDER BY total_count DESC
      LIMIT 20
    `;

    // Prebuilt vs custom totals
    const totals = await sql`
      SELECT
        COALESCE(SUM(prebuilt_total_spoken), 0)::int AS prebuilt_total,
        COALESCE(SUM(custom_total_spoken), 0)::int AS custom_total
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
    `;

    const t = totals[0] || {};
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      leaderboard: leaderboard.map((r) => ({ phrase_id: r.phrase_id, count: r.total_count })),
      prebuilt_total: t.prebuilt_total || 0,
      custom_total: t.custom_total || 0,
    }));
  } catch (err) {
    console.error('Dashboard phrases error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
