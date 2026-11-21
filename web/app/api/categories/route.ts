import { NextRequest, NextResponse } from "next/server";
import { getTenantHostname, getDefaultApiKey, getApiBaseUrl } from "@/lib/api/client";
import { loadSeedEntities } from "@/lib/api/seedFallback";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const siteQuery = searchParams.get("site");
  const siteHeader = request.headers.get("x-website-id") || request.headers.get("x-site-id");
  const siteId = (siteQuery || siteHeader || process.env.NEXT_PUBLIC_SITE_ID || "gujjutours").toLowerCase();
  const moduleParam = searchParams.get("module")?.toLowerCase();

  try {
    const apiUrl = getApiBaseUrl();
    const hostname = getTenantHostname(siteId);
    const apiKey = getDefaultApiKey(siteId);

    const backendUrl = new URL(`${apiUrl}/api/categories`);
    searchParams.forEach((val, key) => {
      if (key !== "site") {
        backendUrl.searchParams.set(key, val);
      }
    });

    const res = await fetch(backendUrl.toString(), {
      headers: {
        "X-Website-Id": siteId,
        "X-Website-Hostname": hostname,
        "X-Api-Key": apiKey,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : null);
      if (items && items.length > 0) {
        const normalizedItems = items.map((c: any) => ({
          ...c,
          name:
            typeof c.name === "object" && c.name !== null
              ? c.name.en || c.name.gu || c.name.ms || Object.values(c.name)[0] || c.slug || "Category"
              : c.name || c.title || c.label || c.slug || "Category",
          label:
            typeof c.name === "object" && c.name !== null
              ? c.name.en || c.name.gu || c.name.ms || Object.values(c.name)[0] || c.slug || "Category"
              : c.label || c.name || c.title || c.slug || "Category",
        }));
        return NextResponse.json({ ...data, items: normalizedItems, data: normalizedItems });
      }
    }
  } catch {
    // Backend offline — fall back to disk seed
  }

  let allSeed = loadSeedEntities(siteId, "categories");
  if (moduleParam) {
    allSeed = allSeed.filter((c: any) => !c.module || c.module === moduleParam || c.module === "all");
  }

  const normalizedSeed = allSeed.map((c: any) => ({
    ...c,
    name:
      typeof c.name === "object" && c.name !== null
        ? c.name.en || c.name.gu || c.name.ms || Object.values(c.name)[0] || c.slug || "Category"
        : c.name || c.title || c.label || c.slug || "Category",
    label:
      typeof c.name === "object" && c.name !== null
        ? c.name.en || c.name.gu || c.name.ms || Object.values(c.name)[0] || c.slug || "Category"
        : c.label || c.name || c.title || c.slug || "Category",
  }));

  return NextResponse.json({
    success: true,
    items: normalizedSeed,
    data: normalizedSeed,
    total: normalizedSeed.length,
  });
}
