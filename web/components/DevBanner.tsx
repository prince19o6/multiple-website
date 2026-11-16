"use client";

import { useEffect, useState } from "react";
import { ENV } from "@/lib/env";

interface HealthData {
  host: string;
  siteId: string;
  backendHostname: string;
  resolutionSource?: string;
  apiUrl: string;
  status: number;
  configOk: boolean;
  toursOk: boolean;
  latencyMs: number;
  tourCount: number;
  brandName: string;
  firstItem?: string;
  toursUrl?: string;
  resolvedWebsite?: string;
  resolvedDatabase?: string;
  resolvedHostname?: string;
  dataSource: "mongodb" | "seed-fallback" | "unknown";
  error?: string;
}

export function DevBanner() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        setLoading(true);
        const res = await fetch("/api/health", { cache: "no-store" });
        if (cancelled) return;
        const data = (await res.json()) as HealthData;
        if (!cancelled) setHealth(data);
      } catch (err) {
        if (!cancelled) {
          setHealth({
            host: typeof window !== "undefined" ? window.location.host : "localhost",
            siteId: "error",
            backendHostname: "unknown",
            resolutionSource: "error",
            apiUrl: ENV.apiUrl,
            status: 0,
            configOk: false,
            toursOk: false,
            latencyMs: 0,
            tourCount: 0,
            brandName: "Error",
            dataSource: "unknown",
            error: err instanceof Error ? err.message : "Network error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ENV.isDev) return null;

  const isHealthy = health?.configOk || health?.toursOk;
  const isSeed = health?.dataSource === "seed-fallback";

  const statusColor = loading
    ? "bg-amber-500"
    : isHealthy
      ? "bg-emerald-500"
      : "bg-red-500";

  const formatSource = (src?: string) => {
    if (src === "env") return "Direct from .env (SITE_ID)";
    if (src === "host-routing") return "Host Routing (*.localhost)";
    if (src === "production-host") return "Production Domain";
    return src || "default";
  };

  return (
    <aside
      aria-label="Development banner"
      className="fixed bottom-3 left-3 z-30 font-sans text-xs shadow-xl transition-all max-w-[calc(100vw-140px)] sm:max-w-sm pointer-events-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl">
        {/* Header Pill */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-800/80 transition-colors select-none"
        >
          <span className={`w-2.5 h-2.5 rounded-full ${statusColor} shrink-0 animate-pulse`} />
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            {health?.siteId || "..."}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 truncate max-w-[90px] sm:max-w-[130px] text-[11px]">
            {health?.host || "localhost:3000"}
          </span>

          {/* Data Source Badge */}
          {isSeed ? (
            <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
              SEED
            </span>
          ) : (
            <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {health?.toursOk ? `${health.tourCount} tours` : "offline"}
            </span>
          )}

          <span className="text-slate-400 text-[10px] ml-1">
            {expanded ? "▼" : "▲"}
          </span>
        </div>

        {/* Expanded Diagnostics Drawer */}
        {expanded && (
          <div className="border-t border-slate-800 p-3 space-y-2 bg-slate-950/70 text-[11px]">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Request Host</span>
              <span className="font-mono text-sky-400 font-bold">{health?.host}</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Resolved Site ID</span>
              <span className="font-mono text-emerald-400 font-bold">{health?.siteId}</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Resolution Source</span>
              <span className="font-mono text-cyan-300 font-semibold">{formatSource(health?.resolutionSource)}</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Backend Hostname Header</span>
              <span className="font-mono text-amber-300">{health?.backendHostname}</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Backend API URL</span>
              <span className="font-mono text-slate-300 truncate max-w-[170px]">
                {health?.apiUrl}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Data Source</span>
              {isSeed ? (
                <span className="font-mono font-bold text-red-400 bg-red-950/60 px-1 py-0.5 rounded border border-red-500/30">
                  seed-fallback (warning)
                </span>
              ) : (
                <span className="font-mono text-emerald-400 font-semibold">mongodb</span>
              )}
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">API Latency / Status</span>
              <span className="font-mono text-slate-300">
                {health?.latencyMs}ms ({health?.status || 0})
              </span>
            </div>

            {health?.firstItem && (
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                <span className="text-slate-400 font-medium">First Tour</span>
                <span className="font-mono text-slate-300 truncate max-w-[170px]" title={health.firstItem}>
                  {health.firstItem}
                </span>
              </div>
            )}

            {health?.error && (
              <div className="mt-2 p-1.5 rounded bg-red-950/50 border border-red-900/60 text-red-300 text-[10px] break-all">
                ⚠️ {health.error}
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span>Port: {ENV.port} (Single Process)</span>
              <button
                onClick={() => window.location.reload()}
                className="text-sky-400 hover:text-sky-300 underline font-medium"
              >
                Reload
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
