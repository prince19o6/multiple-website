import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/apiBase";
import { getSiteById, isValidSiteId, type SiteId } from "@/lib/siteRegistry";
import { getSiteApiCredentials } from "@/lib/serverSiteSecrets";
import { registerLocalUser, loginLocalUser, getLocalUserByIdOrEmail } from "@/lib/auth/localAuthStore";

export interface ProxyAuthOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: any;
  requireAuth?: boolean;
}

export function resolveSiteId(req: NextRequest, bodySiteId?: string): SiteId {
  if (bodySiteId && isValidSiteId(bodySiteId)) {
    return bodySiteId as SiteId;
  }
  const querySite = req.nextUrl.searchParams.get("siteId");
  if (querySite && isValidSiteId(querySite)) {
    return querySite as SiteId;
  }
  const headerSite = req.headers.get("x-website-id");
  if (headerSite && isValidSiteId(headerSite)) {
    return headerSite as SiteId;
  }
  const cookieSite = req.cookies.get("active_site")?.value || req.cookies.get("admin_active_site")?.value;
  if (cookieSite && isValidSiteId(cookieSite)) {
    return cookieSite as SiteId;
  }
  return "gujjutours";
}

export async function forwardAuthRequest(req: NextRequest, options: ProxyAuthOptions) {
  try {
    const siteId = resolveSiteId(req, options.body?.siteId);
    const siteDef = getSiteById(siteId);
    const hostname = siteDef?.backendHostname || "www.gujjutours.com";
    const creds = getSiteApiCredentials(siteId);

    // Resolve Authorization token
    let authHeader = req.headers.get("authorization");
    if (!authHeader) {
      const cookieToken =
        req.cookies.get(`auth_token_${siteId}`)?.value ||
        req.cookies.get(`admin_token_${siteId}`)?.value ||
        req.cookies.get("auth_token")?.value;
      if (cookieToken) {
        authHeader = `Bearer ${cookieToken}`;
      }
    }

    if (options.requireAuth && !authHeader) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Website-Hostname": hostname,
      "X-Website-Id": siteId,
      "X-Api-Key": creds.apiKey,
    };

    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "NextJS-Web";

    let requestBody: string | undefined;
    if (options.body && options.method !== "GET") {
      const bodyWithMeta = {
        ...options.body,
        ipAddress: clientIp,
        deviceInfo: userAgent,
      };
      requestBody = JSON.stringify(bodyWithMeta);
    }

    const backendUrl = `${API_BASE}${options.path.startsWith("/") ? "" : "/"}${options.path}`;

    let backendRes: Response | null = null;
    let isDbUnavailable = false;
    try {
      backendRes = await fetch(backendUrl, {
        method: options.method,
        headers,
        body: requestBody,
      });
    } catch {
      isDbUnavailable = true;
    }

    let data: any = {};
    if (backendRes) {
      const text = await backendRes.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
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

    // Resilient fallback for Register if MongoDB is unavailable
    if (isDbUnavailable && options.path.includes("register") && options.body) {
      const regResult = registerLocalUser({
        fullName: options.body.fullName || options.body.name || "Traveler",
        email: options.body.email,
        password: options.body.password,
        phone: options.body.phone,
        phoneCountryCode: options.body.phoneCountryCode,
        siteId,
      });

      const fallbackResponse = NextResponse.json(
        {
          success: true,
          data: regResult,
          message: "Registration successful",
        },
        { status: 201 }
      );

      fallbackResponse.cookies.set(`auth_token_${siteId}`, regResult.token, {
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: false,
      });

      if (regResult.refreshToken) {
        fallbackResponse.cookies.set(`auth_refresh_${siteId}`, regResult.refreshToken, {
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
          sameSite: "lax",
          httpOnly: true,
        });
      }

      return fallbackResponse;
    }

    // Resilient fallback for Login if MongoDB is unavailable
    if (isDbUnavailable && options.path.includes("login") && options.body) {
      const loginRes = loginLocalUser({
        email: options.body.email,
        password: options.body.password,
        siteId,
      });

      if (loginRes.success && loginRes.data) {
        const fallbackResponse = NextResponse.json(
          {
            success: true,
            data: loginRes.data,
            message: "Login successful",
          },
          { status: 200 }
        );

        fallbackResponse.cookies.set(`auth_token_${siteId}`, loginRes.data.token, {
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
          sameSite: "lax",
          httpOnly: false,
        });

        if (loginRes.data.refreshToken) {
          fallbackResponse.cookies.set(`auth_refresh_${siteId}`, loginRes.data.refreshToken, {
            path: "/",
            maxAge: 30 * 24 * 60 * 60,
            sameSite: "lax",
            httpOnly: true,
          });
        }

        return fallbackResponse;
      }
    }

    // Resilient fallback for /api/auth/me if MongoDB is unavailable
    if (isDbUnavailable && options.path.includes("me")) {
      const rawToken = authHeader?.replace("Bearer ", "").trim() || "";
      if (rawToken) {
        try {
          const parts = rawToken.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
            const user = getLocalUserByIdOrEmail(payload.email || payload.sub, siteId) || {
              id: payload.sub,
              email: payload.email,
              fullName: payload.name || payload.email?.split("@")[0] || "Traveler",
              name: payload.name || payload.email?.split("@")[0] || "Traveler",
              role: payload.role || "Customer",
              siteId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            return NextResponse.json({
              success: true,
              data: {
                id: user.id,
                name: user.fullName || user.name,
                fullName: user.fullName || user.name,
                email: user.email,
                role: user.role,
              },
            });
          }
        } catch {}
      }
    }

    if (!backendRes) {
      return NextResponse.json(
        {
          success: false,
          error: `Backend auth service unreachable at ${API_BASE}`,
        },
        { status: 503 }
      );
    }

    const response = NextResponse.json(
      {
        success: backendRes.ok,
        data: data.data || data,
        message: data.message || (backendRes.ok ? "Success" : "Failed"),
        error: !backendRes.ok ? data.error || data.message || "Request failed" : undefined,
      },
      { status: backendRes.status }
    );

    // If login or register returned tokens, persist to HttpOnly cookies
    const payload = data.data || data;
    if (backendRes.ok && (payload.accessToken || payload.token)) {
      const token = payload.accessToken || payload.token;
      response.cookies.set(`auth_token_${siteId}`, token, {
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: false, // Accessible to client-side auth context
      });
      if (payload.refreshToken) {
        response.cookies.set(`auth_refresh_${siteId}`, payload.refreshToken, {
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
          sameSite: "lax",
          httpOnly: true,
        });
      }
    }

    // If logout, clear cookies
    if (options.path.includes("logout")) {
      response.cookies.set(`auth_token_${siteId}`, "", { path: "/", maxAge: 0 });
      response.cookies.set(`auth_refresh_${siteId}`, "", { path: "/", maxAge: 0 });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

