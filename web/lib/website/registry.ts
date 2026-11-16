/**
 * CENTRAL REGISTRY — Backward-compatible adapter for legacy callers.
 * All dynamic tenant configuration is now driven by SiteConfig (lib/config/siteConfigSchema.ts)
 * and served directly by the tenant's API.
 */
import { DEFAULT_SITE_CONFIG } from "@/lib/config/siteConfigSchema";
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
        label: "Gujju Tours",
        dataSource: "gujjutourdata",
        staticConfig: DEFAULT_SITE_CONFIG as any,
        source: SOURCE_OVERRIDES.website1,
    },
    website2: {
        id: "website2",
        label: "TripGo Asia",
        dataSource: "tripgoasia",
        staticConfig: DEFAULT_SITE_CONFIG as any,
        source: SOURCE_OVERRIDES.website2,
    },
    website3: {
        id: "website3",
        label: "Technoheaven",
        dataSource: "technoheaven",
        staticConfig: DEFAULT_SITE_CONFIG as any,
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
          : DEFAULT_SITE_CONFIG;
    return { ...base, ...(base.id ? {} : { id: extra.id }), name: extra.label };
}

function resolveHostname(input: string): string {
    const canonical = resolveCanonicalHostname(input);
    if (canonical) return canonical;

    const normalized = normalizeHostname(input);
    if (normalized.includes(".")) return normalized;

    return normalizeHostname(resolveDefaultHostname());
}

export function resolveWebsite(input: string): ResolvedSite {
    const extra = findExtraSite(input);
    if (extra) {
        return {
            id: extra.site.id,
            label: extra.site.label,
            hostname: extra.hostname,
            dataSource: extra.site.dataSource || extra.site.id,
            staticConfig: staticConfigFor(extra.site),
            source: extra.site.source,
            known: true,
        };
    }

    const staticSlug = resolveStaticSlug(input);
    if (staticSlug && isWebsiteId(staticSlug)) {
        const def = SITE_REGISTRY[staticSlug];
        return {
            id: def.id,
            label: def.label,
            hostname: resolveHostname(input),
            dataSource: def.dataSource,
            staticConfig: def.staticConfig,
            source: def.source,
            known: true,
        };
    }

    const hostname = resolveHostname(input);
    return {
        id: hostname,
        label: hostname,
        hostname,
        dataSource: hostname,
        staticConfig: DEFAULT_SITE_CONFIG as any,
        known: false,
    };
}

export const resolveSite = resolveWebsite;

export function buildWebsiteConfig(
    site: ResolvedSite,
    dynamicResult: SiteConfigResult | null
): MergedWebsiteConfig {
    return mergeWebsiteConfig(site.staticConfig, dynamicResult) as any;
}
