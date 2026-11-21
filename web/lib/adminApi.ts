// web/lib/adminApi.ts
// Single, typed, resilient Admin API client for the web admin dashboard.
// All requests enforce tenant isolation via X-Website-Hostname and site-prefixed auth tokens/cookies.

import { API_BASE } from "@/lib/apiBase";
import { ENV } from "@/lib/env";
import { resolveSiteFromHost, getSiteById } from "@/lib/siteRegistry";

export type AdminSiteId = "gujjutours" | "tripgoasia" | "technoheaven" | "website1" | "website2" | "website3";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "SuperAdmin" | "user" | string;
  websiteId: string;
  status?: string;
  isDisabled?: boolean;
}

export interface AdminStats {
  websiteId: string;
  totalTours: number;
  totalBookings: number;
  pendingBookings: number;
  pendingApprovals?: number;
  todayBookings?: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalUsers: number;
  newUsers?: number;
  revenueByModule?: Record<string, number>;
  recentBookings: AdminBooking[];
}

export interface AdminBookingTraveler {
  id?: string;
  name: string;
  type?: "Adult" | "Child" | string;
  age?: number;
  gender?: string;
  passportOrId?: string;
}

export interface AdminBookingStatusHistoryItem {
  status: string;
  changedAt: string;
  action?: string;
  reason?: string;
  note?: string;
  actorRole?: "Admin" | "Customer" | "System" | string;
  actorId?: string;
  previousStatus?: string;
}

export interface AdminBookingCancellationRequest {
  requestedAt: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
}

export interface AdminBooking {
  id: string;
  _id?: string;
  reference?: string;
  guestName: string;
  email: string;
  phone?: string;
  tourName: string;
  tourId: number | string;
  tourSlug?: string;
  totalPrice: number;
  status: "pending" | "confirmed" | "rejected" | "expired" | "cancelled" | "completed" | string;
  travelers: number;
  adults?: number;
  children?: number;
  travelersList?: AdminBookingTraveler[];
  startDate?: string;
  endDate?: string;
  travelDate?: string;
  createdAt?: string;
  updatedAt?: string;
  location?: string;
  destination?: string | any;
  serviceType?: string;
  module?: string;
  currency?: string;
  paymentStatus?: "unpaid" | "paid" | "refunded" | string;
  specialRequest?: string;
  source?: "web" | "app" | string;
  snapshot?: {
    title?: string;
    coverImage?: string;
    destination?: string | any;
    duration?: string;
    category?: string;
    itinerarySummary?: Array<{ day: number; title: string; description?: string }>;
    includedSummary?: string[];
    excludedSummary?: string[];
    priceSummary?: { basePrice?: number; currency?: string };
  };
  statusHistory?: AdminBookingStatusHistoryItem[];
  cancellationRequest?: AdminBookingCancellationRequest;
  emailsSent?: string[];
}

export interface InboxCountsDto {
  pending: number;
  confirmed: number;
  rejected: number;
  expired: number;
  cancelled: number;
  completed: number;
  cancellationRequests: number;
  total: number;
}

export interface BulkActionResultDto {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  errors: Record<string, string>;
}

export interface EmailOutboxItem {
  id: string;
  websiteId: string;
  recipientEmail: string;
  recipientName?: string;
  template: string;
  subject: string;
  status: "Queued" | "Processing" | "Sent" | "Failed";
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: string;
  sentAt?: string;
  lastError?: string;
  createdAt: string;
}

export interface ActionTokenVerifyResult {
  valid: boolean;
  bookingId?: string;
  reference?: string;
  action?: "approve" | "reject" | string;
  guestName?: string;
  tourTitle?: string;
  expiresAt?: string;
  warning?: string;
  reason?: string;
}

export interface ActionTokenExecuteResult {
  success: boolean;
  action: string;
  bookingId: string;
  reference: string;
  status: string;
  message: string;
}

export interface AdminTour {
  id: string;
  _id?: string;
  tourNumericId?: number;
  name: string;
  slug?: string;
  description: string;
  category: string;
  destination?: string;
  location?: string;
  price: number;
  discountedPrice?: number;
  duration: string;
  difficulty?: string;
  maxGroupSize?: number;
  rating?: number;
  reviews?: number;
  image: string;
  featured?: boolean;
  popular?: boolean;
  highlights?: string[];
  included?: string[];
  excluded?: string[];
  itinerary?: Array<{ day: number; title: string; description: string }>;
  website?: string;
}

