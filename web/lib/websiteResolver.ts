/**
 * lib/websiteResolver.ts
 * =========================================================================
 * THE single centralized entry point for "which website is this request
 * for?". Everything else (middleware, layout, API routes, components)
 * calls THIS — never re-implements hostname parsing.
 *
 * It is a thin, explicit wrapper around the data layer that already
 * exists in this project:
 *   - lib/hostnameRegistry.ts   -> known-brand aliases (website1/2/3)
 *   - lib/website/registry.ts   -> SITE_REGISTRY + EXTRA_SITES (sites.config.ts)
 * so adding a website in lib/website/sites.config.ts automatically makes
 * it resolvable here too — no second place to register it.
 *
 *   const website = resolveWebsiteFromHostname(hostname);
 *   website.hostname   // "example2.com"
 *   website.websiteId  // "website2"
 *   website.registered // true = known site, false = unregistered hostname
 */
import { normalizeHostname } from "./hostnameRegistry";
import { resolveSite } from "./website/registry";
import type { ResolvedSite } from "./website/types";

export interface ResolvedWebsite {
    /** Normalized hostname (lowercase, no protocol/port/trailing dot) */
    hostname: string;
    /** Internal id used for fetching/separating data, e.g. "website1" */
    websiteId: string;
    /** false = this hostname is NOT in the registry (unknown website) */
    registered: boolean;
    /** Full resolved site (static config, data source, REST source...) */
    site: ResolvedSite;
}

/**
 * Step 1-6 of the flow: hostname in, websiteId out. Never throws.
 * An unrecognized hostname still gets a websiteId (its own hostname, so
 * caching/data-fetching always has a stable, unique key — see "Data
 * isolation" below) but `registered` is false, so callers can decide to
 * reject it (see requireRegisteredWebsite).
 */
export function resolveWebsiteFromHostname(rawHostname: string): ResolvedWebsite {
    const hostname = normalizeHostname(rawHostname || "");
    const site = resolveSite(hostname);
    return {
        hostname,
        websiteId: site.id,
        registered: site.known,
        site,
    };
}

/** Same thing, but throws a typed error for unregistered hostnames. */
export class UnknownWebsiteError extends Error {
    constructor(public hostname: string) {
        super(`Unknown website: no websiteId is registered for hostname "${hostname}"`);
        this.name = "UnknownWebsiteError";
    }
}

export function requireRegisteredWebsite(rawHostname: string): ResolvedWebsite {
    const resolved = resolveWebsiteFromHostname(rawHostname);
    if (!resolved.registered) throw new UnknownWebsiteError(resolved.hostname);
    return resolved;
}

/**
 * Data-isolation helper (see "Caching" requirement): a cache key that can
 * NEVER collide between two websites, even before you know if the
 * hostname is registered.
 *   cacheKey("website2", "tours")            -> "website2:tours"
 *   cacheKey("website2", "tours", "featured")-> "website2:tours:featured"
 */
export function websiteCacheKey(websiteId: string, ...parts: (string | number)[]): string {
    return [websiteId, ...parts].join(":");
}