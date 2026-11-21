import { NextRequest, NextResponse } from "next/server";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";

function resolveTargetHost(_request: NextRequest, siteId: string) {
  if (siteId === "tripgoasia") return "www.tripgoasia.com";
  if (siteId === "technoheaven") return "stagingb2b.technoheaven.com";
  return "www.gujjutours.com";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const segments = resolvedParams?.slug || [];
    const subPath = segments.join("/");

    const rawHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";
    const host = normalizeHost(rawHost);

    const searchParams = request.nextUrl.searchParams;
    const siteQuery = searchParams.get("site") || searchParams.get("siteId");
    const siteHeader = request.headers.get("x-site-id");
    const siteDef =
      resolveSiteFromHost(host) ||
      getSiteById(siteQuery) ||
      getSiteById(siteHeader) ||
      (ENV.defaultSiteId ? getSiteById(ENV.defaultSiteId) : null);

    const siteId = (siteDef?.siteId || siteQuery || process.env.SITE_ID || "gujjutours").toLowerCase();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname = siteDef?.backendHostname || resolveTargetHost(request, siteId);

    const backendUrl = new URL(`${apiUrl}/api/visa/${subPath}`);
    searchParams.forEach((val, key) => backendUrl.searchParams.set(key, val));
    if (!backendUrl.searchParams.has("siteId")) {
      backendUrl.searchParams.set("siteId", siteId);
    }

    const res = await fetch(backendUrl.toString(), {
      headers: {
        "X-Website-Hostname": hostname,
        "X-Site-Id": siteId,
        "X-Website-Id": siteId,
      },
      next: { revalidate: 30 },
    });

    const json = await res.json().catch(() => null);
    return NextResponse.json(json || { success: res.ok }, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to contact visa service" },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const segments = resolvedParams?.slug || [];
    const subPath = segments.join("/");

    const rawHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";
    const host = normalizeHost(rawHost);

    const searchParams = request.nextUrl.searchParams;
    const siteQuery = searchParams.get("site") || searchParams.get("siteId");
    const siteHeader = request.headers.get("x-site-id");
    const siteDef =
      resolveSiteFromHost(host) ||
      getSiteById(siteQuery) ||
      getSiteById(siteHeader) ||
      (ENV.defaultSiteId ? getSiteById(ENV.defaultSiteId) : null);

    const siteId = (siteDef?.siteId || siteQuery || process.env.SITE_ID || "gujjutours").toLowerCase();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname = siteDef?.backendHostname || resolveTargetHost(request, siteId);

    const body = await request.json().catch(() => ({}));
    const backendUrl = `${apiUrl}/api/visa/${subPath}`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Website-Hostname": hostname,
        "X-Site-Id": siteId,
        "X-Website-Id": siteId,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);
    return NextResponse.json(json || { success: res.ok }, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to contact visa service" },
      { status: 502 }
    );
  }
}
