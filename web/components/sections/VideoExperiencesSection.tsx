"use client";

import React, { useState, useEffect } from "react";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import { type ModuleVideoItemContract } from "@/lib/apiContracts";

interface VideoExperiencesSectionProps {
  config: MergedWebsiteConfig;
  videos?: ModuleVideoItemContract[];
}

export default function VideoExperiencesSection({ config, videos: propVideos }: VideoExperiencesSectionProps) {
  const [videos, setVideos] = useState<ModuleVideoItemContract[]>(propVideos || []);
  const [loading, setLoading] = useState<boolean>(!propVideos || propVideos.length === 0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const siteId = config.site?.id || "gujjutours";

  useEffect(() => {
    if (propVideos && propVideos.length > 0) {
      setVideos(propVideos);
      setLoading(false);
      return;
    }

    async function fetchVideos() {
      try {
        const res = await fetch(`/api/core/v1/home?module=tours&site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.videos) && json.videos.length > 0) {
            setVideos(json.videos);
          }
        }
      } catch {
        // Suppress and hide section if no videos
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [siteId, propVideos]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-foreground">
        <div className="w-48 h-6 bg-neutral-200 dark:bg-neutral-800 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-foreground">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Watch Top Travel Experiences
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Real snapshots and breathtaking journey clips captured by our travelers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {videos.map((vid, idx) => {
          const isPlaying = activeVideo === vid.id;
          const thumb = vid.thumbnailUrl || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80";

          return (
            <div
              key={vid.id || idx}
              className="rounded-2xl overflow-hidden bg-surface border border-border shadow-soft-sm relative flex flex-col justify-between h-56 group"
            >
              {isPlaying && vid.videoUrl ? (
                <video
                  src={vid.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb}
                    alt={vid.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                  <div className="relative z-10 p-3 self-end">
                    {vid.duration ? (
                      <span className="px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-white backdrop-blur-sm">
                        {vid.duration}
                      </span>
                    ) : null}
                  </div>

                  <div className="relative z-10 p-4">
                    <button
                      type="button"
                      onClick={() => setActiveVideo(vid.id)}
                      className="w-10 h-10 rounded-full bg-white/90 text-neutral-900 flex items-center justify-center font-bold text-sm shadow-soft-lg mb-2 hover:scale-110 transition-transform"
                      aria-label={`Play ${vid.title}`}
                    >
                      ▶
                    </button>
                    <h3 className="text-sm font-bold text-white line-clamp-1 drop-shadow">
                      {vid.title}
                    </h3>
                    {vid.destination ? (
                      <p className="text-[11px] text-gray-200 mt-0.5">{vid.destination}</p>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
