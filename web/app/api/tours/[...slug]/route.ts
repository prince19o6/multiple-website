import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function loadSeedActivities(site: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "activities.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.error("[Tours Detail API] Error reading seed activities:", err.message);
  }
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const site = (searchParams.get("site") || process.env.SITE_ID || "gujjutours").toLowerCase();

    const activities = loadSeedActivities(site).length > 0
      ? loadSeedActivities(site)
      : loadSeedActivities("gujjutours");

    if (!slug || slug.length === 0) {
      return NextResponse.json({ success: false, error: "Missing identifier" }, { status: 400 });
    }

    // Handle collections/categories query
    if (slug[0] === "categories") {
      const categoriesPath = path.join(process.cwd(), "seed", site, "categories.json");
      if (fs.existsSync(categoriesPath)) {
        const cats = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));
        const activityCats = cats.filter((c: any) => c.module === "activities" || c.module === "tours");
        return NextResponse.json({ success: true, data: activityCats });
      }
      return NextResponse.json({ success: true, data: [] });
    }

    // Handle cities list
    if (slug[0] === "cities") {
      const cityMap = new Map<string, { name: string; country: string; count: number }>();
      activities.forEach((a: any) => {
        const name = a.city || a.destination;
        if (name) {
          const key = name.toLowerCase();
          const existing = cityMap.get(key) || { name, country: a.country || "", count: 0 };
          existing.count++;
          cityMap.set(key, existing);
        }
      });
      return NextResponse.json({ success: true, data: Array.from(cityMap.values()) });
    }

    // Resolve activity detail:
    // Can be /api/tours/<id>, /api/tours/<slug>, or /api/tours/<city>/<category>/<slug>
    const lastPart = slug[slug.length - 1].toLowerCase();
    const cityPart = slug.length >= 3 ? slug[0].toLowerCase() : "";
    const catPart = slug.length >= 3 ? slug[1].toLowerCase() : "";

    const match = activities.find((a: any) => {
      // 1. Direct ID match
      if (String(a.id).toLowerCase() === lastPart || String(a.tourNumericId) === lastPart) {
        return true;
      }
      // 2. Slug match
      if (a.slug?.toLowerCase() === lastPart) {
        return true;
      }
      // 3. Multi-segment match: city + category + slug
      if (cityPart && catPart) {
        const matchesCity = a.city?.toLowerCase().includes(cityPart) || a.destination?.toLowerCase().includes(cityPart);
        const matchesCat = a.categorySlug?.toLowerCase() === catPart || a.category?.toLowerCase().includes(catPart);
        const matchesSlug = a.slug?.toLowerCase().includes(lastPart);
        if (matchesCity && matchesCat && matchesSlug) return true;
      }
      return false;
    });

    if (match) {
      return NextResponse.json({ success: true, data: match });
    }

    // Fallback: Return first item if running demo preview
    if (activities.length > 0) {
      return NextResponse.json({ success: true, data: activities[0], fallback: true });
    }

    return NextResponse.json({ success: false, error: "Activity not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

