import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import type { SiteConfigResult } from "@/lib/siteConfig";

export type { MergedWebsiteConfig, SiteConfigResult };

/* ------------------------------------------------------------------ */
/*  Data sources: where a website's dynamic data comes from            */
/* ------------------------------------------------------------------ */

/** One mapping rule: read a value from the other API's JSON. */
export interface MappingRule {
    /** Path in the other API's JSON, e.g. "data.branding.primaryColor". A list = first non-empty wins. */
    from: string | string[];
    /** Used when the API has no value at that path. */
    default?: unknown;
    /** Convert the value: "string" | "number" | "boolean" | "array". */
    as?: "string" | "number" | "boolean" | "array";
}

/**
 * target path (same names as in config/website1.js) -> where to read it.
 *   "theme.primary": "data.branding.primaryColor"
 *   "homeSections":  { from: "data.home.sections", default: ["hero", "cta"] }
 */
export type FieldMapping = Record<string, string | MappingRule>;

/** Debug info filled in by the fetchers (used by /api/website-config/[id]/debug). */
export interface FetchDebugSink {
    method?: string;
    /** Requested URL with secrets removed */
    url?: string;
    status?: number | null;
    /** First part of the raw response body */
    bodyPreview?: string;
    /** Fields the mapping could not find in the response */
    unmapped?: string[];
    /** How many mapped fields were found */
    mappedCount?: number;
    /** Saved (database) config overlay result */
    overlay?: string;
}

/**
 * A REST API that is NOT your own backend. Add one to a website in
 * lib/website/sites.config.ts.
 */
export interface RestSourceConfig {
    type: "rest";
    /** Full base URL, e.g. "https://api.sunrisetours.com" ... */
    baseUrl?: string;
    /** ...or the NAME of an env variable that holds it (recommended), e.g. "SUNRISE_API_URL". */
    baseUrlEnv?: string;
    /**
     * Path (+ query). Placeholders: {hostname} {lang} {websiteId} {env:NAME}
     * e.g. "/api/core/v1/config/{hostname}?lang={lang}"
     */
    path: string;
    method?: "GET" | "POST";
    /** Extra headers. Values accept the same placeholders, e.g. { Authorization: "Bearer {env:SUNRISE_API_KEY}" } */
    headers?: Record<string, string>;
    /** Only if the API wraps success in a flag, e.g. "isSuccess". Falsy value = failure. */
    successPath?: string;
    /** Where the useful payload sits in the JSON, e.g. "result" or "data". Omit if it is the root. */
    responsePath?: string;
    /**
     * "native": the API already returns the same shape as the Gujju Tours config API
     *           (website, colors, font, websiteConfiguration ...). Nothing to map.
     * "mapped": any other shape, translated with `mapping` (default when `mapping` is set).
     */
    format?: "native" | "mapped";
    mapping?: FieldMapping;
    /** Escape hatch for odd APIs: full control over the conversion. Return null for "no data". */
    transform?: (payload: any, ctx: { hostname: string; lang: string }) => Partial<SiteConfigResult> | null;
    /**
     * Also read the config saved in YOUR database (PUT /api/admin/website-config/{hostname})
     * and let it win over the API values. Handy: theme/fonts from their API, home page from your DB.
     */
    overlaySavedConfig?: boolean;
}

/** A brand-new website (own hostnames + own API). Add it in lib/website/sites.config.ts. */
export interface ExtraSiteDefinition {
    /** Any unique name, e.g. "sunrise" */
    id: string;
    /** Shown in logs / as fallback site name */
    label: string;
    /** Real hostnames that should show this site (first one is the canonical one) */
    hostnames: string[];
    /**
     * Start from the layout, sections, navigation and footer of website1 / website2 / website3.
     * The API then overrides theme, fonts, texts... Recommended.
     */
    template?: WebsiteId;
    /** Or give your own static config object instead of a template. */
    staticConfig?: Record<string, any>;
    /** Logical data-source name (labels + WEBSITE_API_URL__<NAME> env override). Defaults to id. */
    dataSource?: DataSourceId;
    /** Where its dynamic data comes from. Omit = your own backend (like website1-3). */
    source?: RestSourceConfig;
}

/** The three websites that ship with hand-authored static config. */
export type WebsiteId = "website1" | "website2" | "website3";

/**
 * Logical name of the backend data source a website reads from.
 * Known values are listed for autocomplete; any other string is allowed so
 * unknown hostnames keep working (multi-tenant).
 */
export type DataSourceId =
    | "gujjutourdata"
    | "tripgoasia"
    | "technoheaven"
    | (string & {});

/**
 * One row of the central registry. Add a new website by adding one row
 * in lib/website/registry.ts — nothing else needs to change.
 */
export interface SiteDefinition {
    /** "website1" | "website2" | "website3" (or the raw slug for unknown sites) */
    id: string;
    /** Human-readable name, for logs / admin UIs */
    label: string;
    /** Which data source this website reads its dynamic content from */
    dataSource: DataSourceId;
    /** Hand-authored static config (theme, fonts, layout, buttons, cards...) */
    staticConfig: Record<string, any>;
    /**
     * Optional custom factory: static config + dynamic data -> final config.
     * Defaults to mergeWebsiteConfig(staticConfig, dynamic). Plug your own
     * createWebsiteConfig(dynamicData) in here if you want a per-site merge.
     */
    createConfig?: (dynamic: SiteConfigResult | null) => MergedWebsiteConfig;
    /** Omit = read from your own backend. Set = read from this REST API instead. */
    source?: RestSourceConfig;
}

/** A SiteDefinition plus the hostname to ask the backend about. */
export interface ResolvedSite extends SiteDefinition {
    hostname: string;
    /** false for hostnames/slugs that are not in the registry */
    known: boolean;
}

export type WebsiteConfigErrorCode =
    | "NO_BASE_URL"
    | "NO_HOSTNAME"
    | "MISSING_ENV"
    | "TIMEOUT"
    | "NETWORK"
    | "HTTP_ERROR"
    | "INVALID_JSON"
    | "API_REJECTED"
    | "EMPTY_RESPONSE"
    | "MERGE_FAILED"
    | "UNEXPECTED";

export interface WebsiteConfigError {
    code: WebsiteConfigErrorCode;
    message: string;
    /** HTTP status when there was a response, otherwise null */
    status: number | null;
    /** URL that was requested ("" if none could be built) */
    url: string;
    hostname: string;
    dataSource: DataSourceId;
}

export type DynamicDataResult =
    | { ok: true; data: SiteConfigResult; url: string; status: number }
    | { ok: false; error: WebsiteConfigError };

export interface FetchDynamicDataOptions {
    lang?: string;
    /** Abort the request after this many ms (default from env, 8000) */
    timeoutMs?: number;
    /** Next.js data-cache lifetime in seconds (default 60) */
    revalidate?: number;
    /** Filled with request/response details for the debug endpoint */
    debug?: FetchDebugSink;
    /** Skip the Next.js data cache entirely */
    noStore?: boolean;
}

export type ConfigSource = "api" | "fallback";

export interface WebsiteConfigMeta {
    websiteId: string;
    dataSource: DataSourceId;
    hostname: string;
    known: boolean;
    /** "api" = dynamic data merged in; "fallback" = static/default config only */
    source: ConfigSource;
    /** Why we fell back (null when source === "api") */
    error: WebsiteConfigError | null;
    fetchedAt: string;
}

export interface WebsiteConfigResult {
    config: MergedWebsiteConfig;
    meta: WebsiteConfigMeta;
}

export interface GetWebsiteConfigOptions {
    lang?: string;
}
