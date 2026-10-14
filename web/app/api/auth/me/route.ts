import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/apiBase";
import { getSiteById, isValidSiteId } from "@/lib/siteRegistry";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let siteId = searchParams.get("siteId") || "";

    if (!siteId || !isValidSiteId(siteId)) {
      const cookieSite = req.cookies.get("admin_active_site")?.value;
      if (cookieSite && isValidSiteId(cookieSite)) {
        siteId = cookieSite;
      } else {
        siteId = "tripgoasia";
      }
    }

    const token =
      req.cookies.get(`admin_token_${siteId}`)?.value ||
      req.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const siteDef = getSiteById(siteId);
    const hostname = siteDef?.backendHostname || "www.tripgoasia.com";

    const backendRes = await fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Website-Hostname": hostname,
        "X-Website-Id": siteId,
      },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error verifying authentication";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
