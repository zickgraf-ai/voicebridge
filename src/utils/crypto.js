// AES-256-GCM encryption using Web Crypto API.
// Used for encrypting backup URLs that contain PHI (name, DOB, address, medications).
// Zero dependencies — uses only browser-native APIs.

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

// Base64url encode/decode (URL-safe, no padding)
function toBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext with a password using AES-256-GCM + PBKDF2.
 * Returns a URL-safe base64 string: base64url(salt[16] + iv[12] + ciphertext + tag[16])
 */
export async function encrypt(plaintext, password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Concatenate: salt + iv + ciphertext (includes GCM auth tag)
  const result = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return toBase64Url(result);
}

/**
 * Decrypt a string produced by encrypt() with the same password.
 * Throws on wrong password or corrupted data.
 */
export async function decrypt(encoded, password) {
  const data = fromBase64Url(encoded);

  // Minimum size: salt(16) + iv(12) + tag(16) = 44 bytes
  if (data.length < SALT_BYTES + IV_BYTES + 16) {
    throw new Error('Invalid encrypted data: too short');
  }

  const salt = data.slice(0, SALT_BYTES);
  const iv = data.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const ciphertext = data.slice(SALT_BYTES + IV_BYTES);

  const key = await deriveKey(password, salt);

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(plainBuffer);
  } catch {
    throw new Error('Decryption failed: wrong password or corrupted data');
  }
}

/**
 * Detect old unencrypted base64 backup format.
 * Old format: btoa(encodeURIComponent(JSON.stringify(data)))
 * Returns true if the string decodes to valid JSON with expected keys.
 */
export function isLegacyBackup(encoded) {
  try {
    const json = decodeURIComponent(atob(encoded));
    const data = JSON.parse(json);
    return data !== null && typeof data === 'object' && ('profile' in data || 'settings' in data);
  } catch {
    return false;
  }
}
