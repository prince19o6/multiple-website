import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/apiBase";
import { getSiteById, isValidSiteId } from "@/lib/siteRegistry";
import { getSiteApiCredentials } from "@/lib/serverSiteSecrets";
import { loginLocalUser } from "@/lib/auth/localAuthStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, siteId: rawSiteId, requireAdmin } = body;

    const siteId = rawSiteId && isValidSiteId(rawSiteId) ? rawSiteId : "gujjutours";
    const siteDef = getSiteById(siteId);
    const hostname = siteDef?.backendHostname || "www.gujjutours.com";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const creds = getSiteApiCredentials(siteId);
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "NextJS-Web";

    let backendRes: Response | null = null;
    let isDbUnavailable = false;
    let data: Record<string, any> = {};

    try {
      backendRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Hostname": hostname,
          "X-Website-Id": siteId,
          "X-Api-Key": creds.apiKey,
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ipAddress: clientIp,
          deviceInfo: userAgent,
        }),
      });
    } catch {
      isDbUnavailable = true;
    }

    if (backendRes) {
      const text = await backendRes.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text };
      }

      const errString = `${data.error || ""} ${data.message || ""}`;
      if (
        backendRes.status === 503 ||
        errString.includes("Database unavailable") ||
        errString.includes("MongoDB") ||
        errString.includes("timed out")
      ) {
        isDbUnavailable = true;
      }
    }

    // If database is unavailable or backend is offline, use resilient local auth
    if (isDbUnavailable) {
      const localResult = loginLocalUser({
        email: email.trim(),
        password,
        siteId,
        requireAdmin,
      });

      if (!localResult.success || !localResult.data) {
        return NextResponse.json(
          { success: false, error: localResult.error || "Authentication failed" },
          { status: 401 }
        );
      }

      const resData = localResult.data;
      const response = NextResponse.json({
        success: true,
        data: resData,
      });

      response.cookies.set(`auth_token_${siteId}`, resData.token, {
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: false,
      });

      if (resData.refreshToken) {
        response.cookies.set(`auth_refresh_${siteId}`, resData.refreshToken, {
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
          sameSite: "lax",
          httpOnly: true,
        });
      }

      if (resData.user.role.toLowerCase() === "admin") {
        response.cookies.set(`admin_token_${siteId}`, resData.token, {
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
          sameSite: "lax",
          httpOnly: false,
        });
        response.cookies.set("admin_active_site", siteId, {
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
          sameSite: "lax",
          httpOnly: false,
        });
        response.cookies.set("admin_token", resData.token, {
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
          sameSite: "lax",
          httpOnly: false,
        });
      }

      return response;
    }

    if (!backendRes || !backendRes.ok) {
      const errorMsg =
        typeof data.error === "string"
          ? data.error
          : typeof data.message === "string"
          ? data.message
          : "Invalid email or password";
      return NextResponse.json({ success: false, error: errorMsg }, { status: backendRes ? backendRes.status : 400 });
    }

    const payload = (data.data || data) as {
      accessToken?: string;
      token?: string;
      refreshToken?: string;
      expiresAt?: string;
      user?: {
        id: string;
        fullName?: string;
        name?: string;
        email: string;
        role: string;
      };
    };

    const token = payload.accessToken || payload.token;
    if (!token || !payload.user) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication payload received from server" },
        { status: 500 }
      );
    }

    const roleLower = (payload.user.role || "").toLowerCase();
    if (requireAdmin && roleLower !== "admin" && roleLower !== "superadmin") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied: This account does not possess administrator privileges.",
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken: token,
        token,
        refreshToken: payload.refreshToken,
        expiresAt: payload.expiresAt,
        user: {
          id: payload.user.id,
          name: payload.user.fullName || payload.user.name || payload.user.email.split("@")[0],
          fullName: payload.user.fullName || payload.user.name,
          email: payload.user.email,
          role: payload.user.role,
        },
      },
    });

    // Set customer token cookie
    response.cookies.set(`auth_token_${siteId}`, token, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: false,
    });

    if (payload.refreshToken) {
      response.cookies.set(`auth_refresh_${siteId}`, payload.refreshToken, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: true,
      });
    }

    // If admin, also set admin tokens
    if (roleLower === "admin" || roleLower === "superadmin") {
      response.cookies.set(`admin_token_${siteId}`, token, {
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: false,
      });
      response.cookies.set("admin_active_site", siteId, {
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: false,
      });
      response.cookies.set("admin_token", token, {
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: false,
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal login error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
