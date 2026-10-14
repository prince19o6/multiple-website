import { NextRequest, NextResponse } from "next/server";
import { fetchDynamicData } from "@/lib/website/fetchDynamicData";
import { resolveSite } from "@/lib/website/registry";
import { isAllowedWebsite } from "@/lib/hostnameRegistry";
import type { SiteConfigResponse } from "@/lib/siteConfig";

/**
 * GET /api/website-config/website2?lang=en
 *
 * Same-origin endpoint for client components. It looks up website2's data
 * source, calls the right backend on the server, and returns the raw dynamic
 * data (merging happens in the hook, because the merged config contains a
 * Set and cannot be sent as JSON).
 *
 * STRICT ALLOWLIST: only GujjuTours / TripGoAsia / Technoheaven (by any of
 * their registered hostnames or preview slugs, see lib/hostnameRegistry.ts)
 * are served here. Anything else is a 404, never a generic/fallback config.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ websiteId: string }> }
) {
    const { websiteId } = await context.params;
    const lang = request.nextUrl.searchParams.get("lang") || "en";

    if (!isAllowedWebsite(websiteId)) {
        return NextResponse.json(
            { result: null, error: `Unknown website: "${websiteId}"`, isSuccess: false } satisfies SiteConfigResponse,
            { status: 404 }
        );
    }

    const site = resolveSite(websiteId);
    const result = await fetchDynamicData(site, { lang, revalidate: 30 });

    if (!result.ok) {
        const { code, message, status } = result.error;
        const httpStatus =
            code === "NO_HOSTNAME"
                ? 400
                : code === "TIMEOUT"
                    ? 504
                    : status === 404
                        ? 404
                        : 502;
        return NextResponse.json(
            { result: null, error: message, isSuccess: false } satisfies SiteConfigResponse,
            { status: httpStatus }
        );
    }

    return NextResponse.json(
        { result: result.data, error: null, isSuccess: true } satisfies SiteConfigResponse,
        { headers: { "Cache-Control": "private, max-age=30" } }
    );
}