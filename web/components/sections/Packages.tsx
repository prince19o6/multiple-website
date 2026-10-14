"use client";

import { useRouter, useParams } from "next/navigation";
import { sitePath } from "@/lib/sitepath";
import { getHeadingFontFamily } from "@/lib/sectionHelpers";
import type { SectionProps } from "@/lib/componentRegistry";

// website3 (Holiday Paradise) only. Elegant editorial cards.
export default function Packages({ config }: SectionProps) {
    const router = useRouter();
    const { site } = useParams<{ site: string }>();

    const theme: any = config.theme || {};
    const packagesConfig: any = (config as any).packages || {};
    const headingFontFamily = getHeadingFontFamily(config);

    if (packagesConfig.enabled === false || !packagesConfig.items?.length) return null;

    return (
        <section key="packages" className="py-16" style={{ backgroundColor: theme.background }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2
                    className="text-4xl font-semibold mb-4"
                    style={{ color: theme.heading, fontFamily: headingFontFamily || "Georgia, serif" }}
                >
                    {packagesConfig.title || "Choose Your Perfect Escape"}
                </h2>
                {packagesConfig.subtitle && (
                    <p className="mb-12" style={{ color: theme.mutedText }}>
                        {packagesConfig.subtitle}
                    </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packagesConfig.items.map((item: any) => (
                        <button
                            key={item.id}
                            onClick={() => router.push(sitePath(site, "/explore"))}
                            className="bg-white border p-8 text-left hover:shadow-lg transition-shadow"
                            style={{ borderColor: theme.border }}
                        >
                            <div className="text-3xl mb-4">{item.icon}</div>
                            <h3
                                className="text-xl mb-2"
                                style={{ fontFamily: headingFontFamily || "Georgia, serif", color: theme.heading }}
                            >
                                {item.title}
                            </h3>
                            <p className="text-sm" style={{ color: theme.mutedText }}>
                                {item.description}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}