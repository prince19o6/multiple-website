import { NextRequest, NextResponse } from "next/server";
import { getTenantHostname, getDefaultApiKey, getApiBaseUrl } from "@/lib/api/client";
import { findSeedEntity } from "@/lib/api/seedFallback";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const searchParams = request.nextUrl.searchParams;
  const siteQuery = searchParams.get("site");
  const siteHeader = request.headers.get("x-website-id") || request.headers.get("x-site-id");
  const siteId = (siteQuery || siteHeader || process.env.NEXT_PUBLIC_SITE_ID || "gujjutours").toLowerCase();

  try {
    const apiUrl = getApiBaseUrl();
    const hostname = getTenantHostname(siteId);
    const apiKey = getDefaultApiKey(siteId);

    const backendUrl = new URL(`${apiUrl}/api/transfers/${slugStr}`);
    searchParams.forEach((val, key) => {
      if (key !== "site") {
        backendUrl.searchParams.set(key, val);
      }
    });

    const res = await fetch(backendUrl.toString(), {
      headers: {
        "X-Website-Id": siteId,
        "X-Website-Hostname": hostname,
        "X-Api-Key": apiKey,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && (data.data || data.id || data.title || data.vehicleName)) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // Backend offline — fall back to disk seed
  }

  const seedItem = findSeedEntity(siteId, "transfers", slugStr);
  if (seedItem) {
    return NextResponse.json({
      success: true,
      data: seedItem,
    });
  }

  return NextResponse.json(
    { success: false, message: `Transfer '${slugStr}' not found` },
    { status: 404 }
  );
}
