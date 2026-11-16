/**
 * src/lib/storage.ts
 *
 * Central Storage Module for the Native Mobile App.
 *
 * THE ONLY MODULE IN THE MOBILE APP ALLOWED TO TOUCH expo-secure-store AND AsyncStorage.
 *
 * Guarantees:
 * 1. Strict Tenant Isolation: Every storage key is prefixed with the sanitized active site ID.
 * 2. SecureStore Key Compliance: All keys strictly contain only alphanumeric characters, '.', '-', and '_'.
 *    Colons ':', at-signs '@', slashes '/', spaces, and other forbidden characters are sanitized to '_'.
 * 3. Short & Stable Keys: Keys are kept within safe limits for Android KeyStore / SharedPreferences (< 200 chars).
 * 4. Resilient Fallbacks: If SecureStore is unavailable or throws a native error, operations fallback
 *    smoothly to AsyncStorage with [DEBUG] logging of the key name (never the value).
 * 5. Clean API: Typed helpers for get/set/delete/objects and site-wide purging.
 * 6. Migration: Idempotent migration of legacy keys (@auth:token:<site>, auth_token_<site>, etc.) on startup.
 */

import { ENV } from '@/src/config/env';

// ─── Native Storage Loaders (Safe for Node/Expo/Web) ──────────────────────────

interface StorageEngine {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys?: () => Promise<readonly string[]>;
  multiRemove?: (keys: readonly string[]) => Promise<void>;
}

interface SecureStorageEngine {
  isAvailableAsync: () => Promise<boolean>;
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}

let secureStoreModule: SecureStorageEngine | null = null;
let asyncStorageModule: StorageEngine | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  secureStoreModule = require('expo-secure-store');
} catch {
  secureStoreModule = null;
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const asMod = require('@react-native-async-storage/async-storage');
  asyncStorageModule = (asMod && asMod.default) ? asMod.default : asMod;
} catch {
  asyncStorageModule = null;
}

// In-memory fallback if AsyncStorage is unavailable (e.g. headless tests or web SSR)
const memoryStore = new Map<string, string>();
const fallbackAsyncStorage: StorageEngine = {
  getItem: async (key: string) => memoryStore.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    memoryStore.set(key, value);
  },
  removeItem: async (key: string) => {
    memoryStore.delete(key);
  },
  getAllKeys: async () => Array.from(memoryStore.keys()),
  multiRemove: async (keys: readonly string[]) => {
    keys.forEach((k) => memoryStore.delete(k));
  },
};

/**
 * Get active AsyncStorage implementation
 */
function getAsyncStorage(): StorageEngine {
  return asyncStorageModule || fallbackAsyncStorage;
}

/**
 * Checks if SecureStore is available in the current environment
 */
export async function isSecureStoreAvailable(): Promise<boolean> {
  if (!secureStoreModule || typeof secureStoreModule.isAvailableAsync !== 'function') {
    return false;
  }
  try {
    return await secureStoreModule.isAvailableAsync();
  } catch {
    return false;
  }
}

// ─── Test Adapters Injection ──────────────────────────────────────────────────

export function __setStorageAdaptersForTest(
  secureAdapter: SecureStorageEngine | null,
  asyncAdapter: StorageEngine | null
): void {
  secureStoreModule = secureAdapter;
  asyncStorageModule = asyncAdapter;
}

// ─── Key Generation & Sanitization ────────────────────────────────────────────

/**
 * Sanitizes an individual key segment:
 * - Converts to lowercase.
 * - Replaces any character outside [a-z0-9._-] with '_'.
 * - Trims leading and trailing dots/underscores/hyphens.
 */
export function sanitizePart(part: string | null | undefined): string {
  if (!part) return '';
  return String(part)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '');
}

/**
 * Builds a valid, tenant-isolated storage key.
 *
 * Rules:
 * 1. Requires a non-empty site ID (throws in development if missing; falls back to 'default' in production).
 * 2. Splits input names on dots, colons, slashes, or at-signs.
 * 3. Sanitizes each segment to [a-z0-9._-].
 * 4. Joins the sanitized site ID and segments with '.'.
 *    Example: makeKey('auth.token', 'gujjutours') -> 'gujjutours.auth.token'
 * 5. Caps length at 180 characters to guarantee stability across Android KeyStore / SharedPreferences.
 */
