import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/apiBase";
import { getSiteById, isValidSiteId } from "@/lib/siteRegistry";

export async function POST(req: NextRequest) {
  try {
    let siteId = "tripgoasia";
    try {
      const body = await req.json();
      if (body.siteId && isValidSiteId(body.siteId)) {
        siteId = body.siteId;
      }
    } catch {
      // Body is optional
    }

    const cookieSite = req.cookies.get("admin_active_site")?.value;
    if (cookieSite && isValidSiteId(cookieSite)) {
      siteId = cookieSite;
    }

    const refreshToken = req.cookies.get(`admin_refresh_${siteId}`)?.value;
    const siteDef = getSiteById(siteId);
    const hostname = siteDef?.backendHostname || "www.tripgoasia.com";

    if (refreshToken) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Website-Hostname": hostname,
            "X-Website-Id": siteId,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Backend failure during logout should not prevent clearing local cookies
      }
    }

    const res = NextResponse.json({ success: true, message: "Logged out successfully" });

    // Expire site-prefixed cookies
    const cookieNames = [
      `admin_token_${siteId}`,
      `admin_refresh_${siteId}`,
      `admin_user_${siteId}`,
      "admin_token",
      "admin_user",
    ];

    for (const name of cookieNames) {
      res.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
      });
    }

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Logout error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
