"use client";

import React from "react";
import Footer from "@/components/footer";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import type { SiteConfig } from "@/lib/config/siteConfigSchema";

interface FooterSectionProps {
  config?: MergedWebsiteConfig | SiteConfig | any;
  data?: any;
  component?: any;
}

export default function FooterSection({ config }: FooterSectionProps) {
  return <Footer config={config} isSection={true} />;
}

