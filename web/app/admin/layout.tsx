import { headers, cookies } from "next/headers";
import { getSiteById, isValidSiteId, SITE_REGISTRY, type SiteDefinition } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";
import { AdminProvider } from "@/lib/AdminContext";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = {
  title: "Admin Portal | Multi-Tenant Management",
  description: "Administrative console for tours, bookings, and site analytics.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const activeCookie = cookieStore.get("admin_active_site")?.value;

  const siteId =
    activeCookie && isValidSiteId(activeCookie)
      ? activeCookie
      : headerList.get("x-site-id") || ENV.siteId || "gujjutours";

  const siteDef: SiteDefinition = getSiteById(siteId) || SITE_REGISTRY.gujjutours;

  return (
    <AdminProvider site={siteDef}>
      <AdminLayoutClient siteDef={siteDef}>{children}</AdminLayoutClient>
    </AdminProvider>
  );
}