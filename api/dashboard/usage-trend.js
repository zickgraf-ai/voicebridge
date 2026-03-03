// GET /api/dashboard/usage-trend?from=DATE&to=DATE
// Returns daily ping counts for the usage trend chart.

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
    return res.end(JSON.stringify({ data: [] }));
  }

  try {
    const rows = await sql`
      SELECT
        received_at::date AS date,
        COUNT(*)::int AS pings
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
      GROUP BY received_at::date
      ORDER BY received_at::date
    `;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      data: rows.map((r) => ({ date: r.date, pings: r.pings })),
    }));
  } catch (err) {
    console.error('Dashboard usage-trend error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
