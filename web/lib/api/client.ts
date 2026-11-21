/**
 * web/lib/api/client.ts
 *
 * UNIFIED TYPED API CLIENT FOR THE TOURS MONOREPO.
 * Supports both Server Components and Client Components.
 * Automatically injects:
 *   - X-Website-Id (from NEXT_PUBLIC_SITE_ID / env / caller)
 *   - X-Website-Hostname (mapped from siteId)
 *   - X-Api-Key (from NEXT_PUBLIC_API_KEY / env / caller)
 * Handles JSON parsing, timeout aborts, exponential-backoff retries, and typed errors.
 */

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  siteId?: string;
  apiKey?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly data?: unknown;

  constructor(message: string, status: number, url: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

/**
 * Maps tenant siteId to official Website hostname matching backend WebsiteRegistry.cs
 */
export function getTenantHostname(siteId: string): string {
  const s = siteId.toLowerCase().trim();
  switch (s) {
    case "tripgoasia":
    case "website2":
      return "tripgoasia.com";
    case "technoheaven":
    case "website3":
      return "technoheaven.com";
    case "gujjutours":
    case "website1":
    default:
      return "gujjutours.com";
  }
}

/**
 * Resolves the active site ID across environments.
 */
export function getDefaultSiteId(): string {
  if (typeof process !== "undefined" && process.env) {
    return (
      process.env.NEXT_PUBLIC_SITE_ID ||
      process.env.SITE_ID ||
      "gujjutours"
    ).toLowerCase().trim();
  }
  return "gujjutours";
}

/**
 * Resolves the backend API base URL across server and client.
 */
export function getApiBaseUrl(): string {
  if (typeof process !== "undefined" && process.env) {
    const url =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.API_URL ||
      "http://localhost:5000";
    return url.replace(/\/+$/, "");
  }
  return "http://localhost:5000";
}

/**
 * Resolves the tenant public API key.
 */
export function getDefaultApiKey(siteId: string): string {
  const s = siteId.toLowerCase().trim();
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NEXT_PUBLIC_API_KEY) {
      return process.env.NEXT_PUBLIC_API_KEY;
    }
    if (s === "tripgoasia") {
      return process.env.TRIPGOASIA_API_KEY || "tg_pub_app_tripgoasia_2026_y2r";
    }
    if (s === "technoheaven") {
      return process.env.TECHNOHEAVEN_API_KEY || "th_pub_app_technoheaven_2026_z5q";
    }
    return process.env.GUJJUTOURS_API_KEY || "gt_pub_app_gujjutours_2026_m8b";
  }
  return s === "tripgoasia"
    ? "tg_pub_app_tripgoasia_2026_y2r"
    : s === "technoheaven"
    ? "th_pub_app_technoheaven_2026_z5q"
    : "gt_pub_app_gujjutours_2026_m8b";
}

/**
 * Core fetch wrapper with timeout, retry, and multi-tenant headers.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = 12000,
    retries = 2,
    siteId = getDefaultSiteId(),
    apiKey,
    params,
    headers: customHeaders,
    ...fetchInit
  } = options;

  const baseUrl = getApiBaseUrl();
  const resolvedApiKey = apiKey || getDefaultApiKey(siteId);
  const hostname = getTenantHostname(siteId);

  // Construct final URL with query parameters
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  let url = `${baseUrl}${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
    "X-Website-Id": siteId,
    "X-Website-Hostname": hostname,
    "X-Api-Key": resolvedApiKey,
  };

  if (fetchInit.body && typeof fetchInit.body === "string") {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(customHeaders as Record<string, string>),
  };

  let lastError: Error | null = null;
  const attempts = Math.max(1, retries + 1);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // In client browser, if a direct backend call failed on previous attempt, try same-origin proxy
      const targetUrl =
        typeof window !== "undefined" && attempt > 1 && url.startsWith("http://localhost:5000")
          ? url.replace("http://localhost:5000", "")
          : url;

      const response = await fetch(targetUrl, {
        ...fetchInit,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Handle non-OK status codes
      if (!response.ok) {
        // If direct backend call gave 502/503/504 or 404 in browser, try same-origin proxy fallback
        if (typeof window !== "undefined" && targetUrl.startsWith("http://localhost:5000")) {
          try {
            const sameOriginUrl = url.replace("http://localhost:5000", "");
            const fallbackRes = await fetch(sameOriginUrl, {
              ...fetchInit,
              headers: mergedHeaders,
            });
            if (fallbackRes.ok) {
              const json = await fallbackRes.json();
              return json as T;
            }
          } catch {
            // ignore and proceed
          }
        }

        let errData: any = null;
        try {
          errData = await response.json();
        } catch {
          errData = { message: response.statusText };
        }

        const msg =
          errData?.message ||
          errData?.error ||
          errData?.title ||
          `API request failed with status ${response.status} (${response.statusText})`;

        const apiErr = new ApiError(msg, response.status, url, errData);

        // Do not retry 4xx errors (client errors or not-found)
        if (response.status >= 400 && response.status < 500) {
          throw apiErr;
        }

        lastError = apiErr;
      } else {
        // Parse successful response
        const json = await response.json();
        return json as T;
      }
    } catch (err: any) {
      clearTimeout(timer);

      // In client browser, if direct call to port 5000 failed due to connection refused / offline, try same-origin proxy
      if (typeof window !== "undefined" && url.startsWith("http://localhost:5000")) {
        try {
          const sameOriginUrl = url.replace("http://localhost:5000", "");
          const fallbackRes = await fetch(sameOriginUrl, {
            ...fetchInit,
            headers: mergedHeaders,
          });
          if (fallbackRes.ok) {
            const json = await fallbackRes.json();
            return json as T;
          }
        } catch {
          // continue with standard error handling
        }
      }

      if (err instanceof ApiError && err.status < 500) {
        throw err;
      }

      if (err.name === "AbortError") {
        lastError = new ApiError(
          `Request timeout after ${timeoutMs}ms to ${cleanEndpoint}`,
          408,
          url
        );
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
      }

      // If we still have attempts left, wait with exponential backoff
      if (attempt < attempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  throw (
    lastError ||
    new ApiError(`API call failed after ${attempts} attempts`, 500, url)
  );
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};
