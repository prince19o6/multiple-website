/**
 * lib/website/env.ts
 *
 * Environment access for the website-config layer.
 * Resolves exclusively through lib/env.ts (single source of truth).
 */

import { ENV } from "@/lib/env";
import { getSiteById, DEFAULT_DEV_SITE_ID } from "@/lib/siteRegistry";

export const DEFAULT_LANG = ENV.defaultLang || "en";
export const DEFAULT_REVALIDATE_SECONDS = 60;
const DEFAULT_TIMEOUT_MS = 8000;

export function resolveApiBaseUrl(_dataSource?: string): string {
  return ENV.apiUrl;
}

export function resolveTimeoutMs(): number {
  return DEFAULT_TIMEOUT_MS;
}

/** Hostname used when a bare slug is not in the registry. */
export function resolveDefaultHostname(siteId?: string): string {
  const site = getSiteById(siteId || ENV.defaultSiteId || DEFAULT_DEV_SITE_ID);
  return site ? site.backendHostname : "www.gujjutours.com";
}