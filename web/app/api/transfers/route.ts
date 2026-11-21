import { NextRequest, NextResponse } from "next/server";
import { getTenantHostname, getDefaultApiKey, getApiBaseUrl } from "@/lib/api/client";
import { loadSeedEntities, filterSeedEntities } from "@/lib/api/seedFallback";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const siteQuery = searchParams.get("site");
  const siteHeader = request.headers.get("x-website-id") || request.headers.get("x-site-id");
  const siteId = (siteQuery || siteHeader || process.env.NEXT_PUBLIC_SITE_ID || "gujjutours").toLowerCase();

  try {
    const apiUrl = getApiBaseUrl();
    const hostname = getTenantHostname(siteId);
    const apiKey = getDefaultApiKey(siteId);

    const backendUrl = new URL(`${apiUrl}/api/transfers`);
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
        return NextResponse.json(data);
      }
    }
  } catch {
    // Backend offline — fall back to disk seed
  }

  const allSeed = loadSeedEntities(siteId, "transfers");
  const filtered = filterSeedEntities(allSeed, {
    query: searchParams.get("q") || searchParams.get("search") || searchParams.get("query"),
    city: searchParams.get("city") || searchParams.get("destination"),
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
    pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!, 10) : 20,
    sort: searchParams.get("sort"),
  });

  return NextResponse.json({
    success: true,
    items: filtered.items,
    data: filtered.items,
    total: filtered.total,
    page: filtered.page,
    pageSize: filtered.pageSize,
  });
}
