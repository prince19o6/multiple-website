"use client";

import React, { createContext, useContext, useEffect } from "react";
import type { SiteDefinition } from "@/lib/siteRegistry";
import { setAdminSite } from "@/lib/adminApi";

interface AdminContextType {
  site: SiteDefinition;
  siteId: string;
  backendHostname: string;
  displayName: string;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({
  site,
  children,
}: {
  site: SiteDefinition;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Keep adminApi client synchronized with the active site
    setAdminSite(site.siteId);

    // Set active site cookie for admin operations
    if (typeof document !== "undefined") {
      document.cookie = `admin_active_site=${site.siteId}; path=/; SameSite=Lax; max-age=86400`;
    }
  }, [site.siteId]);

  const value: AdminContextType = {
    site,
    siteId: site.siteId,
    backendHostname: site.backendHostname,
    displayName: site.displayName,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext(): AdminContextType {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext must be used within an AdminProvider");
  }
  return context;
}
