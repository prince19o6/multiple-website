import { NextRequest, NextResponse } from "next/server";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { getSiteApiCredentials } from "@/lib/serverSiteSecrets";
import { ENV } from "@/lib/env";

function resolveRequestSite(request: NextRequest) {
  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const host = normalizeHost(rawHost);

  const siteQuery = request.nextUrl.searchParams.get("site");
  const siteHeader = request.headers.get("x-site-id");
  return (
    resolveSiteFromHost(host) ||
    getSiteById(siteQuery) ||
    getSiteById(siteHeader) ||
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
    const reference = body?.reference?.trim();
    const email = body?.email?.trim();

    if (!reference || !email) {
      return NextResponse.json(
        { success: false, error: "Both booking reference number and guest email are required." },
        { status: 400 }
      );
    }

    const creds = getSiteApiCredentials(site.siteId);
    const backendUrl = `${ENV.apiUrl}/api/bookings/lookup`;
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
      body: JSON.stringify({ reference, email }),
      cache: "no-store",
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to lookup reservation",
      },
      { status: 500 }
    );
  }
}
