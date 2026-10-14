"use client";

import { useRouter, useParams } from "next/navigation";
import { sitePath } from "@/lib/sitepath";
import {
    getButtonClass,
    getButtonSize,
    getCardLayoutClass,
    getHeadingFontFamily,
    getIconWrapperClass,
    getIconWrapperStyle,
} from "@/lib/sectionHelpers";
import type { SectionProps } from "@/lib/componentRegistry";

interface CustomSectionItem {
    icon?: string;
    image?: string;
    title?: string;
    description?: string;
}

export interface CustomSectionConfig {
    enabled?: boolean;
    // Picks which of the layouts below to render — the only "structure"
    // decision config makes; everything else is just content.
    layout?: "cards" | "gallery" | "banner" | "list" | "split";
    title?: string;
    subtitle?: string;
    items?: CustomSectionItem[];
    image?: string;
    buttonText?: string;
    buttonAction?: string; // maps to a real route the same way hero/cta buttons do
    background?: "primary" | "surface" | "dark" | "light";
    columns?: number;
}

interface CustomSectionProps extends SectionProps {
    sectionKey: string;
    sectionConfig: CustomSectionConfig;
}

// The ONE hardcoded component behind every site-defined custom section
// key in config.customSections. A brand-new hostname can describe a
// section its real site actually has (press mentions, an instagram
// strip, partner logos, ...) purely as data — this component just
// picks a layout and paints that data — instead of needing a bespoke
// React component written and registered for it. See DynamicRenderer
// for how a homeSections key resolves here vs. to the fixed registry.
export default function CustomSection({
    config,
    sectionKey,
    sectionConfig,
}: CustomSectionProps) {
    const router = useRouter();
    const { site } = useParams<{ site: string }>();

    const theme: any = config.theme || {};
    const buttons: any = (config as any).buttons || {};
    const icons: any = (config as any).icons || {};
    const headingFontFamily = getHeadingFontFamily(config);

    const layout = sectionConfig.layout || "cards";
    const columns = sectionConfig.columns || 3;

    const bg =
        sectionConfig.background === "primary" ? theme.primary
            : sectionConfig.background === "dark" ? (theme.secondary || "#111827")
                : sectionConfig.background === "light" ? "#f8fafc"
                    : theme.surface || "#ffffff";

    const textColor =
        sectionConfig.background === "primary" || sectionConfig.background === "dark"
            ? "#ffffff"
            : theme.text || "#111827";

    const goToButton = () => router.push(sitePath(site, "/explore"));

    const Heading = () => (
        <>
            <h2
                className="text-4xl font-bold mb-4"
                style={{ color: textColor, fontFamily: headingFontFamily }}
            >
                {sectionConfig.title}
            </h2>
            {sectionConfig.subtitle && (
                <p className="text-lg mb-12 opacity-80" style={{ color: textColor }}>
                    {sectionConfig.subtitle}
                </p>
            )}
        </>
    );

    if (layout === "banner") {
        return (
            <section key={sectionKey} className="py-16 text-center" style={{ backgroundColor: bg, color: textColor }}>
                <div className="max-w-2xl mx-auto px-4">
                    <Heading />
                    {sectionConfig.buttonText && (
                        <button
                            onClick={goToButton}
                            className={`${getButtonClass(buttons)} ${getButtonSize(buttons)} font-semibold`}
                            style={{ backgroundColor: "#ffffff", color: theme.primary || "#2563eb" }}
                        >
                            {sectionConfig.buttonText}
                        </button>
                    )}
                </div>
            </section>
        );
    }

    if (layout === "gallery") {
        return (
            <section key={sectionKey} className="py-16" style={{ backgroundColor: bg }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Heading />
                    <div className={`grid grid-cols-2 md:grid-cols-${columns} gap-4`}>
                        {(sectionConfig.items || []).map((item, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden aspect-square">
                                <img src={item.image} alt={item.title || ""} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (layout === "list") {
        return (
            <section key={sectionKey} className="py-16" style={{ backgroundColor: bg, color: textColor }}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Heading />
                    <div className="divide-y" style={{ borderColor: theme.border || "#e5e7eb" }}>
                        {(sectionConfig.items || []).map((item, idx) => (
                            <div key={idx} className="py-5 flex items-start gap-4">
                                {item.icon && <span className="text-2xl">{item.icon}</span>}
                                <div>
                                    <h3 className="font-semibold mb-1">{item.title}</h3>
                                    <p className="opacity-75 text-sm">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (layout === "split") {
        return (
            <section key={sectionKey} className="py-16" style={{ backgroundColor: bg, color: textColor }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <Heading />
                        {sectionConfig.buttonText && (
                            <button
                                onClick={goToButton}
                                className={`${getButtonClass(buttons)} ${getButtonSize(buttons)} font-semibold text-white`}
                                style={{ backgroundColor: theme.primary || "#2563eb" }}
                            >
                                {sectionConfig.buttonText}
                            </button>
                        )}
                    </div>
                    {sectionConfig.image && (
                        <img src={sectionConfig.image} alt="" className="w-full h-[320px] object-cover rounded-2xl" />
                    )}
                </div>
            </section>
        );
    }

    // "cards" (default) — reuses the same icon-card visual language as
    // WhyChooseUs, so a custom section still feels native to the site
    // rather than visibly bolted on.
    return (
        <section key={sectionKey} className="py-16" style={{ backgroundColor: bg, color: textColor }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Heading />
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-8`}>
                    {(sectionConfig.items || []).map((item, idx) => (
                        <div
                            key={idx}
                            className={`bg-white p-8 rounded-2xl shadow-md ${getCardLayoutClass(icons)}`}
                            style={{ color: "#111827" }}
                        >
                            {item.icon && (
                                <div className={getIconWrapperClass(icons)} style={getIconWrapperStyle(icons, theme)}>
                                    {item.icon}
                                </div>
                            )}
                            <div>
                                {item.title && <h3 className="text-xl font-bold mb-2">{item.title}</h3>}
                                {item.description && <p className="text-gray-600">{item.description}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}