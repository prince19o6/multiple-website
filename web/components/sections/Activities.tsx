"use client";

import { useRouter, useParams } from "next/navigation";
import { sitePath } from "@/lib/sitepath";
import type { SectionProps } from "@/lib/componentRegistry";

// website2 (Adventure World) only. Bold horizontal-scroll icon cards.
export default function Activities({ config }: SectionProps) {
    const router = useRouter();
    const { site } = useParams<{ site: string }>();

    const theme: any = config.theme || {};
    const activitiesConfig: any = (config as any).activities || {};

    if (activitiesConfig.enabled === false || !activitiesConfig.items?.length) return null;

    return (
        <section
            key="activities"
            className="py-16"
            style={{ backgroundColor: theme.secondary || "#052e16", color: "#ffffff" }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-black mb-4 uppercase">
                    {activitiesConfig.title || "Choose Your Adventure"}
                </h2>
                {activitiesConfig.subtitle && (
                    <p className="text-white/70 text-lg mb-12">{activitiesConfig.subtitle}</p>
                )}
                <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
                    {activitiesConfig.items.map((item: any, idx: number) => (
                        <button
                            key={`${item.id || 'activity'}-${idx}`}
                            onClick={() => router.push(sitePath(site, "/explore"))}
                            className="shrink-0 w-56 snap-start bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-6 text-left border border-white/10"
                        >
                            <div className="text-4xl mb-4">{item.icon}</div>
                            <h3 className="text-lg font-black uppercase mb-2">{item.title}</h3>
                            <p className="text-sm text-white/70">{item.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}