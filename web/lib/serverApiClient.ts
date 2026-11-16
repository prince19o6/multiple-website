import "server-only";

/**
 * lib/serverApiClient.ts
 *
 * AUTHORITATIVE SERVER-ONLY API CLIENT FOR NEXT.JS 15.
 *
 * Guarantees:
 * - Marked with `import "server-only"` to prevent bundlers from ever inlining into client code.
 * - Enforces per-website API key isolation: Asserts at runtime that Site A's key cannot be used with Site B's API.
 * - Automatically injects `X-Website-Hostname`, `X-Website-Id`, and `X-Api-Key`.
 * - Optional user token propagation (`Authorization: Bearer <jwt>`).
 * - Configurable AbortController timeout (default 10s).
 * - Typed error hierarchy (`ServerApiClientError`).
 * - Bounded retries strictly for network or 5xx server errors; client errors (4xx) are NEVER retried.
 * - Zero `any`.
 */

import {
  SITE_REGISTRY,
  getSiteById,
  type SiteDefinition,
  type SiteId,
} from "@/lib/siteRegistry";
import { getSiteApiCredentials } from "@/lib/serverSiteSecrets";

export type ServerApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "SECURITY_MISMATCH"
  | "CLIENT_ERROR"
  | "SERVER_ERROR"
  | "PARSE_ERROR";

export class ServerApiClientError extends Error {
  readonly status: number;
  readonly code: ServerApiErrorCode;
  readonly siteId: SiteId;
  readonly url: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: ServerApiErrorCode,
    siteId: SiteId,
    url: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ServerApiClientError";
    this.status = status;
    this.code = code;
    this.siteId = siteId;
    this.url = url;
    this.details = details;
  }
}

export interface ServerFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  userToken?: string;
  customApiKey?: string;
}

export interface ServerFetchResult<T> {
  success: boolean;
  data: T;
  status: number;
  siteId: SiteId;
  backendHostname: string;
  dataSource: "mongodb" | "api" | "fallback";
}

/**
 * Runtime assertion: Validates that an API key belongs strictly to the requested website tenant.
 * Prevents accidental cross-tenant leakage where credentials for Website A might be passed to Website B.
 */
export function assertTenantKeySafety(site: SiteDefinition, apiKey: string, url: string): void {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    throw new ServerApiClientError(
      `[serverApiClient] Critical security error: No API key configured for website "${site.siteId}" (${site.displayName}).`,
      401,
      "SECURITY_MISMATCH",
      site.siteId,
      url
    );
  }

  // Cross-reference against every other registered tenant
  for (const [otherId, otherSite] of Object.entries(SITE_REGISTRY)) {
    if (otherId !== site.siteId) {
      const otherCreds = getSiteApiCredentials(otherId as SiteId);
      if (otherCreds.apiKey && apiKey.trim() === otherCreds.apiKey.trim()) {
        throw new ServerApiClientError(
          `[serverApiClient] CRITICAL CROSS-TENANT VIOLATION PREVENTED: Attempted to call website "${site.siteId}" (${site.displayName}) using the API key belonging to "${otherSite.displayName}" (${otherId})!`,
          403,
          "SECURITY_MISMATCH",
          site.siteId,
          url
        );
      }
    }
  }
}

function resolveSiteDefinition(siteOrId: SiteDefinition | SiteId): SiteDefinition {
  if (typeof siteOrId === "string") {
    const found = getSiteById(siteOrId);
    if (!found) {
      throw new Error(`[serverApiClient] Unknown site identifier: "${siteOrId}"`);
    }
    return found;
  }
  return siteOrId;
}

/**
 * Executes a resilient, authenticated server-side HTTP request scoped strictly to a website tenant.
 */
