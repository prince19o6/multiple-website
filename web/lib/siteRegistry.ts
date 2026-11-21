/**
 * lib/siteRegistry.ts
 *
 * THE AUTHORITATIVE MULTI-TENANT SITE REGISTRY.
 * This is the ONLY place to define websites and map hostnames.
 *
 * Each website defines:
 * - siteId: Unique identifier ("gujjutours" | "tripgoasia" | "technoheaven")
 * - displayName: Human-readable brand name
 * - backendHostname: Exact canonical hostname expected by ASP.NET Core WebsiteRegistry.cs
 * - productionHostnames: Live production domain names
 * - devHostnames: Localhost subdomains for local development (*.localhost:3000)
 * - stagingApiUrl: Brand fallback API URL
 * - defaultAccentColor: Primary brand color
 * - currency: Currency code ($ / INR)
 * - apiUrlEnvVar: Environment variable name holding backend API URL (e.g. "GUJJUTOURS_API_URL")
 * - apiKeyEnvVar: Environment variable name holding server API Key (e.g. "GUJJUTOURS_API_KEY")
 *
 * NOTE: Actual server secret keys and credentials resolution are strictly isolated
 * inside server-only modules (@/lib/serverSiteSecrets.ts) to guarantee zero key leakage in client bundles.
 */

export type SiteId = "gujjutours" | "tripgoasia" | "technoheaven";

export interface SiteDefinition {
  readonly siteId: SiteId;
  readonly legacySlug: "website1" | "website2" | "website3";
  readonly displayName: string;
  readonly backendHostname: string;
  readonly productionHostnames: readonly string[];
  readonly devHostnames: readonly string[];
  readonly stagingApiUrl: string;
  readonly defaultAccentColor: string;
  readonly defaultCurrency: string;
  readonly defaultCurrencySymbol: string;
  readonly apiUrlEnvVar: string;
  readonly apiKeyEnvVar: string;
}

export const SITE_REGISTRY: Record<SiteId, SiteDefinition> = {
  gujjutours: {
    siteId: "gujjutours",
    legacySlug: "website1",
    displayName: "Gujju Tours",
    backendHostname: "www.gujjutours.com",
    productionHostnames: [
      "www.gujjutours.com",
      "gujjutours.com",
      "b2b.gujjutours.com",
      "travelexplorer.com",
      "www.travelexplorer.com",
    ],
    devHostnames: [
      "gujjutours.localhost",
      "gujju.localhost",
      "website1.localhost",
    ],
    stagingApiUrl: "https://stagingapi.gujjutours.com",
    defaultAccentColor: "#2882c5",
    defaultCurrency: "INR",
    defaultCurrencySymbol: "₹",
    apiUrlEnvVar: "GUJJUTOURS_API_URL",
    apiKeyEnvVar: "GUJJUTOURS_API_KEY",
  },
  tripgoasia: {
    siteId: "tripgoasia",
    legacySlug: "website2",
    displayName: "TripGo Asia",
    backendHostname: "www.tripgoasia.com",
    productionHostnames: [
      "www.tripgoasia.com",
      "tripgoasia.com",
      "adventureworld.com",
      "www.adventureworld.com",
    ],
    devHostnames: [
      "tripgoasia.localhost",
      "tripgo.localhost",
      "website2.localhost",
    ],
    stagingApiUrl: "https://stagingapi.tripgoasia.com",
    defaultAccentColor: "#FF932C",
    defaultCurrency: "USD",
    defaultCurrencySymbol: "$",
    apiUrlEnvVar: "TRIPGOASIA_API_URL",
    apiKeyEnvVar: "TRIPGOASIA_API_KEY",
  },
  technoheaven: {
    siteId: "technoheaven",
    legacySlug: "website3",
    displayName: "Technoheaven",
    backendHostname: "stagingb2b.technoheaven.com",
    productionHostnames: [
      "stagingb2b.technoheaven.com",
      "technoheaven.com",
      "www.technoheaven.com",
      "holidayparadise.com",
      "www.holidayparadise.com",
    ],
    devHostnames: [
      "technoheaven.localhost",
      "techno.localhost",
      "website3.localhost",
    ],
    stagingApiUrl: "https://stagingapi.technoheaven.com",
    defaultAccentColor: "#66cce2",
    defaultCurrency: "AED",
    defaultCurrencySymbol: "AED ",
    apiUrlEnvVar: "TECHNOHEAVEN_API_URL",
    apiKeyEnvVar: "TECHNOHEAVEN_API_KEY",
  },
};

