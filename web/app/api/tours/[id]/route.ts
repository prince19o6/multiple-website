import { NextRequest, NextResponse } from "next/server";
import { fetchTourById } from "@/lib/api";
import { resolveSiteFromHost } from "@/lib/siteRegistry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const site = resolveSiteFromHost(host);

  try {
    const tour = await fetchTourById(id, site ?? undefined);
    if (!tour) {
      return NextResponse.json(
        { success: false, data: null, error: "Tour not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, data: tour },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Failed to fetch tour",
      },
      { status: 500 }
    );
  }
}
