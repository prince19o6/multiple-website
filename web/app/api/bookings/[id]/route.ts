import { NextRequest, NextResponse } from "next/server";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { getSiteApiCredentials } from "@/lib/serverSiteSecrets";
import { ENV } from "@/lib/env";

function resolveRequestSite(request: NextRequest, id?: string) {
  const siteQuery = request.nextUrl.searchParams.get("site");
  const siteHeader = request.headers.get("x-site-id");

  if (id) {
    const upper = id.toUpperCase();
    if (upper.startsWith("TGA-") || upper.startsWith("TGA_")) return getSiteById("tripgoasia");
    if (upper.startsWith("GT-") || upper.startsWith("GT_")) return getSiteById("gujjutours");
    if (upper.startsWith("TH-") || upper.startsWith("TH_")) return getSiteById("technoheaven");
  }

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Booking reference or ID is required" },
      { status: 400 }
    );
  }

  const site = resolveRequestSite(request, id);
  if (!site) {
    return NextResponse.json(
      { success: false, error: "Unknown website host" },
      { status: 404 }
    );
  }

  try {
    const creds = getSiteApiCredentials(site.siteId);
    let authHeader = request.headers.get("authorization") || undefined;
    if (!authHeader) {
      const tokenCookie =
        request.cookies.get(`auth_token_${site.siteId}`)?.value ||
        request.cookies.get(`user_token_${site.siteId}`)?.value ||
        request.cookies.get(`admin_token_${site.siteId}`)?.value ||
        request.cookies.get("admin_token")?.value;
      if (tokenCookie) {
        authHeader = `Bearer ${tokenCookie}`;
      }
    }

    const backendUrl = `${ENV.apiUrl}/api/bookings/${encodeURIComponent(id)}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Website-Hostname": site.backendHostname,
      "X-Website-Id": site.siteId,
      "X-Site-Id": site.siteId,
      "X-Api-Key": creds.apiKey,
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(backendUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json, { status: 200 });
    }

    const errJson = await res.json().catch(() => null);
    return NextResponse.json(
      { success: false, error: errJson?.error || "Booking not found in active database" },
      { status: res.status }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Backend reservation service is unreachable." },
      { status: 502 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Booking reference or ID is required" },
      { status: 400 }
    );
  }

  const site = resolveRequestSite(request, id);
  if (!site) {
    return NextResponse.json(
      { success: false, error: "Unknown website host" },
      { status: 404 }
    );
  }

  try {
    const creds = getSiteApiCredentials(site.siteId);
    const body = await request.json().catch(() => ({}));
    const action = body.action || "cancel";

    if (action === "request-cancellation") {
      const backendUrl = `${ENV.apiUrl}/api/bookings/${encodeURIComponent(id)}/request-cancellation`;
      const res = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Hostname": site.backendHostname,
          "X-Website-Id": site.siteId,
          "X-Site-Id": site.siteId,
          "X-Api-Key": creds.apiKey,
          "X-Client-Source": "web",
        },
        body: JSON.stringify({
          email: body.email || "",
          reason: body.reason || "Cancellation requested by traveler",
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: json.error || json.message || "Failed to submit cancellation request" },
          { status: res.status }
        );
      }

      return NextResponse.json(json, { status: 200 });
    }

    if (action === "cancel") {
      const emailParam = body.email ? `?email=${encodeURIComponent(body.email)}` : "";
      const backendUrl = `${ENV.apiUrl}/api/bookings/${encodeURIComponent(id)}/cancel${emailParam}`;

      const res = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Hostname": site.backendHostname,
          "X-Website-Id": site.siteId,
          "X-Site-Id": site.siteId,
          "X-Api-Key": creds.apiKey,
          "X-Client-Source": "web",
        },
        body: JSON.stringify({
          reason: body.reason || "Cancelled by user",
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: json.error || json.message || "Failed to cancel booking" },
          { status: res.status }
        );
      }

      return NextResponse.json(json, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update booking",
      },
      { status: 500 }
    );
  }
}
