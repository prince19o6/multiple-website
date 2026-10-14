import type { SiteConfigResult } from "./siteConfig";
import { resolveLogoFromWebsite } from "./assetResolver";
import {
    themeFromApiColors,
    themeToCssVariables,
    type ThemeColors,
} from "./themeFromApi";
import { servicesFromConfig } from "./websiteModules";
import { headerLinksFromConfig } from "./websiteLinks";

export type NormalizedWebsiteConfig = {
    hostname: string;
    source: "external";
    website: SiteConfigResult["website"];
    branding: {
        name: string;
        fullName: string | null;
        logo: string | null;
        favicon: string | null;
    };
    colors: SiteConfigResult["colors"];
    theme: ThemeColors;
    cssVariables: Record<string, string>;
    font: SiteConfigResult["font"];
    headerLinks: ReturnType<typeof headerLinksFromConfig>;
    services: ReturnType<typeof servicesFromConfig>;
    modules: unknown[];
    contact: { email?: string; phone?: string };
    social: unknown[];
    uiTheme: Record<string, unknown>;
    websiteConfiguration: unknown;
    dynamic: SiteConfigResult;
};

function firstContactValue(list: unknown[] | undefined): string | undefined {
    if (!Array.isArray(list)) return undefined;
    for (const item of list) {
        if (item && typeof item === "object" && typeof (item as any).value === "string") {
            return (item as any).value;
        }
    }
    return undefined;
}

export function normalizeExternalResult(
    hostname: string,
    result: Record<string, any>
): NormalizedWebsiteConfig {
    const website = (result.website || null) as SiteConfigResult["website"];
    const colors = (result.colors || {}) as SiteConfigResult["colors"];
    const themeColors = themeFromApiColors(colors);
    const cssVariables = themeToCssVariables(themeColors);

    const logo = resolveLogoFromWebsite(website, null);
    const favicon = resolveLogoFromWebsite(
        {
            ...website,
            icon: website?.faviconImagePath || website?.favicon || website?.icon,
        },
        null
    );

    const name =
        (website?.name && String(website.name)) ||
        (website?.fullName && String(website.fullName)) ||
        hostname;

    const dynamic = result as SiteConfigResult;

    if (process.env.NODE_ENV === "development") {
        console.log("[Website Config] Normalized name:", name);
        console.log("[Website Config] Logo:", logo);
        console.log("[Website Config] Theme primary:", themeColors.primary);
    }

    return {
        hostname,
        source: "external",
        website,
        branding: {
            name,
            fullName: website?.fullName ? String(website.fullName) : null,
            logo,
            favicon,
        },
        colors,
        theme: themeColors,
        cssVariables,
        font: (result.font || null) as SiteConfigResult["font"],
        headerLinks: headerLinksFromConfig(dynamic),
        services: servicesFromConfig(dynamic),
        modules: Array.isArray(result.websiteModules) ? result.websiteModules : [],
        contact: {
            email: firstContactValue(result.websiteContact?.email),
            phone: firstContactValue(result.websiteContact?.contact),
        },
        social: Array.isArray(result.websiteExtra?.social)
            ? result.websiteExtra.social
            : [],
        uiTheme: (result.theme && typeof result.theme === "object"
            ? result.theme
            : {}) as Record<string, unknown>,
        websiteConfiguration: result.websiteConfiguration ?? null,
        dynamic,
    };
}