"use client";

export interface FloatingWhatsAppButtonProps {
  siteId?: string;
  phone?: string;
  label?: string;
}

/**
 * FloatingWhatsAppButton
 * 
 * Note: Floating WhatsApp support is globally handled by `FloatingWhatsApp` in `Footer.tsx`
 * across all pages. This component renders null to prevent duplicate stacked buttons on home.
 */
export default function FloatingWhatsAppButton(_props?: FloatingWhatsAppButtonProps) {
  return null;
}
