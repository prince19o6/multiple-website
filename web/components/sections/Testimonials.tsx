"use client";

import { getHeadingFontFamily } from "@/lib/sectionHelpers";
import type { SectionProps } from "@/lib/componentRegistry";

// website3 (Holiday Paradise) only.
export default function Testimonials({ config }: SectionProps) {
    const theme: any = config.theme || {};
    const testimonialsConfig: any = (config as any).testimonials || {};
    const headingFontFamily = getHeadingFontFamily(config);

    if (testimonialsConfig.enabled === false || !testimonialsConfig.items?.length) return null;

    return (
        <section key="testimonials" className="py-16 bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl mb-12" style={{ fontFamily: headingFontFamily || "Georgia, serif", color: theme.heading }}>
                    {testimonialsConfig.title || "What Our Guests Say"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonialsConfig.items.map((t: any, idx: number) => (
                        <div key={idx} className="p-6 border-t-2" style={{ borderColor: theme.accent || "#d4af37" }}>
                            <p className="italic mb-4" style={{ color: theme.text }}>
                                &ldquo;{t.text}&rdquo;
                            </p>
                            <div className="text-sm font-semibold" style={{ color: theme.heading }}>
                                {t.name}
                            </div>
                            <div className="text-yellow-500 text-sm">{"★".repeat(t.rating)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}