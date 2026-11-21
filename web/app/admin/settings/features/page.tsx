"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { fetchAdminFeatures, updateAdminFeatures, type AdminSiteId } from "@/lib/adminApi";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import {
  type FeatureItem,
  resolveFeatureDependencies,
} from "@/lib/features/featureRegistrySchema";

export default function AdminFeaturesPage() {
  const site = useSite();
  const config = useSiteConfig();

  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [initialFeatures, setInitialFeatures] = useState<FeatureItem[]>([]);
  const [version, setVersion] = useState("1.0.0");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<"all" | "service" | "module" | "page">("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | "web" | "app">("all");
  const [searchFilter, setSearchFilter] = useState("");

  const hostname = config?.site?.canonicalHostname || "www.gujjutours.com";
  const siteId = site.siteId as AdminSiteId;
  const primaryColor = config?.theme?.colors?.primary || "#2563eb";

  // Fetch current features from admin API
  const loadFeatures = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await fetchAdminFeatures(hostname, siteId);
      if (data && data.features) {
        const loaded: FeatureItem[] = data.features || [];
        setFeatures(loaded);
        setInitialFeatures(loaded);
        setVersion(data.version || "1.0.0");
        setLastUpdated(data.updatedAt || new Date().toISOString());
        setLastUpdatedBy(data.updatedBy || "admin");
      } else {
        // Fallback to config featureRegistry
        const fromConfig: FeatureItem[] = config?.featureRegistry || [];
        setFeatures(fromConfig);
        setInitialFeatures(fromConfig);
        setVersion(config?.version || "1.0.0");
      }
    } catch {
      const fromConfig: FeatureItem[] = config?.featureRegistry || [];
      setFeatures(fromConfig);
      setInitialFeatures(fromConfig);
    } finally {
      setLoading(false);
    }
  }, [hostname, siteId, config]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  // Handle toggle feature
  const handleToggle = (id: string) => {
    setFeatures((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          return { ...item, enabled: !item.enabled };
        }
        return item;
      });
      return resolveFeatureDependencies(next);
    });
  };

  // Handle reorder
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= features.length) return;

    setFeatures((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;

      // Re-stamp order
      return copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  // Handle label change
  const handleLabelChange = (id: string, newLabel: string, lang = "en") => {
    setFeatures((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, label: { ...item.label, [lang]: newLabel } }
          : item
      )
    );
  };

  // Handle platform change
  const handlePlatformToggle = (id: string, platform: "web" | "app") => {
    setFeatures((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const exists = item.platforms.includes(platform);
        const updated = exists
          ? item.platforms.filter((p) => p !== platform)
          : [...item.platforms, platform];
        return { ...item, platforms: updated.length > 0 ? updated : [platform] };
      })
    );
  };

  // Handle visibility toggles
  const handleVisibilityToggle = (id: string, prop: "visibleInNav" | "visibleOnHome") => {
    setFeatures((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [prop]: !item[prop] } : item
      )
    );
  };

  // Filtered list
  const filteredFeatures = useMemo(() => {
    return features.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (platformFilter !== "all" && !item.platforms.includes(platformFilter)) return false;
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        const matchesName = Object.values(item.label || {}).some((l) =>
          l.toLowerCase().includes(query)
        );
        const matchesId = item.id.toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }
      return true;
    });
  }, [features, typeFilter, platformFilter, searchFilter]);

  // Check for unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(features) !== JSON.stringify(initialFeatures);
  }, [features, initialFeatures]);

  // Publish changes to server
  const handlePublish = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const data = await updateAdminFeatures(hostname, features, siteId);
      if (data && data.features) {
        setFeatures(data.features);
        setInitialFeatures(data.features);
      }
      setVersion(data?.version || "1.0.1");
      setLastUpdated(data?.updatedAt || new Date().toISOString());
      setLastUpdatedBy(data?.updatedBy || "admin");
      setFeedback({
        type: "success",
        message: `Successfully published features! Version bumped to v${data?.version || "1.0.1"}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "An error occurred while saving features.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Preview elements
  const previewServices = useMemo(() => {
    return features.filter(
      (f) => f.enabled && f.type === "service" && f.platforms.includes("web")
    );
  }, [features]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            <span>Site Settings</span>
            <span>/</span>
            <span className="text-foreground">Feature Registry</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <span>Feature Management &amp; Service Control</span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-bold text-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              v{version}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centrally manage verticals, navigation items, routes, and permissions for{" "}
            <strong className="text-foreground">{site.displayName}</strong> ({hostname}).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setFeatures(initialFeatures)}
            disabled={!hasChanges || saving}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-muted-foreground disabled:opacity-40 transition-colors"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl text-white shadow-md hover:opacity-95 active:scale-98 disabled:opacity-40 transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            {saving ? (
              <>
                <span className="animate-spin text-base">⏳</span>
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Feedback Banner ─── */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm border ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Live Preview Card ─── */}
      <div className="bg-neutral-900 rounded-2xl p-4 text-white shadow-lg border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
            <span>👁️ Live Service Switcher Preview</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-400 font-normal">
              {previewServices.length} active services
            </span>
          </div>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-neutral-300">
            Real-Time
          </span>
        </div>

        {/* Live Service Tabs Bar Simulation */}
        <div className="flex items-center gap-2 overflow-x-auto py-2 px-3 bg-neutral-950/80 rounded-xl border border-white/5 scrollbar-hide">
          {previewServices.map((serv, idx) => (
            <div
              key={serv.id}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                idx === 0
                  ? "bg-white/20 text-white border border-white/30 shadow-sm"
                  : "text-white/70 bg-white/5"
              }`}
            >
              {serv.icon?.url ? (
                <div className="relative w-4 h-4 shrink-0">
                  <Image
                    src={serv.icon.url}
                    alt={serv.label?.en || serv.id}
                    fill
                    sizes="16px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <span>🧭</span>
              )}
              <span>{serv.label?.en || serv.id}</span>
              {serv.badge && (
                <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded-full font-black">
                  {serv.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "service", "module", "page"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                typeFilter === t
                  ? "bg-foreground text-background font-bold shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Platform & Search Input */}
        <div className="flex items-center gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
          >
            <option value="all">All Platforms</option>
            <option value="web">Web Only</option>
            <option value="app">App Only</option>
          </select>

          <input
            type="text"
            placeholder="Search features..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground w-40 sm:w-52"
          />
        </div>
      </div>

      {/* ─── Features Table ─── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Order</th>
                <th className="py-3 px-4">Feature &amp; Icon</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Platforms</th>
                <th className="py-3 px-4 text-center">In Nav</th>
                <th className="py-3 px-4 text-center">On Home</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <span className="animate-spin text-2xl">⏳</span>
                      <span>Loading feature configuration for {hostname}...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFeatures.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No matching features found.
                  </td>
                </tr>
              ) : (
                filteredFeatures.map((item, idx) => {
                  const isEnabled = item.enabled;
                  const hasParentDisabled =
                    item.dependsOn &&
                    item.dependsOn.some((depId) => {
                      const p = features.find((f) => f.id === depId);
                      return p && !p.enabled;
                    });

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        !isEnabled ? "opacity-60 bg-muted/10" : ""
                      }`}
                    >
                      {/* Order Controls */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMove(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <span className="font-bold text-foreground text-xs w-5 text-center">
                            {item.order || idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMove(idx, "down")}
                            disabled={idx === features.length - 1}
                            className="p-1 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground"
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      {/* Feature Name & Icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
                            {item.icon?.url ? (
                              <div className="relative w-5 h-5">
                                <Image
                                  src={item.icon.url}
                                  alt={item.id}
                                  fill
                                  sizes="20px"
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <span className="text-sm">🧭</span>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              value={item.label?.en || ""}
                              onChange={(e) => handleLabelChange(item.id, e.target.value)}
                              className="font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:bg-background px-1 py-0.5 rounded text-xs outline-none"
                            />
                            <div className="flex items-center gap-2 mt-0.5 px-1">
                              <span className="text-[10px] text-muted-foreground font-mono">
                                id: {item.id}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.2 rounded">
                                  {item.badge}
                                </span>
                              )}
                              {hasParentDisabled && (
                                <span className="text-[9px] bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold px-1.5 py-0.2 rounded" title="Auto-disabled because parent feature is disabled">
                                  Cascaded
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.type === "service"
                              ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                              : item.type === "module"
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* Route Path */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {item.route || "—"}
                        </span>
                      </td>

                      {/* Platforms */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePlatformToggle(item.id, "web")}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                              item.platforms.includes("web")
                                ? "bg-primary/20 text-primary font-bold border border-primary/30"
                                : "text-muted-foreground/40 hover:text-muted-foreground"
                            }`}
                          >
                            Web
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePlatformToggle(item.id, "app")}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                              item.platforms.includes("app")
                                ? "bg-primary/20 text-primary font-bold border border-primary/30"
                                : "text-muted-foreground/40 hover:text-muted-foreground"
                            }`}
                          >
                            App
                          </button>
                        </div>
                      </td>

                      {/* In Nav Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleVisibilityToggle(item.id, "visibleInNav")}
                          className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors mx-auto ${
                            item.visibleInNav
                              ? "bg-emerald-500 text-white"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {item.visibleInNav ? "✓" : "×"}
                        </button>
                      </td>

                      {/* On Home Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleVisibilityToggle(item.id, "visibleOnHome")}
                          className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors mx-auto ${
                            item.visibleOnHome
                              ? "bg-emerald-500 text-white"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {item.visibleOnHome ? "✓" : "×"}
                        </button>
                      </td>

                      {/* Enabled / Disabled Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(item.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isEnabled ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] text-muted-foreground">
                          {isEnabled ? "Active" : "Disabled"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Audit Info Footer ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground pt-2">
        <span>
          Registry changes take effect dynamically without requiring redeployment or mobile rebuild.
        </span>
        {lastUpdated && (
          <span>
            Last published: {new Date(lastUpdated).toLocaleString()} by{" "}
            <strong className="text-foreground">{lastUpdatedBy}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