export const ALL_SITES = Object.values(SITE_REGISTRY);

/**
 * Normalizes any hostname string:
 * - Lowercases and trims whitespace
 * - Strips protocol (http:// or https://)
 * - Strips URL path (e.g. /tour/123)
 * - Strips port (e.g. :3000)
 * - Strips trailing dots
 */
export function normalizeHost(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "";
  let h = raw.trim().toLowerCase();
  h = h.replace(/^https?:\/\//, "");
  const slashIdx = h.indexOf("/");
  if (slashIdx >= 0) h = h.slice(0, slashIdx);
  const colonIdx = h.indexOf(":");
  if (colonIdx >= 0) h = h.slice(0, colonIdx);
  return h.replace(/\.+$/, "");
}

/**
 * Resolves a SiteDefinition from an incoming request's Host / x-forwarded-host header.
 */
export function resolveSiteFromHost(hostHeader?: string | null): SiteDefinition | null {
  const host = normalizeHost(hostHeader);
  if (!host) return null;

  // Direct siteId or legacySlug match
  for (const site of ALL_SITES) {
    if (site.siteId === host || site.legacySlug === host) {
      return site;
    }
  }

  // Exact hostname match (dev or production)
  for (const site of ALL_SITES) {
    if (site.devHostnames.includes(host) || site.productionHostnames.includes(host)) {
      return site;
    }
  }

  // Strip leading "www." and compare
  const withoutWww = host.replace(/^www\./, "");
  for (const site of ALL_SITES) {
    if (
      site.devHostnames.some((h) => h.replace(/^www\./, "") === withoutWww) ||
      site.productionHostnames.some((h) => h.replace(/^www\./, "") === withoutWww)
    ) {
      return site;
    }
  }

  // Fallback for generic localhost development driven by SITE_ID env
  if (host === "localhost" || host === "127.0.0.1") {
    const envSite = process.env.SITE_ID?.trim().toLowerCase();
    if (envSite && (envSite in SITE_REGISTRY)) {
      return SITE_REGISTRY[envSite as SiteId];
    }
  }

  return null;
}

/**
 * Finds a site by its siteId ("gujjutours" | "tripgoasia" | "technoheaven").
 */
export function getSiteById(siteId?: string | null): SiteDefinition | null {
  if (!siteId) return null;
  const cleanId = siteId.trim().toLowerCase();
  if (cleanId === "gujjutours" || cleanId === "website1") return SITE_REGISTRY.gujjutours;
  if (cleanId === "tripgoasia" || cleanId === "website2") return SITE_REGISTRY.tripgoasia;
  if (cleanId === "technoheaven" || cleanId === "website3") return SITE_REGISTRY.technoheaven;
  return null;
}

/**
 * Resolves a SiteDefinition strictly from production hostnames.
 */
export function resolveProductionSiteFromHost(hostHeader?: string | null): SiteDefinition | null {
  const host = normalizeHost(hostHeader);
  if (!host) return null;

  for (const site of ALL_SITES) {
    if (site.productionHostnames.includes(host)) {
      return site;
    }
  }

  const withoutWww = host.replace(/^www\./, "");
  for (const site of ALL_SITES) {
    if (site.productionHostnames.some((h) => h.replace(/^www\./, "") === withoutWww)) {
      return site;
    }
  }

  return null;
}

/**
 * Validates whether a given siteId is recognized.
 */
export function isValidSiteId(siteId: string): siteId is SiteId {
  return siteId === "gujjutours" || siteId === "tripgoasia" || siteId === "technoheaven";
}

export const DEFAULT_DEV_SITE_ID: SiteId = "gujjutours";

/**
 * Retrieves the actively configured SITE_ID from process.env, falling back to DEFAULT_DEV_SITE_ID.
 */
export function getActiveSiteId(): SiteId {
  const envSiteId = process.env.SITE_ID?.trim().toLowerCase();
  if (envSiteId && isValidSiteId(envSiteId)) {
    return envSiteId;
  }
  return DEFAULT_DEV_SITE_ID;
}
