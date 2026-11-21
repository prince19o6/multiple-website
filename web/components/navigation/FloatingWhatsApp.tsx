"use client";

import React, { useState, useEffect } from "react";
import { useOptionalSite } from "@/lib/SiteContext";

interface FloatingWhatsAppProps {
  config?: any;
  phone?: string;
  siteName?: string;
}

export default function FloatingWhatsApp({
  config,
  phone: propPhone,
  siteName: customSiteName,
}: FloatingWhatsAppProps) {
  const [mounted, setMounted] = useState(false);
  const siteDef = useOptionalSite();

  useEffect(() => {
    setMounted(true);
  }, []);

  const contextSiteId = siteDef?.siteId || "gujjutours";
  const contextSiteName = siteDef?.displayName || "Gujju Tours";

  const siteId = config?.site?.id || contextSiteId;
  const isTripGo = siteId === "tripgoasia" || siteId === "website2";
  const isTechno = siteId === "technoheaven" || siteId === "website3";

  const siteName =
    customSiteName ||
    config?.site?.fullName ||
    config?.site?.name ||
    (isTripGo ? "TripGo Asia" : isTechno ? "Techno B2B" : contextSiteName);

  // Default support numbers per tenant
  const defaultNumber = isTripGo
    ? "+60 174969786"
    : isTechno
    ? "+971 42686884"
    : "+91 9327682026";

  const rawPhone =
    propPhone ||
    config?.websiteContact?.whatsapp ||
    config?.content?.contact?.whatsapp ||
    config?.contact?.whatsapp ||
    config?.websiteContact?.phone ||
    config?.content?.contact?.phone ||
    config?.contact?.phone ||
    defaultNumber;

  const cleanPhone = rawPhone.replace(/[^0-9]/g, "");

  const prefilledMessage = encodeURIComponent(
    isTripGo
      ? `Hello ${siteName}! I would like to inquire about tours, activities and airport transfers in Southeast Asia.`
      : isTechno
      ? `Hello ${siteName}! I am looking for corporate rates, agency portal access and B2B travel bookings.`
      : `Hello ${siteName}! I am planning a trip and need assistance with hotels, custom holiday packages and visa services.`
  );

  const waUrl = `https://wa.me/${cleanPhone}?text=${prefilledMessage}`;

  if (!mounted) return null;

  return (
    <aside
      aria-label="WhatsApp live chat support"
      className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end select-none pointer-events-auto"
    >
      {/* Main Floating Action Pill */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with ${siteName} concierge on WhatsApp`}
        className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 group relative min-h-[40px] sm:min-h-[44px]"
      >
        {/* Soft radar pulse wave */}
        <span className="animate-ping absolute -inset-0.5 rounded-full bg-[#25D366] opacity-30 pointer-events-none" />

        {/* Official WhatsApp SVG Logo */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 shrink-0 transition-transform group-hover:scale-110"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>

        {/* Pill Label */}
        <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap pr-0.5">
          Chat with us
        </span>

        {/* Live Online Green Dot */}
        <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 ml-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-full w-full bg-white" />
        </span>
      </a>
    </aside>
  );
}
