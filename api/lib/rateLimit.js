// In-memory IP rate limiter for Vercel serverless functions.
// State persists for the warm lifetime of the function instance (~5-15 min).

const ipMap = new Map(); // IP -> { count, resetTime }

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/**
 * Check if a request is within the rate limit.
 * @param {object} req - HTTP request object
 * @param {number} limit - Max requests per window
 * @param {number} windowMs - Window size in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
 */
/** @internal — clears all rate-limit state; used only by tests */
export function _resetForTesting() {
  ipMap.clear();
}

export function checkRateLimit(req, limit, windowMs) {
  const now = Date.now();
  const ip = getClientIp(req);

  // Clean up stale entries to prevent memory leaks
  for (const [key, entry] of ipMap) {
    if (now > entry.resetTime) {
      ipMap.delete(key);
    }
  }

  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetTime) {
    // First request or window expired — start fresh
    ipMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  entry.count += 1;
  const resetIn = entry.resetTime - now;

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining: limit - entry.count, resetIn };
}
