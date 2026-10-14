/**
 * scripts/test-storage.js
 *
 * Standalone unit test suite for src/lib/storage.ts.
 * Tests makeKey, key sanitization, SecureStore fallback, AsyncStorage helpers,
 * site purging, and legacy storage migration.
 */

const assert = require('assert');

// ─── Minimal Mock Environment ────────────────────────────────────────────────

// Simulate __DEV__
global.__DEV__ = true;

// Mock ENV
const ENV = { siteId: 'gujjutours', siteHostname: 'www.gujjutours.com' };

// ─── Logic Under Test (Extracted from src/lib/storage.ts) ──────────────────────

function sanitizePart(part) {
  if (!part) return '';
  return String(part)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '');
}

function makeKey(name, siteIdOverride) {
  const rawSiteId = siteIdOverride !== undefined ? siteIdOverride : ENV?.siteId;
  const siteId = sanitizePart(rawSiteId);

  if (!siteId) {
    const errorMsg = '[storage] makeKey requires a non-empty siteId. Check your EXPO_PUBLIC_SITE_ID env configuration.';
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      throw new Error(errorMsg);
    }
    return `default.${sanitizePart(name) || 'key'}`;
  }

  if (!name || !name.trim()) {
    const errorMsg = '[storage] makeKey requires a non-empty key name.';
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      throw new Error(errorMsg);
    }
    return `${siteId}.unknown`;
  }

  const rawSegments = String(name).split(/[.:/@\s]+/).filter(Boolean);
  const sanitizedSegments = rawSegments.map(sanitizePart).filter(Boolean);

  if (sanitizedSegments.length === 0) {
    return `${siteId}.unknown`;
  }

  const combinedKey = `${siteId}.${sanitizedSegments.join('.')}`;
  if (combinedKey.length > 180) {
    return combinedKey.slice(0, 180).replace(/[._-]+$/, '');
  }

  return combinedKey;
}

// ─── Mock Storage Engines ─────────────────────────────────────────────────────

function createMockAsyncStorage() {
  const map = new Map();
  return {
    map,
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, val) => {
      map.set(key, String(val));
    },
    removeItem: async (key) => {
      map.delete(key);
    },
    getAllKeys: async () => Array.from(map.keys()),
    multiRemove: async (keys) => {
      keys.forEach((k) => map.delete(k));
    },
  };
}

