/**
 * Fetches a website's dynamic data from ANOTHER website's REST API
 * (see RestSourceConfig). SERVER-SIDE ONLY. Never throws.
 */
import { isEmptyExternalResult } from "@/lib/externalConfig";
import type { SiteConfigResult } from "@/lib/siteConfig";
import { ENV } from "@/lib/env";
import {
    DEFAULT_LANG,
    DEFAULT_REVALIDATE_SECONDS,
    resolveApiBaseUrl,
    resolveTimeoutMs,
} from "./env";
import { failure } from "./errors";
import {
    applyMapping,
    deepMerge,
    getPath,
    toSiteConfigResult,
} from "./mapping";
import type {
    DynamicDataResult,
    FetchDynamicDataOptions,
    RestSourceConfig,
    ResolvedSite,
} from "./types";

class MissingEnvError extends Error {
    constructor(public envName: string) {
        super(`Environment variable ${envName} is not set`);
    }
}

/** Replaces {hostname} {lang} {websiteId} and {env:NAME}. */
function fill(template: string, vars: Record<string, string>, encode: boolean): string {
    return template.replace(/\{(env:)?([A-Za-z0-9_]+)\}/g, (_m, isEnv: string | undefined, name: string) => {
        let value: string | undefined;
        if (isEnv) {
            if (name === "NEXT_PUBLIC_API_URL" || name === "API_BASE_URL") value = ENV.apiUrl;
            else if (name === "NEXT_PUBLIC_SITE_HOSTNAME") value = vars["hostname"];
            else if (name === "NEXT_PUBLIC_SITE_ID") value = vars["websiteId"];
            else value = undefined;

            if (value === undefined || value === "") throw new MissingEnvError(name);
        } else {
            value = vars[name];
            if (value === undefined) return `{${name}}`;
        }
        return encode ? encodeURIComponent(value) : value;
    });
}

function clean(value: string): string {
    return value.trim().replace(/\/+$/, "");
}

function resolveRestBase(source: RestSourceConfig, _dataSource: string): string | null {
    if (source.baseUrl && clean(source.baseUrl)) return clean(source.baseUrl);
    return ENV.apiUrl;
}

/** Hides API keys / tokens in the URL shown in logs and the debug endpoint. */
function redactUrl(url: string): string {
    return url.replace(
        /([?&][^=&]*(?:key|token|secret|auth|password|signature)[^=&]*=)[^&]*/gi,
        "$1***"
    );
}

async function readSavedOverlay(
    site: ResolvedSite,
    timeoutMs: number
): Promise<{ config: Record<string, unknown> | null; note: string }> {
    const base = resolveApiBaseUrl(site.dataSource);
    if (!base) return { config: null, note: "skipped: backend URL not configured" };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 4000));
    try {
        const res = await fetch(
            `${base}/api/admin/website-config/${encodeURIComponent(site.hostname)}`,
            {
                headers: {
                    Accept: "application/json",
                    "X-Website-Hostname": site.hostname,
                    "X-Website-Id": site.id,
                },
                signal: controller.signal,
                cache: "no-store",
            }
        );
        if (res.status === 404) return { config: null, note: "nothing saved in database for this hostname" };
        if (!res.ok) return { config: null, note: `backend answered ${res.status}` };
        const body = (await res.json()) as { config?: unknown };
        const cfg = body?.config;
        return cfg && typeof cfg === "object" && !Array.isArray(cfg)
            ? { config: cfg as Record<string, unknown>, note: "applied (saved config wins)" }
            : { config: null, note: "saved config was empty" };
    } catch (err) {
        return { config: null, note: `not applied: ${err instanceof Error ? err.message : String(err)}` };
    } finally {
        clearTimeout(timer);
    }
}

