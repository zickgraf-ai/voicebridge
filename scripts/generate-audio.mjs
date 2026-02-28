#!/usr/bin/env node

/**
 * Generate pre-built MP3 audio files for all standard phrases across 6 voices.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs                    # generate all missing
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs --voice nova       # one voice only
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs --phrase "Turn on TV"  # one phrase only
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs --audit            # audit existing files
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs --regenerate-flagged   # re-gen truncated
 *
 * Outputs:
 *   public/audio/<voice>/<md5-hash-12>.mp3  — individual audio files
 *   src/data/audioManifest.json              — phrase->filename mapping per voice
 *
 * Features:
 *   - Uses gpt-4o-mini-tts model with instructions to prevent truncation
 *   - Appends trailing period to phrases without punctuation (improves TTS endings)
 *   - Duration validation: re-generates up to 2x if audio seems truncated
 *   - Resume support: skips phrases already in manifest (unless --regenerate-flagged)
 *   - 50ms delay between API calls to avoid rate limits
 *   - Writes manifest after each batch for crash recovery
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditFile, auditManifest } from './audit-audio.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'src', 'data', 'audioManifest.json');
const AUDIO_DIR = join(ROOT, 'public', 'audio');

const VOICES = ['nova', 'shimmer', 'alloy', 'echo', 'onyx', 'fable'];
const MODEL = 'gpt-4o-mini-tts';
const TTS_INSTRUCTIONS = 'Speak every word clearly and completely. Do not rush or truncate the ending. Use a calm, friendly pace suitable for someone listening carefully.';
const MAX_RETRIES = 2;
const DELAY_MS = 50;

// ---------------------------------------------------------------------------
// Load phrases from the source file
// ---------------------------------------------------------------------------

async function loadPhrases() {
  const phrasesModule = await import(join(ROOT, 'src', 'data', 'phrases.js'));
  return phrasesModule.ALL_STANDARD_PHRASES;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    audit: args.includes('--audit'),
    regenerateFlagged: args.includes('--regenerate-flagged'),
    voice: null,
    phrase: null,
  };

  const voiceIdx = args.indexOf('--voice');
  if (voiceIdx !== -1 && args[voiceIdx + 1]) {
    flags.voice = args[voiceIdx + 1];
  }

  const phraseIdx = args.indexOf('--phrase');
  if (phraseIdx !== -1 && args[phraseIdx + 1]) {
    flags.phrase = args[phraseIdx + 1];
  }

  return flags;
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

/**
 * Prepare text for TTS: append a period if the phrase doesn't end with punctuation.
 * This helps OpenAI TTS handle the end of short phrases without truncation.
 */
function prepareTtsInput(text) {
  const trimmed = text.trim();
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return trimmed + '.';
}

async function generateAudio(text, voice, apiKey) {
  const input = prepareTtsInput(text);

  const resp = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input,
      voice,
      instructions: TTS_INSTRUCTIONS,
      response_format: 'mp3',
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`OpenAI TTS API error ${resp.status}: ${body}`);
  }

  return Buffer.from(await resp.arrayBuffer());
}

/**
 * Generate audio with duration validation and retry.
 * Returns the buffer if valid, or the best attempt after retries.
 */
async function generateWithValidation(phrase, voice, apiKey) {
  let bestBuffer = null;
  let bestDuration = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`  Retry ${attempt}/${MAX_RETRIES} for ${voice}:"${phrase.slice(0, 40)}"`);
      await sleep(100); // extra delay between retries
    }

    const buffer = await generateAudio(phrase, voice, apiKey);
    const { duration, flagged } = auditFile(buffer, phrase);

    if (!flagged) {
      return buffer; // passes validation
    }

    // Keep the longest attempt as fallback
    if (duration > bestDuration) {
      bestBuffer = buffer;
      bestDuration = duration;
    }
  }

  console.warn(`  WARNING: ${voice}:"${phrase.slice(0, 40)}" still short after ${MAX_RETRIES} retries (${bestDuration.toFixed(2)}s)`);
  return bestBuffer;
}

// ---------------------------------------------------------------------------
// Audit mode
// ---------------------------------------------------------------------------