export interface AdminAnalyticsData {
  websiteId: string;
  totalRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  bookingsByStatus: Array<{ status: string; count: number; revenue: number }>;
  toursByCategory: Array<{ category: string; count: number }>;
  topTours: Array<{ name: string; bookingsCount: number; revenue: number }>;
  revenueOverTime: Array<{ period: string; bookings: number; revenue: number }>;
}

export const ADMIN_SITE_NAMES: Record<AdminSiteId, { label: string; hostname: string; color: string; id: string }> = {
  gujjutours: { label: "Gujju Tours", hostname: "www.gujjutours.com", color: "#E05A1F", id: "gujjutours" },
  tripgoasia: { label: "TripGo Asia", hostname: "www.tripgoasia.com", color: "#0D9488", id: "tripgoasia" },
  technoheaven: { label: "Technoheaven", hostname: "stagingb2b.technoheaven.com", color: "#2563EB", id: "technoheaven" },
  website1: { label: "Gujju Tours", hostname: "www.gujjutours.com", color: "#E05A1F", id: "gujjutours" },
  website2: { label: "TripGo Asia", hostname: "www.tripgoasia.com", color: "#0D9488", id: "tripgoasia" },
  website3: { label: "Technoheaven", hostname: "stagingb2b.technoheaven.com", color: "#2563EB", id: "technoheaven" },
};

const TOKEN_KEY = "admin_token";
const USER_KEY = "admin_user";
const SITE_KEY = "admin_site";
const SESSION_CHANGE_EVENT = "admin-session-change";

// In-memory active site holder for client-side synchronous lookups
let inMemoryActiveSite: AdminSiteId | null = null;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number = 86400): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAdminSite(): AdminSiteId {
  if (inMemoryActiveSite) {
    return inMemoryActiveSite;
  }
  if (typeof window !== "undefined") {
    // 1. Check cookie set by middleware or AdminProvider
    const cookieSite = getCookie("admin_active_site");
    if (cookieSite && (ADMIN_SITE_NAMES as Record<string, unknown>)[cookieSite]) {
      return cookieSite as AdminSiteId;
    }

    // 2. Resolve from hostname if domain is specific
    const siteFromHost = resolveSiteFromHost(window.location.hostname);
    if (siteFromHost && ADMIN_SITE_NAMES[siteFromHost.siteId as AdminSiteId]) {
      return siteFromHost.siteId as AdminSiteId;
    }

    // 3. Stored in localStorage
    const stored = localStorage.getItem(SITE_KEY);
    if (stored && (ADMIN_SITE_NAMES as Record<string, unknown>)[stored]) {
      return stored as AdminSiteId;
    }
  }

  // 4. Default from ENV
  if (ENV.siteId && (ADMIN_SITE_NAMES as Record<string, unknown>)[ENV.siteId]) {
    return ENV.siteId as AdminSiteId;
  }

  return "tripgoasia";
}

export function setAdminSite(site: AdminSiteId): void {
  inMemoryActiveSite = site;
  if (typeof window !== "undefined") {
    localStorage.setItem(SITE_KEY, site);
    localStorage.setItem("adminWebsiteId", site);
    setCookie("admin_active_site", site);
    window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT));
  }
}

export function getAdminToken(siteId?: AdminSiteId): string | null {
  if (typeof window === "undefined") return null;
  const s = siteId || getAdminSite();
  // Check site-prefixed cookie first, then localStorage
  const cookieToken = getCookie(`admin_token_${s}`);
  if (cookieToken) return cookieToken;

  return localStorage.getItem(`admin_token_${s}`) || localStorage.getItem(TOKEN_KEY);
}

