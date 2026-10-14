"use client";

import { useRouter, useParams } from "next/navigation";
import { sitePath } from "@/lib/sitepath";
import type { SectionProps } from "@/lib/componentRegistry";

// website2 (Adventure World) only.
export default function Difficulty({ config }: SectionProps) {
    const router = useRouter();
    const { site } = useParams<{ site: string }>();

    const theme: any = config.theme || {};
    const difficultyConfig: any = (config as any).difficulty || {};

    if (difficultyConfig.enabled === false || !difficultyConfig.levels?.length) return null;

    return (
        <section key="difficulty" className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-black mb-10 text-center uppercase" style={{ color: theme.heading }}>
                    {difficultyConfig.title || "Choose Your Difficulty"}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {difficultyConfig.levels.map((level: any) => (
                        <button
                            key={level.id}
                            onClick={() => router.push(sitePath(site, "/explore"))}
                            className="rounded-full border-2 py-6 px-4 text-center font-black uppercase hover:scale-105 transition-transform"
                            style={{ borderColor: theme.primary || "#16a34a" }}
                        >
                            <div className="text-3xl mb-2">{level.icon}</div>
                            <div>{level.label}</div>
                            <div className="text-xs font-normal normal-case text-gray-500 mt-1">
                                {level.description}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}