#!/usr/bin/env node

/**
 * Audit all pre-built MP3 audio files for truncation.
 *
 * Reads audioManifest.json, parses each MP3 to calculate actual duration,
 * compares against expected duration (heuristic from word count), and flags
 * files that appear truncated.
 *
 * Usage:
 *   node scripts/audit-audio.mjs              # full audit, tabular report
 *   node scripts/audit-audio.mjs --json       # JSON output for scripting
 *   node scripts/audit-audio.mjs --voice nova # audit one voice only
 */

import { readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'src', 'data', 'audioManifest.json');
const AUDIO_DIR = join(ROOT, 'public', 'audio');

// ---------------------------------------------------------------------------
// MP3 duration calculation via MPEG frame header parsing
// ---------------------------------------------------------------------------

const MPEG_VERSIONS = { 0: 2.5, 1: null, 2: 2, 3: 1 };
const LAYER_INDICES = { 0: null, 1: 3, 2: 2, 3: 1 };

// Bitrate table: [version][layer][bitrateIndex]
// Version 1 = MPEG1, Version 2 = MPEG2/2.5
const BITRATES = {
  1: {
    1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  },
  2: {
    1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  },
};

const SAMPLE_RATES = {
  1: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  2.5: [11025, 12000, 8000],
};

const SAMPLES_PER_FRAME = {
  1: { 1: 384, 2: 1152, 3: 1152 },
  2: { 1: 384, 2: 1152, 3: 576 },
  2.5: { 1: 384, 2: 1152, 3: 576 },
};

/**
 * Parse MPEG frame headers to calculate total duration of an MP3 buffer.
 * Handles VBR by summing frame-by-frame durations.
 */
function getMp3Duration(buffer) {
  let offset = 0;
  let totalDuration = 0;
  let frameCount = 0;

  // Skip ID3v2 tag if present
  if (buffer.length >= 10 &&
      buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    const size = (buffer[6] & 0x7f) << 21 |
                 (buffer[7] & 0x7f) << 14 |
                 (buffer[8] & 0x7f) << 7 |
                 (buffer[9] & 0x7f);
    offset = 10 + size;
  }

  while (offset + 4 < buffer.length) {
    // Find sync word: 11 set bits (0xFF followed by 0xE0+)
    if (buffer[offset] !== 0xFF || (buffer[offset + 1] & 0xE0) !== 0xE0) {
      offset++;
      continue;
    }

    const b1 = buffer[offset + 1];
    const b2 = buffer[offset + 2];

    const versionBits = (b1 >> 3) & 0x03;
    const layerBits = (b1 >> 1) & 0x03;
    const bitrateIndex = (b2 >> 4) & 0x0F;
    const sampleRateIndex = (b2 >> 2) & 0x03;
    const paddingBit = (b2 >> 1) & 0x01;

    const version = MPEG_VERSIONS[versionBits];
    const layer = LAYER_INDICES[layerBits];

    if (!version || !layer || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
      offset++;
      continue;
    }

    const versionKey = version === 1 ? 1 : 2;
    const bitrate = BITRATES[versionKey]?.[layer]?.[bitrateIndex];
    const sampleRate = SAMPLE_RATES[version]?.[sampleRateIndex];
    const samplesPerFrame = SAMPLES_PER_FRAME[version]?.[layer];

    if (!bitrate || !sampleRate || !samplesPerFrame) {
      offset++;
      continue;
    }

    let frameSize;
    if (layer === 1) {
      frameSize = Math.floor((12 * bitrate * 1000 / sampleRate + paddingBit) * 4);
    } else {
      frameSize = Math.floor(samplesPerFrame / 8 * bitrate * 1000 / sampleRate + paddingBit);
    }

    if (frameSize < 1) {
      offset++;
      continue;
    }

    totalDuration += samplesPerFrame / sampleRate;
    frameCount++;
    offset += frameSize;
  }

  return { duration: totalDuration, frameCount };
}

// ---------------------------------------------------------------------------
// Expected duration heuristic
// ---------------------------------------------------------------------------

function expectedDuration(phrase) {
  const words = phrase.trim().split(/\s+/).length;
  // ~0.3s per word + 0.2s padding (mouth open/close, trailing silence)
  return words * 0.3 + 0.2;
}

// ---------------------------------------------------------------------------
// Main audit logic (exported for reuse by generate-audio.mjs)
// ---------------------------------------------------------------------------

export function auditFile(buffer, phrase) {
  const { duration } = getMp3Duration(buffer);
  const expected = expectedDuration(phrase);
  const ratio = duration / expected;
  const flagged = ratio < 0.8;
  return { duration, expected, ratio, flagged };
}

export function auditManifest({ voiceFilter } = {}) {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  const results = [];
  let flaggedCount = 0;
  let missingCount = 0;
  let totalCount = 0;

  const voices = voiceFilter ? [voiceFilter] : Object.keys(manifest);

  for (const voice of voices) {
    const entries = manifest[voice] || {};
    for (const [phrase, filename] of Object.entries(entries)) {
      totalCount++;
      const filePath = join(AUDIO_DIR, voice, filename);

      let buffer;
      try {
        buffer = readFileSync(filePath);
      } catch {
        results.push({ voice, phrase, filename, status: 'MISSING', duration: 0, expected: 0, ratio: 0 });
        missingCount++;
        continue;
      }

      const fileSize = buffer.length;
      const { duration, expected, ratio, flagged } = auditFile(buffer, phrase);

      const status = flagged ? 'FLAGGED' : 'OK';
      if (flagged) flaggedCount++;

      results.push({ voice, phrase, filename, status, duration, expected, ratio, fileSize });
    }
  }

  return { results, flaggedCount, missingCount, totalCount };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const voiceIdx = args.indexOf('--voice');
  const voiceFilter = voiceIdx !== -1 ? args[voiceIdx + 1] : undefined;

  console.log('Auditing audio files...\n');

  const { results, flaggedCount, missingCount, totalCount } = auditManifest({ voiceFilter });

  if (jsonOutput) {
    console.log(JSON.stringify({ results: results.filter(r => r.status !== 'OK'), flaggedCount, missingCount, totalCount }, null, 2));
    process.exit(flaggedCount + missingCount > 0 ? 1 : 0);
  }

  // Tabular output
  const flagged = results.filter(r => r.status !== 'OK');

  if (flagged.length === 0) {
    console.log(`All ${totalCount} audio files passed duration check.`);
    process.exit(0);
  }

  // Print header
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

  console.log(`\n${flaggedCount} flagged, ${missingCount} missing out of ${totalCount} total.`);
  process.exit(1);
}

// Run CLI if invoked directly
const isMainModule = process.argv[1] &&
  fileURLToPath(import.meta.url).endsWith(process.argv[1].replace(/^.*[\\/]/, ''));

if (isMainModule) {
  main();
}
