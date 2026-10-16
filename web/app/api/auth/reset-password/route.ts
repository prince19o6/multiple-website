import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/apiBase";
import { getSiteById, isValidSiteId } from "@/lib/siteRegistry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword, siteId: rawSiteId } = body;

    const siteId = rawSiteId && isValidSiteId(rawSiteId) ? rawSiteId : "gujjutours";
    const siteDef = getSiteById(siteId);
    const hostname = siteDef?.backendHostname || "www.gujjutours.com";

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Reset token and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    let backendRes: Response;
    try {
      backendRes = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Hostname": hostname,
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({ token, newPassword }),
      });
    } catch (networkErr: unknown) {
      const errMsg = networkErr instanceof Error ? networkErr.message : "Unknown error";
      return NextResponse.json(
        {
          success: false,
          error: `Backend server unreachable at ${API_BASE}: ${errMsg}`,
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

    if (!backendRes.ok) {
      const errorMsg =
        typeof data.error === "string"
          ? data.error
          : typeof data.message === "string"
            ? data.message
            : "Password reset failed. The token may be invalid or expired.";
      return NextResponse.json({ success: false, error: errorMsg }, { status: backendRes.status });
    }

    return NextResponse.json({
      success: true,
      message: "Password has been successfully reset. You may now log in.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
