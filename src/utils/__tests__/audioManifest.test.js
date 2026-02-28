import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import manifest from '../../data/audioManifest.json';
import { ALL_STANDARD_PHRASES } from '../../data/phrases.js';

const VOICES = ['nova', 'shimmer', 'alloy', 'echo', 'onyx', 'fable'];
const AUDIO_DIR = join(__dirname, '..', '..', '..', 'public', 'audio');

describe('audioManifest', () => {
  it('has entries for all 6 voices', () => {
    for (const voice of VOICES) {
      expect(manifest).toHaveProperty(voice);
      expect(typeof manifest[voice]).toBe('object');
    }
  });

  it.each(VOICES)('voice "%s" has entries for all standard phrases', (voice) => {
    const entries = manifest[voice];
    const missing = ALL_STANDARD_PHRASES.filter((phrase) => !entries[phrase]);

    if (missing.length > 0) {
      // Show up to 10 missing for debugging
      const preview = missing.slice(0, 10).map((p) => `"${p}"`).join(', ');
      expect(missing).toHaveLength(0,
        `Voice "${voice}" is missing ${missing.length} phrases: ${preview}`
      );
    }

    expect(missing).toHaveLength(0);
  });

  it('has no duplicate filenames within the same voice directory', () => {
    for (const voice of VOICES) {
      const entries = manifest[voice];
      const filenames = Object.values(entries);
      const unique = new Set(filenames);

      if (filenames.length !== unique.size) {
        const dupes = filenames.filter((f, i) => filenames.indexOf(f) !== i);
        expect(dupes).toHaveLength(0,
          `Voice "${voice}" has duplicate filenames: ${dupes.join(', ')}`
        );
      }

      expect(filenames.length).toBe(unique.size);
    }
  });

  it('all manifest mp3 files exist on disk and are > 5KB', () => {
    // Only run this check if the audio directory exists (skipped in CI without audio files)
    if (!existsSync(AUDIO_DIR)) return;

    const problems = [];

    for (const voice of VOICES) {
      const voiceDir = join(AUDIO_DIR, voice);
      if (!existsSync(voiceDir)) continue;

      const entries = manifest[voice];
      for (const [phrase, filename] of Object.entries(entries)) {
        const filePath = join(voiceDir, filename);

        if (!existsSync(filePath)) {
          problems.push(`MISSING: ${voice}/${filename} ("${phrase}")`);
          continue;
        }

        const size = statSync(filePath).size;
        if (size < 5000) {
          problems.push(`TOO SMALL (${size}B): ${voice}/${filename} ("${phrase}")`);
        }
      }
    }

    if (problems.length > 0) {
      const preview = problems.slice(0, 10).join('\n  ');
      expect(problems).toHaveLength(0,
        `Found ${problems.length} file issues:\n  ${preview}`
      );
    }
  });
});
