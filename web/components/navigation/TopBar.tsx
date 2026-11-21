"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import type { SiteConfig } from "@/lib/config/siteConfigSchema";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface TopBarProps {
  config?: MergedWebsiteConfig | SiteConfig | any;
  isAdminLoggedIn?: boolean;
}

export default function TopBar({ config, isAdminLoggedIn }: TopBarProps) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("EN");

  const phone =
    config?.websiteContact?.phone ||
    config?.content?.contact?.phone ||
    config?.contact?.phone ||
    "+91 9875095616";
  const email =
    config?.websiteContact?.email ||
    config?.content?.contact?.email ||
    config?.contact?.email ||
    "booking@gujjutours.com";

  // Dynamic languages from SiteConfig site.languages or fallback
  const siteLangs = config?.site?.languages;
  const legacyLangs = Array.isArray(config?.dynamic?.websiteLaunguage)
    ? config.dynamic.websiteLaunguage
    : [];

  const availableLangs =
    Array.isArray(siteLangs) && siteLangs.length > 0
      ? siteLangs.map((l: any) => ({
          code: String(l.code || "en").toUpperCase(),
          name: String(l.name || "English"),
        }))
      : legacyLangs.length > 0
        ? legacyLangs.map((l: any) => ({
            code: String(l.code || "en").toUpperCase(),
            name: String(l.name || "English"),
          }))
        : [
            { code: "EN", name: "English" },
            { code: "GU", name: "Gujarati" },
            { code: "HI", name: "Hindi" },
          ];

  return (
    <div className="bg-surface-2 text-foreground-muted text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 border-b border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Contact Info */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="flex items-center gap-1.5 text-foreground-muted hover:text-primary transition-colors truncate"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
              />
            </svg>
            <span className="font-medium text-foreground truncate">{phone}</span>
          </a>

          <a
            href={`mailto:${email}`}
            className="hidden sm:flex items-center gap-1.5 text-foreground-muted hover:text-primary transition-colors truncate"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
            <span className="font-medium text-foreground truncate">{email}</span>
          </a>
        </div>

        {/* Right: Language, Appearance Toggle & Admin */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isAdminLoggedIn && (
            <Link
              href="/admin"
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white tracking-wide shadow-sm"
            >
              Admin Console
            </Link>
          )}

          {/* Language Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-surface-3"
              aria-label="Select Language"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-4 h-4 text-foreground-muted"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
              <span className="font-semibold text-xs tracking-wider">
                {selectedLang}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className={`w-3 h-3 transition-transform text-foreground-muted ${
                  langMenuOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-32 bg-surface text-foreground rounded-xl shadow-soft-lg border border-border py-1 z-50">
                {availableLangs.map((lang: any) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-surface-2 transition-colors ${
                      selectedLang === lang.code
                        ? "text-primary font-bold bg-primary-light"
                        : "text-foreground"
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-[10px] text-foreground-muted uppercase">
                      {lang.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Site-Scoped Persistent Theme Toggle */}
          <ThemeToggle className="w-8 h-8 !rounded-lg" />
        </div>
      </div>
    </div>
  );
}