export function getAdminUser(siteId?: AdminSiteId): AdminUser | null {
  if (typeof window === "undefined") return null;
  const s = siteId || getAdminSite();

  // Check site-prefixed cookie first
  const cookieUserRaw = getCookie(`admin_user_${s}`);
  if (cookieUserRaw) {
    try {
      return JSON.parse(cookieUserRaw) as AdminUser;
    } catch {
      // Fall through to localStorage
    }
  }

  const raw = localStorage.getItem(`admin_user_${s}`) || localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function setAdminSession(token: string, user: AdminUser, site?: AdminSiteId): void {
  if (typeof window === "undefined") return;
  const s = site || getAdminSite();

  // Store in site-prefixed localStorage
  localStorage.setItem(`admin_token_${s}`, token);
  localStorage.setItem(`admin_user_${s}`, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem("adminLoggedIn", "true");
  localStorage.setItem(SITE_KEY, s);
  localStorage.setItem("adminWebsiteId", s);

  // Store in site-prefixed cookies (86400s = 24h)
  setCookie(`admin_token_${s}`, token, 86400);
  setCookie(`admin_user_${s}`, JSON.stringify(user), 86400);
  setCookie("admin_active_site", s, 86400);

  inMemoryActiveSite = s;
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT));
}

export function clearAdminSession(siteId?: AdminSiteId): void {
  if (typeof window === "undefined") return;
  const s = siteId || getAdminSite();

  // Call Next.js route handler in background to expire server cookies
  try {
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: s }),
    }).catch(() => { });
  } catch {
    // Ignore background fetch error
  }

  // Remove site-prefixed localStorage items
  localStorage.removeItem(`admin_token_${s}`);
  localStorage.removeItem(`admin_user_${s}`);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("adminLoggedIn");

  // Remove site-prefixed cookies
  deleteCookie(`admin_token_${s}`);
  deleteCookie(`admin_user_${s}`);

  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT));
}

export function onAdminSessionChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => { };
  window.addEventListener(SESSION_CHANGE_EVENT, cb);
  return () => window.removeEventListener(SESSION_CHANGE_EVENT, cb);
}

export function getAdminHostname(siteId?: AdminSiteId): string {
  const s = siteId || getAdminSite();
  if (ADMIN_SITE_NAMES[s]?.hostname) {
    return ADMIN_SITE_NAMES[s].hostname;
  }
  const siteDef = getSiteById(s);
  return siteDef?.backendHostname || "www.tripgoasia.com";
}

// ─── Network Engine ─────────────────────────────────────────────────────────

async function adminRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  siteId?: AdminSiteId
): Promise<T> {
  const s = siteId || getAdminSite();
  const token = getAdminToken(s);
  const hostname = getAdminHostname(s);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Website-Hostname": hostname,
    "X-Website-Id": s,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: unknown) {
    const msg = netErr instanceof Error ? netErr.message : "Network error";
    throw new Error(
      `Network connection to API server failed (${url}): ${msg}. Please ensure backend is running on port 5000.`
    );
  }

  if (res.status === 401) {
    clearAdminSession(s);
    if (typeof window !== "undefined" && window.location.pathname !== "/admin/login") {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/admin/login?returnUrl=${returnUrl}`;
    }
    throw new Error("Admin session expired. Please log in again.");
  }

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(`Server returned invalid response (Status ${res.status})`);
  }

  if (!res.ok) {
    let errorMsg =
      typeof json.error === "string"
        ? json.error
        : typeof json.message === "string"
          ? json.message
          : `Request failed with status ${res.status}`;

    if (
      errorMsg.includes("CompositeServerSelector") ||
      errorMsg.includes("TimeoutException") ||
      errorMsg.includes("selecting a server") ||
      errorMsg.includes("HeartbeatException") ||
      errorMsg.includes("ReplicaSet")
    ) {
      errorMsg = "Database server is temporarily unreachable or timed out. Operating in offline fallback mode.";
    }

    throw new Error(errorMsg);
  }

  return json as unknown as T;
}

// ─── Admin Methods ──────────────────────────────────────────────────────────

export async function adminLoginApi(
  email: string,
  password: string,
  siteId: AdminSiteId
): Promise<{ token: string; user: AdminUser }> {
  const hostname = getAdminHostname(siteId);

  // Call Next.js route handler which safely manages httpOnly site-prefixed cookies
  let res: Response;
  try {
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), password, siteId }),
    });
  } catch {
    // Fallback directly to backend if route handler is not reachable
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Website-Hostname": hostname,
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  }

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(`Server returned invalid response (Status ${res.status})`);
  }

  console.log(`[DEBUG] adminLoginApi response: status=${res.status}, keys=${Object.keys(data).join(", ")}`);

  if (!res.ok) {
    const errorMsg =
      typeof data.error === "string"
        ? data.error
        : typeof data.message === "string"
          ? data.message
          : res.status === 401
            ? "Invalid email or password"
            : res.status === 429
              ? "Too many login attempts. Please wait a minute and try again."
              : `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  const payload = (data.data || data) as {
    token?: string;
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      websiteId?: string;
      status?: string;
    };
  } | undefined;

  // Case-insensitive role check
  const roleLower = (payload?.user?.role || "").toLowerCase();
  if (roleLower !== "admin" && roleLower !== "superadmin") {
    throw new Error("Access denied: This account does not possess administrator privileges.");
  }

  if (!payload?.token || !payload.user) {
    throw new Error("Invalid authentication payload received from server.");
  }

  const user: AdminUser = {
    id: payload.user.id,
    name: payload.user.name,
    email: payload.user.email,
    role: (roleLower === "superadmin" ? "SuperAdmin" : "Admin") as "Admin" | "SuperAdmin",
    websiteId: payload.user.websiteId || siteId,
    status: payload.user.status,
  };

  setAdminSession(payload.token, user, siteId);
  return { token: payload.token, user };
}

