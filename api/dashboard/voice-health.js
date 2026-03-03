// GET /api/dashboard/voice-health?from=DATE&to=DATE
// Returns premium voice health metrics: success rate, latency, cache hit rate, daily trend.

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
    return res.end(JSON.stringify({ success_rate: 0, avg_latency_ms: 0, cache_hit_rate: 0, daily: [] }));
  }

  try {
    // Aggregate metrics
    const agg = await sql`
      SELECT
        COALESCE(SUM(premium_voice_requests), 0)::int AS total_requests,
        COALESCE(SUM(premium_voice_successes), 0)::int AS total_successes,
        COALESCE(SUM(premium_voice_failures), 0)::int AS total_failures,
        COALESCE(
          SUM(premium_voice_avg_latency_ms * premium_voice_requests) / NULLIF(SUM(premium_voice_requests), 0),
          0
        )::real AS avg_latency,
        COALESCE(SUM(premium_voice_cache_hits), 0)::int AS total_cache_hits
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
    `;

    // Daily trend
    const daily = await sql`
      SELECT
        received_at::date AS date,
        SUM(premium_voice_requests)::int AS requests,
        SUM(premium_voice_successes)::int AS successes,
        SUM(premium_voice_failures)::int AS failures
      FROM analytics_pings
      WHERE received_at >= ${range.from}::timestamptz
        AND received_at < (${range.to}::date + interval '1 day')
      GROUP BY received_at::date
      ORDER BY received_at::date
    `;

    const a = agg[0] || {};
    const totalReqs = a.total_requests || 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success_rate: totalReqs > 0 ? Math.round(1000 * a.total_successes / totalReqs) / 10 : 0,
      avg_latency_ms: Math.round(a.avg_latency || 0),
      cache_hit_rate: totalReqs > 0 ? Math.round(1000 * a.total_cache_hits / totalReqs) / 10 : 0,
      daily: daily.map((r) => ({ date: r.date, requests: r.requests, successes: r.successes, failures: r.failures })),
    }));
  } catch (err) {
    console.error('Dashboard voice-health error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
