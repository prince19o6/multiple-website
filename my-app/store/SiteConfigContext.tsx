/**
 * store/SiteConfigContext.tsx
 *
 * Central SiteProvider & SiteConfigContext.
 *
 * Responsibilities:
 * - Bootstraps the application by fetching /api/core/v1/config/{hostname} via TanStack Query.
 * - Single source of truth: Active site is driven strictly by ENV (src/config/env.ts).
 * - Startup cache validation: Compares stored site ID and API URL against current ENV.
 *   If the site or API URL changed, automatically invalidates React Query cache,
 *   AsyncStorage config/query cache, wishlist, bookings, and auth tokens.
 * - Caches the last good config per site in AsyncStorage (@site:cached_config_<siteId>).
 * - Offline support: uses cached config when offline or on network error.
 * - Real error state: displays full-screen BootstrapErrorScreen if network fails and no cache exists.
 * - Disables runtime site switching unless EXPO_PUBLIC_ENABLE_SITE_SWITCHER=true.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
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
import type { SiteConfigResult } from '@/lib/siteConfig';
import { mergeWebsiteConfig, type MergedWebsiteConfig } from '@/lib/mergeWebsiteConfig';
import { resolveLogoFromWebsite } from '@/lib/assetResolver';
import { themeFromApiColors, DEFAULT_THEME, type ThemeColors } from '@/lib/themeFromApi';
import BootstrapErrorScreen from '@/components/BootstrapErrorScreen';

import website1 from '@/config/website1';
import website2 from '@/config/website2';
import website3 from '@/config/website3';

// ─── Static Baseline Schemas ──────────────────────────────────────────────────

const BASELINE_CONFIGS: Record<string, Record<string, unknown>> = {
  gujjutours: website1 as unknown as Record<string, unknown>,
  tripgoasia: website2 as unknown as Record<string, unknown>,
  technoheaven: website3 as unknown as Record<string, unknown>,
  website1: website1 as unknown as Record<string, unknown>,
  website2: website2 as unknown as Record<string, unknown>,
  website3: website3 as unknown as Record<string, unknown>,
};

function getBaselineConfig(siteId: string): Record<string, unknown> {
  return BASELINE_CONFIGS[siteId] ?? (website1 as unknown as Record<string, unknown>);
}

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
  config: MergedWebsiteConfig;
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

const DEFAULT_INITIAL_CONFIG = mergeWebsiteConfig(getBaselineConfig(DEFAULT_SITE_ID), null);

const SiteConfigContext = createContext<SiteContextValue>({
  site: SITES[0],
  siteId: DEFAULT_SITE_ID,
  hostname: SITES[0].hostname,
  siteName: SITES[0].name,
  logoUrl: null,
  darkLogoUrl: null,
  config: DEFAULT_INITIAL_CONFIG,
  theme: DEFAULT_THEME,
  typography: {
    headingFont: 'Poppins',
    bodyFont: 'Poppins',
  },
  contact: {
    phones: ['+91 9875095616'],
    emails: ['booking@gujjutours.com'],
    phone: '+91 9875095616',
    email: 'booking@gujjutours.com',
  },
  footerLinks: [],
  headerLinks: [],
  enabledSections: ['hero', 'categories', 'featuredTours', 'destinations', 'offers'],
  copyright: '© 2026 Gujju Tours. All Rights Reserved',
  currency: SITES[0].currencyDefault,
  isLoaded: false,
  isLoading: true,
  isError: false,
  error: null,
  isOffline: false,
  switchSite: async () => {},
  refetch: async () => {},
});

// ─── Provider Component ───────────────────────────────────────────────────────

export interface SiteProviderProps {
  children: React.ReactNode;
  config?: MergedWebsiteConfig;
}

export function SiteProvider({ children }: SiteProviderProps) {
  const [activeSiteId, setActiveSiteId] = useState<SiteId>(getInitialSiteId);
  const [cachedConfig, setCachedConfig] = useState<SiteConfigResult | null>(null);
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

        // Run one-time migration for current site if needed
        await migrateLegacyStorage(currentSiteId);

        const lastSiteId = await storeGet('app.last_startup_site_id');
        const lastApiUrl = await storeGet('app.last_startup_api_url');

        // If stored values exist and differ from the current env configuration, clear stale caches
        if (lastSiteId && (lastSiteId !== currentSiteId || lastApiUrl !== currentApiUrl)) {
          console.log(
            `[SiteProvider] Active site changed from "${lastSiteId}" to "${currentSiteId}". Purging previous site cache...`
          );

          // Purge React Query cache
          queryClient.clear();

          // Purge storage keys related to previous tenant
          await clearSiteStorage(lastSiteId);

          if (isMounted) {
            setCachedConfig(null);
          }
        }

        // Store active site id and API URL for next comparison
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
        const parsed = await storeGetObject<SiteConfigResult>('config.cache', activeSiteId);
        if (parsed && typeof parsed === 'object' && isMounted) {
          setCachedConfig(parsed);
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
  } = useQuery<SiteConfigResult, Error>({
    queryKey: queryKeys.siteConfig(activeSite.id, activeSite.hostname, ENV.defaultLang),
    queryFn: () => fetchConfig(activeSite.hostname, ENV.defaultLang, activeSite.id),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    refetchOnWindowFocus: false,
    enabled: !!activeSite.id,
  });

  // 4. Persist successful config to storage cache
  useEffect(() => {
    if (queryData) {
      storeSetObject('config.cache', queryData, activeSite.id).catch(() => {});

      if (Platform.OS !== 'web' && typeof SplashScreen !== 'undefined' && SplashScreen?.hideAsync) {
        SplashScreen.hideAsync().catch(() => {});
      }
    }
  }, [queryData, activeSite.id]);

  // Effective config: prefer live query data, fallback to offline cached data
  const effectiveResult = queryData ?? cachedConfig;
  const isUsingCacheFallback = !queryData && !!cachedConfig;
  const isFatalError = isQueryError && !cachedConfig && cacheLoaded;

  // Hide splash screen on fatal error so user can see BootstrapErrorScreen
  useEffect(() => {
    if (isFatalError && Platform.OS !== 'web' && typeof SplashScreen !== 'undefined' && SplashScreen?.hideAsync) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isFatalError]);

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
    const baseline = getBaselineConfig(activeSite.id);
    const merged = mergeWebsiteConfig(baseline, effectiveResult);

    // Dynamic theme colors from API
    const apiTheme =
      effectiveResult?.colors && Object.keys(effectiveResult.colors).length > 0
        ? themeFromApiColors(effectiveResult.colors)
        : null;
    const themeColors = apiTheme
      ? { ...merged.theme, ...apiTheme }
      : merged.theme ?? DEFAULT_THEME;

    // Dynamic logo URLs with full fallbacks (light and dark)
    const websiteInfo = effectiveResult?.website;
    const resolvedLogo =
      resolveLogoFromWebsite(websiteInfo, activeSite.id, false) ||
      merged.logo ||
      resolveLogoFromWebsite(null, activeSite.id, false);

    const resolvedDarkLogo =
      resolveLogoFromWebsite(websiteInfo, activeSite.id, true) ||
      resolveLogoFromWebsite(null, activeSite.id, true);

    if (resolvedLogo) {
      merged.logo = resolvedLogo;
    }

    // Dynamic contact info
    const contactList = Array.isArray(effectiveResult?.websiteContact?.contact)
      ? (effectiveResult?.websiteContact?.contact as Array<{ value?: string }>)
      : [];
    const emailList = Array.isArray(effectiveResult?.websiteContact?.email)
      ? (effectiveResult?.websiteContact?.email as Array<{ value?: string }>)
      : [];
    const phones: string[] = contactList.map((c) => String(c?.value || '')).filter(Boolean);
    const emails: string[] = emailList.map((e) => String(e?.value || '')).filter(Boolean);

    // Dynamic navigation links
    const headerLinks = Array.isArray(effectiveResult?.websiteLinks?.headerType)
      ? (effectiveResult?.websiteLinks?.headerType as Array<{ name: string; reference: string; displayOrder?: number }>)
      : [];
    const footerLinks = Array.isArray(effectiveResult?.websiteLinks?.footerTypes)
      ? (effectiveResult?.websiteLinks?.footerTypes as Array<{ name: string; reference: string; displayOrder?: number }>)
      : [];

    const enabledSections = ['hero', 'categories', 'featuredTours', 'destinations', 'offers'];

    // Dynamic currency
    const apiCurrency = (effectiveResult?.websiteConfiguration as { currency?: { code?: string } } | null | undefined)?.currency;
    const currency = {
      code: apiCurrency?.code || activeSite.currencyDefault.code,
      symbol: activeSite.currencyDefault.symbol,
    };

    const typography = {
      headingFont: effectiveResult?.font?.family || 'Poppins',
      bodyFont: effectiveResult?.font?.family || 'Poppins',
    };

    const siteName = websiteInfo?.name || activeSite.name;
    const copyright = websiteInfo?.footerCopyright || `© 2026 ${siteName}. All Rights Reserved`;

    const isLoaded = !!effectiveResult;
    const isLoading = isQueryLoading && !effectiveResult;

    return {
      site: activeSite,
      siteId: activeSite.id,
      hostname: activeSite.hostname,
      siteName,
      logoUrl: resolvedLogo,
      darkLogoUrl: resolvedDarkLogo,
      config: merged,
      theme: themeColors,
      typography,
      contact: {
        phones,
        emails,
        phone: phones[0] || '+91 9875095616',
        email: emails[0] || 'support@travelplatform.com',
        address:
          (typeof websiteInfo?.fullAddress === 'string' && websiteInfo.fullAddress) ||
          (typeof websiteInfo?.subUrb === 'string' && websiteInfo.subUrb) ||
          undefined,
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
    effectiveResult,
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

  // Initial loading state before cache or network data arrives
  if (!effectiveResult && !cacheLoaded && isQueryLoading) {
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

export function useSiteConfig(): MergedWebsiteConfig {
  const ctx = useContext(SiteConfigContext);
  return ctx.config;
}

export function useSite(): SiteContextValue {
  return useContext(SiteConfigContext);
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
});
