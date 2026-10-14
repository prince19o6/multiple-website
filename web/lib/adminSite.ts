// lib/adminSite.ts
// Scoped site identifier for the active admin panel session.

import { ENV } from "@/lib/env";
import { resolveSiteFromHost, DEFAULT_DEV_SITE_ID } from "@/lib/siteRegistry";

export const ADMIN_SITES = [
  "gujjutours",
  "tripgoasia",
  "technoheaven",
  "website1",
  "website2",
  "website3",
] as const;

export type AdminSite = (typeof ADMIN_SITES)[number];

const STORAGE_KEY = "adminWebsiteId";
const CHANGE_EVENT = "admin-website-change";

export function getAdminWebsiteId(): AdminSite {
  if (typeof window !== "undefined") {
    // 1. First check if hostname matches a known site
    const siteFromHost = resolveSiteFromHost(window.location.hostname);
    if (siteFromHost && (ADMIN_SITES as readonly string[]).includes(siteFromHost.siteId)) {
      return siteFromHost.siteId as AdminSite;
    }
    // 2. Check localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (ADMIN_SITES as readonly string[]).includes(stored)) {
      return stored as AdminSite;
    }
  }
  if (ENV.defaultSiteId && (ADMIN_SITES as readonly string[]).includes(ENV.defaultSiteId)) {
    return ENV.defaultSiteId as AdminSite;
  }
  return (DEFAULT_DEV_SITE_ID as AdminSite) || "tripgoasia";
}

export function setAdminWebsiteId(site: AdminSite) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, site);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: site }));
}

export function onAdminWebsiteChange(callback: (site: AdminSite) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => callback((e as CustomEvent<AdminSite>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}