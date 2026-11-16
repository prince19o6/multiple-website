import { NextRequest, NextResponse } from "next/server";
import {
  resolveProductionSiteFromHost,
  resolveSiteFromHost,
  getSiteById,
  normalizeHost,
  type SiteDefinition,
} from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

const PASSTHROUGH_PREFIXES = [
  "/_next",
  "/api",
  "/booking-action",
  "/env-error",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function isPrivateOrLocalHost(host: string): boolean {
  if (!host) return false;
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    return true;
  }
  // Private IPv4 ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x, 127.x.x.x)
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow Next.js static assets, API handlers, error page, and public files
  if (PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 2. Extract and normalize incoming Host header
  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const normalizedHost = normalizeHost(rawHost);

  let site: SiteDefinition | null = null;
  let resolutionSource: "production-host" | "host-routing" | "env" = "env";

  // 3a. Production/real registered domain matching
  const prodSite = resolveProductionSiteFromHost(normalizedHost);
  if (prodSite) {
    site = prodSite;
    resolutionSource = "production-host";
  }

  // 3b. Optional host routing (*.localhost:3000) when ENABLE_HOST_ROUTING=true
  if (!site && ENV.enableHostRouting) {
    const hostRoutedSite = resolveSiteFromHost(normalizedHost);
    if (hostRoutedSite) {
      site = hostRoutedSite;
      resolutionSource = "host-routing";
    }
  }

  // 3c. Explicit path segment site routing in local/dev (e.g. /tripgoasia, /gujjutours, /technoheaven)
  const pathFirstSegment = pathname.split("/").filter(Boolean)[0] || "";
  const pathSite = (ENV.isDev || isPrivateOrLocalHost(normalizedHost)) ? getSiteById(pathFirstSegment) : null;
  if (!site && pathSite) {
    site = pathSite;
    resolutionSource = "env";
  }

  // 3d. Localhost, 127.0.0.1, LAN IPs, or any unrouted dev hosts: resolve directly from SITE_ID in .env
  if (!site && (ENV.isDev || isPrivateOrLocalHost(normalizedHost))) {
    if (!ENV.isSiteIdValid || !ENV.siteId) {
      const errorUrl = request.nextUrl.clone();
      errorUrl.pathname = "/env-error";
      const errRes = NextResponse.rewrite(errorUrl);
      errRes.headers.set("x-env-error", "MISSING_OR_INVALID_SITE_ID");
      return errRes;
    }

    site = getSiteById(ENV.siteId);
    resolutionSource = "env";
  }

  // 3e. Unknown host in Production
  if (!site) {
    return new NextResponse(
      `Unknown website hostname: "${normalizedHost}". Host is not registered.`,
      {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  }

  // 4. Admin routes (/admin, /admin/**) guarded and scoped to active site
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isLoginOrAuth = pathname === "/admin/login" || pathname === "/admin/unauthorized";
    const adminToken = request.cookies.get(`admin_token_${site.siteId}`)?.value || request.cookies.get("admin_token")?.value;

    if (!adminToken && !isLoginOrAuth) {
      const returnUrl = encodeURIComponent(pathname + (request.nextUrl.search || ""));
      const loginUrl = new URL(`/admin/login?returnUrl=${returnUrl}`, request.url);
      const redirectRes = NextResponse.redirect(loginUrl);
      redirectRes.cookies.set("admin_active_site", site.siteId, {
        path: "/",
        sameSite: "lax",
        maxAge: 86400,
      });
      return redirectRes;
    }

    if (adminToken && pathname === "/admin/login") {
      const dashboardUrl = new URL("/admin", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-site-id", site.siteId);
    requestHeaders.set("x-site-hostname", normalizedHost);
    requestHeaders.set("x-backend-hostname", site.backendHostname);
    requestHeaders.set("x-site-source", resolutionSource);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set("x-site-id", site.siteId);
    response.headers.set("x-site-hostname", normalizedHost);
    response.headers.set("x-backend-hostname", site.backendHostname);
    response.headers.set("x-site-source", resolutionSource);
    response.cookies.set("admin_active_site", site.siteId, {
      path: "/",
      sameSite: "lax",
      maxAge: 86400,
    });

    return response;
  }

  // 5. Clean path (if someone navigates to legacy /chooser, redirect to root)
  let cleanPath = pathname === "/chooser" ? "/" : pathname;
  if (pathSite && cleanPath.startsWith(`/${pathSite.siteId}`)) {
    cleanPath = cleanPath.slice(pathSite.siteId.length + 1) || "/";
  }

  const LEGACY_SITE_ROUTES = [
    "/about",
    "/booking",
    "/bookings",
    "/category",
    "/contact",
    "/explore",
    "/my-bookings",
    "/reset-password",
    "/tour",
  ];

  // Canonical language prefix: if navigating to root "/", rewrite internally to "/en"
  if (cleanPath === "/" || cleanPath === "") {
    cleanPath = "/en";
  } else if (
    !/^\/(en|ar|hi|gu)(\/|$)/.test(cleanPath) &&
    !LEGACY_SITE_ROUTES.some((p) => cleanPath === p || cleanPath.startsWith(`${p}/`))
  ) {
    cleanPath = `/en${cleanPath}`;
  }

  // 6. Internally rewrite to dynamic site route segment `/${site.siteId}${cleanPath}`
  const targetUrl = request.nextUrl.clone();
  targetUrl.pathname = `/${site.siteId}${cleanPath}`;

  const response = NextResponse.rewrite(targetUrl);
  response.headers.set("x-site-id", site.siteId);
  response.headers.set("x-site-hostname", normalizedHost);
  response.headers.set("x-backend-hostname", site.backendHostname);
  response.headers.set("x-site-source", resolutionSource);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};