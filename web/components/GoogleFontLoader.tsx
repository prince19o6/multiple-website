// components/GoogleFontLoader.tsx
//
// Loads the fonts named in config.typography (headingFont / bodyFont) from
// Google Fonts, so a font that comes from the API or the database ("Poppins",
// "Inter", "Montserrat"...) really shows up instead of silently falling back
// to the system font.
//
//  - Fonts delivered as files by the config API are handled by
//    DynamicFontLoader, so this component does nothing in that case.
//  - "Playfair Display" is already preloaded by app/layout.tsx.
//  - Weights come from typography.headingWeight / bodyWeight (default 700 / 400).
//    Single-weight display fonts (e.g. Pacifico) need headingWeight "400".

import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

const ALREADY_AVAILABLE = new Set([
    "playfair display", // next/font in app/layout.tsx
    "system-ui",
    "sans-serif",
    "serif",
    "monospace",
    "arial",
    "helvetica",
    "georgia",
    "times new roman",
    "verdana",
    "tahoma",
    "trebuchet ms",
    "courier new",
    "segoe ui",
]);

function usableFamily(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const family = value.trim();
    // Letters, digits and spaces only: it ends up inside a URL.
    if (!/^[A-Za-z0-9 ]{2,60}$/.test(family)) return null;
    if (ALREADY_AVAILABLE.has(family.toLowerCase())) return null;
    return family;
}

function weight(value: unknown, fallback: string): string {
    const w = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
    return /^[1-9]00$/.test(w) ? w : fallback;
}

export function GoogleFontLoader({ config }: { config: MergedWebsiteConfig }) {
    if (config.dynamic?.font?.files?.length) return null;

    const t = (config.typography || {}) as Record<string, unknown>;
    const wanted = new Map<string, Set<string>>();

    const add = (family: string | null, w: string) => {
        if (!family) return;
        if (!wanted.has(family)) wanted.set(family, new Set());
        wanted.get(family)!.add(w);
    };

    add(usableFamily(t.headingFont), weight(t.headingWeight, "700"));
    add(usableFamily(t.bodyFont), weight(t.bodyWeight, "400"));

    if (wanted.size === 0) return null;

    const query = Array.from(wanted.entries())
        .map(([family, weights]) => {
            const list = Array.from(weights).sort().join(";");
            return `family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${list}`;
        })
        .join("&");

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
                rel="stylesheet"
                href={`https://fonts.googleapis.com/css2?${query}&display=swap`}
            />
        </>
    );
}