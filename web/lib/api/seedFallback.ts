import fs from "fs";
import path from "path";

function getCandidateDirs(siteId: string): string[] {
  const s = (siteId || "gujjutours").toLowerCase().trim();
  const cwd = process.cwd();
  return [
    path.join(cwd, "seed", s),
    path.join(cwd, "web", "seed", s),
    path.join(cwd, "seed"),
    path.join(cwd, "web", "seed"),
    path.join(cwd, "seed", "gujjutours"),
    path.join(cwd, "web", "seed", "gujjutours"),
  ];
}

export function loadSeedEntities<T = any>(siteId: string, moduleName: string): T[] {
  const s = (siteId || "gujjutours").toLowerCase().trim();
  const mod = (moduleName || "").toLowerCase().trim();
  const dirs = getCandidateDirs(s);

  let possibleFiles: string[] = [];
  if (mod === "tours" || mod === "activities") {
    possibleFiles = [`tours.${s}.json`, "tours.gujjutours.json", "tours.json", "activities.json"];
  } else if (mod === "buildpackage" || mod === "build-package") {
    possibleFiles = ["build-package-options.json", "packages.json"];
  } else if (mod === "visa" || mod === "visas") {
    possibleFiles = ["visas.json", "visa.json"];
  } else if (mod === "transfers" || mod === "cabs" || mod === "cab") {
    possibleFiles = ["transfers.json", "cabs.json"];
  } else {
    possibleFiles = [`${mod}.json`];
  }

  for (const d of dirs) {
    for (const f of possibleFiles) {
      const fullPath = path.join(d, f);
      if (fs.existsSync(fullPath)) {
        try {
          let raw = fs.readFileSync(fullPath, "utf-8");
          if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
          const parsed = JSON.parse(raw);
          let items = Array.isArray(parsed) ? parsed : parsed.items || parsed.data || [];
          if (items.length > 0) {
            if (mod === "categories") {
              items = items.map((c: any) => {
                const resolvedName =
                  typeof c.name === "object" && c.name !== null
                    ? c.name.en || c.name.gu || c.name.ms || Object.values(c.name)[0] || c.slug || "Category"
                    : c.name || c.title || c.label || c.slug || "Category";
                return {
                  ...c,
                  name: resolvedName,
                  label: resolvedName,
                };
              });
            }
            return items;
          }
        } catch {
          // ignore error and continue searching
        }
      }
    }
  }

  return [];
}

export function findSeedEntity<T = any>(
  siteId: string,
  moduleName: string,
  slugOrId: string
): T | null {
  if (!slugOrId) return null;
  const clean = slugOrId.trim().toLowerCase();
  const segments = clean.split("/").filter(Boolean);
  const lastPart = segments.length > 0 ? segments[segments.length - 1] : clean;

  const items = loadSeedEntities<any>(siteId, moduleName);

  return (
    items.find((item: any) => {
      const s = String(item.slug || "").toLowerCase();
      const destSlug = String(item.destinationSlug || "").toLowerCase();
      const id = String(item.id ?? "").toLowerCase();
      const mongoId = String(item._id ?? "").toLowerCase();
      const entityId = String(
        item.restaurantId ||
        item.packageId ||
        item.hotelId ||
        item.tourId ||
        item.flightId ||
        item.transferId ||
        ""
      ).toLowerCase();
      const flightNum = String(item.flightNumber || "").toLowerCase();
      const numId = String(item.restaurantNumericId || item.numericId || item.flightNumericId || item.tourNumericId || item.packageNumericId || item.destinationNumericId || "");
      const title = String(item.title || item.name || item.destinationName || "").toLowerCase();
      const country = String(item.country || "").toLowerCase();
      const countrySlug = String(item.countrySlug || "").toLowerCase();
      const countryCode = String(item.countryCode || "").toLowerCase();

      const targets = [clean, lastPart];
      return targets.some((t) =>
        t === s ||
        t === destSlug ||
        t === id ||
        t === mongoId ||
        t === entityId ||
        t === flightNum ||
        t === numId ||
        t === title ||
        t === country ||
        t === countrySlug ||
        t === countryCode
      );
    }) || null
  );
}

