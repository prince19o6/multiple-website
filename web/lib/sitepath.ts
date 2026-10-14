/**
 * ALWAYS prefix with [site] on path-based multi-tenant.
 *
 * Wrong: /explore              → chooser or 404
 * Right: /www.gujjutours.com/explore → real tours list
 */

function normalizePath(path: string = "/"): string {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function sitePath(site?: string | null, path: string = "/"): string {
  const normalizedPath = normalizePath(path);

  if (!site || typeof site !== "string" || !site.trim()) {
    return normalizedPath;
  }

  const segment = site.trim();

  // Don't double-prefix if path already includes the site
  if (
    normalizedPath === `/${segment}` ||
    normalizedPath.startsWith(`/${segment}/`)
  ) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return `/${segment}`;
  }

  return `/${segment}${normalizedPath}`;
}

export function buildSitePath(site?: string | null, path: string = "/"): string {
  return sitePath(site, path);
}

export default sitePath;