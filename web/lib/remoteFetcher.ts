import DOMPurify from "isomorphic-dompurify";
import { getActiveRemoteConfig } from "./remoteConfig";

interface FetchOptions {
    siteId: string;
    path: string;
    fallbackHtml?: string;
    customHeaders?: Record<string, string>;
}

// In-Memory Cache (Can be replaced with Redis / SWR)
const cacheStore = new Map<string, { data: any; timestamp: number }>();

export async function fetchRemoteContent<T = string>({
    siteId,
    path,
    fallbackHtml = "<div class='remote-error'>Remote content unavailable</div>",
    customHeaders = {},
}: FetchOptions): Promise<{ content: T; isFallback: boolean }> {
    const config = getActiveRemoteConfig(siteId);
    const targetUrl = `${config.baseUrl}${path}`;
    const cacheKey = `${siteId}:${path}`;

    // 1. Check Cache
    const cached = cacheStore.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < config.cacheTtlSeconds * 1000) {
        return { content: cached.data as T, isFallback: false };
    }

    // 2. Fetch with Timeout & Fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        const response = await fetch(targetUrl, {
            headers: {
                "Accept": "text/html, application/json",
                "X-Requested-With": "RemoteComponentFetcher",
                ...customHeaders,
            },
            signal: controller.signal,
            next: { revalidate: config.cacheTtlSeconds }, // Next.js Cache Integration
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        let data: any;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const rawText = await response.text();
            // Sanitize raw HTML for security
            data = DOMPurify.sanitize(rawText, {
                ADD_TAGS: ["style", "script", "slot", "template"],
                ADD_ATTR: ["target", "onclick", "data-component"],
            });
        }

        // 3. Save to Cache
        cacheStore.set(cacheKey, { data, timestamp: Date.now() });
        return { content: data as T, isFallback: false };
    } catch (error) {
        clearTimeout(timeoutId);
        console.warn(`[RemoteFetcher Error] Failed fetching ${targetUrl}:`, error);

        return {
            content: (typeof fallbackHtml === "string" ? fallbackHtml : { error: true }) as unknown as T,
            isFallback: true,
        };
    }
}