export async function fetchAdminStats(siteId?: AdminSiteId): Promise<AdminStats> {
  const res = await adminRequest<{ success: boolean; data: AdminStats }>("/api/admin/stats", {}, siteId);
  return res.data;
}

export async function fetchAdminAnalytics(siteId?: AdminSiteId): Promise<AdminAnalyticsData> {
  const res = await adminRequest<{ success: boolean; data: AdminAnalyticsData }>("/api/admin/analytics", {}, siteId);
  return res.data;
}

export async function fetchAdminTours(
  params?: { category?: string; page?: number; limit?: number },
  siteId?: AdminSiteId
): Promise<AdminTour[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "all") query.append("category", params.category);
  if (params?.page) query.append("page", params.page.toString());
  query.append("pageSize", (params?.limit || 200).toString());
  query.append("limit", (params?.limit || 200).toString());

  const res = await adminRequest<any>(`/api/tours?${query.toString()}`, {}, siteId);
  const items = Array.isArray(res) ? res : (res.items || res.data || []);
  return items.map((t: any) => ({
    ...t,
    id: t.id !== undefined ? String(t.id) : (t._id || ""),
    name: t.name || t.title || "Tour Package",
    title: t.title || t.name || "Tour Package",
    category: t.category || "General",
    description: t.description || "",
    duration: t.duration || "1 Day",
    price: typeof t.price === "number" ? t.price : (Number(t.price) || 0),
    discountedPrice: t.discountedPrice ? Number(t.discountedPrice) : undefined,
    image: t.image || (Array.isArray(t.images) && t.images[0]) || "",
    destination: typeof t.destination === "string" ? t.destination : (t.destination?.cityName || t.location || ""),
  }));
}

export async function createAdminTour(tour: Partial<AdminTour>, siteId?: AdminSiteId): Promise<AdminTour> {
  const res = await adminRequest<{ success: boolean; data: AdminTour }>(
    "/api/tours",
    {
      method: "POST",
      body: JSON.stringify(tour),
    },
    siteId
  );
  return res.data;
}

export async function updateAdminTour(id: string, tour: Partial<AdminTour>, siteId?: AdminSiteId): Promise<AdminTour> {
  const res = await adminRequest<{ success: boolean; data: AdminTour }>(
    `/api/tours/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(tour),
    },
    siteId
  );
  return res.data;
}

export async function toggleAdminTour(
  id: string,
  property: "featured" | "popular",
  value: boolean,
  siteId?: AdminSiteId
): Promise<void> {
  await adminRequest(
    `/api/tours/${id}/toggle`,
    {
      method: "PATCH",
      body: JSON.stringify({ property, value }),
    },
    siteId
  );
}

export async function deleteAdminTour(id: string, siteId?: AdminSiteId): Promise<void> {
  await adminRequest(
    `/api/tours/${id}`,
    {
      method: "DELETE",
    },
    siteId
  );
}

export async function fetchAdminBookings(
  params?: { status?: string; search?: string },
  siteId?: AdminSiteId
): Promise<AdminBooking[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.append("status", params.status);
  if (params?.search) query.append("search", params.search);

  const res = await adminRequest<{ success: boolean; data: AdminBooking[] }>(
    `/api/bookings?${query.toString()}`,
    {},
    siteId
  );
  return (res.data || []).map((b) => ({
    ...b,
    id: b.id || b._id || "",
  }));
}

export async function updateAdminBookingStatus(id: string, status: string, siteId?: AdminSiteId): Promise<void> {
  await adminRequest(
    `/api/bookings/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    },
    siteId
  );
}

