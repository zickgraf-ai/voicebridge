// Vercel Edge Function: POST /api/speak
// Calls OpenAI TTS API to generate speech audio.
// Runs on the Edge Runtime for lower cold-start latency (~50ms vs ~250ms).

export const config = { runtime: 'edge' };

// In-memory rate limiter (per-isolate, same approach as serverless version)
const ipMap = new Map();

function checkRateLimit(ip, limit, windowMs) {
  const now = Date.now();
  for (const [key, entry] of ipMap) {
    if (now > entry.resetTime) ipMap.delete(key);
  }
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetTime) {
    ipMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }
  entry.count += 1;
  const resetIn = entry.resetTime - now;
  if (entry.count > limit) return { allowed: false, remaining: 0, resetIn };
  return { allowed: true, remaining: limit - entry.count, resetIn };
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Rate limit: 30 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const rateCheck = checkRateLimit(ip, 30, 60_000);
  const rateHeaders = {
    'X-RateLimit-Limit': '30',
    'X-RateLimit-Remaining': String(rateCheck.remaining),
    'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateCheck.resetIn) / 1000)),
  };

  if (!rateCheck.allowed) {
    return Response.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { ...rateHeaders, 'Retry-After': String(Math.ceil(rateCheck.resetIn / 1000)) },
    });
  }

  // Body size limit: 2KB
  let body;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 2048) {
      return Response.json({ error: 'Request body too large' }, { status: 413, headers: rateHeaders });
    }
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: rateHeaders });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'OpenAI API key not configured' }, { status: 500, headers: rateHeaders });
  }

  const { text, voice = 'nova', speed = 1.0 } = body;
  if (!text || typeof text !== 'string' || text.length > 500) {
    return Response.json({ error: 'Invalid text (required, max 500 chars)' }, { status: 400, headers: rateHeaders });
  }

  const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  if (!validVoices.includes(voice)) {
    return Response.json({ error: 'Invalid voice' }, { status: 400, headers: rateHeaders });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        input: text,
        voice,
        instructions: 'Speak every word clearly and completely. Do not rush or truncate the ending. Use a calm, friendly pace suitable for someone listening carefully.',
        speed: Math.max(0.25, Math.min(4.0, speed)),
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS error:', response.status, errorText);
      return Response.json({ error: 'TTS API error' }, { status: response.status, headers: rateHeaders });
    }

    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        ...rateHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('TTS request failed:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: rateHeaders });
  }
}
