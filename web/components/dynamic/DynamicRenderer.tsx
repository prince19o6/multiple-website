"use client";

import React from "react";
import type { ComponentConfig } from "@/lib/config/siteConfigSchema";
import { resolveWebComponent } from "@/lib/registry/componentRegistry";
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
  config: MergedWebsiteConfig | any;
  data: SectionData;
}

/**
 * DynamicRenderer
 *
 * Drives the page layout directly from the website's API configuration.
 *
 * Execution Flow:
 * 1. Checks `config.components.home` for an ordered array of ComponentConfig items.
 * 2. Filters out disabled components and platform non-web components.
 * 3. Sorts sequentially by `order`.
 * 4. Resolves each component type and variant via `resolveWebComponent`.
 * 5. Falls back cleanly to legacy section registry if `config.components.home` is empty.
 */
export function DynamicRenderer({ config, data }: DynamicRendererProps) {
  const homeComponents: ComponentConfig[] = config?.components?.home;

  // Modern Path: Driven by typed ComponentConfig[] from SiteConfig
  if (Array.isArray(homeComponents) && homeComponents.length > 0) {
    const rawWebComponents = homeComponents
      .filter((c) => c.enabled !== false && (!c.platforms || c.platforms.includes("web")))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // When a hero component is present, it already incorporates the full search widget and service tabs.
    // Filter out duplicate standalone searchWidget/search components so only the first (hero-integrated) one renders.
    const hasHero = rawWebComponents.some((c) => c.type === "hero");
    const webComponents = rawWebComponents.filter((c) => {
      if (hasHero && (c.type === "searchWidget" || c.type.toLowerCase().includes("search"))) {
        return false;
      }
      return true;
    });

    return (
      <>
        {webComponents.map((comp) => {
          const Component = resolveWebComponent(comp);

          if (!Component) {
            if (process.env.NODE_ENV === "development") {
              return (
                <div
                  key={comp.id || `${comp.type}:${comp.variant}`}
                  className="max-w-7xl mx-auto my-4 p-4 border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs rounded-xl"
                >
                  <span className="font-bold">⚠️ Unmapped Component:</span>{" "}
                  <code>{comp.type}</code> (variant: <code>{comp.variant || "default"}</code>, id: <code>{comp.id}</code>)
                </div>
              );
            }
            return null;
          }

          return (
            <Component
              key={comp.id || `${comp.type}:${comp.variant || "default"}`}
              component={comp}
              config={config}
              data={data}
            />
          );
        })}
      </>
    );
  }

  // Legacy Fallback Path: Driven by homeSections or DEFAULT_SECTION_ORDER
  const configuredOrder = config?.homeSections;
  let order: string[] =
    Array.isArray(configuredOrder) && configuredOrder.length > 0
      ? configuredOrder
      : DEFAULT_SECTION_ORDER;

  if (order.includes("hero")) {
    order = order.filter((k) => k !== "search" && k !== "searchWidget");
  }

  const customSections: Record<string, CustomSectionConfig> =
    config?.customSections || {};

  return (
    <>
      {order.map((key) => {
        if (typeof key !== "string") return null;

        if (isRegisteredSection(key)) {
          const sectionConfig = config[key];
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
