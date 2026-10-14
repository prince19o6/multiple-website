"use client";

import type { SectionProps } from "@/lib/componentRegistry";

export default function Stats({ config }: SectionProps) {
    const theme: any = config.theme || {};
    const stats: any = (config as any).stats || {};

    if (stats.enabled === false || !stats.items?.length) return null;

    return (
        <section
            key="stats"
            className="text-white py-16"
            style={{ backgroundColor: theme.primary || "#2563eb" }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                    {stats.items.map((item: any, idx: number) => (
                        <div key={idx}>
                            <div className="text-5xl font-bold mb-2">{item.number}</div>
                            <p className="text-white/80">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}