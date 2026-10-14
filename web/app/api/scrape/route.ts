import { NextRequest, NextResponse } from "next/server";
import { scrapeHomepage, SITE_URLS } from "@/lib/homepageScraper";

/**
 * GET /api/scrape?site=gujjutours
 * GET /api/scrape?site=www.tripgoasia.com
 * GET /api/scrape?site=https://www.technoheaven.com
 *
 * Accepts one of the known site names in SITE_URLS, OR any hostname/URL.
 */
export async function GET(request: NextRequest) {
    const site = request.nextUrl.searchParams.get("site");

    if (!site) {
        return NextResponse.json(
            {
                ok: false,
                error: `Missing "site" query param. Try one of: ${Object.keys(SITE_URLS).join(", ")}`,
            },
            { status: 400 }
        );
    }

    const result = await scrapeHomepage(site);

    if (!result.ok) {
        const httpStatus = result.error.code === "INVALID_INPUT" ? 400 : 502;
        return NextResponse.json({ ok: false, error: result.error }, { status: httpStatus });
    }

    return NextResponse.json(
        { ok: true, data: result.data },
        { headers: { "Cache-Control": "private, max-age=60" } }
    );
}