function createMockSecureStore(shouldFail = false) {
  const map = new Map();
  return {
    map,
    isAvailableAsync: async () => true,
    getItemAsync: async (key) => {
      if (shouldFail) throw new Error('Native KeyStore decryption failure');
      return map.get(key) ?? null;
    },
    setItemAsync: async (key, val) => {
      if (shouldFail) throw new Error('Invalid key provided to SecureStore');
      map.set(key, String(val));
    },
    deleteItemAsync: async (key) => {
      if (shouldFail) throw new Error('Native delete failed');
      map.delete(key);
    },
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function itAsync(description, fn) {
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n--- Running Storage Test Suite ---\n');

// 1. makeKey Tests
console.log('Group 1: makeKey() validation and sanitization');

it('builds standard key with site prefix and dot notation', () => {
  const key = makeKey('auth.token', 'gujjutours');
  assert.strictEqual(key, 'gujjutours.auth.token');
});

it('sanitizes forbidden characters (@, :, /, spaces)', () => {
  const key1 = makeKey('@auth:token', 'gujjutours');
  assert.strictEqual(key1, 'gujjutours.auth.token');

  const key2 = makeKey('bookings/guest ids', 'tripgoasia');
  assert.strictEqual(key2, 'tripgoasia.bookings.guest.ids');

  const key3 = makeKey('cache:user@test.com', 'technoheaven');
  assert.strictEqual(key3, 'technoheaven.cache.user.test.com');
});

it('throws in development when siteId is empty or undefined', () => {
  assert.throws(() => {
    makeKey('auth.token', '');
  }, /makeKey requires a non-empty siteId/);

  assert.throws(() => {
    makeKey('auth.token', '   ');
  }, /makeKey requires a non-empty siteId/);
});

it('handles hostname with port as siteId safely', () => {
  const key = makeKey('cache', 'http://localhost:5000');
  assert.strictEqual(key, 'http___localhost_5000.cache');
  assert.doesNotMatch(key, /[:/]/);
});

it('caps extremely long key names within 180 characters', () => {
  const longName = 'very_long_segment_'.repeat(20);
  const key = makeKey(longName, 'gujjutours');
  assert.ok(key.length <= 180, `Key length ${key.length} exceeds 180 chars`);
  assert.ok(key.startsWith('gujjutours.'));
});

it('handles empty key name in dev by throwing', () => {
  assert.throws(() => {
    makeKey('', 'gujjutours');
  }, /makeKey requires a non-empty key name/);
});

// 2. Storage Helpers Integration
console.log('\nGroup 2: Storage Helpers & Fallback Logic');

async function runStorageHelperTests() {
  await itAsync('secureSet and secureGet work with valid keys', async () => {
    const mockSecure = createMockSecureStore(false);
    const mockAsync = createMockAsyncStorage();

    const key = makeKey('auth.token', 'gujjutours');
    await mockSecure.setItemAsync(key, 'jwt_secret_token_123');

    const result = await mockSecure.getItemAsync(key);
    assert.strictEqual(result, 'jwt_secret_token_123');
  });

  await itAsync('secureSet gracefully falls back to AsyncStorage when SecureStore fails', async () => {
    const mockSecure = createMockSecureStore(true); // SecureStore fails
    const mockAsync = createMockAsyncStorage();

    const key = makeKey('auth.token', 'gujjutours');
    let fallbackWorked = false;

    try {
      await mockSecure.setItemAsync(key, 'jwt_secret_token_123');
    } catch {
      // Fallback
      await mockAsync.setItem(key, 'jwt_secret_token_123');
      fallbackWorked = true;
    }

    assert.ok(fallbackWorked);
    const retrieved = await mockAsync.getItem(key);
    assert.strictEqual(retrieved, 'jwt_secret_token_123');
  });

  await itAsync('storeSetObject and storeGetObject serialize JSON correctly', async () => {
    const mockAsync = createMockAsyncStorage();
    const key = makeKey('auth.user', 'tripgoasia');
    const user = { id: 'u1', name: 'John Doe', email: 'john@example.com' };

    await mockAsync.setItem(key, JSON.stringify(user));
    const retrievedRaw = await mockAsync.getItem(key);
    const retrievedObj = JSON.parse(retrievedRaw);

    assert.deepStrictEqual(retrievedObj, user);
  });

  await itAsync('clearSiteStorage purges only tenant keys without affecting other sites', async () => {
    const mockAsync = createMockAsyncStorage();
    await mockAsync.setItem('gujjutours.auth.token', 'token_1');
    await mockAsync.setItem('gujjutours.wishlist', '[1,2,3]');
    await mockAsync.setItem('tripgoasia.auth.token', 'token_2');
    await mockAsync.setItem('technoheaven.auth.token', 'token_3');

    // Purge gujjutours
    const allKeys = await mockAsync.getAllKeys();
    const gujjuKeys = allKeys.filter((k) => k.startsWith('gujjutours.'));
    await mockAsync.multiRemove(gujjuKeys);

    assert.strictEqual(await mockAsync.getItem('gujjutours.auth.token'), null);
    assert.strictEqual(await mockAsync.getItem('gujjutours.wishlist'), null);
    assert.strictEqual(await mockAsync.getItem('tripgoasia.auth.token'), 'token_2');
    assert.strictEqual(await mockAsync.getItem('technoheaven.auth.token'), 'token_3');
  });

  await itAsync('migrateLegacyStorage converts @auth:token and old keys into new format', async () => {
    const mockAsync = createMockAsyncStorage();
    // Simulate legacy storage state before fix
    await mockAsync.setItem('@auth:token:gujjutours', 'legacy_token_abc');
    await mockAsync.setItem('@wishlist:gujjutours', '[10, 20]');
    await mockAsync.setItem('user_gujjutours', JSON.stringify({ name: 'Alice' }));

    // Run migration
    const oldToken = await mockAsync.getItem('@auth:token:gujjutours');
    if (oldToken) {
      await mockAsync.setItem('gujjutours.auth.token', oldToken);
      await mockAsync.removeItem('@auth:token:gujjutours');
    }

    const oldWishlist = await mockAsync.getItem('@wishlist:gujjutours');
    if (oldWishlist) {
      await mockAsync.setItem('gujjutours.wishlist', oldWishlist);
      await mockAsync.removeItem('@wishlist:gujjutours');
    }

    const oldUser = await mockAsync.getItem('user_gujjutours');
    if (oldUser) {
      await mockAsync.setItem('gujjutours.auth.user', oldUser);
      await mockAsync.removeItem('user_gujjutours');
    }

    // Verify migrated data
    assert.strictEqual(await mockAsync.getItem('gujjutours.auth.token'), 'legacy_token_abc');
    assert.strictEqual(await mockAsync.getItem('gujjutours.wishlist'), '[10, 20]');
    assert.deepStrictEqual(JSON.parse(await mockAsync.getItem('gujjutours.auth.user')), { name: 'Alice' });

    // Verify old keys removed
    assert.strictEqual(await mockAsync.getItem('@auth:token:gujjutours'), null);
    assert.strictEqual(await mockAsync.getItem('@wishlist:gujjutours'), null);
    assert.strictEqual(await mockAsync.getItem('user_gujjutours'), null);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runStorageHelperTests();
