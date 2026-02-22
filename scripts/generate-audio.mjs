#!/usr/bin/env node

/**
 * Generate pre-built MP3 audio files for all standard phrases across 6 voices.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs
 *
 * Outputs:
 *   public/audio/<voice>/<md5-hash-12>.mp3  — individual audio files
 *   src/data/audioManifest.json              — phrase→filename mapping per voice
 *
 * Features:
 *   - Resume support: skips phrases already in manifest
 *   - 50ms delay between API calls to avoid rate limits
 *   - Writes manifest after each batch for crash recovery
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'src', 'data', 'audioManifest.json');
const AUDIO_DIR = join(ROOT, 'public', 'audio');

const VOICES = ['nova', 'shimmer', 'alloy', 'echo', 'onyx', 'fable'];
const DELAY_MS = 50;

// ---------------------------------------------------------------------------
// Load phrases from the source file
// We can't import ESM with JSX easily, so we extract ALL_STANDARD_PHRASES
// by evaluating the module. For robustness, we import dynamically.
// ---------------------------------------------------------------------------

async function loadPhrases() {
  // Dynamic import of the phrases module
  const phrasesModule = await import(join(ROOT, 'src', 'data', 'phrases.js'));
  return phrasesModule.ALL_STANDARD_PHRASES;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function md5Short(text) {
  return createHash('md5').update(text).digest('hex').slice(0, 12);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    const manifest = {};
    for (const v of VOICES) manifest[v] = {};
    return manifest;
  }
}

function saveManifest(manifest) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

async function generateAudio(text, voice, apiKey) {
  const resp = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      response_format: 'mp3',
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`OpenAI TTS API error ${resp.status}: ${body}`);
  }

  return Buffer.from(await resp.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is required.');
    console.error('Usage: OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs');
    process.exit(1);
  }

  const phrases = await loadPhrases();
  console.log(`Loaded ${phrases.length} phrases`);

  const manifest = loadManifest();
  let generated = 0;
  let skipped = 0;
  const total = phrases.length * VOICES.length;

  for (const voice of VOICES) {
    if (!manifest[voice]) manifest[voice] = {};

    const voiceDir = join(AUDIO_DIR, voice);
    mkdirSync(voiceDir, { recursive: true });

    for (const phrase of phrases) {
      // Skip if already in manifest and file exists
      if (manifest[voice][phrase]) {
        const filePath = join(voiceDir, manifest[voice][phrase]);
        if (existsSync(filePath)) {
          skipped++;
          continue;
        }
      }

      const filename = md5Short(phrase) + '.mp3';
      const filePath = join(voiceDir, filename);

      try {
        const buffer = await generateAudio(phrase, voice, apiKey);
        writeFileSync(filePath, buffer);
        manifest[voice][phrase] = filename;
        generated++;

        const progress = generated + skipped;
        if (progress % 50 === 0 || progress === total) {
          console.log(`[${progress}/${total}] Generated ${voice}:${phrase.slice(0, 40)}...`);
          saveManifest(manifest);
        }

        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`Failed: ${voice}:${phrase} — ${err.message}`);
        // Save progress and continue
        saveManifest(manifest);
      }
    }
  }

  saveManifest(manifest);
  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Total: ${total}`);
  console.log(`Manifest saved to: ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
