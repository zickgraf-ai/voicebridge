// Vercel serverless function: POST /api/speak
// Calls OpenAI TTS API to generate speech audio

import { checkRateLimit } from './lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 30 requests per minute per IP
  const rateCheck = checkRateLimit(req, 30, 60_000);
  res.setHeader('X-RateLimit-Limit', '30');
  res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(rateCheck.resetIn / 1000)));
    return res.status(429).json({ error: 'Too many requests' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const { text, voice = 'nova', speed = 1.0 } = req.body || {};
  if (!text || typeof text !== 'string' || text.length > 500) {
    return res.status(400).json({ error: 'Invalid text (required, max 500 chars)' });
  }

  const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  if (!validVoices.includes(voice)) {
    return res.status(400).json({ error: 'Invalid voice' });
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
      return res.status(response.status).json({ error: 'TTS API error' });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('TTS request failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
