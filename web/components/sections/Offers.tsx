"use client";

import { useRouter, useParams } from "next/navigation";
import { sitePath } from "@/lib/sitepath";
import { getHeadingFontFamily } from "@/lib/sectionHelpers";
import type { SectionProps } from "@/lib/componentRegistry";

// website3 (Holiday Paradise) only.
export default function Offers({ config }: SectionProps) {
    const router = useRouter();
    const { site } = useParams<{ site: string }>();

    const theme: any = config.theme || {};
    const offersConfig: any = (config as any).offers || {};
    const headingFontFamily = getHeadingFontFamily(config);

    if (offersConfig.enabled === false) return null;

    return (
        <section
            key="offers"
            className="py-16 text-center text-white"
            style={{ backgroundColor: theme.primary || "#dc2626" }}
        >
            <div className="max-w-3xl mx-auto px-4">
                {offersConfig.showLimitedTime && (
                    <span className="inline-block bg-white/20 px-4 py-1 text-xs uppercase tracking-widest mb-4">
                        {offersConfig.badgeText || "Special Offer"}
                    </span>
                )}
                <h2 className="text-3xl mb-3" style={{ fontFamily: headingFontFamily || "Georgia, serif" }}>
                    {offersConfig.title || "Special Holiday Offers"}
                </h2>
                <p className="text-white/85 mb-6">{offersConfig.subtitle}</p>
                <button
                    onClick={() => router.push(sitePath(site, "/explore"))}
                    className="bg-white px-8 py-3 font-semibold"
                    style={{ color: theme.primary }}
                >
                    {offersConfig.buttonText || "View Offer"}
                </button>
            </div>
        </section>
    );
}