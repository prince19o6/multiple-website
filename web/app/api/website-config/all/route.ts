import { NextResponse } from "next/server";
import { getAllWebsiteConfigs } from "@/lib/website/getAllWebsiteConfigs";

/**
 * GET /api/website-config/all
 *
 * Dynamic data for EVERY registered hostname of all three websites, in one
 * call — driven entirely by lib/hostnameRegistry.ts, so a newly added
 * hostname (addHostname() / EXTRA_HOSTNAME_ALIASES) appears here with no
 * code change. Each entry reports its own source ("api" | "fallback") and
 * error, independent of the others.
 *
 * For dashboards / cache warm-up / health checks — NOT used by the
 * per-site pages themselves, which still call /api/website-config/[id].
 */
export async function GET() {
    const all = await getAllWebsiteConfigs();

    return NextResponse.json(
        {
            count: all.length,
            ok: all.every((e) => e.meta.source === "api"),
            sites: all.map((e) => ({
                hostname: e.hostname,
                staticSlug: e.staticSlug,
                brand: e.brand,
                source: e.meta.source,
                error: e.meta.error,
                name: e.config.name,
                theme: e.config.theme,
            })),
        },
        { headers: { "Cache-Control": "private, max-age=30" } }
    );
}