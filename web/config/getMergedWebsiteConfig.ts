import { isValidWebsite } from "./getWebsiteConfig";
import { getWebsiteConfig } from "@/lib/website/getWebsiteConfig";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

/**
 * Kept so app/[site]/layout.tsx (and anything else importing this) keeps
 * working unchanged. All the logic now lives in lib/website/*.
 * Never throws: on API failure this returns the static/default config.
 */
export async function getMergedWebsiteConfig(
    site: string
): Promise<MergedWebsiteConfig | null> {
    if (!isValidWebsite(site)) return null;
    const { config } = await getWebsiteConfig(site);
    return config;
}