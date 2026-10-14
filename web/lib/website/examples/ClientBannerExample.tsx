"use client";

/**
 * CLIENT-SIDE usage, with loading and error states. It renders immediately
 * with the static/default config, then upgrades when the API answers.
 */
import { useWebsiteConfig } from "@/lib/website/useWebsiteConfig";
import type { WebsiteId } from "@/lib/website/types";

export function WebsiteBanner({ websiteId }: { websiteId: WebsiteId }) {
    const { config, isLoading, error, refetch } = useWebsiteConfig(websiteId);
    const theme = config.theme;

    return (
        <div
            style={{
                background: theme.primary,
                color: "#fff",
                padding: 16,
                borderRadius: 12,
            }}
        >
            <strong>{config.name}</strong>

            {isLoading && <span> · loading latest content…</span>}

            {error && (
                <span>
                    {" "}
                    · couldn&apos;t refresh ({error}){" "}
                    <button onClick={refetch}>Retry</button>
                </span>
            )}
        </div>
    );
}

/*
  <WebsiteBanner websiteId="website1" />   // gujjutourdata
  <WebsiteBanner websiteId="website2" />   // tripgoasia
  <WebsiteBanner websiteId="website3" />   // technoheaven
*/