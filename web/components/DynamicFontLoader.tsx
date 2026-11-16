// Injects @font-face rules for whatever font the config API returned
// (e.g. Poppins, loaded at runtime from CloudFront) and exposes it as
// CSS variables so the rest of the site can use var(--font-heading) /
// var(--font-body) without knowing where the font came from. Also
// works automatically with any component that already reads
// config.typography.headingFont / bodyFont as a font-family string,
// since mergeWebsiteConfig.ts sets those to the same family name.
// Renders nothing visible — safe to drop into any layout.

"use client";

import { useEffect } from "react";

interface FontFile {
    url: string;
    weight: number;
}

interface DynamicFont {
    family: string;
    files: FontFile[];
}

export function DynamicFontLoader({ font }: { font: DynamicFont | null | undefined }) {
    useEffect(() => {
        if (!font?.family || !font.files?.length) return;

        const styleId = `dynamic-font-${font.family.replace(/\s+/g, "-").toLowerCase()}`;

        document.documentElement.style.setProperty("--font-heading", `'${font.family}', sans-serif`);
        document.documentElement.style.setProperty("--font-body", `'${font.family}', sans-serif`);

        // Avoid injecting duplicate <style> tags on re-renders/navigation.
        if (document.getElementById(styleId)) return;

        const faceRules = font.files
            .map(
                (file) => `
        @font-face {
          font-family: '${font.family}';
          src: url('${file.url}') format('woff2');
          font-weight: ${file.weight};
          font-style: normal;
          font-display: swap;
        }`
            )
            .join("\n");

        const styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.textContent = faceRules;
        document.head.appendChild(styleEl);
    }, [font?.family, font?.files]);

    return null;
}