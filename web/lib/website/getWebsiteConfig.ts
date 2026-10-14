/**
 * getWebsiteConfig(websiteId) — the single entry point for server code
 * (Server Components, layouts, generateMetadata, route handlers).
 *
 *   1. resolves the site + its data source from the registry
 *   2. fetches that site's dynamic data (timeout, cache, error handling)
 *   3. merges it into the static config
 *   4. on ANY failure returns the static/default config instead
 *
 * It never throws. Check `meta.source` / `meta.error` if you care whether
 * the API answered.
 *
 * React's cache() de-duplicates calls within one request, so the layout,
 * the page and generateMetadata can all call this without extra fetches.
 */
import { cache } from "react";
import { DEFAULT_LANG } from "./env";
import { fetchDynamicData } from "./fetchDynamicData";
import { buildWebsiteConfig, resolveSite } from "./registry";
import type {
    GetWebsiteConfigOptions,
    MergedWebsiteConfig,
    ResolvedSite,
    SiteConfigResult,
    WebsiteConfigError,
    WebsiteConfigResult,
} from "./types";

// Primitive arguments only: React's cache() keys on argument identity.
const loadWebsiteConfig = cache(
    async (websiteId: string, lang: string): Promise<WebsiteConfigResult> => {
        const site = resolveSite(websiteId);
        let dynamic: SiteConfigResult | null = null;
        let error: WebsiteConfigError | null = null;

        try {
            const result = await fetchDynamicData(site, { lang });
            if (result.ok) dynamic = result.data;
            else error = result.error;
        } catch (err) {
            error = toUnexpectedError(site, err, "UNEXPECTED");
        }

        let config: MergedWebsiteConfig;
        try {
            config = buildWebsiteConfig(site, dynamic);
        } catch (err) {
            // Bad API data broke the merge: keep the site up on static config.
            error = toUnexpectedError(site, err, "MERGE_FAILED");
            dynamic = null;
            config = buildWebsiteConfig(site, null);
        }

        return {
            config,
            meta: {
                websiteId: site.id,
                dataSource: site.dataSource,
                hostname: site.hostname,
                known: site.known,
                source: dynamic ? "api" : "fallback",
                error: dynamic ? null : error,
                fetchedAt: new Date().toISOString(),
            },
        };
    }
);

function toUnexpectedError(
    site: ResolvedSite,
    err: unknown,
    code: "UNEXPECTED" | "MERGE_FAILED"
): WebsiteConfigError {
    const error: WebsiteConfigError = {
        code,
        message: err instanceof Error ? err.message : String(err),
        status: null,
        url: "",
        hostname: site.hostname,
        dataSource: site.dataSource,
    };
    console.error("[website-config]", error);
    return error;
}

export function getWebsiteConfig(
    websiteId: string,
    options: GetWebsiteConfigOptions = {}
): Promise<WebsiteConfigResult> {
    return loadWebsiteConfig(websiteId, options.lang || DEFAULT_LANG);
}