export async function deleteAdminBooking(id: string, siteId?: AdminSiteId): Promise<void> {
  await adminRequest(
    `/api/bookings/${id}`,
    {
      method: "DELETE",
    },
    siteId
  );
}

export async function fetchAdminUsers(siteId?: AdminSiteId): Promise<AdminUser[]> {
  const res = await adminRequest<{ success: boolean; data: AdminUser[] }>("/api/users", {}, siteId);
  return res.data || [];
}

export async function updateAdminUserRole(id: string, role: string, siteId?: AdminSiteId): Promise<void> {
  await adminRequest(
    `/api/users/${id}/role`,
    {
      method: "PUT",
      body: JSON.stringify({ role }),
    },
    siteId
  );
}

export async function updateAdminUserStatus(id: string, isDisabled: boolean, siteId?: AdminSiteId): Promise<void> {
  await adminRequest(
    `/api/users/${id}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ isDisabled }),
    },
    siteId
  );
}

export async function deleteAdminUser(id: string, siteId?: AdminSiteId): Promise<void> {
  await adminRequest(
    `/api/users/${id}`,
    {
      method: "DELETE",
    },
    siteId
  );
}

// ─── Booking Workflow & Confirmation Methods ────────────────────────────────

export async function fetchAdminInboxCounts(siteId?: AdminSiteId): Promise<InboxCountsDto> {
  const res = await adminRequest<{ success: boolean; data: InboxCountsDto }>(
    "/api/bookings/inbox/counts",
    {},
    siteId
  );
  return (
    res.data || {
      pending: 0,
      confirmed: 0,
      rejected: 0,
      expired: 0,
      cancelled: 0,
      completed: 0,
      cancellationRequests: 0,
      total: 0,
    }
  );
}

export async function confirmAdminBooking(
  id: string,
  adminNote?: string,
  siteId?: AdminSiteId
): Promise<AdminBooking> {
  const res = await adminRequest<{ success: boolean; data: AdminBooking }>(
    `/api/bookings/${encodeURIComponent(id)}/confirm`,
    {
      method: "POST",
      body: JSON.stringify({ note: adminNote || "", adminNote: adminNote || "" }),
    },
    siteId
  );
  return res.data;
}

export async function rejectAdminBooking(
  id: string,
  reason: string,
  siteId?: AdminSiteId
): Promise<AdminBooking> {
  const res = await adminRequest<{ success: boolean; data: AdminBooking }>(
    `/api/bookings/${encodeURIComponent(id)}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
    siteId
  );
  return res.data;
}

export async function cancelAdminBooking(
  id: string,
  reason: string,
  siteId?: AdminSiteId
): Promise<AdminBooking> {
  const res = await adminRequest<{ success: boolean; data: AdminBooking }>(
    `/api/bookings/${encodeURIComponent(id)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
    siteId
  );
  return res.data;
}

export async function bulkConfirmAdminBookings(
  bookingIds: string[],
  siteId?: AdminSiteId
): Promise<BulkActionResultDto> {
  const res = await adminRequest<{ success: boolean; data: BulkActionResultDto }>(
    "/api/bookings/bulk-confirm",
    {
      method: "POST",
      body: JSON.stringify({ bookingIds }),
    },
    siteId
  );
  return res.data;
}

export async function bulkRejectAdminBookings(
  bookingIds: string[],
  reason: string,
  siteId?: AdminSiteId
): Promise<BulkActionResultDto> {
  const res = await adminRequest<{ success: boolean; data: BulkActionResultDto }>(
    "/api/bookings/bulk-reject",
    {
      method: "POST",
      body: JSON.stringify({ bookingIds, reason }),
    },
    siteId
  );
  return res.data;
}

export async function resendAdminBookingEmail(
  id: string,
  template?: string,
  siteId?: AdminSiteId
): Promise<{ success: boolean; message: string }> {
  const query = template ? `?template=${encodeURIComponent(template)}` : "";
  const res = await adminRequest<{ success: boolean; message: string }>(
    `/api/bookings/${encodeURIComponent(id)}/resend-email${query}`,
    {
      method: "POST",
    },
    siteId
  );
  return res;
}

export async function fetchBookingOutbox(
  id: string,
  siteId?: AdminSiteId
): Promise<EmailOutboxItem[]> {
  const res = await adminRequest<{ success: boolean; data: EmailOutboxItem[] }>(
    `/api/bookings/${encodeURIComponent(id)}/outbox`,
    {},
    siteId
  );
  return res.data || [];
}

export async function reviewCancellationRequest(
  id: string,
  approve: boolean,
  adminNote?: string,
  siteId?: AdminSiteId
): Promise<AdminBooking> {
  const res = await adminRequest<{ success: boolean; data: AdminBooking }>(
    `/api/bookings/${encodeURIComponent(id)}/review-cancellation`,
    {
      method: "POST",
      body: JSON.stringify({ approve, adminNote: adminNote || "" }),
    },
    siteId
  );
  return res.data;
}

export async function verifyActionToken(
  token: string,
  siteId?: AdminSiteId
): Promise<ActionTokenVerifyResult> {
  const s = siteId || getAdminSite();
  const hostname = getAdminHostname(s);
  const url = `${API_BASE}/api/bookings/action-token/verify?token=${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Website-Hostname": hostname,
      "X-Website-Id": s,
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      valid: false,
      reason: json.error || json.reason || `Verification failed with status ${res.status}`,
    };
  }

  return (json.data ?? json) as ActionTokenVerifyResult;
}

