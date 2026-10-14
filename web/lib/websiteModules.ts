import type { SiteConfigResult } from "./siteConfig";

export type WebsiteServices = {
    tours: boolean;
    hotels: boolean;
    activities: boolean;
    transfers: boolean;
    flights: boolean;
    visa: boolean;
    restaurants: boolean;
    insurance: boolean;
    packages: boolean;
    featureCodes: Set<string>;
    fromApi: boolean;
};

const DEFAULT_SERVICES: Omit<WebsiteServices, "featureCodes" | "fromApi"> = {
    tours: true,
    hotels: false,
    activities: false,
    transfers: false,
    flights: false,
    visa: false,
    restaurants: false,
    insurance: false,
    packages: true,
};

function codesFromRights(dynamic: SiteConfigResult | null): Set<string> {
    const set = new Set<string>();
    if (!dynamic?.websiteRights || !Array.isArray(dynamic.websiteRights)) return set;
    for (const item of dynamic.websiteRights) {
        if (item && typeof item === "object") {
            const code = (item as { featureCode?: string }).featureCode;
            if (typeof code === "string" && code) set.add(code.toUpperCase());
            const feature = (item as { feature?: string }).feature;
            if (typeof feature === "string" && feature) set.add(feature.toUpperCase());
        }
    }
    return set;
}

export function servicesFromConfig(dynamic: SiteConfigResult | null): WebsiteServices {
    const featureCodes = codesFromRights(dynamic);
    const fromApi =
        featureCodes.size > 0 ||
        (Array.isArray(dynamic?.websiteModules) && dynamic!.websiteModules.length > 0);

    if (!fromApi) {
        return { ...DEFAULT_SERVICES, featureCodes, fromApi: false };
    }

    const has = (...keys: string[]) => keys.some((k) => featureCodes.has(k.toUpperCase()));

    return {
        tours: has("TOUR", "TOURS", "AS", "ALLSERVICES", "TLRVHIT") || true,
        hotels: has("HOTEL", "HOTELS", "HSEARCHV2", "HOTELPOLYGONSEARCH", "SHCAT", "ISSHOWROOM", "SPWH"),
        activities: has("ACTIVITY", "ACTIVITIES"),
        transfers: has("TRANSFER", "TRANSFERS", "TRANFER"),
        flights: has("FLIGHT", "FLIGHTS"),
        visa: has("VISA", "VISAWHYCHOOSEUS"),
        restaurants: has("RESTAURANT", "RESTAURANTS"),
        insurance: has("INSURANCE"),
        packages: has("PACKAGE", "PACKAGES", "SPWH", "AS") || true,
        featureCodes,
        fromApi: true,
    };
}

export function isServiceEnabled(
    services: WebsiteServices,
    name: keyof Omit<WebsiteServices, "featureCodes" | "fromApi">
): boolean {
    return Boolean(services[name]);
}