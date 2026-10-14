import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { DevBanner } from "@/components/DevBanner";
import { ENV } from "@/lib/env";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Travel Platform | Multi-Tenant Tours & Safaris",
  description: "Curated tours, wildlife safaris, and beach getaways across Gujju Tours, TripGo Asia, and Technoheaven.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={ENV.defaultLang} className={playfair.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <DevBanner />
        {children}
      </body>
    </html>
  );
}
