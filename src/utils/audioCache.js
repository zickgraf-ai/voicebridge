// IndexedDB wrapper for persistent audio blob storage
// Cache key format: "${voiceName}:${phrase}"

const DB_NAME = 'voicebridge-audio';
const DB_VERSION = 1;
const STORE_NAME = 'audio';

// In-memory set of known cached keys for synchronous lookups.
// Populated by putAudio/getCacheStatus/getAllKeys.
// Used by usePremiumSpeech to decide synchronously (within gesture context)
// whether to fire Web Speech fallback or wait for cached premium audio.
const _knownKeys = new Set();

/**
 * Synchronous check: is this key known to be cached?
 * May return false for keys that ARE cached but haven't been loaded into
 * memory yet (e.g. before getCacheStatus runs). That's safe — it just
 * means Web Speech fallback fires, then gets cancelled when premium loads.
 */
export function hasCachedKeySync(key) {
  return _knownKeys.has(key);
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get an audio blob from cache.
 * @param {string} key - Cache key (e.g., "nova:Hello")
 * @returns {Promise<Blob|null>}
 */
export async function getAudio(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Store an audio blob in cache.
 * @param {string} key - Cache key
 * @param {Blob} blob - Audio blob
 */
export async function putAudio(key, blob) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(blob, key);
      request.onsuccess = () => {
        _knownKeys.add(key);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Silently fail if storage is full
  }
}

/**
 * Check if a key exists in cache.
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export async function hasAudio(key) {
  const blob = await getAudio(key);
  return blob !== null;
}

/**
 * Get all keys in the cache.
 * @returns {Promise<string[]>}
 */
export async function getAllKeys() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = () => {
        const keys = request.result || [];
        for (const k of keys) _knownKeys.add(k);
        resolve(keys);
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Get cache status for a voice.
 * @param {string} voiceName
 * @param {string[]} allPhrases - All expected phrases
 * @returns {Promise<{cached: number, total: number}>}
 */
export async function getCacheStatus(voiceName, allPhrases) {
  try {
    const keys = await getAllKeys();
    const prefix = voiceName + ':';
    const cachedKeys = new Set(keys.filter((k) => k.startsWith(prefix)));
    let cached = 0;
    for (const phrase of allPhrases) {
      if (cachedKeys.has(prefix + phrase)) cached++;
    }
    return { cached, total: allPhrases.length };
  } catch {
    return { cached: 0, total: allPhrases.length };
  }
}

/**
 * Clear all cached audio for a specific voice, or all voices.
 * @param {string} [voiceName] - If provided, only clear this voice
 */
export async function clearAudio(voiceName) {
  try {
    const db = await openDB();
    if (!voiceName) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      _knownKeys.clear();
      return;
    }
    const keys = await getAllKeys();
    const prefix = voiceName + ':';
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        store.delete(key);
        _knownKeys.delete(key);
      }
    }
  } catch {
    // Silently fail
  }
}
