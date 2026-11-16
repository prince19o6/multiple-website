import { MetadataRoute } from "next";
import { ALL_SITES } from "@/lib/siteRegistry";
import { fetchSiteConfig } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const site of ALL_SITES) {
    let canonicalHost = site.backendHostname;
    let enabledFeatures = {
      hotels: true,
      flights: true,
      packages: true,
      visas: true,
      transfers: true,
      restaurants: false,
      insurance: false,
      buildPackage: false,
    };

    try {
      const config = await fetchSiteConfig(site.siteId);
      if (config.site?.canonicalHostname) {
        canonicalHost = config.site.canonicalHostname;
      }
      if (config.features) {
        enabledFeatures = { ...enabledFeatures, ...config.features };
      }
    } catch {
      // Use fallback defaults on API error
    }

    const baseUrl = `https://${canonicalHost}`;

    // Base routes
    sitemapEntries.push(
      {
        url: `${baseUrl}/`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/en`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/en/tours`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      }
    );

    // Conditional feature routes
    if (enabledFeatures.hotels) {
      sitemapEntries.push({
        url: `${baseUrl}/en/hotels`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    if (enabledFeatures.flights) {
      sitemapEntries.push({
        url: `${baseUrl}/en/flights`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    if (enabledFeatures.packages) {
      sitemapEntries.push({
        url: `${baseUrl}/en/holidays`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    if (enabledFeatures.visas) {
      sitemapEntries.push({
        url: `${baseUrl}/en/visas`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    if (enabledFeatures.transfers) {
      sitemapEntries.push({
        url: `${baseUrl}/en/transfers`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    // Static standard pages
    sitemapEntries.push(
      {
        url: `${baseUrl}/en/about-us`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: `${baseUrl}/en/contact-us`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: `${baseUrl}/en/faq`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: `${baseUrl}/en/termsandconditions`,
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/en/privacy-policy`,
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.3,
      }
    );
  }

  return sitemapEntries;
}
