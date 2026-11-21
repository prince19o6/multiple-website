/**
 * store/SiteConfigContext.tsx
 *
 * Central SiteProvider & SiteConfigContext for the React Native mobile application.
 *
 * Guarantees:
 * - Bootstraps the application by fetching /api/core/v1/config/{hostname} via TanStack Query.
 * - Single source of truth: Active site is driven strictly by ENV (src/config/env.ts).
 * - Startup cache validation: Compares stored site ID and API URL against current ENV.
 *   If the site or API URL changed, automatically invalidates React Query cache,
 *   AsyncStorage config/query cache, wishlist, bookings, and auth tokens.
 * - Caches the last good config per site in AsyncStorage (config.cache, activeSiteId).
 * - Offline support: uses cached config when offline or on network error.
 * - Real error state: displays full-screen BootstrapErrorScreen if network fails and no cache exists.
 * - Safety valves: Force Update modal (minSupportedVersion / forceUpdate) and Maintenance Mode screen (maintenance).
 * - Exports convenience hooks: useSite, useSiteConfig, useFeature, useSiteNavigation, useSiteContent, useSiteSeo, useSiteApp.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { useQuery } from '@tanstack/react-query';
import {
  storeGet,
  storeSet,
  storeGetObject,
  storeSetObject,
  clearSiteStorage,
  migrateLegacyStorage,
} from '@/src/lib/storage';
import {
  SITES,
  DEFAULT_SITE_ID,
  getSiteById,
  resolveSite,
  setActiveSite as setGlobalActiveSite,
  type SiteId,
  type SiteDefinition,
} from '@/src/config/sites';
import { ENV } from '@/src/config/env';
import { fetchConfig } from '@/services/api';
import { queryKeys, queryClient } from './queryClient';
import type { SiteConfig } from '@/lib/config/siteConfigSchema';
import { DEFAULT_SITE_CONFIG, validateSiteConfig } from '@/lib/config/siteConfigSchema';
import { toMergedSiteConfig, type MergedWebsiteConfig } from '@/lib/mergeWebsiteConfig';
import { resolveLogoFromWebsite } from '@/lib/assetResolver';
import { DEFAULT_THEME, type ThemeColors } from '@/lib/themeFromApi';
import BootstrapErrorScreen from '@/components/BootstrapErrorScreen';

export type MergedSiteConfig = MergedWebsiteConfig & SiteConfig;

function getInitialSiteId(): SiteId {
  const resolved = resolveSite(ENV.siteId || ENV.siteHostname);
  return resolved.id;
}

// ─── Context Value Shape ──────────────────────────────────────────────────────

export interface SiteContextValue {
  site: SiteDefinition;
  siteId: SiteId;
  hostname: string;
  siteName: string;
  logoUrl: string | null;
  darkLogoUrl?: string | null;
  config: MergedSiteConfig;
  theme: ThemeColors;
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  contact: {
    phones: string[];
    emails: string[];
    phone: string;
    email: string;
    address?: string;
  };
  footerLinks: Array<{ name: string; reference: string; displayOrder?: number }>;
  headerLinks: Array<{ name: string; reference: string; displayOrder?: number }>;
  enabledSections: string[];
  copyright: string;
  currency: {
    code: string;
    symbol: string;
  };
  isLoaded: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isOffline: boolean;
  switchSite: (newSiteId: SiteId) => Promise<void>;
  refetch: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteContextValue | null>(null);

// ─── Provider Props ───────────────────────────────────────────────────────────

interface SiteProviderProps {
  children: React.ReactNode;
  config?: MergedWebsiteConfig;
}

export function SiteProvider({ children }: SiteProviderProps) {
  const [activeSiteId, setActiveSiteId] = useState<SiteId>(getInitialSiteId);
  const [cachedConfig, setCachedConfig] = useState<SiteConfig | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState<boolean>(false);

  const activeSite = useMemo(() => getSiteById(activeSiteId), [activeSiteId]);

  // Keep global active site in sync with state
  useEffect(() => {
    setGlobalActiveSite(activeSiteId);
  }, [activeSiteId]);

  // 1. Startup Cache Validation: Purge stale cache if configured site ID or API changed
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const currentSiteId = ENV.siteId;
        const currentApiUrl = ENV.apiUrl;

        await migrateLegacyStorage(currentSiteId);

        const lastSiteId = await storeGet('app.last_startup_site_id');
        const lastApiUrl = await storeGet('app.last_startup_api_url');

        if (lastSiteId && (lastSiteId !== currentSiteId || lastApiUrl !== currentApiUrl)) {
          if (__DEV__) {
            console.log(
              `[SiteProvider] Active site changed from "${lastSiteId}" to "${currentSiteId}". Purging previous site cache...`
            );
          }

          queryClient.clear();
          await clearSiteStorage(lastSiteId);

          if (isMounted) {
            setCachedConfig(null);
          }
        }

        await storeSet('app.last_startup_site_id', currentSiteId);
        await storeSet('app.last_startup_api_url', currentApiUrl);
      } catch (err) {
        console.warn('[SiteProvider] Startup cache verification error:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load offline cache for the active site from storage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const parsed = await storeGetObject<unknown>('config.cache', activeSiteId);
        if (parsed && typeof parsed === 'object' && isMounted) {
          const validated = validateSiteConfig(parsed, DEFAULT_SITE_CONFIG);
          setCachedConfig(validated.config);
        }
      } catch {
        // Cache read failure ignored
      } finally {
        if (isMounted) setCacheLoaded(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [activeSiteId]);

  // 3. Single TanStack Query config fetch
  const {
    data: queryData,
    isLoading: isQueryLoading,
    isError: isQueryError,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery<unknown, Error>({
    queryKey: queryKeys.siteConfig(activeSite.id, activeSite.hostname, ENV.defaultLang),
    queryFn: () => fetchConfig(activeSite.hostname, ENV.defaultLang, activeSite.id),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    refetchOnWindowFocus: false,
    enabled: !!activeSite.id,
  });

  // Validated live config from queryData
  const validatedQueryConfig = useMemo<SiteConfig | null>(() => {
    if (!queryData) return null;
    const validated = validateSiteConfig(queryData, DEFAULT_SITE_CONFIG);
    return validated.config;
  }, [queryData]);

  // 4. Persist successful config to storage cache and hide splash screen
  useEffect(() => {
    if (validatedQueryConfig) {
      storeSetObject('config.cache', validatedQueryConfig, activeSite.id).catch(() => {});

      if (Platform.OS !== 'web' && typeof SplashScreen !== 'undefined' && SplashScreen?.hideAsync) {
        SplashScreen.hideAsync().catch(() => {});
      }
    }
  }, [validatedQueryConfig, activeSite.id]);

  // Effective config: prefer live query data, fallback to offline cached data, then default
  const effectiveConfig: SiteConfig = validatedQueryConfig ?? cachedConfig ?? DEFAULT_SITE_CONFIG;
  const isUsingCacheFallback = !validatedQueryConfig && !!cachedConfig;
  const isFatalError = isQueryError && !cachedConfig && cacheLoaded;

  // Hide splash screen on fatal error so user can see BootstrapErrorScreen
  useEffect(() => {
    if (isFatalError && Platform.OS !== 'web' && typeof SplashScreen !== 'undefined' && SplashScreen?.hideAsync) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isFatalError]);

  // Preload custom fonts from config if present
  useEffect(() => {
    const customFonts = effectiveConfig.typography?.customFonts;
    if (Array.isArray(customFonts) && customFonts.length > 0) {
      const fontMap: Record<string, string> = {};
      for (const font of customFonts) {
        if (font.family && font.url) {
          // If the font family is already bundled locally in the app (e.g. Poppins, Inter, Playfair Display),
          // avoid redundant remote network fetches that trigger 12000ms CORS/timeout warnings on web.
          const lowerFamily = font.family.toLowerCase();
          if (
            Platform.OS === 'web' &&
            (lowerFamily.includes('poppins') ||
             lowerFamily.includes('inter') ||
             lowerFamily.includes('playfair'))
          ) {
            continue;
          }
          fontMap[font.family] = font.url;
        }
      }
      if (Object.keys(fontMap).length > 0) {
        Font.loadAsync(fontMap).catch((err) => {
          if (__DEV__) {
            console.warn('[SiteProvider] Failed to load remote custom font:', err);
          }
        });
      }
    }
  }, [effectiveConfig.typography?.customFonts]);

  // Switch site handler (only allowed when EXPO_PUBLIC_ENABLE_SITE_SWITCHER=true)
  const switchSite = useCallback(
    async (newSiteId: SiteId) => {
      if (!ENV.enableSiteSwitcher) {
        if (__DEV__) {
          console.warn(
            `[SiteProvider] Site switching is disabled. The application is locked to "${ENV.siteId}" via environment variables.`
          );
        }
        return;
      }

      if (newSiteId === activeSiteId) return;

      if (__DEV__) {
        console.log(`[SiteProvider] Switching site to ${newSiteId}...`);
      }
      queryClient.clear();
      setCachedConfig(null);
      setCacheLoaded(false);
      setGlobalActiveSite(newSiteId);
      setActiveSiteId(newSiteId);
    },
    [activeSiteId]
  );

  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  // Derive merged dynamic config and theme
  const contextValue = useMemo<SiteContextValue>(() => {
    const merged = toMergedSiteConfig(effectiveConfig);

    const resolvedLogo =
      effectiveConfig.assets?.logoLight ||
      effectiveConfig.assets?.logoUrl ||
      resolveLogoFromWebsite(null, activeSite.id, false);

    const resolvedDarkLogo =
      effectiveConfig.assets?.logoDark ||
      resolvedLogo;

    const contactConfig = effectiveConfig.content?.contact;
    const phone = contactConfig?.phone || '+91 9875095616';
    const email = contactConfig?.email || 'support@travelplatform.com';
    const address = contactConfig?.address || '';

    const phones = [phone];
    const emails = [email];

    const headerLinks = (effectiveConfig.navigation?.web?.menuItems || []).map((m, idx) => ({
      name: m.label,
      reference: m.href,
      displayOrder: idx + 1,
    }));

    const footerLinks = (effectiveConfig.navigation?.web?.footerColumns || []).flatMap((c) =>
      c.links.map((l, idx) => ({
        name: l.label,
        reference: l.href,
        displayOrder: idx + 1,
      }))
    );

    const enabledSections = (effectiveConfig.components?.home || [])
      .filter((c) => c.enabled !== false && (!c.platforms || c.platforms.includes('app')))
      .map((c) => c.type);

    const currency = {
      code: effectiveConfig.site?.currency?.code || activeSite.currencyDefault.code,
      symbol: effectiveConfig.site?.currency?.symbol || activeSite.currencyDefault.symbol,
    };

    const typography = {
      headingFont: effectiveConfig.typography?.headingFont || 'Poppins',
      bodyFont: effectiveConfig.typography?.bodyFont || 'Poppins',
    };

    const siteName = effectiveConfig.site?.name || activeSite.name;
    const copyright = `© ${new Date().getFullYear()} ${siteName}. All Rights Reserved`;

    const isLoaded = !!validatedQueryConfig || !!cachedConfig;
    const isLoading = isQueryLoading && !isLoaded;

    return {
      site: activeSite,
      siteId: activeSite.id,
      hostname: activeSite.hostname,
      siteName,
      logoUrl: resolvedLogo,
      darkLogoUrl: resolvedDarkLogo,
      config: merged,
      theme: merged.theme,
      typography,
      contact: {
        phones,
        emails,
        phone,
        email,
        address,
      },
      footerLinks,
      headerLinks,
      enabledSections,
      copyright,
      currency,
      isLoaded,
      isLoading,
      isError: isQueryError,
      error: queryError ?? null,
      isOffline: isUsingCacheFallback,
      switchSite,
      refetch,
    };
  }, [
    activeSite,
    effectiveConfig,
    validatedQueryConfig,
    cachedConfig,
    isQueryLoading,
    isQueryError,
    queryError,
    isUsingCacheFallback,
    switchSite,
    refetch,
  ]);

  // Safely prefetch brand logo assets in background
  useEffect(() => {
    if (contextValue.logoUrl) {
      Image.prefetch(contextValue.logoUrl).catch(() => {});
    }
    if (contextValue.darkLogoUrl) {
      Image.prefetch(contextValue.darkLogoUrl).catch(() => {});
    }
  }, [contextValue.logoUrl, contextValue.darkLogoUrl]);

  // Fatal error state: no network and no cached config available
  if (isFatalError) {
    return (
      <BootstrapErrorScreen
        hostname={activeSite.hostname}
        apiUrl={ENV.configApiUrl || activeSite.apiBaseUrl}
        errorMessage={queryError?.message || 'Failed to fetch site config. CORS or network error.'}
        onRetry={() => queryRefetch()}
      />
    );
  }

  // Safety Valve 1: Maintenance Mode Overlay
  if (effectiveConfig.app?.maintenance) {
    return (
      <View style={styles.fullscreenSafety}>
        <View style={styles.safetyCard}>
          <Text style={styles.safetyEmoji}>🛠️</Text>
          <Text style={styles.safetyTitle}>Under Maintenance</Text>
          <Text style={styles.safetyBody}>
            {effectiveConfig.app.maintenanceMessage ||
              'Our systems are currently undergoing scheduled maintenance. Please check back shortly.'}
          </Text>
          <Text style={styles.safetySupport}>
            Support:{' '}
            <Text
              style={styles.safetyLink}
              onPress={() => Linking.openURL(`mailto:${effectiveConfig.app.supportEmail}`)}
            >
              {effectiveConfig.app.supportEmail}
            </Text>
          </Text>
        </View>
      </View>
    );
  }

  // Safety Valve 2: Force Update Overlay
  const currentAppVersion = '1.0.0';
  const minVersion = effectiveConfig.app?.minSupportedVersion || '1.0.0';
  const isOutdated = currentAppVersion < minVersion;
  if (effectiveConfig.app?.forceUpdate || isOutdated) {
    const storeUrl =
      Platform.OS === 'ios'
        ? effectiveConfig.app.storeUrls?.ios
        : effectiveConfig.app.storeUrls?.android;

    return (
      <View style={styles.fullscreenSafety}>
        <View style={styles.safetyCard}>
          <Text style={styles.safetyEmoji}>🚀</Text>
          <Text style={styles.safetyTitle}>Update Required</Text>
          <Text style={styles.safetyBody}>
            {effectiveConfig.app.forceUpdateMessage ||
              'A critical update is required. Please download the latest version to continue.'}
          </Text>
          {storeUrl ? (
            <TouchableOpacity
              style={styles.safetyBtn}
              onPress={() => Linking.openURL(storeUrl)}
            >
              <Text style={styles.safetyBtnText}>Update Now</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  // Initial loading state before cache or network data arrives
  if (!effectiveConfig && !cacheLoaded && isQueryLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SiteConfigContext.Provider value={contextValue}>
      {isUsingCacheFallback && isQueryError && (
        <View style={styles.cachedNoticeBanner}>
          <Text style={styles.cachedNoticeText} numberOfLines={1}>
            Offline / connection issue. Using cached theme for {activeSite.name}.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => queryRefetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {children}
    </SiteConfigContext.Provider>
  );
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

export function useSiteConfig(): MergedSiteConfig {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) return toMergedSiteConfig(DEFAULT_SITE_CONFIG);
  return ctx.config;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return ctx;
}

export function useFeature(featureName: keyof SiteConfig['features']): boolean {
  const config = useSiteConfig();
  if (!config.features) return false;
  return Boolean(config.features[featureName]);
}

export function useSiteNavigation(): SiteConfig['navigation'] {
  const config = useSiteConfig();
  return config.navigation || DEFAULT_SITE_CONFIG.navigation;
}

export function useSiteContent(): SiteConfig['content'] {
  const config = useSiteConfig();
  return config.content || DEFAULT_SITE_CONFIG.content;
}

export function useSiteSeo(): SiteConfig['seo'] {
  const config = useSiteConfig();
  return config.seo || DEFAULT_SITE_CONFIG.seo;
}

export function useSiteApp(): SiteConfig['app'] {
  const config = useSiteConfig();
  return config.app || DEFAULT_SITE_CONFIG.app;
}

export const SiteConfigProvider = SiteProvider;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  cachedNoticeBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    zIndex: 9999,
  },
  cachedNoticeText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#d97706',
    borderRadius: 4,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  fullscreenSafety: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  safetyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155',
  },
  safetyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  safetyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  safetyBody: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  safetySupport: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  safetyLink: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  safetyBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  safetyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
