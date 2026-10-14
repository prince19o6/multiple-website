"use client";

import React, { createContext, useContext } from "react";
import type { SiteDefinition } from "@/lib/siteRegistry";

interface SiteContextValue {
  site: SiteDefinition;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({
  site,
  children,
}: {
  site: SiteDefinition;
  children: React.ReactNode;
}) {
  return (
    <SiteContext.Provider value={{ site }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite(): SiteDefinition {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSite must be used within a SiteProvider");
  }
  return context.site;
}

export function useOptionalSite(): SiteDefinition | null {
  const context = useContext(SiteContext);
  return context?.site ?? null;
}
