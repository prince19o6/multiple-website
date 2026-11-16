import type { SupportedSiteId } from "./types";

export interface BookingCreationRequest {
  serviceId: string | number;
  serviceType: string;
  title: string;
  price: number;
  currency: string;
  startDate: string;
  endDate?: string;
  guestsCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface BookingResult {
  id: string;
  bookingRef: string;
  status: "Pending" | "Confirmed" | "Cancelled";
  serviceTitle: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  canDownloadEticket: boolean;
}

export class LocalBackendProvider {
  private baseUrl: string;

  constructor(backendUrl?: string) {
    this.baseUrl = backendUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  }

  private getHostname(siteId: SupportedSiteId): string {
    if (siteId === "gujjutours" || siteId === "website1") return "www.gujjutours.com";
    if (siteId === "tripgoasia" || siteId === "website2") return "www.tripgoasia.com";
    return "stagingb2b.technoheaven.com";
  }

  async createBooking(siteId: SupportedSiteId, req: BookingCreationRequest, token?: string): Promise<BookingResult> {
    const hostname = this.getHostname(siteId);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Website-Hostname": hostname
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}/api/bookings`, {
      method: "POST",
      headers,
      body: JSON.stringify(req)
    });

    if (!res.ok) {
      let errMsg = `Booking failed with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errMsg = errJson.message || errJson.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    const data = await res.json();
    return {
      id: data.id || data._id,
      bookingRef: data.reference || data.bookingRef,
      status: data.status || "Pending",
      serviceTitle: req.title,
      totalPrice: req.price,
      currency: req.currency,
      createdAt: new Date().toISOString(),
      canDownloadEticket: data.status === "Confirmed"
    };
  }

  async getMyBookings(siteId: SupportedSiteId, token: string): Promise<BookingResult[]> {
    const hostname = this.getHostname(siteId);
    try {
      const res = await fetch(`${this.baseUrl}/api/bookings/my`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Website-Hostname": hostname
        }
      });
      if (!res.ok) return [];
      const items = await res.json();
      return (items || []).map((b: any) => ({
        id: b.id || b._id,
        bookingRef: b.bookingRef || b.reference,
        status: b.status,
        serviceTitle: b.title || b.serviceTitle,
        totalPrice: b.price || b.totalPrice,
        currency: b.currency,
        createdAt: b.createdAt,
        canDownloadEticket: b.status === "Confirmed"
      }));
    } catch {
      return [];
    }
  }
}

