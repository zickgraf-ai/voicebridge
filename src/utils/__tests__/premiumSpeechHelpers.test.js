import { describe, it, expect } from 'vitest';

/**
 * Tests for blob validation logic used in usePremiumSpeech.
 * The minimum valid blob size threshold is 100 bytes — anything smaller
 * is considered corrupt and should be treated as a cache miss.
 */
const MIN_VALID_BLOB_SIZE = 100;

function isValidAudioBlob(blob) {
  return blob && blob.size > MIN_VALID_BLOB_SIZE;
}

describe('blob validation', () => {
  it('rejects null blob', () => {
    expect(isValidAudioBlob(null)).toBeFalsy();
  });

  it('rejects undefined blob', () => {
    expect(isValidAudioBlob(undefined)).toBeFalsy();
  });

  it('rejects blob under 100 bytes', () => {
    const tinyBlob = new Blob(['tiny'], { type: 'audio/mp3' });
    expect(tinyBlob.size).toBeLessThanOrEqual(MIN_VALID_BLOB_SIZE);
    expect(isValidAudioBlob(tinyBlob)).toBeFalsy();
  });

  it('rejects empty blob (0 bytes)', () => {
    const emptyBlob = new Blob([], { type: 'audio/mp3' });
    expect(emptyBlob.size).toBe(0);
    expect(isValidAudioBlob(emptyBlob)).toBeFalsy();
  });

  it('accepts valid blob over 100 bytes', () => {
    const data = 'x'.repeat(200);
    const validBlob = new Blob([data], { type: 'audio/mp3' });
    expect(validBlob.size).toBeGreaterThan(MIN_VALID_BLOB_SIZE);
    expect(isValidAudioBlob(validBlob)).toBeTruthy();
  });

  it('rejects blob of exactly 100 bytes (boundary)', () => {
    const data = 'x'.repeat(100);
    const boundaryBlob = new Blob([data], { type: 'audio/mp3' });
    expect(boundaryBlob.size).toBe(100);
    expect(isValidAudioBlob(boundaryBlob)).toBeFalsy();
  });

  it('accepts blob of 101 bytes (just above boundary)', () => {
    const data = 'x'.repeat(101);
    const justAbove = new Blob([data], { type: 'audio/mp3' });
    expect(justAbove.size).toBe(101);
    expect(isValidAudioBlob(justAbove)).toBeTruthy();
  });
});
