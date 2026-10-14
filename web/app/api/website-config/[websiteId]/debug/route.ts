import { NextRequest, NextResponse } from "next/server";
import { fetchDynamicData } from "@/lib/website/fetchDynamicData";
import { buildWebsiteConfig, resolveSite } from "@/lib/website/registry";
import type { FetchDebugSink } from "@/lib/website/types";

/**
 * GET /api/website-config/<site>/debug
 *
 * Shows, step by step, what happens when a website's data is fetched:
 * which URL was called, what the API answered, which mapped fields were
 * found or missing, and what the final theme / fonts / home page look like.
 *
 * Only available in development, or when WEBSITE_DEBUG=true is set.
 */
import { ENV } from "@/lib/env";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ websiteId: string }> }
) {
    if (!ENV.isDev) {
        return NextResponse.json({ error: "Debug endpoint is disabled in production" }, { status: 404 });
    }

    const { websiteId } = await context.params;
    const lang = request.nextUrl.searchParams.get("lang") || "en";

    const site = resolveSite(websiteId);
    const debug: FetchDebugSink = {};
    const result = await fetchDynamicData(site, { lang, noStore: true, debug });

    let merged: Record<string, unknown> | null = null;
    let mergeError: string | null = null;
    try {
        const config = buildWebsiteConfig(site, result.ok ? result.data : null);
        merged = {
            name: config.name,
            logo: config.logo,
            theme: config.theme,
            typography: config.typography,
            homeSections: (config as any).homeSections ?? null,
            heroTitle: (config as any).hero?.title ?? null,
            configSource: config.configSource,
        };
    } catch (err) {
        mergeError = err instanceof Error ? err.message : String(err);
    }

    return NextResponse.json(
        {
            verdict: result.ok
                ? "OK: data fetched from the API and merged"
                : `FALLBACK: ${result.error.code} - ${result.error.message}`,
            site: {
                id: site.id,
                label: site.label,
                hostname: site.hostname,
                dataSource: site.dataSource,
                knownWebsite: site.known,
                source: site.source ? "rest (sites.config.ts)" : "your backend",
            },
            request: { method: debug.method ?? null, url: debug.url ?? null },
            response: { status: debug.status ?? null, bodyPreview: debug.bodyPreview ?? null },
            mapping: site.source?.mapping
                ? { found: debug.mappedCount ?? 0, notFound: debug.unmapped ?? [] }
                : null,
            savedConfigOverlay: debug.overlay ?? null,
            error: result.ok ? null : result.error,
            finalConfig: merged,
            mergeError,
        },
        { headers: { "Cache-Control": "no-store" } }
    );
}