import { NextRequest, NextResponse } from "next/server";
import { createBooking, fetchBookings, type CreateBookingPayload } from "@/lib/api";
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

export async function GET(request: NextRequest) {
  const site = resolveRequestSite(request);
  if (!site) {
    return NextResponse.json({ success: false, data: [], error: "Unknown website host" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") || undefined;

  try {
    const bookings = await fetchBookings(site, email);
    return NextResponse.json(
      { success: true, data: bookings },
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
        error: err instanceof Error ? err.message : "Failed to fetch bookings",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const site = resolveRequestSite(request);
  if (!site) {
    return NextResponse.json({ success: false, error: "Unknown website host" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as CreateBookingPayload;
    if (!body.tourId || !body.guestName || !body.email || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: "Missing required booking fields" },
        { status: 400 }
      );
    }

    const booking = await createBooking(site, body);
    return NextResponse.json(
      { success: true, data: booking },
      {
        status: 201,
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
        error: err instanceof Error ? err.message : "Failed to create booking",
      },
      { status: 500 }
    );
  }
}
