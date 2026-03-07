// Vercel Serverless Function: POST /api/auth
// Simple password-based authentication for the analytics dashboard.
// Uses HMAC-signed cookies for session management.

import { createHmac } from 'crypto';

const COOKIE_NAME = 'tts_dash_auth';
const COOKIE_MAX_AGE = 86400 * 7; // 7 days

function getSecret() {
  return process.env.DASHBOARD_PASSWORD || '';
}

function getSigningKey() {
  // Use a separate signing key if available, otherwise derive from password
  return process.env.DASHBOARD_SIGNING_KEY || getSecret() + '_signing_key';
}

function signToken(payload) {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64url');
  const sig = createHmac('sha256', getSigningKey()).update(encoded).digest('base64url');
  return encoded + '.' + sig;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = createHmac('sha256', getSigningKey()).update(encoded).digest('base64url');
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    // Check expiry
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function parseCookie(cookieHeader) {
  if (!cookieHeader) return {};
  const cookies = {};
  cookieHeader.split(';').forEach((c) => {
    const [key, ...rest] = c.trim().split('=');
    if (key) cookies[key] = rest.join('=');
  });
  return cookies;
}

export function isAuthenticated(req) {
  const cookies = parseCookie(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  return verifyToken(token) !== null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const password = getSecret();
  if (!password) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Dashboard not configured' }));
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid JSON' }));
  }

  if (!body || body.password !== password) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid password' }));
  }

  // Create signed token
  const token = signToken({
    role: 'dashboard',
    iat: Date.now(),
    exp: Date.now() + COOKIE_MAX_AGE * 1000,
  });

  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
  ]);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ ok: true }));
}
