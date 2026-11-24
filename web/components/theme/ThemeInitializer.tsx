"use client";

import { useEffect } from "react";

interface ThemeInitializerProps {
  siteId: string;
  defaultMode?: string;
}

export function ThemeInitializer({
  siteId,
  defaultMode = "light",
}: ThemeInitializerProps) {
  useEffect(() => {
    try {
      const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)theme_${siteId}=([^;]+)`)
      );
      const mode = match ? match[1] : defaultMode;
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    } catch {
      // Ignore in non-browser environments
    }
  }, [siteId, defaultMode]);

  return null;
}
