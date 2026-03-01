import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, isLegacyBackup } from '../crypto.js';

describe('encrypt / decrypt', () => {
  it('round-trips with the same password', async () => {
    const plaintext = '{"name":"Sarah","dob":"1985-01-15"}';
    const password = 'test-password-123';

    const ciphertext = await encrypt(plaintext, password);
    const result = await decrypt(ciphertext, password);

    expect(result).toBe(plaintext);
  });

  it('throws on wrong password', async () => {
    const ciphertext = await encrypt('secret data', 'correct-password');

    await expect(decrypt(ciphertext, 'wrong-password')).rejects.toThrow();
  });

  it('produces different ciphertext for same input (random salt/IV)', async () => {
    const plaintext = 'same input';
    const password = 'same-password';

    const ct1 = await encrypt(plaintext, password);
    const ct2 = await encrypt(plaintext, password);

    expect(ct1).not.toBe(ct2);
  });

  it('output is URL-safe (no +, /, =)', async () => {
    // Encrypt enough data to ensure base64 would normally contain these chars
    const plaintext = 'A'.repeat(200);
    const ciphertext = await encrypt(plaintext, 'password');

    expect(ciphertext).not.toMatch(/[+/=]/);
  });

  it('handles unicode content', async () => {
    const plaintext = 'Hello \u{1F600} \u00E9\u00E0\u00FC \u4F60\u597D';
    const password = 'unicode-pw-\u{1F511}';

    const ciphertext = await encrypt(plaintext, password);
    const result = await decrypt(ciphertext, password);

    expect(result).toBe(plaintext);
  });

  it('rejects truncated ciphertext', async () => {
    const ciphertext = await encrypt('test', 'password');
    const truncated = ciphertext.slice(0, 10);

    await expect(decrypt(truncated, 'password')).rejects.toThrow();
  });

  it('rejects corrupted ciphertext', async () => {
    const ciphertext = await encrypt('test', 'password');
    // Flip some characters in the middle
    const corrupted =
      ciphertext.slice(0, 20) +
      'XXXX' +
      ciphertext.slice(24);

    await expect(decrypt(corrupted, 'password')).rejects.toThrow();
  });
});

describe('isLegacyBackup', () => {
  it('detects old base64 format', () => {
    // Simulate the old backup format: btoa(encodeURIComponent(JSON.stringify(data)))
    const data = { profile: { name: 'Sarah' }, settings: { autoSpeak: true } };
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));

    expect(isLegacyBackup(encoded)).toBe(true);
  });

  it('returns false for encrypted format', async () => {
    const ciphertext = await encrypt('{"test": true}', 'password');

    expect(isLegacyBackup(ciphertext)).toBe(false);
  });

  it('returns false for garbage input', () => {
    expect(isLegacyBackup('not-valid-anything!!!')).toBe(false);
    expect(isLegacyBackup('')).toBe(false);
    expect(isLegacyBackup('abc')).toBe(false);
  });
});
