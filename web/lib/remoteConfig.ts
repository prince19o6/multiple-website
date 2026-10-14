// lib/remoteConfig.ts

export interface RemoteSiteConfig {
    id: string;
    name: string;
    baseUrl: string;
    corsProxyUrl?: string;
    cacheTtlSeconds: number;
    layoutEndpoints: {
        header: string;
        footer: string;
        fullLayout: string;
    };
    componentEndpoint: string; // e.g. /api/components/[name]
    functionsEndpoint: string;  // e.g. /api/functions/[name]
}

export const SITE_REGISTRY: Record<string, RemoteSiteConfig> = {
    marketing: {
        id: "marketing",
        name: "Marketing Site",
        baseUrl: "https://marketing.example.com",
        cacheTtlSeconds: 300,
        layoutEndpoints: {
            header: "/api/partials/header",
            footer: "/api/partials/footer",
            fullLayout: "/api/partials/layout",
        },
        componentEndpoint: "/api/components",
        functionsEndpoint: "/api/functions",
    },
    toursPortal: {
        id: "toursPortal",
        name: "Tours Portal",
        baseUrl: "https://tours-portal.example.com",
        cacheTtlSeconds: 60,
        layoutEndpoints: {
            header: "/layouts/header.json",
            footer: "/layouts/footer.json",
            fullLayout: "/layouts/page.json",
        },
        componentEndpoint: "/components",
        functionsEndpoint: "/utils",
    },
};

export function getActiveRemoteConfig(siteId: string): RemoteSiteConfig {
    const config = SITE_REGISTRY[siteId];
    if (!config) {
        throw new Error(`Remote site configuration "${siteId}" not found.`);
    }
    return config;
}
