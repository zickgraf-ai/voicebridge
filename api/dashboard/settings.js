// GET /api/dashboard/settings?from=DATE&to=DATE
// Returns settings distribution: button sizes, voice speeds, feature enablement.

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
    return res.end(JSON.stringify({ button_sizes: {}, voice_speeds: [], features: {} }));
  }

  try {
    // Button size distribution
    const buttonSizes = await sql`
      SELECT button_size, COUNT(*)::int AS count
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
        AND button_size IS NOT NULL
      GROUP BY button_size
    `;

    // Voice speed histogram
    const voiceSpeeds = await sql`
      SELECT voice_speed, COUNT(*)::int AS count
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
        AND voice_speed IS NOT NULL
      GROUP BY voice_speed
      ORDER BY voice_speed
    `;

    // Feature enablement
    const total = await sql`
      SELECT COUNT(*)::int AS total
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
    `;

    const features = await sql`
      SELECT
        COUNT(*) FILTER (WHERE smart_suggestions_enabled = true)::int AS smart_suggestions,
        COUNT(*) FILTER (WHERE premium_voice_enabled = true)::int AS premium_voice,
        COUNT(*) FILTER (WHERE location_feature_enabled = true)::int AS location_feature
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
    `;

    const t = total[0]?.total || 0;
    const f = features[0] || {};

    const buttonSizeMap = {};
    for (const r of buttonSizes) {
      buttonSizeMap[r.button_size] = r.count;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      button_sizes: buttonSizeMap,
      voice_speeds: voiceSpeeds.map((r) => ({ speed: r.voice_speed, count: r.count })),
      features: {
        smart_suggestions: t > 0 ? Math.round(1000 * (f.smart_suggestions || 0) / t) / 10 : 0,
        premium_voice: t > 0 ? Math.round(1000 * (f.premium_voice || 0) / t) / 10 : 0,
        location_feature: t > 0 ? Math.round(1000 * (f.location_feature || 0) / t) / 10 : 0,
      },
      total_pings: t,
    }));
  } catch (err) {
    console.error('Dashboard settings error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
