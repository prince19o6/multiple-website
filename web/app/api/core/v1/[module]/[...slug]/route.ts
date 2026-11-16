import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ module: string; slug: string[] }> }
) {
  const { module: rawModule, slug } = await params;
  const subRoute = slug ? slug.join("/") : "";
  const searchParams = request.nextUrl.searchParams;
  const site = (searchParams.get("site") || process.env.NEXT_PUBLIC_SITE || "gujjutours").toLowerCase();

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const hostname =
    site === "tripgoasia"
      ? "www.tripgoasia.com"
      : site === "technoheaven"
      ? "stagingb2b.technoheaven.com"
      : "www.gujjutours.com";

  // Try ASP.NET Core backend first
  try {
    const backendUrl = new URL(`${apiUrl}/api/core/v1/${rawModule}/${subRoute}`);
    searchParams.forEach((v, k) => backendUrl.searchParams.set(k, v));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(backendUrl.toString(), {
      headers: { "X-Website-Hostname": hostname },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend offline or timeout — fall back to /api/core/v1/home
  }

  // Fallback to home API slice
  const homeUrl = new URL(request.url);
  homeUrl.pathname = "/api/core/v1/home";
  homeUrl.searchParams.set("module", rawModule);
  homeUrl.searchParams.set("site", site);

  const homeRes = await fetch(homeUrl.toString());
  if (homeRes.ok) {
    const homeJson = await homeRes.json();
    if (subRoute === "categories") {
      return NextResponse.json({
        success: true,
        site,
        module: rawModule,
        count: homeJson.categories?.length || 0,
        data: homeJson.categories || [],
      });
    }
    if (subRoute === "featured") {
      return NextResponse.json({
        success: true,
        site,
        module: rawModule,
        count: homeJson.featured?.length || 0,
        data: homeJson.featured || [],
      });
    }
    if (subRoute === "destinations") {
      return NextResponse.json({
        success: true,
        site,
        module: rawModule,
        count: homeJson.destinations?.length || 0,
        data: homeJson.destinations || [],
      });
    }
    return NextResponse.json(homeJson);
  }

  return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });
}