export async function executeActionToken(
  token: string,
  reason?: string,
  action?: string,
  siteId?: AdminSiteId
): Promise<ActionTokenExecuteResult> {
  const s = siteId || getAdminSite();
  const hostname = getAdminHostname(s);
  const url = `${API_BASE}/api/bookings/action-token/execute`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Website-Hostname": hostname,
      "X-Website-Id": s,
    },
    body: JSON.stringify({ token, action: action || "", reason: reason || "" }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || json.message || `Execution failed with status ${res.status}`);
  }

  return (json.data ?? json) as ActionTokenExecuteResult;
}

// ─── User Bookings & Password Management ────────────────────────────────────

export async function fetchAdminUserBookings(
  userId: string,
  siteId?: AdminSiteId
): Promise<AdminBooking[]> {
  const res = await adminRequest<{ success: boolean; data: AdminBooking[] }>(
    `/api/users/${encodeURIComponent(userId)}/bookings`,
    {},
    siteId
  );
  return res.data || [];
}

export async function resetAdminUserPassword(
  userId: string,
  newPassword: string,
  siteId?: AdminSiteId
): Promise<{ success: boolean; message: string }> {
  return await adminRequest<{ success: boolean; message: string }>(
    `/api/users/${encodeURIComponent(userId)}/reset-password`,
    {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    },
    siteId
  );
}

// ─── Multi-Module Catalog Management ────────────────────────────────────────

export interface AdminCatalogResult<T = any> {
  success: boolean;
  module: string;
  data: T[];
  items?: T[];
  total: number;
  page: number;
  pageSize: number;
}

const DEDICATED_API_MODULES = new Set(["banners", "offers", "videos", "reviews", "faqs", "partners", "pages"]);

function getModuleEndpoint(module: string, id?: string): string {
  const mod = module.trim().toLowerCase();
  const base = DEDICATED_API_MODULES.has(mod) ? `/api/${mod}` : `/api/admin/catalog/${encodeURIComponent(mod)}`;
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

export async function fetchAdminCatalog(
  module: string,
  params?: { search?: string; category?: string; page?: number; limit?: number },
  siteId?: AdminSiteId
): Promise<AdminCatalogResult> {
  const mod = module.trim().toLowerCase();
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.category && params.category !== "all") query.append("category", params.category);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("pageSize", params.limit.toString());
  query.append("activeOnly", "false");

  const endpoint = getModuleEndpoint(mod);
  const res = await adminRequest<any>(
    `${endpoint}?${query.toString()}`,
    {},
    siteId
  );

  const items = Array.isArray(res) ? res : (res.data || res.items || []);
  const count = typeof res.count === "number" ? res.count : (res.total || items.length);

  return {
    success: true,
    module: mod,
    data: items,
    items,
    total: count,
    page: params?.page || 1,
    pageSize: params?.limit || items.length,
  };
}

