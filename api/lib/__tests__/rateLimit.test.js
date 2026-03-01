import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, _resetForTesting } from '../rateLimit.js';

function makeReq(ip = '1.2.3.4') {
  return { headers: { 'x-forwarded-for': ip }, socket: {} };
}

beforeEach(() => {
  _resetForTesting();
  vi.restoreAllMocks();
});

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const req = makeReq();
    const result = checkRateLimit(req, 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('decrements remaining with each request', () => {
    const req = makeReq();
    checkRateLimit(req, 5, 60_000); // remaining 4
    checkRateLimit(req, 5, 60_000); // remaining 3
    const result = checkRateLimit(req, 5, 60_000); // remaining 2
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks after limit is exceeded', () => {
    const req = makeReq();
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(req, 5, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit(req, 5, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('returns resetIn > 0 when blocked', () => {
    const req = makeReq();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(req, 5, 60_000);
    }
    const blocked = checkRateLimit(req, 5, 60_000);
    expect(blocked.resetIn).toBeGreaterThan(0);
    expect(blocked.resetIn).toBeLessThanOrEqual(60_000);
  });

  it('tracks IPs independently', () => {
    const reqA = makeReq('10.0.0.1');
    const reqB = makeReq('10.0.0.2');

    // Exhaust limit for IP A
    for (let i = 0; i < 3; i++) {
      checkRateLimit(reqA, 3, 60_000);
    }
    expect(checkRateLimit(reqA, 3, 60_000).allowed).toBe(false);

    // IP B should still be allowed
    expect(checkRateLimit(reqB, 3, 60_000).allowed).toBe(true);
  });

  it('resets after the window expires', () => {
    const req = makeReq();
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // Exhaust limit
    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, 3, 1000);
    }
    expect(checkRateLimit(req, 3, 1000).allowed).toBe(false);

    // Advance past the window
    vi.spyOn(Date, 'now').mockReturnValue(now + 1001);
    const result = checkRateLimit(req, 3, 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('cleans up stale entries from other IPs', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // Create entries for two IPs
    checkRateLimit(makeReq('10.0.0.1'), 5, 1000);
    checkRateLimit(makeReq('10.0.0.2'), 5, 1000);

    // Advance past the window and make a request from a new IP
    vi.spyOn(Date, 'now').mockReturnValue(now + 1001);
    checkRateLimit(makeReq('10.0.0.3'), 5, 1000);

    // Old IPs should be cleaned up — verify by checking they get fresh windows
    const result = checkRateLimit(makeReq('10.0.0.1'), 5, 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4); // fresh window, not 3
  });

  it('extracts IP from x-forwarded-for (first entry)', () => {
    const req = { headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' }, socket: {} };
    checkRateLimit(req, 1, 60_000);
    // Second request from same chain should be blocked
    expect(checkRateLimit(req, 1, 60_000).allowed).toBe(false);

    // Different first IP should be independent
    const req2 = { headers: { 'x-forwarded-for': '4.4.4.4, 2.2.2.2' }, socket: {} };
    expect(checkRateLimit(req2, 1, 60_000).allowed).toBe(true);
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = { headers: { 'x-real-ip': '5.5.5.5' }, socket: {} };
    checkRateLimit(req, 1, 60_000);
    expect(checkRateLimit(req, 1, 60_000).allowed).toBe(false);
  });

  it('falls back to socket.remoteAddress when headers are absent', () => {
    const req = { headers: {}, socket: { remoteAddress: '6.6.6.6' } };
    checkRateLimit(req, 1, 60_000);
    expect(checkRateLimit(req, 1, 60_000).allowed).toBe(false);
  });

  it('uses "unknown" when no IP source is available', () => {
    const req = { headers: {}, socket: {} };
    checkRateLimit(req, 1, 60_000);
    expect(checkRateLimit(req, 1, 60_000).allowed).toBe(false);
  });
});
