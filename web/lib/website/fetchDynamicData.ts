/**
 * Fetches one website's dynamic data from its data source.
 * SERVER-SIDE ONLY. Never throws: every failure comes
 * back as { ok: false, error } so callers can fall back to static config.
 */
import { isEmptyExternalResult } from "@/lib/externalConfig";
import type { SiteConfigResponse } from "@/lib/siteConfig";
import { failure } from "./errors";
import { fetchRestSource } from "./fetchRestSource";
import {
    DEFAULT_LANG,
    DEFAULT_REVALIDATE_SECONDS,
    resolveApiBaseUrl,
    resolveTimeoutMs,
} from "./env";
import type {
    DynamicDataResult,
    FetchDynamicDataOptions,
    ResolvedSite,
} from "./types";

export function buildDynamicDataUrl(
    baseUrl: string,
    hostname: string,
    lang: string
): string {
    return `${baseUrl}/api/core/v1/config/${encodeURIComponent(hostname)}?lang=${encodeURIComponent(lang)}`;
}

export async function fetchDynamicData(
    site: ResolvedSite,
    options: FetchDynamicDataOptions = {}
): Promise<DynamicDataResult> {
    // A website with its own REST API (sites.config.ts) is fetched by the REST
    // fetcher. Everything else goes through your own backend, as before.
    if (site.source) {
        return fetchRestSource(site, site.source, options);
    }

    const lang = options.lang || DEFAULT_LANG;

    if (!site.hostname) {
        return failure(
            site,
            "",
            "NO_HOSTNAME",
            "No hostname could be resolved for this website"
        );
    }

    const baseUrl = resolveApiBaseUrl(site.dataSource);
    if (!baseUrl) {
        return failure(
            site,
            "",
            "NO_BASE_URL",
            "API base URL is not configured (set NEXT_PUBLIC_API_URL or WEBSITE_API_URL)"
        );
    }

    const url = buildDynamicDataUrl(baseUrl, site.hostname, lang);
    if (options.debug) {
        options.debug.method = "GET";
        options.debug.url = url;
    }
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? resolveTimeoutMs();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const init = {
            method: "GET",
            headers: {
                Accept: "application/json",
                "X-Website-Hostname": site.hostname,
                "X-Website-Id": site.id,
            },
            signal: controller.signal,
            ...(options.noStore
                ? { cache: "no-store" }
                : {
                    next: {
                        revalidate:
                            options.revalidate ?? DEFAULT_REVALIDATE_SECONDS,
                        // Isolated cache tags per website ID and data source
                        tags: [
                            `site-config:${site.id}:${site.hostname}`,
                            `website-data:${site.dataSource}`,
                        ],
                    },
                }),
        } as RequestInit;

        const response = await fetch(url, init);
        const text = await response.text();
        if (options.debug) {
            options.debug.status = response.status;
            options.debug.bodyPreview = text.slice(0, 2000);
        }

        let body: SiteConfigResponse | null = null;
        try {
            body = JSON.parse(text) as SiteConfigResponse;
        } catch {
            /* handled below */
        }

        if (!response.ok) {
            return failure(
                site,
                url,
                "HTTP_ERROR",
                body?.error || `API responded with status ${response.status}`,
                response.status
            );
        }
        if (!body) {
            return failure(
                site,
                url,
                "INVALID_JSON",
                "API returned a non-JSON response body"
            );
        }
        if (!body.isSuccess || !body.result) {
            return failure(
                site,
                url,
                "API_REJECTED",
                body.error || "API returned isSuccess=false or null result"
            );
        }

        // Catch the "mock backend returned empty arrays for everything" case so
        // fallbackToStatic works as documented instead of showing a blank page.
        if (isEmptyExternalResult(body.result)) {
            return failure(
                site,
                url,
                "EMPTY_RESPONSE",
                "API returned an empty result object (no real website config)"
            );
        }

        return {
            ok: true,
            data: body.result,
            url,
            status: response.status,
        };
    } catch (err) {
        const isAbort =
            err instanceof Error &&
            (err.name === "AbortError" || err.message.includes("aborted"));
        return failure(
            site,
            url,
            isAbort ? "TIMEOUT" : "NETWORK",
            err instanceof Error ? err.message : String(err)
        );
    } finally {
        clearTimeout(timer);
    }
}