"use client";

import { useEffect, useState } from "react";
import { getWebsiteConfig } from "@/config/getWebsiteConfig";
import {
    fetchSiteConfigViaProxy,
    resolveConfigHostname,
} from "@/lib/siteConfig";
import { mergeWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

export function useMergedWebsiteConfig(site: string): MergedWebsiteConfig {
    const staticConfig = getWebsiteConfig(site) || { id: site };
    const [config, setConfig] = useState<MergedWebsiteConfig>(() =>
        mergeWebsiteConfig(staticConfig, null)
    );

    useEffect(() => {
        let cancelled = false;
        const hostname = resolveConfigHostname(site);

        if (!hostname) {
            console.warn(
                "useMergedWebsiteConfig: no hostname (set NEXT_PUBLIC_SITE_HOSTNAME or use a known slug)"
            );
            return;
        }

        fetchSiteConfigViaProxy(hostname)
            .then((dynamic) => {
                if (cancelled) return;
                setConfig(mergeWebsiteConfig(staticConfig, dynamic));
            })
            .catch((err) => {
                console.error(
                    "useMergedWebsiteConfig: keeping defaults/static structure —",
                    err
                );
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [site]);

    return config;
}