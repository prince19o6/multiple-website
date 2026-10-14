import type {
    DynamicDataResult,
    ResolvedSite,
    WebsiteConfigError,
    WebsiteConfigErrorCode,
} from "./types";

/** Builds (and logs) a typed failure. Never throws. */
export function failure(
    site: ResolvedSite,
    url: string,
    code: WebsiteConfigErrorCode,
    message: string,
    status: number | null = null
): DynamicDataResult {
    const error: WebsiteConfigError = {
        code,
        message,
        status,
        url,
        hostname: site.hostname,
        dataSource: site.dataSource,
    };
    // console.warn, not console.error: this is a HANDLED failure (the
    // caller falls back to the static config), and Next.js 15's dev
    // overlay treats any console.error as a blocking full-screen error
    // even when the code recovers gracefully — misleading for something
    // this routine (a missing env var, a site that hasn't set up its
    // external API yet, a transient network blip).
    console.warn("[website-config]", error);
    return { ok: false, error };
}