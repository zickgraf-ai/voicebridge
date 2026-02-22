import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock indexedDB before importing module
const mockStore = new Map();
const mockObjectStore = {
  put: vi.fn((blob, key) => {
    mockStore.set(key, blob);
    return { set onsuccess(fn) { fn(); }, set onerror(fn) {} };
  }),
  get: vi.fn((key) => {
    const result = mockStore.get(key) || null;
    return { result, set onsuccess(fn) { fn(); }, set onerror(fn) {} };
  }),
  delete: vi.fn((key) => {
    mockStore.delete(key);
    return { set onsuccess(fn) { fn(); }, set onerror(fn) {} };
  }),
  getAllKeys: vi.fn(() => {
    const result = [...mockStore.keys()];
    return { result, set onsuccess(fn) { fn(); }, set onerror(fn) {} };
  }),
  clear: vi.fn(() => {
    mockStore.clear();
    return { set onsuccess(fn) { fn(); }, set onerror(fn) {} };
  }),
};

const mockTransaction = {
  objectStore: vi.fn(() => mockObjectStore),
};

const mockDB = {
  transaction: vi.fn(() => mockTransaction),
  objectStoreNames: { contains: vi.fn(() => true) },
};

// Mock indexedDB globally
globalThis.indexedDB = {
  open: vi.fn(() => ({
    set onupgradeneeded(fn) {},
    set onsuccess(fn) { fn(); },
    set onerror(fn) {},
    result: mockDB,
  })),
};

// Import after mocking
const { getAudio, putAudio, deleteAudio, hasCachedKeySync } = await import('../audioCache');

describe('deleteAudio', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('deletes a previously stored key', async () => {
    // Store a blob
    await putAudio('nova:Bathroom', new Blob(['audio data'], { type: 'audio/mp3' }));
    expect(mockStore.has('nova:Bathroom')).toBe(true);

    // Delete it
    await deleteAudio('nova:Bathroom');

    // Verify it's gone from the mock store
    expect(mockStore.has('nova:Bathroom')).toBe(false);
  });

  it('getAudio returns null for a deleted key', async () => {
    await putAudio('nova:Hello', new Blob(['hello audio'], { type: 'audio/mp3' }));
    await deleteAudio('nova:Hello');

    const result = await getAudio('nova:Hello');
    expect(result).toBeNull();
  });

  it('does not throw when deleting a non-existent key', async () => {
    await expect(deleteAudio('nonexistent:key')).resolves.not.toThrow();
  });
});

describe('hasCachedKeySync', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('returns false for a key that was never stored', () => {
    expect(hasCachedKeySync('nova:NeverStored')).toBe(false);
  });

  it('returns true after putAudio stores a key', async () => {
    await putAudio('nova:Hello', new Blob(['audio'], { type: 'audio/mp3' }));
    expect(hasCachedKeySync('nova:Hello')).toBe(true);
  });

  it('returns false after deleteAudio removes a key', async () => {
    await putAudio('nova:Goodbye', new Blob(['audio'], { type: 'audio/mp3' }));
    expect(hasCachedKeySync('nova:Goodbye')).toBe(true);

    await deleteAudio('nova:Goodbye');
    expect(hasCachedKeySync('nova:Goodbye')).toBe(false);
  });
});
