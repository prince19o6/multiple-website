"use client";

import { useRouter, useParams } from "next/navigation";
import { sitePath } from "@/lib/sitepath";
import {
    ACTION_TO_PATH,
    getButtonClass,
    getButtonSize,
    getHeadingFontFamily,
} from "@/lib/sectionHelpers";
import type { SectionProps } from "@/lib/componentRegistry";

export default function Cta({ config }: SectionProps) {
    const router = useRouter();
    const { site } = useParams<{ site: string }>();

    const theme: any = config.theme || {};
    const cta: any = (config as any).cta || {};
    const buttons: any = (config as any).buttons || {};
    const headingFontFamily = getHeadingFontFamily(config);

    if (cta.enabled === false) return null;

    // Same idea as Hero: fall back to the real, already-fetched site name
    // instead of hardcoded generic English, so any new hostname gets a
    // branded-feeling CTA with zero manual config.
    const siteName = config.name || "Us";
    const defaultTitle = `Ready to Explore with ${siteName}?`;
    const defaultButtonText = `Start Exploring ${siteName}`;

    const heroButtonHref = (action: string | undefined) =>
        sitePath(site, ACTION_TO_PATH[action || "explore"] || "/explore");

    // Holiday Paradise's cta.style: "luxury" — a thin gold divider, serif
    // heading, and an outline (not filled) button, quieter than the bold
    // filled CTA every other site uses.
    if (cta.style === "luxury") {
        return (
            <section key="cta" className="py-20 text-center" style={{ backgroundColor: theme.background }}>
                <div className="max-w-2xl mx-auto px-4">
                    <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: theme.accent || "#d4af37" }} />
                    <h2 className="text-4xl mb-5" style={{ color: theme.heading, fontFamily: headingFontFamily }}>
                        {cta.title || defaultTitle}
                    </h2>
                    <p className="mb-10" style={{ color: theme.mutedText }}>{cta.description}</p>
                    <button
                        onClick={() => router.push(heroButtonHref(cta.buttonAction))}
                        className="px-10 py-3.5 text-sm uppercase tracking-widest font-semibold border transition-colors hover:text-white"
                        style={{ borderColor: theme.primary, color: theme.primary }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.primary || "#dc2626")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                        {cta.buttonText || defaultButtonText}
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section key="cta" className="py-16" style={{ backgroundColor: theme.background || "#f8fafc" }}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl font-bold mb-6">{cta.title || defaultTitle}</h2>
                <p className="text-gray-600 text-lg mb-8">{cta.description}</p>
                <button
                    onClick={() => router.push(heroButtonHref(cta.buttonAction))}
                    className={`${getButtonClass(buttons)} ${getButtonSize(buttons)} font-bold text-lg transition-all hover:opacity-90`}
                    style={{ backgroundColor: theme.primary || "#2563eb", color: "#ffffff" }}
                >
                    {cta.buttonText || defaultButtonText} →
                </button>
            </div>
        </section>
    );
}