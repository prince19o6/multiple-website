import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const site = (searchParams.get("site") || process.env.SITE_ID || "gujjutours").toLowerCase();
  const moduleParam = (searchParams.get("module") || "hotels").toLowerCase();

  // Try fetching from ASP.NET Core backend first
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const hostname = site === "tripgoasia" ? "www.tripgoasia.com" : site === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com";

  try {
    const res = await fetch(`${apiUrl}/api/categories?module=${encodeURIComponent(moduleParam)}`, {
      headers: { "X-Website-Hostname": hostname },
      next: { revalidate: 60 }
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend offline, seamlessly fall back to local seed
  }

  // Fallback: Read from web/seed
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "categories.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      const filtered = Array.isArray(list)
        ? list.filter((c: any) => !moduleParam || c.module?.toLowerCase() === moduleParam)
        : [];
      return NextResponse.json({ success: true, count: filtered.length, data: filtered });
    }
  } catch (err: any) {
    console.error("[Categories API] Seed fallback error:", err.message);
  }

  return NextResponse.json({ success: true, count: 0, data: [] });
}

