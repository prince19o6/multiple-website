import { NextRequest, NextResponse } from "next/server";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { getSiteApiCredentials } from "@/lib/serverSiteSecrets";
import { ENV } from "@/lib/env";

function resolveRequestSite(request: NextRequest) {
  const siteQuery = request.nextUrl.searchParams.get("site");
  const siteHeader = request.headers.get("x-site-id");
  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const host = normalizeHost(rawHost);

  return (
    getSiteById(siteHeader) ||
    getSiteById(siteQuery) ||
    resolveSiteFromHost(host) ||
    (ENV.defaultSiteId ? getSiteById(ENV.defaultSiteId) : null)
  );
}

export async function POST(request: NextRequest) {
  const site = resolveRequestSite(request);
  if (!site) {
    return NextResponse.json({ success: false, error: "Unknown website host" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const creds = getSiteApiCredentials(site.siteId);
    const backendUrl = `${ENV.apiUrl}/api/bookings/quote`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Website-Hostname": site.backendHostname,
        "X-Website-Id": site.siteId,
        "X-Api-Key": creds.apiKey,
        "X-Client-Source": "web",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json, { status: 200 });
    }

    const errJson = await res.json().catch(() => null);
    return NextResponse.json(
      { success: false, error: errJson?.error || "Failed to calculate quote." },
      { status: res.status }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Quote service unreachable" },
      { status: 502 }
    );
  }
}

