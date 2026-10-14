import { cache } from "react";
import { ENV } from "@/lib/env";
import { resolveSiteFromHost } from "@/lib/siteRegistry";

/**
 * lib/externalConfig.ts
 *
 * External configuration loader routed strictly through ENV.apiUrl.
 * Zero direct process.env reads. Strict TypeScript with no `any`.
 */

export function getExternalConfigBase(): string {
  return `${ENV.apiUrl}/api/core/v1/config`;
}

export function normalizeHostname(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "";
  let h = raw.trim().toLowerCase();
  if (h.startsWith("https://")) h = h.slice(8);
  if (h.startsWith("http://")) h = h.slice(7);
  const slash = h.indexOf("/");
  if (slash >= 0) h = h.slice(0, slash);
  const colon = h.indexOf(":");
  if (colon >= 0) h = h.slice(0, colon);
  if (h === "preview" || h === "localhost" || h.startsWith("127.")) return "";
  return h.replace(/\.+$/, "").trim();
}

export function buildExternalConfigUrl(hostname: string, lang = "en"): string {
  const host = normalizeHostname(hostname);
  if (!host) throw new Error("Empty hostname after normalize");
  return `${getExternalConfigBase()}/${encodeURIComponent(host)}?lang=${encodeURIComponent(lang)}`;
}

export type ExternalFetchResult =
  | {
      ok: true;
      hostname: string;
      url: string;
      status: number;
      result: Record<string, unknown>;
    }
  | {
      ok: false;
      hostname: string;
      url: string;
      status: number | null;
      message: string;
    };

async function fetchUncached(
  hostname: string,
  lang = "en"
): Promise<ExternalFetchResult> {
  const normalized = normalizeHostname(hostname);
  if (!normalized) {
    return {
      ok: false,
      hostname: String(hostname || ""),
      url: "",
      status: null,
      message: "Invalid hostname",
    };
  }

  const url = buildExternalConfigUrl(normalized, lang);

  if (ENV.isDev) {
    console.log("[Website Config] Hostname:", normalized);
    console.log("[Website Config] Request URL:", url);
  }

  const siteDef = resolveSiteFromHost(normalized);
  const siteId = siteDef ? siteDef.siteId : normalized;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Website-Hostname": siteDef?.backendHostname ?? normalized,
        "X-Website-Id": siteId,
      },
      next: { revalidate: 60, tags: [`ext-config:${siteId}:${normalized}`] },
    } as RequestInit);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[Website Config] Network error:", message);
    return { ok: false, hostname: normalized, url, status: null, message };
  }

  if (ENV.isDev) {
    console.log("[Website Config] HTTP Status:", response.status);
  }

  let parsed: { isSuccess?: boolean; result?: Record<string, unknown>; error?: string } | null = null;
  try {
    parsed = (await response.json()) as { isSuccess?: boolean; result?: Record<string, unknown>; error?: string };
  } catch {
    return {
      ok: false,
      hostname: normalized,
      url,
      status: response.status,
      message: "Non-JSON response from config API",
    };
  }

  const result = parsed?.result ?? null;
  const hasWebsite =
    result &&
    typeof result === "object" &&
    result.website &&
    typeof result.website === "object";

  if (ENV.isDev) {
    console.log("[Website Config] isSuccess:", parsed?.isSuccess);
    console.log("[Website Config] has website:", Boolean(hasWebsite));
  }

  if (response.ok && parsed?.isSuccess && result) {
    return {
      ok: true,
      hostname: normalized,
      url,
      status: response.status,
      result,
    };
  }

  return {
    ok: false,
    hostname: normalized,
    url,
    status: response.status,
    message: parsed?.error || `Config failed (HTTP ${response.status})`,
  };
}

export const fetchExternalWebsiteConfig = cache(
  async (hostname: string, lang = "en") => fetchUncached(hostname, lang)
);

export function isEmptyExternalResult(result: unknown): boolean {
  if (!result || typeof result !== "object") return true;
  const r = result as Record<string, unknown>;
  const w = r.website as Record<string, unknown> | undefined;
  const hasWebsite =
    w &&
    typeof w === "object" &&
    (w.name || w.fullName || w.logoUrl || w.icon);
  const c = r.colors as Record<string, unknown> | undefined;
  const hasColors =
    c &&
    typeof c === "object" &&
    Object.keys(c).length > 0 &&
    (c.primary || c.secondary);
  return !hasWebsite && !hasColors;
}