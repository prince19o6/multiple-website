"use client";

import React, { useState, useEffect } from "react";
import { useOptionalSite } from "@/lib/SiteContext";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "pill";
}

export function ThemeToggle({
  className = "",
  variant = "icon",
}: ThemeToggleProps) {
  const site = useOptionalSite();
  const siteId = site?.siteId || "gujjutours";
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cookieName = `theme_${siteId}`;

  useEffect(() => {
    setMounted(true);
    // Read active state from documentElement class or cookie
    const hasDarkClass = document.documentElement.classList.contains("dark");
    setIsDark(hasDarkClass);
  }, [siteId]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }

    // Persist choice strictly in site-scoped cookie (1 year expiry)
    document.cookie = `${cookieName}=${nextDark ? "dark" : "light"}; path=/; max-age=31536000; SameSite=Lax`;
  };

  if (!mounted) {
    // Avoid SSR mismatch
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-border bg-surface-2 ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-surface-2 hover:bg-surface-3 text-foreground transition-all duration-200 ${className}`}
      >
        <span>{isDark ? "☀️" : "🌙"}</span>
        <span>{isDark ? "Light" : "Dark"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center border border-border bg-surface-2 hover:bg-surface-3 text-foreground-muted hover:text-foreground transition-all duration-200 shadow-soft-sm ${className}`}
    >
      {isDark ? (
        // Sun icon for dark mode (click to switch to light)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
          stroke="currentColor"
          className="w-4 h-4 text-amber-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
        </svg>
      ) : (
        // Moon icon for light mode (click to switch to dark)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
          stroke="currentColor"
          className="w-4 h-4 text-foreground"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
          />
        </svg>
      )}
    </button>
  );
}
export default ThemeToggle;
