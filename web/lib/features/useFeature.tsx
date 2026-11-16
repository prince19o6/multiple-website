"use client";

import React, { useMemo } from "react";
import { notFound } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import {
  type FeatureItem,
  resolveFeatureDependencies,
  getEnabledFeatures,
  getNavFeatures,
  getHomeFeatures,
  getSearchFeatures,
  isFeatureItemEnabled,
} from "./featureRegistrySchema";

/**
 * Universal helper to check if a feature is enabled from a SiteConfig object.
 */
export function isFeatureEnabled(
  config: any,
  featureId: string,
  platform: "web" | "app" = "web"
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
  if (typeof legacyMap[normalizedKey] === "boolean") {
    return legacyMap[normalizedKey];
  }
  if (typeof legacyMap[featureId] === "boolean") {
    return legacyMap[featureId];
  }

  return true;
}

/**
 * React hook to retrieve a specific feature's state and configuration.
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
      ? feature.enabled && feature.platforms.includes("web")
      : isFeatureEnabled(config, featureId, "web");

    const lang = config?.site?.defaultLanguage || "en";
    const label =
      feature?.label?.[lang] ||
      feature?.label?.["en"] ||
      Object.values(feature?.label || {})[0] ||
      featureId;

    return {
      feature,
      isEnabled,
      isVisibleInNav: feature?.visibleInNav ?? isEnabled,
      isVisibleOnHome: feature?.visibleOnHome ?? isEnabled,
      route: feature?.route || "",
      label,
      icon: feature?.icon || { url: "", fallbackKey: "Sparkles" },
      searchType: feature?.searchType || "none",
      badge: feature?.badge,
    };
  }, [config, featureId]);
}

/**
 * React hook to retrieve all categorized feature lists for the current tenant.
 */
export function useFeatures() {
  const config = useSiteConfig();

  return useMemo(() => {
    const rawList: FeatureItem[] = config?.featureRegistry || [];
    const resolved = resolveFeatureDependencies(rawList);
    const enabled = getEnabledFeatures(resolved, "web");
    const nav = getNavFeatures(resolved, "web");
    const home = getHomeFeatures(resolved, "web");
    const search = getSearchFeatures(resolved, "web");

    return {
      allFeatures: resolved,
      enabledFeatures: enabled,
      navFeatures: nav,
      homeFeatures: home,
      searchFeatures: search,
      isFeatureEnabled: (id: string) => isFeatureEnabled(config, id, "web"),
    };
  }, [config]);
}

/**
 * Declarative guard component. If the feature is disabled, renders fallback
 * or triggers a clean 404 (notFound).
 */
export function FeatureGuard({
  featureId,
  children,
  fallback = null,
  throw404 = false,
}: {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  throw404?: boolean;
}) {
  const { isEnabled } = useFeature(featureId);

  if (!isEnabled) {
    if (throw404) {
      notFound();
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
