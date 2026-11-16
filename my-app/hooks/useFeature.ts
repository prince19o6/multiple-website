import { useMemo } from 'react';
import { useSiteConfig } from '@/store/SiteConfigContext';
import {
  type FeatureItem,
  resolveFeatureDependencies,
  getEnabledFeatures,
  getNavFeatures,
  getHomeFeatures,
  getSearchFeatures,
  isFeatureItemEnabled,
} from '@/lib/features/featureRegistrySchema';

/**
 * Universal helper to check if a feature is enabled from a mobile SiteConfig object.
 */
export function isFeatureEnabled(
  config: any,
  featureId: string,
  platform: 'web' | 'app' = 'app'
): boolean {
  if (!config) return false;

  const registry: FeatureItem[] = config.featureRegistry || [];
  if (Array.isArray(registry) && registry.length > 0) {
    const found = registry.find((item) => item.id.toLowerCase() === featureId.toLowerCase());
    if (found) {
      return isFeatureItemEnabled(registry, featureId, platform);
    }
  }

  // Fallback to legacy config.features boolean map
  const legacyMap = config.features || {};
  const normalizedKey = featureId.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (typeof legacyMap[normalizedKey] === 'boolean') {
    return legacyMap[normalizedKey];
  }
  if (typeof legacyMap[featureId] === 'boolean') {
    return legacyMap[featureId];
  }

  return true;
}

/**
 * React hook to retrieve a specific feature's state and configuration in mobile app.
 */
export function useFeature(featureId: string) {
  const config = useSiteConfig();

  return useMemo(() => {
    const rawList: FeatureItem[] = config?.featureRegistry || [];
    const resolvedList = resolveFeatureDependencies(rawList);
    const feature = resolvedList.find(
      (f) => f.id.toLowerCase() === featureId.toLowerCase()
    );

    const isEnabled = feature
      ? feature.enabled && feature.platforms.includes('app')
      : isFeatureEnabled(config, featureId, 'app');

    const lang = config?.site?.defaultLanguage || 'en';
    const label =
      feature?.label?.[lang] ||
      feature?.label?.['en'] ||
      Object.values(feature?.label || {})[0] ||
      featureId;

    return {
      feature,
      isEnabled,
      isVisibleInNav: feature?.visibleInNav ?? isEnabled,
      isVisibleOnHome: feature?.visibleOnHome ?? isEnabled,
      route: feature?.route || '',
      label,
      icon: feature?.icon || { url: '', fallbackKey: 'sparkles-outline' },
      searchType: feature?.searchType || 'none',
      badge: feature?.badge,
    };
  }, [config, featureId]);
}

/**
 * React hook to retrieve all categorized feature lists for the mobile app.
 */
export function useFeatures() {
  const config = useSiteConfig();

  return useMemo(() => {
    const rawList: FeatureItem[] = config?.featureRegistry || [];
    const resolved = resolveFeatureDependencies(rawList);
    const enabled = getEnabledFeatures(resolved, 'app');
    const nav = getNavFeatures(resolved, 'app');
    const home = getHomeFeatures(resolved, 'app');
    const search = getSearchFeatures(resolved, 'app');

    return {
      allFeatures: resolved,
      enabledFeatures: enabled,
      navFeatures: nav,
      homeFeatures: home,
      searchFeatures: search,
      isFeatureEnabled: (id: string) => isFeatureEnabled(config, id, 'app'),
    };
  }, [config]);
}

