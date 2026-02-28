// Vercel serverless function: POST /api/suggest
// Uses Claude Haiku to rank phrase suggestions based on rich context

import { checkRateLimit } from './lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 10 requests per minute per IP
  const rateCheck = checkRateLimit(req, 10, 60_000);
  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(rateCheck.resetIn / 1000)));
    return res.status(429).json({ error: 'Too many requests' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  const {
    time,
    locationLabel,
    recentPhrases = [],
    topFrequencies = [],
    condition,
    medSchedules = [],
    familyNames = [],
    allPhrases = [],
  } = req.body || {};

  if (!allPhrases || allPhrases.length === 0) {
    return res.status(400).json({ error: 'allPhrases is required' });
  }

  const prompt = buildPrompt({
    time,
    locationLabel,
    recentPhrases,
    topFrequencies,
    condition,
    medSchedules,
    familyNames,
    allPhrases,
  });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'AI suggestion failed' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Parse the numbered list response
    const suggestions = parseResponse(text, allPhrases);

    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json({ suggestions });
  } catch (err) {
    console.error('Suggest request failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildPrompt({ time, locationLabel, recentPhrases, topFrequencies, condition, medSchedules, familyNames, allPhrases }) {
  let ctx = `You are an AI assistant for an AAC (Augmentative and Alternative Communication) app. The user cannot speak and communicates by tapping phrase buttons.

Your task: Select and rank the 9 BEST phrases from the available pool for the user RIGHT NOW.

CONTEXT:
- Current time: ${time || new Date().toLocaleTimeString()}`;

  if (locationLabel) ctx += `\n- Location: ${locationLabel}`;
  if (condition) ctx += `\n- Medical condition: ${condition}`;
  if (medSchedules.length > 0) {
    ctx += `\n- Medications: ${medSchedules.map(m => `${m.name} (next dose: ${m.nextDose})`).join(', ')}`;
  }
  if (familyNames.length > 0) {
    ctx += `\n- Family: ${familyNames.join(', ')}`;
  }
  if (recentPhrases.length > 0) {
    ctx += `\n- Last 3 phrases spoken: ${recentPhrases.join(' -> ')}`;
  }
  if (topFrequencies.length > 0) {
    ctx += `\n- Most used phrases: ${topFrequencies.map(f => `"${f.text}" (${f.count}x)`).join(', ')}`;
  }

  ctx += `\n\nAVAILABLE PHRASES (pick exactly 9 from this list):
${allPhrases.join('\n')}

Rules:
1. Pick exactly 9 phrases from the list above
2. Rank them by predicted usefulness RIGHT NOW
3. Consider time of day, recent context, medication schedules, and frequency patterns
4. Don't repeat phrases the user just said (last 3)
5. Include at least one comfort and one medical phrase
6. Response format: numbered list, one phrase per line, EXACTLY as written in the list
7. No explanations, just the numbered list`;

  return ctx;
}

function parseResponse(text, allPhrases) {
  const phraseSet = new Set(allPhrases);
  const lines = text.split('\n').filter(l => l.trim());
  const result = [];

  for (const line of lines) {
    // Strip numbering like "1. " or "1) "
    const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
    if (phraseSet.has(cleaned) && !result.includes(cleaned)) {
      result.push(cleaned);
    }
    if (result.length >= 9) break;
  }

  return result;
}