function runAudit(voiceFilter) {
  console.log('Running audio audit...\n');
  const { results, flaggedCount, missingCount, totalCount } = auditManifest({ voiceFilter });

  const flagged = results.filter(r => r.status !== 'OK');
  if (flagged.length === 0) {
    console.log(`All ${totalCount} audio files passed duration check.`);
    return [];
  }

  console.log(
    'Status'.padEnd(8) +
    'Voice'.padEnd(10) +
    'Actual'.padEnd(8) +
    'Expect'.padEnd(8) +
    'Ratio'.padEnd(8) +
    'Phrase'
  );
  console.log('-'.repeat(70));

  for (const r of flagged) {
    console.log(
      r.status.padEnd(8) +
      r.voice.padEnd(10) +
      (r.duration > 0 ? r.duration.toFixed(2) + 's' : 'N/A').padEnd(8) +
      (r.expected > 0 ? r.expected.toFixed(2) + 's' : 'N/A').padEnd(8) +
      (r.ratio > 0 ? (r.ratio * 100).toFixed(0) + '%' : 'N/A').padEnd(8) +
      r.phrase.slice(0, 50)
    );
  }

  console.log(`\n${flaggedCount} flagged, ${missingCount} missing out of ${totalCount} total.\n`);
  return flagged;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const flags = parseArgs();

  // --audit mode: just report, no generation
  if (flags.audit) {
    const flagged = runAudit(flags.voice);
    process.exit(flagged.length > 0 ? 1 : 0);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is required.');
    console.error('Usage: OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs');
    process.exit(1);
  }

  const allPhrases = await loadPhrases();
  console.log(`Loaded ${allPhrases.length} phrases, using model: ${MODEL}`);

  const manifest = loadManifest();

  // Determine which voice/phrase combos to generate
  let voicesToProcess = flags.voice ? [flags.voice] : VOICES;
  let phrasesToProcess = flags.phrase ? [flags.phrase] : allPhrases;

  // --regenerate-flagged: audit first, then regenerate only flagged entries
  let flaggedSet = null;
  if (flags.regenerateFlagged) {
    const flagged = runAudit(flags.voice);
    if (flagged.length === 0) {
      console.log('Nothing to regenerate.');
      process.exit(0);
    }

    flaggedSet = new Set(flagged.map(r => `${r.voice}::${r.phrase}`));
    // Limit voices/phrases to only those that appear in flagged
    const flaggedVoices = new Set(flagged.map(r => r.voice));
    const flaggedPhrases = new Set(flagged.map(r => r.phrase));
    voicesToProcess = voicesToProcess.filter(v => flaggedVoices.has(v));
    phrasesToProcess = phrasesToProcess.filter(p => flaggedPhrases.has(p));

    console.log(`Regenerating ${flagged.length} flagged files...\n`);
  }

  let generated = 0;
  let skipped = 0;
  const total = voicesToProcess.length * phrasesToProcess.length;

  for (const voice of voicesToProcess) {
    if (!manifest[voice]) manifest[voice] = {};

    const voiceDir = join(AUDIO_DIR, voice);
    mkdirSync(voiceDir, { recursive: true });

    for (const phrase of phrasesToProcess) {
      // In regenerate-flagged mode, only process flagged combos
      if (flaggedSet && !flaggedSet.has(`${voice}::${phrase}`)) {
        skipped++;
        continue;
      }

      // In normal mode, skip if already in manifest and file exists
      if (!flags.regenerateFlagged && !flags.phrase) {
        if (manifest[voice][phrase]) {
          const filePath = join(voiceDir, manifest[voice][phrase]);
          if (existsSync(filePath)) {
            skipped++;
            continue;
          }
        }
      }

      const filename = md5Short(phrase) + '.mp3';
      const filePath = join(voiceDir, filename);

      try {
        const buffer = await generateWithValidation(phrase, voice, apiKey);
        writeFileSync(filePath, buffer);
        manifest[voice][phrase] = filename;
        generated++;

        const progress = generated + skipped;
        if (progress % 10 === 0 || progress === total) {
          console.log(`[${progress}/${total}] ${voice}: "${phrase.slice(0, 40)}"`);
          saveManifest(manifest);
        }

        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`Failed: ${voice}:"${phrase}" — ${err.message}`);
        saveManifest(manifest);
      }
    }
  }

  saveManifest(manifest);
  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Total entries: ${total}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Manifest saved to: ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
