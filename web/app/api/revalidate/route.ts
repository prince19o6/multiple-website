import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { isValidSiteId, getSiteById } from "@/lib/siteRegistry";
import { getSiteApiCredentials } from "@/lib/serverSiteSecrets";

/**
 * POST /api/revalidate
 *
 * Protected webhook for on-demand cache revalidation.
 * The backend API calls this endpoint when a tenant's SiteConfig is updated.
 *
 * Expected Authentication:
 * - Header `X-Revalidate-Secret` or `X-Api-Key`, or body `secret`
 *
 * Supported Actions:
 * - By site: `{ siteId: "tripgoasia" }` -> revalidates `config:tripgoasia`, `site-config:tripgoasia`, and `/[site]` layout
 * - By tag:  `{ tag: "config:gujjutours" }` -> revalidates specific cache tag
 * - By path: `{ path: "/en/tours" }` -> revalidates specific page path
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get("x-revalidate-secret") ||
      request.headers.get("x-api-key") ||
      "";

    let body: {
      secret?: string;
      siteId?: string;
      tag?: string;
      path?: string;
    } = {};

    try {
      body = await request.json();
    } catch {
      // Body may be empty or form data
    }

    const secret = body.secret || authHeader;
    const expectedSecret = process.env.REVALIDATE_SECRET || "revalidate_secret_key_2026";

    // Validate secret against REVALIDATE_SECRET or tenant API keys
    let isAuthorized = secret === expectedSecret;

    if (!isAuthorized && body.siteId && isValidSiteId(body.siteId)) {
      try {
        const creds = getSiteApiCredentials(body.siteId);
        if (creds.apiKey && secret === creds.apiKey) {
          isAuthorized = true;
        }
      } catch {
        // Ignore resolution error
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          revalidated: false,
          error: "Unauthorized: Invalid revalidation secret or API key.",
        },
        { status: 401 }
      );
    }

    const revalidatedTags: string[] = [];
    const revalidatedPaths: string[] = [];

    // Revalidate by Site ID
    if (body.siteId && isValidSiteId(body.siteId)) {
      const siteDef = getSiteById(body.siteId);
      const siteTag = `config:${body.siteId}`;
      const legacyTag = `site-config:${body.siteId}`;

      revalidateTag(siteTag);
      revalidateTag(legacyTag);
      revalidateTag("config");

      revalidatedTags.push(siteTag, legacyTag, "config");

      if (siteDef) {
        revalidatePath(`/${siteDef.siteId}`, "layout");
        revalidatePath(`/${siteDef.siteId}/en`, "page");
        revalidatedPaths.push(`/${siteDef.siteId}`, `/${siteDef.siteId}/en`);
      }
    }

    // Revalidate by custom Tag
    if (body.tag) {
      revalidateTag(body.tag);
      revalidatedTags.push(body.tag);
    }

    // Revalidate by custom Path
    if (body.path) {
      revalidatePath(body.path);
      revalidatedPaths.push(body.path);
    }

    if (revalidatedTags.length === 0 && revalidatedPaths.length === 0) {
      // Default: purge all config tags
      revalidateTag("config");
      revalidatedTags.push("config");
    }

    return NextResponse.json({
      revalidated: true,
      siteId: body.siteId || null,
      tags: revalidatedTags,
      paths: revalidatedPaths,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        revalidated: false,
        error: `Revalidation failed: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}

