/**
 * SERVER-SIDE usage. Async Server Components: no hooks, no loading state.
 * If the API is down you still get the static/default config.
 *
 * Wire-up options:
 *   - Your real app: app/[site]/layout.tsx already calls
 *     getMergedWebsiteConfig(site), which now delegates to getWebsiteConfig.
 *     Pages below the layout just call useSiteConfig() (client) or
 *     getWebsiteConfig(site) (server, de-duplicated per request).
 *   - Explicit per-site pages: render one of the components below.
 */
import type { Metadata } from "next";
import { getWebsiteConfig } from "@/lib/website/getWebsiteConfig";
import type { WebsiteId } from "@/lib/website/types";

async function SiteHome({ websiteId }: { websiteId: WebsiteId }) {
    const { config, meta } = await getWebsiteConfig(websiteId);
    const theme = config.theme;
    const hero = (config.hero ?? {}) as { title?: string; subtitle?: string };

    return (
        <main
            style={{
                ...(config.cssVariables as React.CSSProperties),
                backgroundColor: theme.background,
                color: theme.text,
                minHeight: "100vh",
                padding: 24,
            }}
        >
            <h1 style={{ color: theme.heading }}>{config.name}</h1>
            <p>{hero.title ?? hero.subtitle}</p>

            {meta.source === "fallback" && (
                <small style={{ color: theme.mutedText }}>
                    Showing default content ({meta.error?.code ?? "no data"}).
                </small>
            )}
        </main>
    );
}

// website1 (Travel Explorer) -> data source "gujjutourdata"
export function Website1Home() {
    return <SiteHome websiteId="website1" />;
}

// website2 (Adventure World) -> data source "tripgoasia"
export function Website2Home() {
    return <SiteHome websiteId="website2" />;
}

// website3 (Holiday Paradise) -> data source "technoheaven"
export function Website3Home() {
    return <SiteHome websiteId="website3" />;
}

// Metadata works the same way; the call is de-duplicated with the page's.
export async function generateWebsiteMetadata(
    websiteId: WebsiteId
): Promise<Metadata> {
    const { config } = await getWebsiteConfig(websiteId);
    return { title: config.name };
}

/*
  app/website1/page.tsx
    import { Website1Home } from "@/lib/website/examples/ServerPageExample";
    export default Website1Home;

  (same for website2 / website3)
*/