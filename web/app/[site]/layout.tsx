import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { DynamicFontLoader } from "@/components/DynamicFontLoader";
import { GoogleFontLoader } from "@/components/GoogleFontLoader";
import { ThemeStyleInjector } from "@/components/ThemeStyleInjector";
import { SiteConfigProvider } from "@/lib/SiteConfigContext";
import { SiteProvider } from "@/lib/SiteContext";
import { fetchSiteConfig } from "@/lib/api";
import { mergeWebsiteConfig, type MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import { getSiteById, type SiteDefinition } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

type Props = {
  children: React.ReactNode;
  params: Promise<{ site: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site } = await params;
  const siteDef = getSiteById(site);

  if (!siteDef) {
    return {
      title: "Travel Platform",
      description: "Explore curated travel experiences.",
    };
  }

  return {
    title: `${siteDef.displayName} | Curated Travel Experiences`,
    description: `Explore premium hand-crafted tours, safaris, and beach vacations with ${siteDef.displayName}.`,
    icons: {
      icon: "/favicon.ico",
    },
  };
}

function ConfigErrorPanel({
  siteDef,
  error,
}: {
  siteDef: SiteDefinition;
  error: {
    hostname: string;
    url: string;
    status: number | null;
    message: string;
  };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 p-6 font-sans">
      <div className="max-w-xl w-full rounded-2xl border border-red-500/40 bg-slate-800 p-8 shadow-2xl text-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <h1 className="text-xl font-bold text-red-400">
              Failed to load website configuration
            </h1>
            <p className="text-xs text-slate-400">
              Could not retrieve dynamic website configuration from the API for {siteDef.displayName}.
            </p>
          </div>
        </div>

        <dl className="text-xs space-y-2 font-mono bg-slate-950 p-4 rounded-xl border border-slate-700/60 mb-6 text-slate-300">
          <div>
            <dt className="text-slate-500 font-semibold">Active Site ID</dt>
            <dd className="text-emerald-400 font-bold">{siteDef.siteId}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-semibold">Target Backend Hostname</dt>
            <dd className="text-sky-300">{siteDef.backendHostname}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-semibold">API Endpoint</dt>
            <dd className="text-amber-300 break-all">{error.url || ENV.apiUrl}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-semibold">HTTP Status</dt>
            <dd className="text-red-400">{error.status ?? "Network Error"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-semibold">Error Details</dt>
            <dd className="text-slate-200">{error.message}</dd>
          </div>
        </dl>

        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            ↻ Retry Request
          </Link>
          <span className="text-xs text-slate-400">
            Ensure {ENV.apiUrl} is reachable.
          </span>
        </div>
      </div>
    </main>
  );
}

export default async function SiteLayout({ children, params }: Props) {
  const { site } = await params;

  // Validate site parameter matches known brand in siteRegistry
  const siteDef = getSiteById(site);
  if (!siteDef) {
    notFound();
  }

  let config: MergedWebsiteConfig;

  try {
    const dynamicConfig = await fetchSiteConfig(siteDef, ENV.defaultLang);
    config = mergeWebsiteConfig(null, dynamicConfig);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return (
      <ConfigErrorPanel
        siteDef={siteDef}
        error={{
          hostname: siteDef.backendHostname,
          url: `${ENV.apiUrl}/api/core/v1/config/${encodeURIComponent(siteDef.backendHostname)}?lang=${ENV.defaultLang}`,
          status: 502,
          message: errorMsg,
        }}
      />
    );
  }

  return (
    <SiteProvider site={siteDef}>
      <SiteConfigProvider config={config}>
        <ThemeStyleInjector config={config} />
        <DynamicFontLoader font={config.dynamic?.font ?? null} />
        <GoogleFontLoader config={config} />
        <Navigation config={config} />
        <div className="flex-1">{children}</div>
        <Footer config={config} />
      </SiteConfigProvider>
    </SiteProvider>
  );
}