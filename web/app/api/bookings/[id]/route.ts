import { NextRequest, NextResponse } from "next/server";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const site = resolveRequestSite(request);
  if (!site) {
    return NextResponse.json(
      { success: false, error: "Unknown website host" },
      { status: 404 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Booking reference or ID is required" },
      { status: 400 }
    );
  }

  try {
    const backendUrl = `${ENV.apiUrl}/api/bookings/${encodeURIComponent(id)}`;
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Website-Hostname": site.backendHostname,
        "X-Site-Id": site.siteId,
      },
      cache: "no-store",
    });

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: json.error || "Booking not found" },
        { status: res.status }
      );
    }

    return NextResponse.json(json, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to fetch booking details",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const site = resolveRequestSite(request);
  if (!site) {
    return NextResponse.json(
      { success: false, error: "Unknown website host" },
      { status: 404 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Booking reference or ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || "cancel";

    if (action === "cancel") {
      const emailParam = body.email ? `?email=${encodeURIComponent(body.email)}` : "";
      const backendUrl = `${ENV.apiUrl}/api/bookings/${encodeURIComponent(id)}/cancel${emailParam}`;

      const res = await fetch(backendUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Hostname": site.backendHostname,
          "X-Site-Id": site.siteId,
        },
      });

      const json = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: json.error || "Failed to cancel booking" },
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