export function makeKey(name: string, siteIdOverride?: string): string {
  const rawSiteId = siteIdOverride !== undefined ? siteIdOverride : ENV?.siteId;
  const siteId = sanitizePart(rawSiteId);

  if (!siteId) {
    const errorMsg = '[storage] makeKey requires a non-empty siteId. Check your EXPO_PUBLIC_SITE_ID env configuration.';
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      throw new Error(errorMsg);
    }
    console.error(errorMsg);
    return `default.${sanitizePart(name) || 'key'}`;
  }

  if (!name || !name.trim()) {
    const errorMsg = '[storage] makeKey requires a non-empty key name.';
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      throw new Error(errorMsg);
    }
    return `${siteId}.unknown`;
  }

  // Split name by delimiters and sanitize each part
  const rawSegments = String(name).split(/[.:/@\s]+/).filter(Boolean);
  const sanitizedSegments = rawSegments.map(sanitizePart).filter(Boolean);

  if (sanitizedSegments.length === 0) {
    return `${siteId}.unknown`;
  }

  const combinedKey = `${siteId}.${sanitizedSegments.join('.')}`;

  // Keep key short and stable (SecureStore Android limit safe)
  if (combinedKey.length > 180) {
    return combinedKey.slice(0, 180).replace(/[._-]+$/, '');
  }

  return combinedKey;
}

// ─── Typed SecureStore Helpers ────────────────────────────────────────────────

export interface StorageOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Securely writes a sensitive string (e.g. auth token).
 * Falls back to AsyncStorage if SecureStore throws or is unavailable.
 * Never throws a raw native error.
 */
export async function secureSet(
  name: string,
  value: string,
  siteIdOverride?: string
): Promise<StorageOperationResult> {
  const key = makeKey(name, siteIdOverride);
  const storage = getAsyncStorage();

  try {
    const isAvail = await isSecureStoreAvailable();
    if (isAvail && secureStoreModule) {
      await secureStoreModule.setItemAsync(key, value);
      // Mirror to AsyncStorage for fast local recovery
      await storage.setItem(key, value).catch(() => {});
      return { success: true };
    }

    // SecureStore not available, store in AsyncStorage
    await storage.setItem(key, value);
    return { success: true };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.warn(`[DEBUG] [storage] SecureStore.setItemAsync failed for key: "${key}": ${errMessage}`);

    // Fallback to AsyncStorage
    try {
      await storage.setItem(key, value);
      return { success: true };
    } catch (fallbackErr: unknown) {
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.warn(`[DEBUG] [storage] AsyncStorage fallback also failed for key: "${key}": ${fallbackMsg}`);
      return {
        success: false,
        error: 'Unable to securely persist credentials on this device. Please check device security settings.',
      };
    }
  }
}

/**
 * Securely retrieves a sensitive string.
 * Reads SecureStore first, falling back to AsyncStorage.
 */
export async function secureGet(
  name: string,
  siteIdOverride?: string
): Promise<string | null> {
  const key = makeKey(name, siteIdOverride);
  const storage = getAsyncStorage();

  try {
    const isAvail = await isSecureStoreAvailable();
    if (isAvail && secureStoreModule) {
      const secureVal = await secureStoreModule.getItemAsync(key);
      if (secureVal !== null && secureVal !== undefined) {
        return secureVal;
      }
    }
    return await storage.getItem(key);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.warn(`[DEBUG] [storage] SecureStore.getItemAsync failed for key: "${key}": ${errMessage}`);
    try {
      return await storage.getItem(key);
    } catch {
      return null;
    }
  }
}

/**
 * Deletes a sensitive string from both SecureStore and AsyncStorage.
 */
export async function secureDelete(
  name: string,
  siteIdOverride?: string
): Promise<void> {
  const key = makeKey(name, siteIdOverride);
  const storage = getAsyncStorage();

  try {
    const isAvail = await isSecureStoreAvailable();
    if (isAvail && secureStoreModule) {
      await secureStoreModule.deleteItemAsync(key).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[DEBUG] [storage] SecureStore.deleteItemAsync failed for key: "${key}": ${msg}`);
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[DEBUG] [storage] SecureStore.deleteItemAsync outer error for key: "${key}": ${msg}`);
  }

  try {
    await storage.removeItem(key);
  } catch {
    // Ignore cleanup error
  }
}

// ─── Typed AsyncStorage Helpers ───────────────────────────────────────────────

/**
 * Sets a string value in AsyncStorage under a tenant-isolated key.
 */
export async function storeSet(
  name: string,
  value: string,
  siteIdOverride?: string
): Promise<void> {
  const key = makeKey(name, siteIdOverride);
  const storage = getAsyncStorage();
  await storage.setItem(key, value);
}

/**
 * Retrieves a string value from AsyncStorage under a tenant-isolated key.
 */
export async function storeGet(
  name: string,
  siteIdOverride?: string
): Promise<string | null> {
  const key = makeKey(name, siteIdOverride);
  const storage = getAsyncStorage();
  return await storage.getItem(key);
}

/**
 * Removes an item from AsyncStorage under a tenant-isolated key.
 */
