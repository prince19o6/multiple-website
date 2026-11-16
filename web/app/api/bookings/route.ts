import { NextRequest, NextResponse } from "next/server";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { getSiteApiCredentials } from "@/lib/serverSiteSecrets";
import { ENV } from "@/lib/env";

function resolveRequestSite(request: NextRequest) {
  const siteQuery = request.nextUrl.searchParams.get("site");
  const siteHeader = request.headers.get("x-site-id") || request.headers.get("x-website-id");

  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const host = normalizeHost(rawHost);

  return (
    getSiteById(siteQuery) ||
    getSiteById(siteHeader) ||
    resolveSiteFromHost(host) ||
    (ENV.defaultSiteId ? getSiteById(ENV.defaultSiteId) : null) ||
    getSiteById("gujjutours")
  );
}

export async function GET(request: NextRequest) {
  const site = resolveRequestSite(request);
  if (!site) {
    return NextResponse.json({ success: false, data: [], error: "Unknown website host" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const ids = searchParams.get("ids") || undefined;
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "20";

  // Check auth header or site-prefixed cookie token
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

  // If no guest email, ids, or auth provided, return empty list gracefully
  if (!email && !ids && !authHeader) {
    return NextResponse.json(
      {
        success: true,
        data: [],
        count: 0,
        message: "Sign in or provide your booking reference/email to view reservations.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Site-Id": site.siteId,
          "X-Backend-Hostname": site.backendHostname,
        },
      }
    );
  }

  try {
    const params = new URLSearchParams();
    if (email) params.append("email", email);
    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    if (ids) params.append("ids", ids);
    params.append("page", page);
    params.append("pageSize", pageSize);

    const creds = getSiteApiCredentials(site.siteId);
    const backendUrl = `${ENV.apiUrl}/api/bookings?${params.toString()}`;
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "X-Website-Hostname": site.backendHostname,
      "X-Website-Id": site.siteId,
      "X-Api-Key": creds.apiKey,
      "X-Client-Source": "web",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(backendUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const json = await res.json();
    return NextResponse.json(json, {
      status: res.status,
      headers: {
        "Cache-Control": "no-store",
        "X-Site-Id": site.siteId,
        "X-Backend-Hostname": site.backendHostname,
      },
    });
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
    const body = await request.json();

    const guestName = (body.guestName || body.name || "").trim();
    const email = (body.email || "").trim();
    const phone = (body.phone || "").trim();

    if (!guestName || !email || !phone) {
      return NextResponse.json(
        { success: false, error: "Missing required booking fields (guestName, email, phone)" },
        { status: 400 }
      );
    }

    const rawTourId =
      typeof body.tourId === "number" && body.tourId > 0
        ? body.tourId
        : typeof body.tourId === "string" && /^\d+$/.test(body.tourId)
        ? parseInt(body.tourId, 10)
        : undefined;

    const service = (body.service || body.serviceType || body.module || "tour").toLowerCase();
    const itemId = body.itemId || body.id || body.flightNumber || body.slug || (rawTourId ? String(rawTourId) : undefined);
    const slug = body.slug || body.tourSlug || (typeof body.id === "string" ? body.id : undefined);
    const title = body.title || body.tourName || "Travel Reservation";
    const image = body.image || body.imageUrl || body.tourImage || "";

    const adults = Math.max(1, Number(body.adults) || 1);
    const children = Math.max(0, Number(body.children) || 0);
    const travelers = Math.max(1, Number(body.travelers) || (adults + children));

    // Capture Idempotency key from header or body
    const idempotencyKey =
      request.headers.get("x-idempotency-key") ||
      request.headers.get("idempotency-key") ||
      body.idempotencyKey ||
      undefined;

    let authHeader = request.headers.get("authorization") || undefined;
    if (!authHeader) {
      const tokenCookie =
        request.cookies.get(`auth_token_${site.siteId}`)?.value ||
        request.cookies.get("auth_token_gujjutours")?.value ||
        request.cookies.get("auth_token_tripgoasia")?.value ||
        request.cookies.get("auth_token_technoheaven")?.value ||
        request.cookies.get(`user_token_${site.siteId}`)?.value ||
        request.cookies.get(`admin_token_${site.siteId}`)?.value ||
        request.cookies.get("admin_token")?.value;
      if (tokenCookie) {
        authHeader = `Bearer ${tokenCookie}`;
      }
    }

    const normalizeDateStr = (raw: any): string | undefined => {
      if (!raw || typeof raw !== "string") return undefined;
      const str = raw.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
      const m = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (m) {
        return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
      }
      try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch {
        // ignore
      }
      return undefined;
    };

    const normTravelDate = normalizeDateStr(body.travelDate) || normalizeDateStr(body.startDate) || new Date().toISOString().slice(0, 10);
    const normStartDate = normalizeDateStr(body.startDate) || normTravelDate;
    const normEndDate = normalizeDateStr(body.endDate) || normStartDate;

    const creds = getSiteApiCredentials(site.siteId);
    const backendUrl = `${ENV.apiUrl}/api/bookings`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Website-Hostname": site.backendHostname,
      "X-Website-Id": site.siteId,
      "X-Site-Id": site.siteId,
      "X-Api-Key": creds.apiKey,
      "X-Client-Source": "web",
    };

    if (idempotencyKey) {
      headers["X-Idempotency-Key"] = idempotencyKey;
    }
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const payload = {
      ...body,
      tourId: rawTourId,
      itemId,
      slug,
      tourSlug: slug,
      tourName: title,
      title,
      tourImage: image,
      image,
      imageUrl: image,
      service,
      serviceType: service,
      module: service,
      guestName,
      email,
      phone,
      travelDate: normTravelDate,
      startDate: normStartDate,
      endDate: normEndDate,
      adults,
      children,
      travelers,
      source: "web",
      website: site.backendHostname,
      websiteId: site.siteId,
    };

    const res = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json, {
        status: res.status,
        headers: {
          "Cache-Control": "no-store",
          "X-Site-Id": site.siteId,
          "X-Backend-Hostname": site.backendHostname,
        },
      });
    }

    const errJson = await res.json().catch(() => null);
    return NextResponse.json(
      {
        success: false,
        code: errJson?.code,
        error: errJson?.error || errJson?.message || "Booking reservation failed on server",
        email: errJson?.email,
      },
      {
        status: res.status,
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
        error: err instanceof Error ? err.message : "Backend reservation service is unreachable.",
      },
      { status: 502 }
    );
  }
}
