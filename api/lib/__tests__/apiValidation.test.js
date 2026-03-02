import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock rateLimit to always allow (used by suggest.js, not speak.js)
vi.mock('../rateLimit.js', () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 99, resetIn: 60000 }),
}));

// --- Helpers for speak.js (Edge Function: Request → Response) ---

function makeEdgeRequest(body) {
  return new Request('https://localhost/api/speak', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
    },
    body: JSON.stringify(body),
  });
}

// --- Helpers for suggest.js (Node.js serverless: req/res) ---

function makeReq(body) {
  return {
    method: 'POST',
    body,
    headers: { 'x-forwarded-for': '1.2.3.4' },
    socket: {},
  };
}

function makeRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
    setHeader(key, val) {
      res.headers[key] = val;
    },
    send() {
      return res;
    },
  };
  return res;
}

describe('api/speak — body size limits (Edge Function)', () => {
  let handler;

  beforeEach(async () => {
    const mod = await import('../../speak.js');
    handler = mod.default;
  });

  it('rejects body larger than 2KB with 413', async () => {
    const bigText = 'x'.repeat(500);
    const body = { text: bigText, voice: 'nova', extraJunk: 'y'.repeat(2000) };
    const request = makeEdgeRequest(body);

    const response = await handler(request);

    expect(response.status).toBe(413);
    const data = await response.json();
    expect(data.error).toMatch(/too large/i);
  });

  it('allows body under 2KB', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'mocked',
    });

    const body = { text: 'Hello', voice: 'nova', speed: 1.0 };
    const request = makeEdgeRequest(body);

    process.env.OPENAI_API_KEY = 'test-key';
    const response = await handler(request);
    delete process.env.OPENAI_API_KEY;

    // Should NOT be 413 — it'll hit the OpenAI call and get 500 from mock
    expect(response.status).not.toBe(413);

    globalThis.fetch = originalFetch;
  });
});

describe('api/suggest — body size and array limits', () => {
  let handler;

  beforeEach(async () => {
    const mod = await import('../../suggest.js');
    handler = mod.default;
  });

  it('rejects body larger than 32KB with 413', async () => {
    const body = {
      allPhrases: Array.from({ length: 100 }, (_, i) => `Phrase ${i}`),
      padding: 'x'.repeat(32 * 1024),
    };
    const req = makeReq(body);
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(413);
    expect(res.body.error).toMatch(/too large/i);
  });

  it('rejects allPhrases > 500 items with 400', async () => {
    const body = {
      allPhrases: Array.from({ length: 501 }, (_, i) => `P${i}`),
    };
    const req = makeReq(body);
    const res = makeRes();

    process.env.ANTHROPIC_API_KEY = 'test-key';
    await handler(req, res);
    delete process.env.ANTHROPIC_API_KEY;

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/allPhrases/i);
  });

  it('rejects recentPhrases > 20 items with 400', async () => {
    const body = {
      allPhrases: ['Hello'],
      recentPhrases: Array.from({ length: 21 }, (_, i) => `Recent ${i}`),
    };
    const req = makeReq(body);
    const res = makeRes();

    process.env.ANTHROPIC_API_KEY = 'test-key';
    await handler(req, res);
    delete process.env.ANTHROPIC_API_KEY;

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/recentPhrases/i);
  });

  it('allows valid payloads through', async () => {
    const body = {
      allPhrases: ['Hello', 'Goodbye'],
      recentPhrases: ['Hello'],
    };
    const req = makeReq(body);
    const res = makeRes();

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'mocked',
    });

    process.env.ANTHROPIC_API_KEY = 'test-key';
    await handler(req, res);
    delete process.env.ANTHROPIC_API_KEY;

    expect(res.statusCode).not.toBe(413);
    expect(res.statusCode).not.toBe(400);

    globalThis.fetch = originalFetch;
  });
});
