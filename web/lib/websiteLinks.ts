import type { SiteConfigResult } from "./siteConfig";

export type NavLink = {
    label: string;
    href: string;
    displayOrder: number;
};

export function headerLinksFromConfig(dynamic: SiteConfigResult | null): NavLink[] | null {
    const header = dynamic?.websiteLinks?.headerType;
    if (!Array.isArray(header) || header.length === 0) return null;

    const links: NavLink[] = [];
    for (const item of header) {
        if (!item || typeof item !== "object") continue;
        const row = item as {
            name?: string;
            reference?: string;
            displayOrder?: number;
            websiteContent?: { name?: string };
        };
        const label = row.name || row.websiteContent?.name;
        const href = row.reference;
        if (!label || !href) continue;
        links.push({
            label,
            href,
            displayOrder: typeof row.displayOrder === "number" ? row.displayOrder : 999,
        });
    }

    if (links.length === 0) return null;
    return links.sort((a, b) => a.displayOrder - b.displayOrder);
}