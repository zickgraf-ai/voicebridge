// Shared helpers for dashboard API routes.

import { neon } from '@neondatabase/serverless';
import { isAuthenticated } from '../auth.js';

export function requireAuth(req, res) {
  if (!isAuthenticated(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return false;
  }
  return true;
}

export function getDateRange(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (!from || !to) return null;
  return { from, to };
}

export function getSql() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}
