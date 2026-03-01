import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock rateLimit to always allow
vi.mock('../rateLimit.js', () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 99, resetIn: 60000 }),
}));

// Helper to create mock req/res
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

describe('api/speak — body size limits', () => {
  let handler;

  beforeEach(async () => {
    // Dynamic import to get fresh module after mocks
    const mod = await import('../../speak.js');
    handler = mod.default;
  });

  it('rejects body larger than 2KB with 413', async () => {
    const bigText = 'x'.repeat(500); // valid text length
    const body = { text: bigText, voice: 'nova', extraJunk: 'y'.repeat(2000) };
    const req = makeReq(body);
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(413);
    expect(res.body.error).toMatch(/too large/i);
  });

  it('allows body under 2KB', async () => {
    // Mock fetch so it doesn't actually call OpenAI
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'mocked',
    });

    const body = { text: 'Hello', voice: 'nova', speed: 1.0 };
    const req = makeReq(body);
    const res = makeRes();

    // Set OPENAI_API_KEY for the test
    process.env.OPENAI_API_KEY = 'test-key';
    await handler(req, res);
    delete process.env.OPENAI_API_KEY;

    // Should NOT be 413 — it'll hit the OpenAI call and get 500 from mock
    expect(res.statusCode).not.toBe(413);

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
    // Use very short strings to stay under the 32KB body limit
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

    // Mock fetch to prevent actual API call
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'mocked',
    });

    process.env.ANTHROPIC_API_KEY = 'test-key';
    await handler(req, res);
    delete process.env.ANTHROPIC_API_KEY;

    // Should pass validation — won't be 413 or 400 for array limits
    expect(res.statusCode).not.toBe(413);
    expect(res.statusCode).not.toBe(400);

    globalThis.fetch = originalFetch;
  });
});
