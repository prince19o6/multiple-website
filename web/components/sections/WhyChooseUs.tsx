"use client";

import {
    getCardLayoutClass,
    getHeadingFontFamily,
    getIconWrapperClass,
    getIconWrapperStyle,
} from "@/lib/sectionHelpers";
import type { SectionProps } from "@/lib/componentRegistry";

export default function WhyChooseUs({ config }: SectionProps) {
    const theme: any = config.theme || {};
    const icons: any = (config as any).icons || {};
    const whyChooseUs: any = (config as any).whyChooseUs || {};
    const headingFontFamily = getHeadingFontFamily(config);

    if (whyChooseUs.enabled === false || !whyChooseUs.items?.length) return null;

    // Holiday Paradise's config asks for whyChooseUs.style: "minimal" —
    // no boxed cards, just quiet columns divided by thin hairlines, serif
    // headings, and the hexagon/dark/right icon settings from its config.
    if (whyChooseUs.style === "minimal") {
        return (
            <section key="whyChooseUs" className="py-20" style={{ backgroundColor: theme.surface || "#ffffff" }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2
                        className="text-4xl text-center mb-4"
                        style={{ color: theme.heading, fontFamily: headingFontFamily }}
                    >
                        {whyChooseUs.title || `Why Choose ${config.name}?`}
                    </h2>
                    {whyChooseUs.description && (
                        <p className="text-center mb-16 max-w-xl mx-auto" style={{ color: theme.mutedText }}>
                            {whyChooseUs.description}
                        </p>
                    )}
                    <div
                        className={`grid grid-cols-1 md:grid-cols-${whyChooseUs.columns || 3} divide-y md:divide-y-0 md:divide-x`}
                        style={{ borderColor: theme.border }}
                    >
                        {whyChooseUs.items.map((item: any, idx: number) => (
                            <div key={idx} className={`px-8 py-8 md:py-0 ${getCardLayoutClass(icons)}`}>
                                <div className={getIconWrapperClass(icons)} style={getIconWrapperStyle(icons, theme)}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg mb-2" style={{ color: theme.heading, fontFamily: headingFontFamily }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-sm" style={{ color: theme.mutedText }}>{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section key="whyChooseUs" className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-bold text-center mb-4">
                    {whyChooseUs.title || `Why Choose ${config.name}?`}
                </h2>
                {whyChooseUs.description && (
                    <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                        {whyChooseUs.description}
                    </p>
                )}
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${whyChooseUs.columns || 4} gap-8`}>
                    {whyChooseUs.items.map((item: any, idx: number) => (
                        <div key={idx} className={`bg-white p-8 rounded-2xl shadow-md ${getCardLayoutClass(icons)}`}>
                            <div className={getIconWrapperClass(icons)} style={getIconWrapperStyle(icons, theme)}>
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-gray-600">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}