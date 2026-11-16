"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { SiteConfig } from "@/lib/config/siteConfigSchema";
import { DEFAULT_SITE_CONFIG } from "@/lib/config/siteConfigSchema";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import { toMergedSiteConfig } from "@/lib/mergeWebsiteConfig";

export type MergedSiteConfig = MergedWebsiteConfig & SiteConfig;

const SiteConfigContext = createContext<MergedSiteConfig | null>(null);

export function SiteConfigProvider({
  config,
  children,
}: {
  config: SiteConfig | MergedWebsiteConfig;
  children: React.ReactNode;
}) {
  const value = useMemo(() => {
    return toMergedSiteConfig(config);
  }, [config]);

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}

/**
 * Hook to retrieve the complete merged, strongly-typed SiteConfig.
 * Safe fallback guarantees zero null/undefined crashes.
 */
export function useSiteConfig(): MergedSiteConfig {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    return toMergedSiteConfig(DEFAULT_SITE_CONFIG);
  }
  return ctx;
}

/**
 * Hook to retrieve theme tokens and colors.
 */
export function useTheme(): SiteConfig["theme"] {
  const config = useSiteConfig();
  return config.theme;
}

/**
 * Hook to retrieve per-website feature switches.
 */
export function useSiteFeatures(): SiteConfig["features"] {
  const config = useSiteConfig();
  return config.features;
}

/**
 * Hook to retrieve navigation definitions (menus, tabs, footer columns, social links).
 */
export function useSiteNavigation(): SiteConfig["navigation"] {
  const config = useSiteConfig();
  return config.navigation;
}

/**
 * Hook to retrieve dynamic content (banners, trust badges, partners, contact).
 */
export function useSiteContent(): SiteConfig["content"] {
  const config = useSiteConfig();
  return config.content;
}

/**
 * Hook to retrieve SEO configuration (titles, description, keywords, ogImage).
 */
export function useSiteSeo(): SiteConfig["seo"] {
  const config = useSiteConfig();
  return config.seo;
}