export async function storeRemove(
  name: string,
  siteIdOverride?: string
): Promise<void> {
  const key = makeKey(name, siteIdOverride);
  const storage = getAsyncStorage();
  await storage.removeItem(key);
}

/**
 * Sets a JSON-serializable object in AsyncStorage.
 */
export async function storeSetObject<T>(
  name: string,
  value: T,
  siteIdOverride?: string
): Promise<void> {
  const key = makeKey(name, siteIdOverride);
  const storage = getAsyncStorage();
  await storage.setItem(key, JSON.stringify(value));
}

/**
 * Retrieves and deserializes a JSON object from AsyncStorage.
 */
export async function storeGetObject<T>(
  name: string,
  siteIdOverride?: string
): Promise<T | null> {
  const key = makeKey(name, siteIdOverride);
  const storage = getAsyncStorage();
  try {
    const raw = await storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ─── Tenant Storage Purge ─────────────────────────────────────────────────────

/**
 * Removes every stored key associated with the given (or active) website tenant.
 * Cleans both SecureStore and AsyncStorage.
 */
export async function clearSiteStorage(siteIdOverride?: string): Promise<void> {
  const rawSiteId = siteIdOverride || ENV?.siteId;
  const siteId = sanitizePart(rawSiteId);
  if (!siteId) return;

  const storage = getAsyncStorage();

  // 1. Clear known SecureStore keys for this site
  await secureDelete('auth.token', siteId);
  await secureDelete('auth.refresh_token', siteId);
  await secureDelete('auth.user', siteId);
  await secureDelete('admin.token', siteId);

  // Also clean up legacy valid secure keys if any
  try {
    const isAvail = await isSecureStoreAvailable();
    if (isAvail && secureStoreModule) {
      await secureStoreModule.deleteItemAsync(`auth_token_${siteId}`).catch(() => {});
      await secureStoreModule.deleteItemAsync('auth_token').catch(() => {});
    }
  } catch {
    // Ignore
  }

  // 2. Find and delete all matching AsyncStorage keys
  try {
    if (typeof storage.getAllKeys === 'function') {
      const allKeys = await storage.getAllKeys();
      const prefix = `${siteId}.`;
      const tenantKeysToRemove = allKeys.filter(
        (k) =>
          k.startsWith(prefix) ||
          k === `@site:cached_config_${siteId}` ||
          k === `@wishlist:${siteId}` ||
          k === `@bookings:guest_ids_${siteId}` ||
          k === `@bookings:guest_contact_${siteId}` ||
          k.startsWith(`@bookings:cache_${siteId}_`) ||
          k === `@auth:token:${siteId}` ||
          k === `auth_token_${siteId}` ||
          k === `@auth:user:${siteId}` ||
          k === `user_${siteId}` ||
          k.startsWith(`@api_cache_${siteId}_`) ||
          k === `admin_token_${siteId}` ||
          k === `admin_user_${siteId}`
      );

      if (tenantKeysToRemove.length > 0) {
        if (typeof storage.multiRemove === 'function') {
          await storage.multiRemove(tenantKeysToRemove);
        } else {
          for (const k of tenantKeysToRemove) {
            await storage.removeItem(k);
          }
        }
      }
    }
  } catch (err: unknown) {
    console.warn(`[DEBUG] [storage] Error during clearSiteStorage for ${siteId}:`, err);
  }
}

/**
 * Thoroughly purges all auth-related credentials, tokens, and active profiles
 * across all potential site namespaces and storage engines.
 */
export async function clearAuthStorage(siteIdOverride?: string): Promise<void> {
  const sitesToClear = new Set<string>();
  if (siteIdOverride) sitesToClear.add(siteIdOverride);
  if (ENV?.siteId) sitesToClear.add(ENV.siteId);
  sitesToClear.add('website1');
  sitesToClear.add('website2');
  sitesToClear.add('website3');
  sitesToClear.add('gujjutours');
  sitesToClear.add('tripgoasia');
  sitesToClear.add('technoheaven');
  sitesToClear.add('default');

  for (const s of sitesToClear) {
    await secureDelete('auth.token', s).catch(() => {});
    await secureDelete('auth.refresh_token', s).catch(() => {});
    await secureDelete('auth.user', s).catch(() => {});
    await storeRemove('auth.token', s).catch(() => {});
    await storeRemove('auth.refresh_token', s).catch(() => {});
    await storeRemove('auth.user', s).catch(() => {});
  }

  // Also clear legacy valid secure keys if any
  try {
    const isAvail = await isSecureStoreAvailable();
    if (isAvail && secureStoreModule) {
      await secureStoreModule.deleteItemAsync('auth_token').catch(() => {});
      await secureStoreModule.deleteItemAsync('auth.token').catch(() => {});
      await secureStoreModule.deleteItemAsync('refresh_token').catch(() => {});
      await secureStoreModule.deleteItemAsync('auth.refresh_token').catch(() => {});
    }
  } catch {
    // Ignore
  }

  const storage = getAsyncStorage();
  try {
    if (typeof storage.getAllKeys === 'function') {
      const allKeys = await storage.getAllKeys();
      const authKeys = allKeys.filter(
        (k) =>
          k.includes('auth.token') ||
          k.includes('auth.user') ||
          k.includes('auth.refresh_token') ||
          k.includes('auth_token') ||
          k.includes('@auth:token') ||
          k.includes('@auth:user')
      );
      if (authKeys.length > 0) {
        if (typeof storage.multiRemove === 'function') {
          await storage.multiRemove(authKeys).catch(() => {});
        } else {
          for (const k of authKeys) {
            await storage.removeItem(k).catch(() => {});
          }
        }
      }
    }
  } catch (err: unknown) {
    console.warn('[DEBUG] [storage] Error during clearAuthStorage:', err);
  }
}

// ─── Legacy Migration ─────────────────────────────────────────────────────────

/**
 * Migrates legacy storage keys (with characters like '@' and ':') into new dotted keys.
 * Runs once per site on startup. Existing user sessions and cached data are preserved.
 */
export async function migrateLegacyStorage(siteIdOverride?: string): Promise<void> {
  const rawSiteId = siteIdOverride || ENV?.siteId;
  const siteId = sanitizePart(rawSiteId);
  if (!siteId) return;

  const storage = getAsyncStorage();
  const migrationMarkerKey = makeKey('storage.migrated.v1', siteId);

  try {
    const isAlreadyMigrated = await storage.getItem(migrationMarkerKey);
    if (isAlreadyMigrated === 'true') {
      return;
    }

    // 1. Migrate auth token
    const oldToken =
      (await storage.getItem(`auth_token_${siteId}`)) ||
      (await storage.getItem(`@auth:token:${siteId}`)) ||
      (await storage.getItem('auth_token'));

    if (oldToken) {
      await secureSet('auth.token', oldToken, siteId);
      await storage.removeItem(`auth_token_${siteId}`).catch(() => {});
      await storage.removeItem(`@auth:token:${siteId}`).catch(() => {});
    }

    // 2. Migrate user profile
    const oldUser =
      (await storage.getItem(`user_${siteId}`)) ||
      (await storage.getItem(`@auth:user:${siteId}`)) ||
      (await storage.getItem('user'));

    if (oldUser) {
      await storeSet('auth.user', oldUser, siteId);
      await storage.removeItem(`user_${siteId}`).catch(() => {});
      await storage.removeItem(`@auth:user:${siteId}`).catch(() => {});
    }

    // 3. Migrate wishlist
    const oldWishlist = await storage.getItem(`@wishlist:${siteId}`);
    if (oldWishlist) {
      await storeSet('wishlist', oldWishlist, siteId);
      await storage.removeItem(`@wishlist:${siteId}`).catch(() => {});
    }

    // 5. Migrate guest bookings from legacy formats
    const legacyGuestKeys = [
      `@bookings:guest_ids_${siteId}`,
      `bookings.guest_ids_${siteId}`,
      'bookings.guest_ids',
      'guest_booking_ids',
      'guest_booking_refs',
    ];

    let combinedGuestIds: string[] = [];
    for (const k of legacyGuestKeys) {
      try {
        const val = await storage.getItem(k);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            combinedGuestIds = [...combinedGuestIds, ...parsed];
          }
          await storage.removeItem(k).catch(() => {});
        }
      } catch {
        // ignore parse errors
      }
    }

    if (combinedGuestIds.length > 0) {
      const uniqueIds = Array.from(new Set(combinedGuestIds.filter(Boolean)));
      await storeSetObject('bookings.guest_ids', uniqueIds, siteId);
      await storeSetObject('bookings.guest_refs', uniqueIds, siteId);
    }

    const oldGuestContact =
      (await storage.getItem(`@bookings:guest_contact_${siteId}`)) ||
      (await storage.getItem('bookings.guest_contact'));
    if (oldGuestContact) {
      await storeSet('bookings.guest_contact', oldGuestContact, siteId);
      await storage.removeItem(`@bookings:guest_contact_${siteId}`).catch(() => {});
      await storage.removeItem('bookings.guest_contact').catch(() => {});
    }

    // Mark migration complete
    await storage.setItem(migrationMarkerKey, 'true');
    console.log(`[DEBUG] [storage] Successfully migrated legacy storage keys for site: ${siteId}`);
  } catch (err: unknown) {
    console.warn(`[DEBUG] [storage] Migration failed for site: ${siteId}:`, err);
  }
}
