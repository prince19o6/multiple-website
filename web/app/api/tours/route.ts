import { NextRequest, NextResponse } from "next/server";
import { fetchTours } from "@/lib/api";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    const rawHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";
    const host = normalizeHost(rawHost);

    // Resolve site: first from Host, then from optional ?site= query or x-site-id header, then defaultSiteId
    const siteQuery = request.nextUrl.searchParams.get("site");
    const siteHeader = request.headers.get("x-site-id");
    const site =
      resolveSiteFromHost(host) ||
      getSiteById(siteQuery) ||
      getSiteById(siteHeader) ||
      (ENV.defaultSiteId ? getSiteById(ENV.defaultSiteId) : null);

    if (!site) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          error: `Unknown website for host "${host}". Please access via *.localhost:3000 or registered domain.`,
        },
        { status: 404 }
      );
    }

    const category = request.nextUrl.searchParams.get("category") || undefined;
    const result = await fetchTours(site, category);

    return NextResponse.json(result, {
      status: result.success ? 200 : 502,
      headers: {
        "Cache-Control": "no-store",
        "X-Site-Id": site.siteId,
        "X-Backend-Hostname": site.backendHostname,
        "X-Data-Source": result.dataSource,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: err instanceof Error ? err.message : "Failed to fetch tours",
      },
      { status: 500 }
    );
  }
}
