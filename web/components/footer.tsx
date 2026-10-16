import React from "react";
import Link from "next/link";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

interface FooterProps {
  config?: MergedWebsiteConfig;
}

export default function Footer({ config }: FooterProps) {
  const theme = config?.theme;
  const primary = theme?.primary || "#2563eb";
  const name = config?.name || "Tours";
  const logo = config?.logo;
  const copyright =
    config?.footerCopyright ||
    `© ${new Date().getFullYear()} ${name}. All rights reserved.`;

  const phone = config?.contact?.phone;
  const email = config?.contact?.email;
  const address = config?.contact?.address;

  // Derive links dynamically from API config
  const navLinks = config?.headerLinks
    ? [
        ...config.headerLinks.map((l) => ({ label: l.label, href: l.href })),
        { label: "My Bookings", href: "/bookings" },
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Tours", href: "/explore" },
        { label: "My Bookings", href: "/bookings" },
        { label: "About Us", href: "/about" },
        { label: "Contact", href: "/contact" },
      ];

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={name}
                  className="h-10 w-auto object-contain max-h-12 brightness-110"
                />
              ) : (
                <div
                  className="h-10 w-10 flex items-center justify-center text-white font-bold rounded-xl text-lg shadow-sm"
                  style={{ backgroundColor: primary }}
                >
                  {name.charAt(0)}
                </div>
              )}
              <span className="font-bold text-xl text-white tracking-tight">
                {name}
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Discover unforgettable journeys and extraordinary travel experiences.
              Tailored itineraries backed by local travel experts.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/explore" className="hover:text-white transition-colors">
                  All Tours & Packages
                </Link>
              </li>
            </ul>
          </div>

          {/* Services from API Modules */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Services
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              {config?.services?.tours && <li>✓ Guided Tours</li>}
              {config?.services?.packages && <li>✓ Holiday Packages</li>}
              {config?.services?.hotels && <li>✓ Hotel Reservations</li>}
              {config?.services?.activities && <li>✓ Local Activities & Sightseeing</li>}
              {config?.services?.transfers && <li>✓ Airport & City Transfers</li>}
              {config?.services?.visa && <li>✓ Visa Assistance</li>}
            </ul>
          </div>

          {/* Contact Details from API */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Contact & Support
            </h3>
            <div className="space-y-3 text-sm text-slate-400">
              {phone && (
                <div className="flex items-start gap-2.5">
                  <span className="text-base text-slate-300">📞</span>
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="hover:text-white transition-colors"
                  >
                    {phone}
                  </a>
                </div>
              )}
              {email && (
                <div className="flex items-start gap-2.5">
                  <span className="text-base text-slate-300">✉️</span>
                  <a
                    href={`mailto:${email}`}
                    className="hover:text-white transition-colors break-all"
                  >
                    {email}
                  </a>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-2.5">
                  <span className="text-base text-slate-300">📍</span>
                  <span>{address}</span>
                </div>
              )}
              {!phone && !email && (
                <p className="text-xs text-slate-500">
                  Customer support available 24/7 for all booked tours.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{copyright}</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-slate-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/explore" className="hover:text-slate-400 transition-colors">
              Explore
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}