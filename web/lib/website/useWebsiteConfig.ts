"use client";

/**
 * Client-side counterpart of getWebsiteConfig(). Starts immediately with the
 * static/default config (no blank screen), then swaps in the merged config
 * once /api/website-config/[websiteId] answers. On failure it keeps the
 * static config and exposes `error`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SiteConfigResponse } from "@/lib/siteConfig";
import { buildWebsiteConfig, resolveSite } from "./registry";
import type { ConfigSource, MergedWebsiteConfig } from "./types";

export interface UseWebsiteConfigOptions {
    lang?: string;
    /** Config already loaded on the server: skips the first request. */
    initialConfig?: MergedWebsiteConfig;
}

export interface UseWebsiteConfigResult {
    config: MergedWebsiteConfig;
    isLoading: boolean;
    /** null when the last request succeeded */
    error: string | null;
    /** "fallback" until the API has answered successfully */
    source: ConfigSource;
    refetch: () => void;
}

interface State {
    config: MergedWebsiteConfig;
    isLoading: boolean;
    error: string | null;
    source: ConfigSource;
}

export function useWebsiteConfig(
    websiteId: string,
    options: UseWebsiteConfigOptions = {}
): UseWebsiteConfigResult {
    const { lang = "en", initialConfig } = options;

    const site = useMemo(() => resolveSite(websiteId), [websiteId]);
    const fallback = useMemo(() => buildWebsiteConfig(site, null), [site]);

    const [state, setState] = useState<State>(() =>
        initialConfig
            ? { config: initialConfig, isLoading: false, error: null, source: "api" }
            : { config: fallback, isLoading: true, error: null, source: "fallback" }
    );
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        // Server already gave us the config: nothing to fetch until refetch().
        if (initialConfig && reloadCount === 0) return;

        const controller = new AbortController();
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        (async () => {
            try {
                const res = await fetch(
                    `/api/website-config/${encodeURIComponent(websiteId)}?lang=${encodeURIComponent(lang)}`,
                    { cache: "no-store", signal: controller.signal }
                );
                const body = (await res.json()) as SiteConfigResponse;

                if (!res.ok || !body.isSuccess || !body.result) {
                    throw new Error(
                        body?.error || `Failed to load config (status ${res.status})`
                    );
                }

                setState({
                    config: buildWebsiteConfig(site, body.result),
                    isLoading: false,
                    error: null,
                    source: "api",
                });
            } catch (err) {
                if (controller.signal.aborted) return;
                setState({
                    config: fallback,
                    isLoading: false,
                    error: err instanceof Error ? err.message : String(err),
                    source: "fallback",
                });
            }
        })();

        return () => controller.abort();
        // initialConfig is intentionally not a dependency: it only seeds state.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [websiteId, lang, site, fallback, reloadCount]);

    const refetch = useCallback(() => setReloadCount((n) => n + 1), []);

    return { ...state, refetch };
}