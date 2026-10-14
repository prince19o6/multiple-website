import { NextRequest, NextResponse } from "next/server";
import { checkApiHealth } from "@/lib/api";
import {
  resolveProductionSiteFromHost,
  resolveSiteFromHost,
  getSiteById,
  normalizeHost,
  type SiteDefinition,
} from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export async function GET(request: NextRequest) {
  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost";
  const host = normalizeHost(rawHost);

  let source = request.headers.get("x-site-source") || "";
  let site: SiteDefinition | null = null;

  // 1. Try resolving via production host
  const prodSite = resolveProductionSiteFromHost(host);
  if (prodSite) {
    site = prodSite;
    source = "production-host";
  }

  // 2. Try host routing if enabled
  if (!site && ENV.enableHostRouting) {
    const hostSite = resolveSiteFromHost(host);
    if (hostSite) {
      site = hostSite;
      source = "host-routing";
    }
  }

  // 3. Fallback to site from query, header, or .env
  if (!site) {
    const siteQuery = request.nextUrl.searchParams.get("site");
    const siteHeader = request.headers.get("x-site-id");
    site =
      getSiteById(siteQuery) ||
      getSiteById(siteHeader) ||
      (ENV.siteId ? getSiteById(ENV.siteId) : null);
    source = "env";
  }

  if (!site) {
    return NextResponse.json(
      {
        host: rawHost,
        siteId: "unresolved",
        backendHostname: "none",
        resolutionSource: "none",
        apiUrl: ENV.apiUrl,
        status: 404,
        configOk: false,
        toursOk: false,
        latencyMs: 0,
        tourCount: 0,
        brandName: "Unknown Website",
        dataSource: "unknown",
        error: `Could not resolve website for host "${rawHost}". Please set SITE_ID in .env.`,
        admin: {
          enabled: false,
          routes: [],
          status: "unavailable",
        },
      },
      { status: 404 }
    );
  }

  const adminRoutes = [
    "/admin",
    "/admin/login",
    "/admin/tours",
    "/admin/bookings",
    "/admin/users",
    "/admin/analytics",
  ];

  try {
    const health = await checkApiHealth(site, rawHost);
    return NextResponse.json(
      {
        ...health,
        resolutionSource: source || "env",
        admin: {
          enabled: true,
          routes: adminRoutes,
          adminUrl: `http://${rawHost}/admin`,
          loginUrl: `http://${rawHost}/admin/login`,
          status: "healthy",
        },
      },
      {
        status: health.status,
        headers: {
          "Cache-Control": "no-store",
          "X-Site-Id": site.siteId,
          "X-Backend-Hostname": site.backendHostname,
          "X-Site-Source": source || "env",
          "X-Data-Source": health.dataSource,
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        host: rawHost,
        siteId: site.siteId,
        backendHostname: site.backendHostname,
        resolutionSource: source || "env",
        apiUrl: ENV.apiUrl,
        status: 500,
        configOk: false,
        toursOk: false,
        latencyMs: 0,
        tourCount: 0,
        brandName: site.displayName,
        dataSource: "unknown",
        error: err instanceof Error ? err.message : "Health check failed",
        admin: {
          enabled: true,
          routes: adminRoutes,
          adminUrl: `http://${rawHost}/admin`,
          loginUrl: `http://${rawHost}/admin/login`,
          status: "degraded",
        },
      },
      { status: 500 }
    );
  }
}
