"use client";

import {
    componentRegistry,
    DEFAULT_SECTION_ORDER,
    isRegisteredSection,
    type SectionData,
} from "@/lib/componentRegistry";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import CustomSection, {
    type CustomSectionConfig,
} from "@/components/sections/CustomSection";

interface DynamicRendererProps {
    config: MergedWebsiteConfig;
    data: SectionData;
}

// Renders the homepage as an ordered list of sections, driven entirely
// by the CURRENT WEBSITE's configuration (spec #4–#8). Each key in
// config.homeSections resolves one of two ways:
//
//   1. A built-in type (hero, featuredTours, ...) -> componentRegistry
//   2. Anything else -> looked up in config.customSections[key]; if
//      present, rendered through the one generic CustomSection
//      component, so a site can define sections the fixed registry
//      has no named component for, purely as data.
//
// Either way, a key only ever maps to one of these two hardcoded
// component paths — never to eval, dynamic import, or execution of
// anything from remote config (spec #21). Unknown keys with no
// matching custom section, and explicitly disabled sections, are
// skipped rather than breaking the page (spec #7 / #19).
export function DynamicRenderer({ config, data }: DynamicRendererProps) {
    const configuredOrder = (config as any)?.homeSections;
    const order: string[] =
        Array.isArray(configuredOrder) && configuredOrder.length > 0
            ? configuredOrder
            : DEFAULT_SECTION_ORDER;

    const customSections: Record<string, CustomSectionConfig> =
        (config as any)?.customSections || {};

    return (
        <>
            {order.map((key) => {
                if (typeof key !== "string") return null;

                if (isRegisteredSection(key)) {
                    const sectionConfig = (config as any)[key];
                    if (sectionConfig && sectionConfig.enabled === false) return null;

                    const Section = componentRegistry[key];
                    return <Section key={key} config={config} data={data} />;
                }

                const customConfig = customSections[key];
                if (!customConfig || customConfig.enabled === false) {
                    return null;
                }

                return (
                    <CustomSection
                        key={key}
                        sectionKey={key}
                        sectionConfig={customConfig}
                        config={config}
                        data={data}
                    />
                );
            })}
        </>
    );
}