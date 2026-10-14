import { cache } from "react";
import { ENV } from "@/lib/env";
import {
  resolveSiteFromHost,
  getSiteById,
  normalizeHost,
} from "@/lib/siteRegistry";
import type { ApiColors } from "./themeFromApi";

export const CONFIG_API_BASE = ENV.apiUrl;

/**
 * Resolve route param (slug or hostname) → backend canonical hostname for config / API headers.
 */
export function resolveConfigHostname(siteOrHostname?: string): string {
  if (!siteOrHostname) return "";
  const site = getSiteById(siteOrHostname) || resolveSiteFromHost(siteOrHostname);
  if (site) return site.backendHostname;
  return normalizeHost(siteOrHostname);
}

export function resolveLogoUrl(website?: ApiWebsite | null): string | null {
  if (!website) return null;
  const raw = website.logoUrl || website.icon || website.favicon;
  if (!raw || typeof raw !== "string") return null;
  const clean = raw.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    return clean;
  }
  const staticPath = typeof website.staticPath === "string" ? website.staticPath.trim().replace(/\/+$/, "") : "";
  if (staticPath && !clean.startsWith("http")) {
    return `${staticPath}/${clean.replace(/^\/+/, "")}`;
  }
  return clean.startsWith("/") ? clean : `/${clean}`;
}

export interface ApiFont {
  family: string;
  files: Array<{ url: string; weight: number }>;
}

export interface ApiWebsite {
  id?: string | number;
  name?: string;
  fullName?: string;
  logoUrl?: string;
  icon?: string;
  favicon?: string;
  faviconImagePath?: string;
  staticPath?: string;
  serviceImageCdnPath?: string;
  footerCopyright?: string;
  [key: string]: unknown;
}

export interface SiteConfigResult {
  recommendations: Array<{ isEnabled: number; favService: string }>;
  theme: Record<string, unknown>;
  websiteConfiguration: unknown | null;
  websiteContact: { contact: unknown[]; email: unknown[] };
  websiteLaunguage: unknown[];
  websiteLinks: { headerType: unknown[]; footerTypes: unknown[] };
  font: ApiFont | null;
  colors: ApiColors;
  websiteRights: unknown[];
  website: ApiWebsite | null;
  websiteModules: unknown[];
  websiteExtra: { social: unknown[]; cardInfo: unknown[] };
  socialMediaScript: unknown[];
  websiteCurrency: unknown[];
  socialMediaConfig: unknown[];
  geo: { country: string | null; city: string | null; ip: string | null };
}

export interface SiteConfigResponse {
  result: SiteConfigResult | null;
  error: string | null;
  isSuccess: boolean;
}

export function buildConfigUrl(hostname: string, lang: string = "en"): string {
  const cleanHost = encodeURIComponent(resolveConfigHostname(hostname));
  const cleanLang = encodeURIComponent(lang || "en");
  return `${CONFIG_API_BASE}/api/core/v1/config/${cleanHost}?lang=${cleanLang}`;
}

export function resolveAssetUrl(
  path?: string | null,
  website?: ApiWebsite | null
): string {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const base =
    (typeof website?.staticPath === "string" && website.staticPath) ||
    (typeof website?.serviceImageCdnPath === "string" &&
      `${website.serviceImageCdnPath}/uploads/`) ||
    "";
  if (!base) return path;
  return `${base.replace(/\/?$/, "/")}${path.replace(/^\//, "")}`;
}

async function fetchSiteConfigUncached(
  siteOrHostname: string,
  lang: string = "en"
): Promise<SiteConfigResult> {
  const site = getSiteById(siteOrHostname) || resolveSiteFromHost(siteOrHostname);
  const targetBackendHost = site ? site.backendHostname : resolveConfigHostname(siteOrHostname);
  const siteId = site ? site.siteId : "shared";

  if (!targetBackendHost) {
    throw new Error(`Unable to resolve backend hostname for "${siteOrHostname}".`);
  }

  const url = buildConfigUrl(targetBackendHost, lang);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Website-Hostname": targetBackendHost,
        "X-Website-Id": siteId,
      },
      next: {
        revalidate: 300,
        tags: [`site-config:${siteId}`],
      },
    } as RequestInit);
  } catch (networkErr) {
    console.error("[siteConfig] Network error:", {
      url,
      hostname: targetBackendHost,
      error: networkErr instanceof Error ? networkErr.message : String(networkErr),
    });
    throw new Error(`Could not reach config API at ${url}. Is the backend reachable?`);
  }

  let body: SiteConfigResponse;
  try {
    body = (await response.json()) as SiteConfigResponse;
  } catch (parseErr) {
    console.error("[siteConfig] Invalid JSON:", {
      url,
      status: response.status,
      error: parseErr instanceof Error ? parseErr.message : String(parseErr),
    });
    throw new Error(`Config API returned non-JSON (status ${response.status})`);
  }

  if (!response.ok || !body.isSuccess || !body.result) {
    throw new Error(body?.error || `Failed to load site config (status ${response.status})`);
  }

  return body.result;
}

export const getCachedSiteConfig = cache(
  async (siteOrHostname: string, lang: string = "en"): Promise<SiteConfigResult> => {
    return fetchSiteConfigUncached(siteOrHostname, lang);
  }
);

export async function fetchSiteConfig(
  siteOrHostname: string,
  lang: string = "en"
): Promise<SiteConfigResult> {
  return getCachedSiteConfig(siteOrHostname, lang);
}

export async function fetchSiteConfigViaProxy(
  siteOrHostname: string,
  lang: string = "en"
): Promise<SiteConfigResult> {
  const site = getSiteById(siteOrHostname) || resolveSiteFromHost(siteOrHostname);
  const targetBackendHost = site ? site.backendHostname : resolveConfigHostname(siteOrHostname);
  const siteId = site ? site.siteId : "shared";

  const params = new URLSearchParams({
    hostname: targetBackendHost,
    lang,
    site: siteId,
  });

  const response = await fetch(`/api/site-config?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "X-Website-Hostname": targetBackendHost,
      "X-Website-Id": siteId,
    },
  });

  const body: SiteConfigResponse = await response.json();

  if (!response.ok || !body.isSuccess || !body.result) {
    throw new Error(body?.error || `Failed to load site config via proxy (status ${response.status})`);
  }

  return body.result;
}