"use client";

import { useEffect, useState, useCallback } from "react";
import type { Tour } from "@/lib/type";
import { DynamicRenderer } from "@/components/dynamic/DynamicRenderer";
import type { DestinationItem } from "@/lib/componentRegistry";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";

export default function SitePage() {
  const config = useSiteConfig();
  const site = useSite();

  const [featuredTours, setFeaturedTours] = useState<Tour[]>([]);
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      // Browser calls local API routes with site context in query
      const siteId = site.siteId;
      const [toursRes, destRes] = await Promise.all([
        fetch(`/api/tours?site=${encodeURIComponent(siteId)}`, { cache: "no-store" }),
        fetch(`/api/destinations?site=${encodeURIComponent(siteId)}`, { cache: "no-store" }),
      ]);

      const toursJson = await toursRes.json().catch(() => null);
      const destJson = await destRes.json().catch(() => null);

      if (!toursRes.ok || (toursJson && toursJson.success === false)) {
        const errorMsg = toursJson?.error || `API request failed (HTTP ${toursRes.status})`;
        setLoadError(errorMsg);
        setFeaturedTours([]);
      } else {
        const tours: Tour[] = Array.isArray(toursJson?.data)
          ? (toursJson.data as Tour[])
          : Array.isArray(toursJson)
            ? (toursJson as Tour[])
            : [];
        setFeaturedTours(tours);
      }

      const dests: DestinationItem[] = Array.isArray(destJson?.data)
        ? (destJson.data as DestinationItem[])
        : Array.isArray(destJson)
          ? (destJson as DestinationItem[])
          : [];
      setDestinations(dests);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [site.siteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const theme = config.theme || {};

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: theme.background || "#ffffff",
        color: theme.text || "#111827",
      }}
    >
      <DynamicRenderer
        config={config}
        data={{
          tours: featuredTours,
          destinations,
          loading,
          error: loadError,
          onRetry: loadData,
        }}
      />
    </main>
  );
}