export async function fetchAdminCatalogItem<T = any>(
  module: string,
  id: string,
  siteId?: AdminSiteId
): Promise<T> {
  const endpoint = getModuleEndpoint(module, id);
  const res = await adminRequest<{ success: boolean; data: T }>(
    endpoint,
    {},
    siteId
  );
  return res.data;
}

export async function createAdminCatalogItem<T = any>(
  module: string,
  item: any,
  siteId?: AdminSiteId
): Promise<T> {
  const endpoint = getModuleEndpoint(module);
  const res = await adminRequest<{ success: boolean; data: T }>(
    endpoint,
    {
      method: "POST",
      body: JSON.stringify(item),
    },
    siteId
  );
  return res.data;
}

export async function updateAdminCatalogItem<T = any>(
  module: string,
  id: string,
  item: any,
  siteId?: AdminSiteId
): Promise<T> {
  const endpoint = getModuleEndpoint(module, id);
  const res = await adminRequest<{ success: boolean; data: T }>(
    endpoint,
    {
      method: "PUT",
      body: JSON.stringify(item),
    },
    siteId
  );
  return res.data;
}

export async function deleteAdminCatalogItem(
  module: string,
  id: string,
  siteId?: AdminSiteId
): Promise<void> {
  const endpoint = getModuleEndpoint(module, id);
  await adminRequest(
    endpoint,
    {
      method: "DELETE",
    },
    siteId
  );
}

export async function toggleAdminCatalogItem(
  module: string,
  id: string,
  siteId?: AdminSiteId
): Promise<any> {
  const endpoint = getModuleEndpoint(module, id);
  return await adminRequest(
    `${endpoint}/toggle-active`,
    {
      method: "PUT",
    },
    siteId
  );
}

export async function reorderAdminCatalog(
  module: string,
  orderedIds: string[],
  siteId?: AdminSiteId
): Promise<any> {
  const endpoint = `${getModuleEndpoint(module)}/reorder`;
  return await adminRequest(
    endpoint,
    {
      method: "PUT",
      body: JSON.stringify(orderedIds),
    },
    siteId
  );
}

export async function uploadAdminCatalogImage(
  file: File,
  siteId?: AdminSiteId
): Promise<{ url: string; fileName: string }> {
  const s = siteId || getAdminSite();
  const token = getAdminToken(s);
  const hostname = getAdminHostname(s);

  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {
    "X-Website-Hostname": hostname,
    "X-Website-Id": s,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/admin/catalog/upload-image`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed with status ${res.status}`);
  }

  const json = await res.json();
  return json;
}

// ─── Website Settings Management ────────────────────────────────────────────

export async function fetchAdminWebsiteConfig(
  hostname?: string,
  siteId?: AdminSiteId
): Promise<any> {
  const s = siteId || getAdminSite();
  const host = hostname || getAdminHostname(s);
  try {
    const res = await adminRequest<{ success: boolean; config: any }>(
      `/api/admin/website-config/${encodeURIComponent(host)}`,
      {},
      s
    );
    return res.config;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404") || msg.includes("not found") || msg.includes("No dynamic config")) {
      return null;
    }
    throw err;
  }
}

export async function updateAdminWebsiteConfig(
  hostname: string,
  config: any,
  siteId?: AdminSiteId
): Promise<{ success: boolean; hostname: string }> {
  const s = siteId || getAdminSite();
  return await adminRequest<{ success: boolean; hostname: string }>(
    `/api/admin/website-config/${encodeURIComponent(hostname)}`,
    {
      method: "PUT",
      body: JSON.stringify(config),
    },
    s
  );
}

export async function fetchAdminFeatures(
  hostname?: string,
  siteId?: AdminSiteId
): Promise<any> {
  const s = siteId || getAdminSite();
  const host = hostname || getAdminHostname(s);
  try {
    const res = await adminRequest<any>(
      `/api/admin/website-config/${encodeURIComponent(host)}/features`,
      {},
      s
    );
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404") || msg.includes("not found")) {
      return null;
    }
    throw err;
  }
}

export async function updateAdminFeatures(
  hostname: string,
  features: any,
  siteId?: AdminSiteId
): Promise<any> {
  const s = siteId || getAdminSite();
  return await adminRequest<any>(
    `/api/admin/website-config/${encodeURIComponent(hostname)}/features`,
    {
      method: "PUT",
      body: JSON.stringify(features),
    },
    s
  );
}


