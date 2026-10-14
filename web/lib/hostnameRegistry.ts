/**
 * lib/hostnameRegistry.ts
 *
 * Hostname resolution helpers delegating to lib/siteRegistry.ts.
 */

import {
  SITE_REGISTRY,
  ALL_SITES,
  resolveSiteFromHost,
  getSiteById,
  normalizeHost,
  type SiteId,
} from "./siteRegistry";

export type StaticSlug = "website1" | "website2" | "website3";
export type AllowedBrand = SiteId;

export interface HostnameAlias {
  hostname: string;
  staticSlug: StaticSlug;
  brand: AllowedBrand;
}

export interface ResolvedHostname {
  hostname: string;
  staticSlug: StaticSlug;
  brand: AllowedBrand;
  canonicalHost: string;
}

export const BRAND_TO_SLUG: Record<AllowedBrand, StaticSlug> = {
  gujjutours: "website1",
  tripgoasia: "website2",
  technoheaven: "website3",
};

export const SLUG_TO_BRAND: Record<StaticSlug, AllowedBrand> = {
  website1: "gujjutours",
  website2: "tripgoasia",
  website3: "technoheaven",
};

export function normalizeHostname(raw?: string | null): string {
  return normalizeHost(raw);
}

export function isAllowedWebsite(siteOrHostname: string): boolean {
  return resolveBrand(siteOrHostname) !== null;
}

export function resolveBrand(siteOrHostname?: string | null): AllowedBrand | null {
  if (!siteOrHostname) return null;
  const site = getSiteById(siteOrHostname) || resolveSiteFromHost(siteOrHostname);
  return site ? site.siteId : null;
}

export function resolveStaticSlug(siteOrHostname?: string | null): StaticSlug | null {
  const brand = resolveBrand(siteOrHostname);
  return brand ? BRAND_TO_SLUG[brand] : null;
}

export function resolveCanonicalHostname(siteOrHostname: string): string | null {
  const site = getSiteById(siteOrHostname) || resolveSiteFromHost(siteOrHostname);
  return site ? site.backendHostname : null;
}

export function resolveHostname(siteOrHostname: string): ResolvedHostname | null {
  const site = getSiteById(siteOrHostname) || resolveSiteFromHost(siteOrHostname);
  if (!site) return null;
  return {
    hostname: normalizeHost(siteOrHostname) || site.backendHostname,
    staticSlug: site.legacySlug,
    brand: site.siteId,
    canonicalHost: site.backendHostname,
  };
}

export function listAllowedHostnames(): string[] {
  return ALL_SITES.flatMap((s) => [...s.devHostnames, ...s.productionHostnames]);
}

export function getHostnamesForWebsite(staticSlug: StaticSlug): string[] {
  const brand = SLUG_TO_BRAND[staticSlug];
  if (!brand) return [];
  const s = SITE_REGISTRY[brand];
  return [...s.devHostnames, ...s.productionHostnames];
}

export function addHostname(_hostname: string, _staticSlug: StaticSlug, _brand: AllowedBrand): boolean {
  return true;
}