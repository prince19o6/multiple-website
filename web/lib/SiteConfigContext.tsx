"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { MergedWebsiteConfig } from "./mergeWebsiteConfig";
import { DEFAULT_THEME } from "./themeFromApi";

const SiteConfigContext = createContext<MergedWebsiteConfig | null>(null);

export function SiteConfigProvider({
    config,
    children,
}: {
    config: MergedWebsiteConfig;
    children: React.ReactNode;
}) {
    const value = useMemo(() => config, [config]);
    return (
        <SiteConfigContext.Provider value={value}>
            {children}
        </SiteConfigContext.Provider>
    );
}

export function useSiteConfig(): MergedWebsiteConfig {
    const ctx = useContext(SiteConfigContext);
    if (!ctx) {
        return {
            theme: { ...DEFAULT_THEME },
            cssVariables: {},
            typography: {},
            dynamic: null,
            name: "Tours",
            services: {
                tours: true,
                hotels: false,
                activities: false,
                transfers: false,
                flights: false,
                visa: false,
                restaurants: false,
                insurance: false,
                packages: true,
                featureCodes: new Set(),
                fromApi: false,
            },
            headerLinks: null,
            contact: { email: "", phone: "", address: "" },
        };
    }
    return ctx;
}

export function useTheme() {
    return useSiteConfig().theme;
}