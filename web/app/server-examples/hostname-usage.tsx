/**
 * app/server-example/hostname-usage.tsx
 * =========================================================================
 * Example usage of the extended lib/hostnameRegistry.ts helpers.
 * Not a real route — copy the parts you need into app/[site]/layout.tsx,
 * generateMetadata, or an API route.
 */
import {
    resolveHostname,
    getHostnamesForWebsite,
    isAllowedWebsite,
    addHostname,
} from "@/lib/hostnameRegistry";
import { getMergedWebsiteConfig } from "@/config/getMergedWebsiteConfig";

/* ---------------- SERVER COMPONENT: resolve + fetch config ---------------- */

export async function ServerExample({ hostname }: { hostname: string }) {
    // 1. Strict allowlist check — unknown hostname -> render nothing/404.
    if (!isAllowedWebsite(hostname)) {
        return <p>Unknown website: {hostname}</p>;
    }

    // 2. One call for slug + brand + canonical host.
    const resolved = resolveHostname(hostname)!; // non-null: isAllowedWebsite already confirmed it

    // 3. Fetch the merged config the normal way (staticSlug drives everything else).
    const config = await getMergedWebsiteConfig(resolved.staticSlug);

    return (
        <div>
            <p>Brand: {resolved.brand}</p>
            <p>Static slug: {resolved.staticSlug}</p>
            <p>Site name: {config?.name}</p>
        </div>
    );
}

/* ---------------- generateMetadata: alternate/canonical URLs -------------- */

export async function exampleGenerateMetadata(hostname: string) {
    const resolved = resolveHostname(hostname);
    if (!resolved) return { title: "Not found" };

    // All hostnames this website answers to — useful for <link rel="alternate">.
    const allHostnames = getHostnamesForWebsite(resolved.staticSlug);

    return {
        alternates: {
            canonical: `https://${resolved.canonicalHost}`,
            languages: undefined,
        },
        other: { "x-all-hostnames": allHostnames.join(",") },
    };
}

/* ---------------- Registering a hostname (run once, e.g. at startup) ------ */

export function registerExtraDomainsExample() {
    // Safe no-ops if already registered; rejected (returns false) if the
    // (staticSlug, brand) pair is wrong or the hostname belongs elsewhere.
    addHostname("promo.gujjutours.in", "website1", "gujjutours");
    addHostname("app.tripgoasia.co", "website2", "tripgoasia");
}