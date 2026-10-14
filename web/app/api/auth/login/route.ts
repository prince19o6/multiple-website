import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/apiBase";
import { getSiteById, isValidSiteId } from "@/lib/siteRegistry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, siteId: rawSiteId } = body;

    const siteId = rawSiteId && isValidSiteId(rawSiteId) ? rawSiteId : "tripgoasia";
    const siteDef = getSiteById(siteId);
    const hostname = siteDef?.backendHostname || "www.tripgoasia.com";

    console.log(`[DEBUG] /api/auth/login - Proxying login for site: ${siteId}, hostname: ${hostname}`);

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    let backendRes: Response;
    try {
      backendRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Hostname": hostname,
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch (networkErr: unknown) {
      const errMsg = networkErr instanceof Error ? networkErr.message : "Unknown error";
      console.error(`[DEBUG] /api/auth/login - Backend unreachable at ${API_BASE}: ${errMsg}`);
      return NextResponse.json(
        {
          success: false,
          error: "Backend server is unreachable. Please verify ToursApi is running on port 5000.",
        },
        { status: 503 }
      );
    }

    const text = await backendRes.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      return NextResponse.json(
        { success: false, error: `Invalid response from backend (Status ${backendRes.status})` },
        { status: 502 }
      );
    }

    console.log(`[DEBUG] /api/auth/login - Backend responded with status: ${backendRes.status}, keys: ${Object.keys(data).join(", ")}`);

    if (!backendRes.ok) {
      const errorMsg =
        typeof data.error === "string"
          ? data.error
          : typeof data.message === "string"
            ? data.message
            : "Invalid email or password";
      return NextResponse.json({ success: false, error: errorMsg }, { status: backendRes.status });
    }

    const payload = data.data as {
      token?: string;
      refreshToken?: string;
      expiresAt?: string;
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        websiteId?: string;
        status?: string;
      };
    } | undefined;

    if (!payload?.token || !payload.user) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication payload received from server" },
        { status: 500 }
      );
    }

    // Case-insensitive role check
    const roleLower = (payload.user.role || "").toLowerCase();
    if (roleLower !== "admin" && roleLower !== "superadmin") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied: This account does not possess administrator privileges.",
        },
        { status: 403 }
      );
    }

    const isProd = process.env.NODE_ENV === "production";
    const res = NextResponse.json({
      success: true,
      data: {
        token: payload.token,
        user: payload.user,
        siteId,
      },
    });

    // Set site-prefixed httpOnly cookie for JWT token
    res.cookies.set(`admin_token_${siteId}`, payload.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 86400, // 24 hours
    });

    if (payload.refreshToken) {
      res.cookies.set(`admin_refresh_${siteId}`, payload.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 86400 * 30, // 30 days
      });
    }

    // Set active site and user metadata cookies (readable by client)
    res.cookies.set("admin_active_site", siteId, {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 86400,
    });

    res.cookies.set(`admin_user_${siteId}`, JSON.stringify(payload.user), {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 86400,
    });

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal authentication error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
