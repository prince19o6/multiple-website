// Shared visual helpers used across homepage sections. Pulled out of
// app/[site]/page.tsx unchanged so every section component can share
// the same button/icon/typography logic without duplicating it.

export function getButtonClass(buttons: any = {}): string {
    if (buttons.style === "pill") return "rounded-full";
    if (buttons.style === "square") return "rounded-none";
    if (buttons.style === "outline") return "rounded-lg border-2";
    return "rounded-lg"; // covers "rounded" and any unset value
}

export function getButtonSize(buttons: any = {}): string {
    if (buttons.size === "large") return "px-10 py-4";
    return "px-8 py-3";
}

// Icon container styling — this is what makes each site's feature
// icons look genuinely different (shape, size, background, motion),
// not just a recolor.
export function getIconWrapperClass(icons: any = {}): string {
    let classes = "flex items-center justify-center mb-4 shrink-0 ";

    if (icons.size === "small") classes += "w-10 h-10 text-2xl ";
    else if (icons.size === "medium") classes += "w-14 h-14 text-3xl ";
    else classes += "w-16 h-16 text-4xl "; // large (default)

    if (icons.style === "square") classes += "rounded-lg ";
    else if (icons.style === "hexagon") classes += "rounded-2xl rotate-3 ";
    else classes += "rounded-full "; // circle (default)

    if (icons.background === "light") classes += "bg-gray-100 ";
    else if (icons.background === "dark") classes += "bg-gray-900 text-white ";
    // "primary" background is applied inline using the theme color

    if (icons.animation === "bounce") classes += "animate-bounce ";
    else if (icons.animation === "pulse") classes += "animate-pulse ";

    return classes;
}

export function getIconWrapperStyle(
    icons: any = {},
    theme: any = {}
): Record<string, string> {
    if (icons.background === "primary" || !icons.background) {
        return { backgroundColor: `${theme.primary || "#2563eb"}1a` }; // light tint
    }
    return {};
}

// Icon position within a card — top/left/right/bottom.
export function getCardLayoutClass(icons: any = {}): string {
    if (icons.position === "left") return "flex items-start gap-4 text-left";
    if (icons.position === "right")
        return "flex flex-row-reverse items-start gap-4 text-right";
    if (icons.position === "bottom")
        return "flex flex-col-reverse items-center text-center";
    return "flex flex-col items-center text-center"; // top (default)
}

// A hero/CTA "action" (from config) maps to a real route. "destinations"
// and "activities" fall back to /explore until those pages exist for
// real, so no button ever links to a 404.
export const ACTION_TO_PATH: Record<string, string> = {
    explore: "/explore",
    activities: "/explore",
    destinations: "/explore",
};

// Heading font comes from config.typography.headingFont (API / database /
// static file, in that priority). "Playfair Display" is preloaded globally in
// app/layout.tsx as --font-playfair; every other family is loaded by
// components/GoogleFontLoader.tsx (or DynamicFontLoader for API font files).
export function getHeadingFontFamily(config: any): string | undefined {
    const family = config?.typography?.headingFont;
    if (typeof family !== "string" || !family.trim()) return undefined;

    if (family === "Playfair Display") {
        return "var(--font-playfair), Georgia, serif";
    }

    const clean = family.replace(/['"]/g, "").trim();
    const isSerif =
        /playfair|georgia|merriweather|lora|cormorant|garamond|baskerville|times/i.test(clean) ||
        (/serif/i.test(clean) && !/sans/i.test(clean));

    return `'${clean}', ${isSerif ? "Georgia, serif" : "system-ui, sans-serif"}`;
}