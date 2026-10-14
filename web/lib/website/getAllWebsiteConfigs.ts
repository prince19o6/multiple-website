/**
 * lib/website/getAllWebsiteConfigs.ts
 * =========================================================================
 * Fetches DYNAMIC data for every registered hostname of every website
 * (GujjuTours / TripGoAsia / Technoheaven) — not just the one hostname a
 * single request happens to be for. Useful for an admin dashboard, a
 * warm-up/cache-priming script, or a health check across all domains.
 *
 * The hostname list comes from lib/hostnameRegistry.ts (which is the
 * single source of truth — see addHostname() / EXTRA_HOSTNAME_ALIASES
 * there), so adding a new production domain for an existing brand makes
 * it show up here automatically, with NOTHING to edit in this file.
 */
import { cache } from "react";
import {
    listAllowedHostnames,
    resolveHostname,
    type StaticSlug,
} from "@/lib/hostnameRegistry";
import { getWebsiteConfig } from "./getWebsiteConfig";
import type { WebsiteConfigResult } from "./types";

export interface AllWebsitesEntry extends WebsiteConfigResult {
    hostname: string;
    staticSlug: StaticSlug;
    brand: string;
}

/**
 * Fetches every registered hostname's dynamic config IN PARALLEL. Never
 * throws — a single hostname's failure just shows up as
 * `meta.source === "fallback"` on its own entry; it doesn't affect the
 * others (each site is fetched and merged independently, same as a
 * single getWebsiteConfig() call would).
 */
export const getAllWebsiteConfigs = cache(async (): Promise<AllWebsitesEntry[]> => {
    const hostnames = listAllowedHostnames(); // ALL registered hostnames, all 3 brands

    const entries = await Promise.all(
        hostnames.map(async (hostname): Promise<AllWebsitesEntry | null> => {
            const resolved = resolveHostname(hostname);
            if (!resolved) return null; // shouldn't happen: listAllowedHostnames() only returns registered ones

            const result = await getWebsiteConfig(hostname);
            return {
                ...result,
                hostname,
                staticSlug: resolved.staticSlug,
                brand: resolved.brand,
            };
        })
    );

    return entries.filter((e): e is AllWebsitesEntry => e !== null);
});

/** Same data, grouped by staticSlug (website1/2/3), each with its hostnames' results. */
export async function getAllWebsiteConfigsBySite(): Promise<
    Record<StaticSlug, AllWebsitesEntry[]>
> {
    const all = await getAllWebsiteConfigs();
    const grouped: Record<StaticSlug, AllWebsitesEntry[]> = {
        website1: [],
        website2: [],
        website3: [],
    };
    for (const entry of all) grouped[entry.staticSlug].push(entry);
    return grouped;
}