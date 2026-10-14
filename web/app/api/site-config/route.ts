import { NextRequest, NextResponse } from "next/server";
import { fetchSiteConfig } from "@/lib/api";
import { ENV } from "@/lib/env";
import { resolveSiteFromHost, DEFAULT_DEV_SITE_ID, getSiteById } from "@/lib/siteRegistry";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const resolvedSite = resolveSiteFromHost(host);
  const defaultSite = getSiteById(ENV.defaultSiteId || DEFAULT_DEV_SITE_ID);

  const hostname =
    searchParams.get("hostname") ||
    resolvedSite?.backendHostname ||
    defaultSite?.backendHostname ||
    "www.gujjutours.com";
  const lang = searchParams.get("lang") || ENV.defaultLang;

  try {
    const result = await fetchSiteConfig(hostname, lang);
    return NextResponse.json(
      {
        result,
        error: null,
        isSuccess: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        result: null,
        error: err instanceof Error ? err.message : "Failed to load site config",
        isSuccess: false,
      },
      { status: 502 }
    );
  }
}