export async function serverFetch<T>(
  siteOrId: SiteDefinition | SiteId,
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<ServerFetchResult<T>> {
  const site = resolveSiteDefinition(siteOrId);
  const creds = getSiteApiCredentials(site.siteId);

  const activeKey = options.customApiKey || creds.apiKey;
  const timeoutMs = options.timeoutMs ?? 10000;
  const maxRetries = options.retries ?? 2;
  const method = options.method || "GET";

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${creds.apiUrl.replace(/\/+$/, "")}${cleanEndpoint}`;

  // Enforce runtime safety assertion
  assertTenantKeySafety(site, activeKey, fullUrl);

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    "X-Website-Hostname": site.backendHostname,
    "X-Website-Id": site.siteId,
    "X-Api-Key": activeKey,
    ...options.headers,
  };

  if (options.userToken) {
    requestHeaders["Authorization"] = `Bearer ${options.userToken}`;
  }

  let requestBody: string | undefined;
  if (options.body !== undefined && options.body !== null) {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
        cache: options.cache ?? "no-store",
        next: options.next,
      });

      clearTimeout(timer);

      // 4xx Client Errors are strictly terminal — never retried
      if (response.status >= 400 && response.status < 500) {
        let errorDetails: unknown;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }

        throw new ServerApiClientError(
          `Request to ${fullUrl} failed with client status ${response.status}`,
          response.status,
          "CLIENT_ERROR",
          site.siteId,
          fullUrl,
          errorDetails
        );
      }

      // 5xx Server Errors may be transient — eligible for retry
      if (!response.ok) {
        throw new ServerApiClientError(
          `Request to ${fullUrl} failed with server status ${response.status}`,
          response.status,
          "SERVER_ERROR",
          site.siteId,
          fullUrl
        );
      }

      let parsedData: T;
      try {
        const text = await response.text();
        parsedData = text ? (JSON.parse(text) as T) : ({} as T);
      } catch (parseErr) {
        throw new ServerApiClientError(
          `Failed to parse JSON response from ${fullUrl}`,
          response.status,
          "PARSE_ERROR",
          site.siteId,
          fullUrl,
          parseErr
        );
      }

      const dataSource = (response.headers.get("x-data-source") as "mongodb" | "api" | null) || "mongodb";

      return {
        success: true,
        data: parsedData,
        status: response.status,
        siteId: site.siteId,
        backendHostname: site.backendHostname,
        dataSource,
      };
    } catch (err: unknown) {
      clearTimeout(timer);

      // Do NOT retry client errors or security assertions
      if (err instanceof ServerApiClientError && err.code === "CLIENT_ERROR") {
        throw err;
      }
      if (err instanceof ServerApiClientError && err.code === "SECURITY_MISMATCH") {
        throw err;
      }

      lastError = err;

      const isAbort = (err as { name?: string })?.name === "AbortError";
      const isLastAttempt = attempt > maxRetries;

      if (isLastAttempt) {
        if (isAbort) {
          throw new ServerApiClientError(
            `Request to ${fullUrl} timed out after ${timeoutMs}ms`,
            408,
            "TIMEOUT",
            site.siteId,
            fullUrl
          );
        }
        if (err instanceof ServerApiClientError) {
          throw err;
        }
        throw new ServerApiClientError(
          `Network failure requesting ${fullUrl}: ${err instanceof Error ? err.message : String(err)}`,
          503,
          "NETWORK_ERROR",
          site.siteId,
          fullUrl,
          err
        );
      }

      // Exponential backoff before retry (200ms, 400ms)
      const backoffMs = attempt * 200;
      await new Promise((res) => setTimeout(res, backoffMs));
    }
  }

  throw new ServerApiClientError(
    `Failed after ${maxRetries} retries`,
    500,
    "SERVER_ERROR",
    site.siteId,
    fullUrl,
    lastError
  );
}

export async function serverGet<T>(
  site: SiteDefinition | SiteId,
  endpoint: string,
  options?: Omit<ServerFetchOptions, "method">
): Promise<ServerFetchResult<T>> {
  return serverFetch<T>(site, endpoint, { ...options, method: "GET" });
}

export async function serverPost<T>(
  site: SiteDefinition | SiteId,
  endpoint: string,
  body?: unknown,
  options?: Omit<ServerFetchOptions, "method" | "body">
): Promise<ServerFetchResult<T>> {
  return serverFetch<T>(site, endpoint, { ...options, method: "POST", body });
}

export async function serverPut<T>(
  site: SiteDefinition | SiteId,
  endpoint: string,
  body?: unknown,
  options?: Omit<ServerFetchOptions, "method" | "body">
): Promise<ServerFetchResult<T>> {
  return serverFetch<T>(site, endpoint, { ...options, method: "PUT", body });
}

export async function serverDelete<T>(
  site: SiteDefinition | SiteId,
  endpoint: string,
  options?: Omit<ServerFetchOptions, "method">
): Promise<ServerFetchResult<T>> {
  return serverFetch<T>(site, endpoint, { ...options, method: "DELETE" });
}
