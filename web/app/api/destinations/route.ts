import { NextRequest, NextResponse } from "next/server";
import { fetchDestinations } from "@/lib/api";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    const rawHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";
    const host = normalizeHost(rawHost);

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
          error: `Unknown website for host "${host}".`,
        },
        { status: 404 }
      );
    }

    const data = await fetchDestinations(site);

    return NextResponse.json(
      { success: true, data },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Site-Id": site.siteId,
          "X-Backend-Hostname": site.backendHostname,
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: err instanceof Error ? err.message : "Failed to fetch destinations",
      },
      { status: 500 }
    );
  }
}
