import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";

function loadSeedTransfers(site: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "transfers.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.error("[Transfers API] Error reading seed:", err.message);
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";
    const host = normalizeHost(rawHost);

    const siteQuery = searchParams.get("site");
    const siteHeader = request.headers.get("x-site-id");
    const siteDef =
      resolveSiteFromHost(host) ||
      getSiteById(siteQuery) ||
      getSiteById(siteHeader) ||
      (ENV.defaultSiteId ? getSiteById(ENV.defaultSiteId) : null);

    const siteId = (siteDef?.siteId || siteQuery || process.env.SITE_ID || "gujjutours").toLowerCase();

    // Query parameters
    const cityParam = searchParams.get("city") || searchParams.get("destination") || "";
    const pickupParam = searchParams.get("pickup") || "";
    const dropoffParam = searchParams.get("dropoff") || "";
    const transferTypeParam = searchParams.get("transferType") || searchParams.get("type") || "";
    const vehicleTypeParam = searchParams.get("vehicleType") || searchParams.get("vehicle") || "";
    const passengersParam = searchParams.get("passengers");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const sortParam = searchParams.get("sort") || "price-asc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const idParam = searchParams.get("id");

    // 1. Attempt backend fetch
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname = siteDef?.backendHostname || (siteId === "tripgoasia" ? "www.tripgoasia.com" : siteId === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com");

    try {
      const backendUrl = new URL(`${apiUrl}/api/transfers`);
      searchParams.forEach((val, key) => backendUrl.searchParams.set(key, val));

      const res = await fetch(backendUrl.toString(), {
        headers: { "X-Website-Hostname": hostname },
        next: { revalidate: 30 },
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Backend unavailable, fallback
    }

    // 2. Fallback to deterministic transfers.json
    let transfers = loadSeedTransfers(siteId);
    if (transfers.length === 0 && siteId !== "gujjutours") {
      transfers = loadSeedTransfers("gujjutours");
    }

    // Filter by single ID
    if (idParam) {
      const single = transfers.find((t: any) =>
        String(t.id) === idParam ||
        String(t.transferNumericId) === idParam ||
        t.transferId === idParam ||
        t.slug === idParam
      );
      if (single) {
        return NextResponse.json({ success: true, data: single });
      }
    }

    // Filter: City / Destination
    if (cityParam && cityParam.toLowerCase() !== "all") {
      const q = cityParam.toLowerCase().trim();
      transfers = transfers.filter((t: any) =>
        t.city?.toLowerCase().includes(q) ||
        t.country?.toLowerCase().includes(q) ||
        t.pickupLocation?.toLowerCase().includes(q) ||
        t.dropoffLocation?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q)
      );
    }

    // Filter: Pickup location text
    if (pickupParam) {
      const q = pickupParam.toLowerCase().trim();
      transfers = transfers.filter((t: any) =>
        t.pickupLocation?.toLowerCase().includes(q) ||
        t.city?.toLowerCase().includes(q)
      );
    }

    // Filter: Dropoff location text
    if (dropoffParam) {
      const q = dropoffParam.toLowerCase().trim();
      transfers = transfers.filter((t: any) =>
        t.dropoffLocation?.toLowerCase().includes(q) ||
        t.city?.toLowerCase().includes(q)
      );
    }

    // Filter: Transfer Type
    if (transferTypeParam && transferTypeParam.toLowerCase() !== "all") {
      const type = transferTypeParam.toLowerCase().trim();
      transfers = transfers.filter((t: any) => t.transferType?.toLowerCase() === type);
    }

    // Filter: Vehicle Type
    if (vehicleTypeParam && vehicleTypeParam.toLowerCase() !== "all") {
      const v = vehicleTypeParam.toLowerCase().trim();
      transfers = transfers.filter((t: any) =>
        t.vehicleType?.toLowerCase() === v ||
        t.vehicleLabel?.toLowerCase().includes(v)
      );
    }

    // Filter: Passengers Capacity
    if (passengersParam) {
      const pax = parseInt(passengersParam, 10);
      if (!isNaN(pax) && pax > 0) {
        transfers = transfers.filter((t: any) => (t.maxPassengers || 3) >= pax);
      }
    }

    // Filter: Price Range
    if (minPriceParam) {
      const min = parseFloat(minPriceParam);
      if (!isNaN(min)) transfers = transfers.filter((t: any) => t.price >= min);
    }
    if (maxPriceParam) {
      const max = parseFloat(maxPriceParam);
      if (!isNaN(max)) transfers = transfers.filter((t: any) => t.price <= max);
    }

    // Sorting
    if (sortParam === "price-asc") {
      transfers.sort((a: any, b: any) => a.price - b.price);
    } else if (sortParam === "price-desc") {
      transfers.sort((a: any, b: any) => b.price - a.price);
    } else if (sortParam === "rating-desc") {
      transfers.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    }

    const total = transfers.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = transfers.slice(startIndex, startIndex + pageSize);

    // Facets
    const allCities = Array.from(new Set(transfers.map((t: any) => t.city).filter(Boolean)));
    const allVehicleTypes = Array.from(new Set(transfers.map((t: any) => t.vehicleType).filter(Boolean)));

    return NextResponse.json({
      success: true,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      data: paginated,
      facets: {
        cities: allCities,
        vehicleTypes: allVehicleTypes,
      },
    });
  } catch (err: any) {
    console.error("[Transfers API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

