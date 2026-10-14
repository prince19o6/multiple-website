/**
 * CENTRAL REGISTRY — the one place that says which website reads from
 * which data source. To add a website:
 *   1. add its static config in /config (like website1.js)
 *   2. add one row to SITE_REGISTRY below
 *   3. add its hostname(s) to lib/hostnameRegistry.ts
 */
import website1 from "@/config/website1";
import website2 from "@/config/website2";
import website3 from "@/config/website3";
import {
    normalizeHostname,
    resolveCanonicalHostname,
    resolveStaticSlug,
} from "@/lib/hostnameRegistry";
import { mergeWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import { resolveDefaultHostname } from "./env";
import { EXTRA_SITES, SOURCE_OVERRIDES } from "./sites.config";
import type {
    ExtraSiteDefinition,
    MergedWebsiteConfig,
    ResolvedSite,
    SiteConfigResult,
    SiteDefinition,
    WebsiteId,
} from "./types";

export const SITE_REGISTRY: Record<WebsiteId, SiteDefinition> = {
    website1: {
        id: "website1",
        label: "Travel Explorer",
        dataSource: "gujjutourdata",
        staticConfig: website1,
        source: SOURCE_OVERRIDES.website1,
    },
    website2: {
        id: "website2",
        label: "Adventure World",
        dataSource: "tripgoasia",
        staticConfig: website2,
        source: SOURCE_OVERRIDES.website2,
    },
    website3: {
        id: "website3",
        label: "Holiday Paradise",
        dataSource: "technoheaven",
        staticConfig: website3,
        source: SOURCE_OVERRIDES.website3,
    },
};

export function listWebsiteIds(): WebsiteId[] {
    return Object.keys(SITE_REGISTRY) as WebsiteId[];
}

export function isWebsiteId(value: string): value is WebsiteId {
    return Object.prototype.hasOwnProperty.call(SITE_REGISTRY, value);
}

function findExtraSite(input: string): { site: ExtraSiteDefinition; hostname: string } | null {
    const raw = input.trim().toLowerCase();
    if (!raw) return null;
    const normalized = normalizeHostname(raw);

    for (const site of EXTRA_SITES) {
        const hosts = site.hostnames.map((h) => normalizeHostname(h)).filter(Boolean);
        if (raw === site.id.toLowerCase()) return { site, hostname: hosts[0] ?? "" };
        if (hosts.includes(normalized)) return { site, hostname: normalized };
    }
    return null;
}

function staticConfigFor(extra: ExtraSiteDefinition): Record<string, any> {
    const base: Record<string, any> = extra.staticConfig
        ? extra.staticConfig
        : extra.template
          ? SITE_REGISTRY[extra.template].staticConfig
          : {};
    // Keep the template's own id on purpose: navigation/footer pick their
    // look ("adventure", "luxury"...) from it.
    return { ...base, ...(base.id ? {} : { id: extra.id }), name: extra.label };
}

function resolveHostname(input: string): string {
    const canonical = resolveCanonicalHostname(input);
    if (canonical) return canonical;

    const normalized = normalizeHostname(input);
    if (normalized.includes(".")) return normalized;

    return normalizeHostname(resolveDefaultHostname());
}

/**
 * Accepts a website id ("website1"), a brand slug ("gujjutours"), or a real
 * hostname ("www.tripgoasia.com") and returns everything needed to fetch and
 * build that site's config. Never throws. Unknown hostnames are still
 * supported (multi-tenant): they get a generic definition with no static
 * theme, and their hostname doubles as the data source name.
 */
export function resolveSite(input: string): ResolvedSite {
    const raw = typeof input === "string" ? input.trim() : "";

    // Websites added in lib/website/sites.config.ts (own hostnames + own API).
    const extra = findExtraSite(raw);
    if (extra) {
        return {
            id: extra.site.id,
            label: extra.site.label,
            dataSource: extra.site.dataSource ?? extra.site.id,
            staticConfig: staticConfigFor(extra.site),
            source: extra.site.source,
            hostname: extra.hostname,
            known: true,
        };
    }

    const hostname = resolveHostname(raw);
    const slug = resolveStaticSlug(raw);

    if (slug && isWebsiteId(slug)) {
        return { ...SITE_REGISTRY[slug], hostname, known: true };
    }

    const id = raw || hostname;
    return {
        id,
        label: hostname || id,
        dataSource: hostname || id,
        staticConfig: { id },
        hostname,
        known: false,
    };
}

/** Static config + (optional) dynamic data -> final config. Client-safe. */
export function buildWebsiteConfig(
    site: SiteDefinition,
    dynamic: SiteConfigResult | null
): MergedWebsiteConfig {
    if (site.createConfig) return site.createConfig(dynamic);
    return mergeWebsiteConfig(site.staticConfig, dynamic);
}