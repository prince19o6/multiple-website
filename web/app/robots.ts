import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveSiteFromHost, getSiteById } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "www.gujjutours.com";

  const site = resolveSiteFromHost(host) || getSiteById(ENV.defaultSiteId);
  const canonical = site?.backendHostname || "www.gujjutours.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/*/my-bookings",
          "/en/my-bookings",
          "/booking/confirmation",
        ],
      },
    ],
    sitemap: `https://${canonical}/sitemap.xml`,
  };
}