export function filterSeedEntities<T = any>(
  items: T[],
  params: {
    query?: string | null;
    city?: string | null;
    cuisine?: string | null;
    category?: string | null;
    categorySlug?: string | null;
    destination?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    page?: number;
    pageSize?: number;
    sort?: string | null;
    pureVeg?: boolean | null;
    jain?: boolean | null;
    halal?: boolean | null;
  }
): { items: T[]; total: number; page: number; pageSize: number } {
  let filtered = [...items];

  const q = params.query?.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter((item: any) => {
      const title = String(item.title || item.name || "").toLowerCase();
      const city = String(item.city || item.destination || item.location || "").toLowerCase();
      const desc = String(item.overview || item.description || "").toLowerCase();
      const cuisine = String(item.cuisine || item.cuisineLabel || "").toLowerCase();
      return title.includes(q) || city.includes(q) || desc.includes(q) || cuisine.includes(q);
    });
  }

  const city = params.city?.trim().toLowerCase();
  if (city && city !== "all") {
    filtered = filtered.filter((item: any) => {
      const c = String(item.city || item.destination || item.location || "").toLowerCase();
      const country = String(item.country || "").toLowerCase();
      return c.includes(city) || country.includes(city);
    });
  }

  const dest = params.destination?.trim().toLowerCase();
  if (dest && dest !== "all") {
    filtered = filtered.filter((item: any) => {
      const d = String(item.destination || item.city || item.location || "").toLowerCase();
      return d.includes(dest);
    });
  }

  const catParam = (params.category || params.categorySlug || params.cuisine)?.trim().toLowerCase();
  if (catParam && catParam !== "all") {
    filtered = filtered.filter((item: any) => {
      const c = String(item.cuisine || item.cuisineLabel || item.category || item.categorySlug || "").toLowerCase();
      return c.includes(catParam);
    });
  }

  if (params.pureVeg) {
    filtered = filtered.filter((item: any) =>
      Boolean(item.isPureVeg || item.pureVeg || item.pureVegAvailable || item.dietaryFeatures?.pureVeg)
    );
  }
  if (params.jain) {
    filtered = filtered.filter((item: any) =>
      Boolean(item.isJainAvailable || item.jainAvailable || item.jainMealAvailable || item.dietaryFeatures?.jainAvailable)
    );
  }
  if (params.halal) {
    filtered = filtered.filter((item: any) =>
      Boolean(item.isHalalCertified || item.halalCertified || item.dietaryFeatures?.halalCertified)
    );
  }

  if (params.minPrice != null && params.minPrice > 0) {
    filtered = filtered.filter((item: any) => {
      const cost = Number(item.costForTwo || item.price || item.startingPrice || 0);
      return cost >= params.minPrice!;
    });
  }

  if (params.maxPrice != null && params.maxPrice > 0) {
    filtered = filtered.filter((item: any) => {
      const cost = Number(item.costForTwo || item.price || item.startingPrice || 0);
      return cost <= params.maxPrice!;
    });
  }

  // Safe sorting
  if (params.sort) {
    const s = params.sort.toLowerCase();
    if (s.includes("price-asc") || s === "low-to-high") {
      filtered.sort((a: any, b: any) => {
        const pa = Number(a.startingPrice || a.price || a.costForTwo || 0);
        const pb = Number(b.startingPrice || b.price || b.costForTwo || 0);
        return pa - pb;
      });
    } else if (s.includes("price-desc") || s === "high-to-low") {
      filtered.sort((a: any, b: any) => {
        const pa = Number(a.startingPrice || a.price || a.costForTwo || 0);
        const pb = Number(b.startingPrice || b.price || b.costForTwo || 0);
        return pb - pa;
      });
    } else if (s.includes("rating")) {
      filtered.sort((a: any, b: any) => (Number(b.rating || 0) - Number(a.rating || 0)));
    } else if (s.includes("duration-asc")) {
      filtered.sort((a: any, b: any) => ((a.durationDays || 0) - (b.durationDays || 0)));
    } else if (s.includes("duration-desc")) {
      filtered.sort((a: any, b: any) => ((b.durationDays || 0) - (a.durationDays || 0)));
    }
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, params.pageSize || 20);
  const total = filtered.length;
  const pagedItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    items: pagedItems,
    total,
    page,
    pageSize,
  };
}
