import { headers } from "next/headers";
import { getSiteById, SITE_REGISTRY, type SiteDefinition } from "@/lib/siteRegistry";
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
  const siteId = headerList.get("x-site-id") || ENV.siteId || "tripgoasia";
  const siteDef: SiteDefinition = getSiteById(siteId) || SITE_REGISTRY.tripgoasia;

  return (
    <AdminProvider site={siteDef}>
      <AdminLayoutClient siteDef={siteDef}>{children}</AdminLayoutClient>
    </AdminProvider>
  );
}