export async function fetchRestSource(
    site: ResolvedSite,
    source: RestSourceConfig,
    options: FetchDynamicDataOptions = {}
): Promise<DynamicDataResult> {
    const lang = options.lang || DEFAULT_LANG;
    const debug = options.debug;

    if (!site.hostname) {
        return failure(site, "", "NO_HOSTNAME", "No hostname could be resolved for this website");
    }

    const vars = { hostname: site.hostname, lang, websiteId: site.id };
    let url = "";
    const headers: Record<string, string> = {
        Accept: "application/json",
        "X-Website-Hostname": site.hostname,
        "X-Website-Id": site.id,
    };

    try {
        const base = resolveRestBase(source, site.dataSource);
        if (!base) {
            return failure(
                site,
                "",
                "NO_BASE_URL",
                `No API base URL for "${site.dataSource}": set baseUrl / baseUrlEnv in lib/website/sites.config.ts`
            );
        }
        const path = fill(source.path.startsWith("/") ? source.path : `/${source.path}`, vars, true);
        url = `${base}${path}`;
        for (const [k, v] of Object.entries(source.headers ?? {})) {
            headers[k] = fill(v, vars, false);
        }
    } catch (err) {
        if (err instanceof MissingEnvError) {
            return failure(site, "", "MISSING_ENV", `${err.message} (add it to .env.local and restart)`);
        }
        return failure(site, "", "UNEXPECTED", err instanceof Error ? err.message : String(err));
    }

    const method = source.method ?? "GET";
    const safeUrl = redactUrl(url);
    if (debug) {
        debug.method = method;
        debug.url = safeUrl;
    }

    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? resolveTimeoutMs();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const init = {
            method,
            headers,
            signal: controller.signal,
            ...(options.noStore
                ? { cache: "no-store" }
                : {
                    next: {
                        revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS,
                        tags: [`site-config:${site.id}:${site.hostname}`, `website-data:${site.dataSource}`],
                    },
                }),
        } as RequestInit;

        const response = await fetch(url, init);
        const text = await response.text();
        if (debug) {
            debug.status = response.status;
            debug.bodyPreview = text.slice(0, 2000);
        }

        if (!response.ok) {
            return failure(site, safeUrl, "HTTP_ERROR", `API responded with status ${response.status}`, response.status);
        }

        let body: unknown;
        try {
            body = JSON.parse(text);
        } catch {
            return failure(site, safeUrl, "INVALID_JSON", "API returned non-JSON body", response.status);
        }

        // ---- step 1: locate the data in the response ----
        const sourcePayload = source.responsePath ? getPath(body, source.responsePath) : body;

        // ---- step 2: map into our internal shape ----
        const outcome = applyMapping(sourcePayload, source.mapping ?? {});
        let converted: Record<string, unknown> = outcome.result;

        if (!converted || Object.keys(converted).length === 0) {
            return failure(
                site,
                safeUrl,
                "MERGE_FAILED",
                source.responsePath
                    ? `No object found at path "${source.responsePath}"`
                    : "API response has no usable data",
                response.status
            );
        }

        // ---- optional: saved config from YOUR database wins ----
        if (source.overlaySavedConfig) {
            const overlay = await readSavedOverlay(site, timeoutMs);
            if (debug) debug.overlay = overlay.note;
            if (overlay.config) {
                converted = {
                    ...converted,
                    websiteConfiguration: deepMerge(
                        (converted.websiteConfiguration as Record<string, unknown>) ?? {},
                        overlay.config
                    ),
                };
            }
        }

        const data: SiteConfigResult = toSiteConfigResult(converted, site.label);

        if (isEmptyExternalResult(data)) {
            return failure(site, safeUrl, "EMPTY_RESPONSE", "API has no data for this hostname", response.status);
        }

        return { ok: true, data, url: safeUrl, status: response.status };
    } catch (err) {
        const aborted = err instanceof Error && err.name === "AbortError";
        return failure(
            site,
            safeUrl,
            aborted ? "TIMEOUT" : "NETWORK",
            aborted
                ? `Request timed out after ${timeoutMs}ms`
                : err instanceof Error
                    ? err.message
                    : String(err)
        );
    } finally {
        clearTimeout(timer);
    }
}