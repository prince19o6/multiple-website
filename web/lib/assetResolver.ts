export type AssetContext = {
    staticPath?: string | null;
    serviceImageCdnPath?: string | null;
    fallback?: string | null;
};

function isAbsolute(path: string) {
    return (
        path.startsWith("http://") ||
        path.startsWith("https://") ||
        path.startsWith("data:") ||
        path.startsWith("//")
    );
}

export function resolveAsset(
    path: string | null | undefined,
    ctx: AssetContext = {}
): string | null {
    const fallback = ctx.fallback ?? null;
    if (path == null || typeof path !== "string") return fallback;
    const t = path.trim();
    if (!t) return fallback;
    if (isAbsolute(t)) return t.startsWith("//") ? `https:${t}` : t;

    const base =
        (ctx.staticPath && String(ctx.staticPath).trim()) ||
        (ctx.serviceImageCdnPath
            ? `${String(ctx.serviceImageCdnPath).replace(/\/$/, "")}/uploads`
            : "");

    if (base) {
        return `${base.replace(/\/?$/, "/")}${t.replace(/^\//, "")}`;
    }
    return t.startsWith("/") ? t : `/${t}`;
}

export function resolveLogoFromWebsite(
    website: {
        logoUrl?: string | null;
        icon?: string | null;
        faviconImagePath?: string | null;
        staticPath?: string | null;
        serviceImageCdnPath?: string | null;
    } | null | undefined,
    fallback: string | null = null
): string | null {
    if (!website) return fallback;
    if (website.logoUrl?.trim()) {
        return resolveAsset(website.logoUrl, {
            staticPath: website.staticPath,
            serviceImageCdnPath: website.serviceImageCdnPath,
            fallback,
        });
    }
    const path = website.icon || website.faviconImagePath || null;
    return resolveAsset(path, {
        staticPath: website.staticPath,
        serviceImageCdnPath: website.serviceImageCdnPath,
        fallback,
    });
}