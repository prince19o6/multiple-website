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

export async function GET(request: NextRequest) {
  const site = resolveRequestSite(request);
  if (!site) {
    return NextResponse.json({ success: false, error: "Unknown website host" }, { status: 404 });
  }

  let authHeader = request.headers.get("authorization") || undefined;
  if (!authHeader) {
    const tokenCookie =
      request.cookies.get(`user_token_${site.siteId}`)?.value ||
      request.cookies.get(`admin_token_${site.siteId}`)?.value ||
      request.cookies.get("admin_token")?.value;
    if (tokenCookie) {
      authHeader = `Bearer ${tokenCookie}`;
    }
  }

  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: "Authentication required to view your bookings." },
      { status: 401 }
    );
  }

  try {
    const creds = getSiteApiCredentials(site.siteId);
    const searchParams = request.nextUrl.searchParams.toString();
    const backendUrl = `${ENV.apiUrl}/api/bookings/mine${searchParams ? `?${searchParams}` : ""}`;

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": authHeader,
        "X-Website-Hostname": site.backendHostname,
        "X-Website-Id": site.siteId,
        "X-Api-Key": creds.apiKey,
        "X-Client-Source": "web",
      },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json, { status: 200 });
    }

    const errJson = await res.json().catch(() => null);
    return NextResponse.json(
      { success: false, error: errJson?.error || "Failed to retrieve your bookings." },
      { status: res.status }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Bookings service unreachable" },
      { status: 502 }
    );
  }
}

