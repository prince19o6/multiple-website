/**
 * lib/env.ts
 *
 * THE ONLY FILE IN THE ENTIRE WEB APP THAT READS process.env.
 * Single source of truth for runtime environment configuration.
 *
 * Architecture Guarantee:
 * - Reads SITE_ID dynamically at request time on the server.
 * - The active website for localhost/LAN is determined by SITE_ID in .env.
 * - Optional ENABLE_HOST_ROUTING=true allows *.localhost host matching.
 * - Exports typed SharedEnvConfig with zero `any`.
 */

import { isValidSiteId } from "@/lib/siteRegistry";

export interface EnvValidationError {
  variable: string;
  message: string;
  received?: string;
  expected?: string;
}

export interface SharedEnvConfig {
  readonly apiUrl: string;
  readonly backendFallbackUrl: string;
  readonly defaultLang: string;
  readonly siteId?: string;
  readonly defaultSiteId?: string;
  readonly isSiteIdValid: boolean;
  readonly enableHostRouting: boolean;
  readonly allowSeedFallback: boolean;
  readonly port: number;
  readonly isDev: boolean;
}

function clean(val?: string | null): string {
  return (val ?? "").trim();
}

function cleanUrl(val?: string | null): string {
  return clean(val).replace(/\/+$/, "");
}

function parseSharedEnv(): SharedEnvConfig {
  const isDev = process.env.NODE_ENV !== "production";

  const rawApiUrl = cleanUrl(
    process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:5000"
  );
  const rawBackendUrl = cleanUrl(
    process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || rawApiUrl || "http://localhost:5000"
  );
  const rawDefaultLang = clean(process.env.NEXT_PUBLIC_DEFAULT_LANG) || "en";

  // Prioritize SITE_ID, fallback to ACTIVE_SITE_ID or DEFAULT_SITE_ID
  const rawSiteId =
    clean(process.env.SITE_ID || process.env.ACTIVE_SITE_ID || process.env.DEFAULT_SITE_ID).toLowerCase() ||
    undefined;

  const isSiteIdValid = Boolean(rawSiteId && isValidSiteId(rawSiteId));
  const enableHostRouting = clean(process.env.ENABLE_HOST_ROUTING).toLowerCase() === "true";
  const allowSeedFallback = clean(process.env.ALLOW_SEED_FALLBACK).toLowerCase() === "true";
  const rawPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const port = !Number.isNaN(rawPort) && rawPort > 0 ? rawPort : 3000;

  return {
    apiUrl: rawApiUrl,
    backendFallbackUrl: rawBackendUrl,
    defaultLang: rawDefaultLang,
    siteId: rawSiteId,
    defaultSiteId: rawSiteId,
    isSiteIdValid,
    enableHostRouting,
    allowSeedFallback,
    port,
    isDev,
  };
}

export function getSharedEnv(): SharedEnvConfig {
  return parseSharedEnv();
}

export const ENV: SharedEnvConfig = {
  get apiUrl(): string {
    return cleanUrl(
      process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:5000"
    );
  },
  get backendFallbackUrl(): string {
    return cleanUrl(
      process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000"
    );
  },
  get defaultLang(): string {
    return clean(process.env.NEXT_PUBLIC_DEFAULT_LANG) || "en";
  },
  get siteId(): string | undefined {
    return (
      clean(
        process.env.SITE_ID || process.env.ACTIVE_SITE_ID || process.env.DEFAULT_SITE_ID
      ).toLowerCase() || undefined
    );
  },
  get defaultSiteId(): string | undefined {
    return this.siteId;
  },
  get isSiteIdValid(): boolean {
    const s = this.siteId;
    return Boolean(s && isValidSiteId(s));
  },
  get enableHostRouting(): boolean {
    return clean(process.env.ENABLE_HOST_ROUTING).toLowerCase() === "true";
  },
  get allowSeedFallback(): boolean {
    return clean(process.env.ALLOW_SEED_FALLBACK).toLowerCase() === "true";
  },
  get port(): number {
    const rawPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    return !Number.isNaN(rawPort) && rawPort > 0 ? rawPort : 3000;
  },
  get isDev(): boolean {
    return process.env.NODE_ENV !== "production";
  },
};
