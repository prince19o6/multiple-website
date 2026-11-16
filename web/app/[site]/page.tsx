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
  const [catalogBanners, setCatalogBanners] = useState<any[]>([]);
  const [catalogHotels, setCatalogHotels] = useState<any[]>([]);
  const [catalogCities, setCatalogCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const siteId = site.siteId;
      const [toursRes, destRes, bannersRes, hotelsRes, citiesRes] = await Promise.allSettled([
        fetch(`/api/tours?site=${encodeURIComponent(siteId)}`, { cache: "no-store" }),
        fetch(`/api/destinations?site=${encodeURIComponent(siteId)}`, { cache: "no-store" }),
        fetch(`/api/catalog/banners?site=${encodeURIComponent(siteId)}`, { cache: "no-store" }),
        fetch(`/api/catalog/hotels?site=${encodeURIComponent(siteId)}`, { cache: "no-store" }),
        fetch(`/api/catalog/destinations?site=${encodeURIComponent(siteId)}`, { cache: "no-store" }),
      ]);

      // 1. Tours
      if (toursRes.status === "fulfilled" && toursRes.value.ok) {
        const json = await toursRes.value.json().catch(() => null);
        const tours: Tour[] = Array.isArray(json?.data)
          ? (json.data as Tour[])
          : Array.isArray(json)
          ? (json as Tour[])
          : [];
        setFeaturedTours(tours);
      }

      // 2. Destinations
      if (destRes.status === "fulfilled" && destRes.value.ok) {
        const json = await destRes.value.json().catch(() => null);
        const dests: DestinationItem[] = Array.isArray(json?.data)
          ? (json.data as DestinationItem[])
          : Array.isArray(json)
          ? (json as DestinationItem[])
          : [];
        setDestinations(dests);
      }

      // 3. Catalog Banners
      if (bannersRes.status === "fulfilled" && bannersRes.value.ok) {
        const json = await bannersRes.value.json().catch(() => null);
        if (Array.isArray(json?.data)) {
          setCatalogBanners(json.data);
        }
      }

      // 4. Catalog Hotels
      if (hotelsRes.status === "fulfilled" && hotelsRes.value.ok) {
        const json = await hotelsRes.value.json().catch(() => null);
        if (Array.isArray(json?.data)) {
          setCatalogHotels(json.data);
        }
      }

      // 5. Catalog Destinations / Cities
      if (citiesRes.status === "fulfilled" && citiesRes.value.ok) {
        const json = await citiesRes.value.json().catch(() => null);
        if (Array.isArray(json?.data)) {
          setCatalogCities(json.data);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load catalog data";
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
          banners: catalogBanners,
          hotels: catalogHotels,
          cities: catalogCities,
          loading,
          error: loadError,
          onRetry: loadData,
        }}
      />
    </main>
  );
}
