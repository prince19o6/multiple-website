"use client";

import { useRouter, useParams } from "next/navigation";
import { sitePath } from "@/lib/sitepath";
import {
    ACTION_TO_PATH,
    getButtonClass,
    getButtonSize,
    getHeadingFontFamily,
} from "@/lib/sectionHelpers";
import type { SectionProps } from "@/lib/componentRegistry";

export default function Hero({ config }: SectionProps) {
    const router = useRouter();
    const { site } = useParams<{ site: string }>();

    const theme: any = config.theme || {};
    const hero: any = (config as any).hero || {};
    const buttons: any = (config as any).buttons || {};
    const headingFontFamily = getHeadingFontFamily(config);

    // Real hostname name/logo/colors already come through automatically
    // via the external config API (see mergeWebsiteConfig), even with no
    // per-site config authored. Falling back to that name here — instead
    // of hardcoded generic English — means ANY new hostname gets a
    // reasonably branded hero with zero manual setup.
    const siteName = config.name || "Us";
    const defaultTitle = `Discover Your Next Adventure with ${siteName}`;
    const defaultDescription = `Explore amazing destinations and unforgettable experiences with ${siteName}.`;

    const heroButtonHref = (action: string | undefined) =>
        sitePath(site, ACTION_TO_PATH[action || "explore"] || "/explore");

    // Holiday Paradise (website3) hero: full-bleed photo background with
    // a soft overlay, centered serif title, and a (visual) search bar —
    // matching hero.style: "luxury-image" + hero.showSearch in its config.
    if (hero.style === "luxury-image") {
        return (
            <section
                key="hero"
                className="relative flex items-center justify-center text-white"
                style={{ minHeight: "640px" }}
            >
                <img
                    src={hero.image}
                    alt={config.name}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            hero.overlayOpacity === "light"
                                ? "rgba(0,0,0,0.35)"
                                : "rgba(0,0,0,0.55)",
                    }}
                />

                <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
                    {hero.showBadge && (
                        <span className="inline-block border border-white/50 px-5 py-1.5 text-xs uppercase tracking-[0.2em] mb-6">
                            {hero.badgeText}
                        </span>
                    )}
                    <h1
                        className="text-5xl md:text-6xl mb-5 leading-tight"
                        style={{ fontFamily: headingFontFamily }}
                    >
                        {hero.title || defaultTitle}
                    </h1>
                    <p className="text-lg text-white/85 mb-10">
                        {hero.description || defaultDescription}
                    </p>

                    {hero.showSearch && (
                        <div className="flex flex-col sm:flex-row bg-white text-left mb-8 shadow-xl">
                            <input
                                type="text"
                                placeholder={hero.searchPlaceholder || "Where would you like to relax?"}
                                className="flex-1 px-5 py-4 text-gray-800 placeholder:text-gray-400 focus:outline-none"
                                readOnly
                                onFocus={() => router.push(heroButtonHref(hero.primaryButton?.action))}
                            />
                            <button
                                onClick={() => router.push(heroButtonHref(hero.primaryButton?.action))}
                                className="px-8 py-4 text-sm uppercase tracking-widest font-semibold text-white"
                                style={{ backgroundColor: theme.primary }}
                            >
                                Search
                            </button>
                        </div>
                    )}

                    <div className="flex gap-4 justify-center flex-wrap">
                        <button
                            onClick={() => router.push(heroButtonHref(hero.primaryButton?.action))}
                            className="px-8 py-3 text-sm uppercase tracking-widest font-semibold text-white"
                            style={{ backgroundColor: theme.primary }}
                        >
                            {hero.primaryButton?.icon} {hero.primaryButton?.text}
                        </button>
                        <button
                            onClick={() => router.push(heroButtonHref(hero.secondaryButton?.action))}
                            className="px-8 py-3 text-sm uppercase tracking-widest font-semibold border border-white text-white hover:bg-white/10"
                        >
                            {hero.secondaryButton?.icon} {hero.secondaryButton?.text}
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    const isSplit = hero.imagePosition === "right";
    const textAlign = hero.alignment === "left" ? "text-left" : "text-center";

    const buttonRow = (
        <div
            className={`flex gap-4 flex-wrap ${hero.alignment === "left" ? "" : "justify-center"}`}
        >
            <button
                onClick={() => router.push(heroButtonHref(hero.primaryButton?.action))}
                className={`${getButtonClass(buttons)} ${getButtonSize(buttons)} font-semibold transition-all hover:opacity-90`}
                style={{ backgroundColor: "#ffffff", color: theme.primary || "#2563eb" }}
            >
                {buttons.uppercase
                    ? `${hero.primaryButton?.icon || ""} ${(hero.primaryButton?.text || "Explore").toUpperCase()}`
                    : `${hero.primaryButton?.icon || ""} ${hero.primaryButton?.text || "Explore"}`}
            </button>

            <button
                onClick={() => router.push(heroButtonHref(hero.secondaryButton?.action))}
                className={`${getButtonClass(buttons)} ${getButtonSize(buttons)} font-semibold transition-all hover:bg-white/10 border-2`}
                style={{ borderColor: "#ffffff", color: "#ffffff", backgroundColor: "transparent" }}
            >
                {buttons.uppercase
                    ? `${hero.secondaryButton?.icon || ""} ${(hero.secondaryButton?.text || "Learn More").toUpperCase()}`
                    : `${hero.secondaryButton?.icon || ""} ${hero.secondaryButton?.text || "Learn More"}`}
            </button>
        </div>
    );

    return (
        <section
            key="hero"
            className="text-white py-20"
            style={{
                background: `linear-gradient(135deg, ${theme.primary || "#2563eb"}, ${theme.primaryDark || "#1d4ed8"})`,
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {isSplit ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className={textAlign}>
                            {hero.showBadge && (
                                <span className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                                    {hero.badgeText}
                                </span>
                            )}
                            <h1 className="text-5xl md:text-6xl font-bold mb-6">
                                {hero.title || defaultTitle}
                            </h1>
                            <p className="text-xl text-white/90 mb-8">
                                {hero.description || defaultDescription}
                            </p>
                            {buttonRow}
                        </div>
                        <div className="hidden md:block">
                            <img
                                src={hero.image}
                                alt={config.name}
                                className="w-full h-[400px] object-cover rounded-2xl shadow-2xl"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto text-center">
                        {hero.showBadge && (
                            <span className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                                {hero.badgeText}
                            </span>
                        )}
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            {hero.title || defaultTitle}
                        </h1>
                        <p className="text-xl text-white/90 mb-8">
                            {hero.description || defaultDescription}
                        </p>
                        <div className="flex justify-center mb-10">{buttonRow}</div>
                        {hero.image && (
                            <img
                                src={hero.image}
                                alt={config.name}
                                className="w-full max-w-3xl mx-auto h-[300px] object-cover rounded-2xl shadow-2xl"
                            />
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}