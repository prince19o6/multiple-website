"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  fetchAdminWebsiteConfig,
  updateAdminWebsiteConfig,
  uploadAdminCatalogImage,
  getAdminSite,
  getAdminHostname,
  ADMIN_SITE_NAMES,
  onAdminSessionChange,
} from "@/lib/adminApi";

interface CouponItem {
  code: string;
  discountPercent: number;
  maxDiscount: number;
  description?: string;
}

interface HomeSectionItem {
  key: string;
  label: string;
  icon: string;
  enabled: boolean;
}

const DEFAULT_HOME_SECTIONS: HomeSectionItem[] = [
  { key: "hero", label: "Hero Banner & Search Widget", icon: "🚀", enabled: true },
  { key: "quickActions", label: "Module Quick Action Pills", icon: "⚡", enabled: true },
  { key: "categories", label: "Activity & Stays Taxonomy Categories", icon: "🏷️", enabled: true },
  { key: "specialOffers", label: "Special Offers & Promo Carousel", icon: "🎁", enabled: true },
  { key: "featuredStays", label: "Featured Stays & Hotels Grid", icon: "🏨", enabled: true },
  { key: "cityStays", label: "City Stays & Popular Hubs", icon: "🏙️", enabled: true },
  { key: "curatedPackages", label: "Curated Holiday Packages & Combos", icon: "🌴", enabled: true },
  { key: "weather", label: "Best Cities Weather Radar", icon: "☀️", enabled: true },
  { key: "travelVideos", label: "Travel Experience Video Reels", icon: "🎬", enabled: true },
  { key: "testimonials", label: "Traveler Reviews & Testimonials", icon: "⭐", enabled: true },
  { key: "whyChooseUs", label: "Why Choose Us Key Highlights", icon: "🛡️", enabled: true },
  { key: "partners", label: "Official Partners & Airline Badges", icon: "🤝", enabled: true },
  { key: "trustBadges", label: "Trust Badges & Certifications", icon: "🏅", enabled: true },
  { key: "faq", label: "Frequently Asked Questions Accordion", icon: "❓", enabled: true },
];

const AVAILABLE_FONTS = [
  "Inter, sans-serif",
  "Poppins, sans-serif",
  "Montserrat, sans-serif",
  "'Plus Jakarta Sans', sans-serif",
  "'Playfair Display', serif",
  "Roboto, sans-serif",
];

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Raw & Site State
  const [rawConfig, setRawConfig] = useState<any>({});
  const [siteName, setSiteName] = useState("");
  const [logoLight, setLogoLight] = useState("");
  const [logoDark, setLogoDark] = useState("");

  // Typography
  const [fontFamily, setFontFamily] = useState("Inter, sans-serif");
  const [headingFont, setHeadingFont] = useState("Poppins, sans-serif");

  // Theme Colors
  const [primaryColor, setPrimaryColor] = useState("#E05A1F");
  const [secondaryColor, setSecondaryColor] = useState("#2563EB");
  const [accentColor, setAccentColor] = useState("#F59E0B");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");

  // Contact Info
  const [phone, setPhone] = useState("+91 9875095616");
  const [email, setEmail] = useState("support@gujjutours.com");
  const [whatsapp, setWhatsapp] = useState("+91 9875095616");
  const [address, setAddress] = useState("Sandhya Wad, Bilimora - Chikhli Rd, Gujarat, India");

  // Social Channels
  const [facebookUrl, setFacebookUrl] = useState("https://facebook.com");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com");
  const [twitterUrl, setTwitterUrl] = useState("https://twitter.com");

  // SEO Settings
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");

  // Home Page Section Management
  const [homeSections, setHomeSections] = useState<HomeSectionItem[]>(DEFAULT_HOME_SECTIONS);

  // Module Flags
  const [moduleFlags, setModuleFlags] = useState({
    hotels: true,
    tours: true,
    packages: true,
    flights: true,
    transfers: true,
    visas: true,
    restaurants: true,
    buildpackage: true,
  });

  // Coupons
  const [coupons, setCoupons] = useState<CouponItem[]>([
    { code: "GUJJU20", discountPercent: 20, maxDiscount: 3000, description: "Flat 20% off on all tours and hotels" },
    { code: "TRIPGO15", discountPercent: 15, maxDiscount: 1500, description: "15% off regional tours" },
  ]);

  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);
  const [newCouponMax, setNewCouponMax] = useState(1000);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.gujjutours;
  const hostname = getAdminHostname(activeSite);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await fetchAdminWebsiteConfig(hostname, activeSite);
      if (cfg) {
        setRawConfig(cfg);

        // Site Name & Logos
        setSiteName(cfg.siteName || currentBrand.label);
        setLogoLight(cfg.logoUrl || cfg.logoLight || "");
        setLogoDark(cfg.logoDark || "");

        // Typography
        if (cfg.theme?.typography?.fontFamily) setFontFamily(cfg.theme.typography.fontFamily);
        if (cfg.theme?.typography?.headingFont) setHeadingFont(cfg.theme.typography.headingFont);

        // Theme colors
        const theme = cfg.theme || {};
        const colors = theme.colors || {};
        if (colors.primary) setPrimaryColor(colors.primary);
        else if (currentBrand.color) setPrimaryColor(currentBrand.color);
        if (colors.secondary) setSecondaryColor(colors.secondary);
        if (colors.accent) setAccentColor(colors.accent);
        if (colors.background) setBackgroundColor(colors.background);

        // Contact Info
        const contact = cfg.websiteContact || cfg.contact || {};
        if (contact.phone) setPhone(contact.phone);
        if (contact.email) setEmail(contact.email);
        if (contact.whatsapp) setWhatsapp(contact.whatsapp);
        if (contact.address) setAddress(contact.address);

        // Social
        const social = cfg.socialLinks || {};
        if (social.facebook) setFacebookUrl(social.facebook);
        if (social.instagram) setInstagramUrl(social.instagram);
        if (social.twitter) setTwitterUrl(social.twitter);

        // SEO
        const seo = cfg.seo || {};
        if (seo.title) setMetaTitle(seo.title);
        if (seo.description) setMetaDescription(seo.description);
        if (seo.keywords) setMetaKeywords(seo.keywords);
        if (seo.ogImage) setOgImageUrl(seo.ogImage);

        // Home Sections
        if (Array.isArray(cfg.homeSections) && cfg.homeSections.length > 0) {
          setHomeSections(cfg.homeSections);
        } else if (Array.isArray(cfg.homeSectionsLayout) && cfg.homeSectionsLayout.length > 0) {
          setHomeSections(cfg.homeSectionsLayout);
        }

        // Module Flags
        if (cfg.modules) {
          setModuleFlags({
            hotels: cfg.modules.hotels ?? true,
            tours: cfg.modules.tours ?? true,
            packages: cfg.modules.packages ?? true,
            flights: cfg.modules.flights ?? true,
            transfers: cfg.modules.transfers ?? true,
            visas: cfg.modules.visas ?? true,
            restaurants: cfg.modules.restaurants ?? true,
            buildpackage: cfg.modules.buildpackage ?? true,
          });
        }

        // Coupons
        if (Array.isArray(cfg.coupons)) {
          setCoupons(cfg.coupons);
        }
      }
    } catch {
      setPrimaryColor(currentBrand.color);
      setSiteName(currentBrand.label);
    } finally {
      setLoading(false);
    }
  }, [hostname, activeSite, currentBrand.color, currentBrand.label]);

  useEffect(() => {
    loadConfig();
    return onAdminSessionChange(() => {
      loadConfig();
    });
  }, [loadConfig]);

  // Handle Logo Upload
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, mode: "light" | "dark" | "og") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadAdminCatalogImage(file);
      if (mode === "light") setLogoLight(res.url);
      else if (mode === "dark") setLogoDark(res.url);
      else if (mode === "og") setOgImageUrl(res.url);
      showToast("Uploaded successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      showToast(msg, "error");
    }
  };

  // Reorder Home Sections
  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= homeSections.length) return;

    const copy = [...homeSections];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setHomeSections(copy);
  };

  // Toggle Home Section
  const handleToggleSection = (key: string) => {
    setHomeSections((prev) =>
      prev.map((sec) => (sec.key === key ? { ...sec, enabled: !sec.enabled } : sec))
    );
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const cleanCode = newCouponCode.trim().toUpperCase();
    if (coupons.some((c) => c.code === cleanCode)) {
      showToast("Coupon code already exists", "error");
      return;
    }

    setCoupons((prev) => [
      ...prev,
      {
        code: cleanCode,
        discountPercent: Number(newCouponDiscount),
        maxDiscount: Number(newCouponMax),
        description: `Promo discount: ${newCouponDiscount}% off (up to ₹${newCouponMax})`,
      },
    ]);
    setNewCouponCode("");
    setNewCouponDiscount(10);
    setNewCouponMax(1000);
  };

  const handleRemoveCoupon = (code: string) => {
    setCoupons((prev) => prev.filter((c) => c.code !== code));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updatedConfig = {
        ...rawConfig,
        hostname,
        siteName,
        logoUrl: logoLight,
        logoLight,
        logoDark,
        theme: {
          ...(rawConfig.theme || {}),
          colors: {
            ...(rawConfig.theme?.colors || {}),
            primary: primaryColor,
            secondary: secondaryColor,
            accent: accentColor,
            background: backgroundColor,
          },
          typography: {
            fontFamily,
            headingFont,
          },
        },
        websiteContact: {
          phone,
          email,
          whatsapp,
          address,
        },
        socialLinks: {
          facebook: facebookUrl,
          instagram: instagramUrl,
          twitter: twitterUrl,
        },
        seo: {
          title: metaTitle,
          description: metaDescription,
          keywords: metaKeywords,
          ogImage: ogImageUrl,
        },
        homeSections,
        homeSectionsLayout: homeSections,
        modules: moduleFlags,
        coupons,
      };

      await updateAdminWebsiteConfig(hostname, updatedConfig, activeSite);
      showToast(`Website settings saved successfully for ${currentBrand.label}!`);
      setRawConfig(updatedConfig);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans pb-20 max-w-5xl">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: currentBrand.color }}
            >
              {currentBrand.label}
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tenant Customization & CMS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Website Settings & Layout CMS
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage live branding, fonts, colors, contact info, SEO, and homepage section order for {currentBrand.label} ({hostname}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/settings/features"
            className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ⚙️ Feature Registry →
          </Link>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving || loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            {saving ? "Saving Changes…" : "Save All Settings"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-gray-400 text-sm font-semibold">
          Loading settings for {currentBrand.label}…
        </div>
      ) : (
        <div className="space-y-6">
          {/* ─── SECTION 1: Brand Identity & Logos ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="text-xl">🏷️</span>
              <h2 className="text-base font-bold text-gray-900">Brand Identity & Logos</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Header Logo (Light Mode)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={logoLight}
                    onChange={(e) => setLogoLight(e.target.value)}
                    placeholder="https://... or /logo.png"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono"
                  />
                  <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl text-xs font-bold cursor-pointer">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadLogo(e, "light")}
                      className="hidden"
                    />
                  </label>
                </div>
                {logoLight && (
                  <div className="mt-2 relative w-32 h-10 bg-slate-100 p-1 rounded border border-gray-200">
                    <Image src={logoLight} alt="Light Logo" fill className="object-contain" unoptimized />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── SECTION 2: Typography & Google Fonts ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="text-xl">🔤</span>
              <h2 className="text-base font-bold text-gray-900">Typography & Web Fonts</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Body Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                >
                  {AVAILABLE_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Heading Font Family</label>
                <select
                  value={headingFont}
                  onChange={(e) => setHeadingFont(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                >
                  {AVAILABLE_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ─── SECTION 3: Brand Colors ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="text-xl">🎨</span>
              <h2 className="text-base font-bold text-gray-900">Theme Colors</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-gray-300 p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-gray-300 p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-gray-300 p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Page Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-gray-300 p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── SECTION 4: Homepage Section Layout Order ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📐</span>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Homepage Section Manager</h2>
                  <p className="text-xs text-gray-500">Reorder sections and toggle visibility for web & mobile.</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {homeSections.filter((s) => s.enabled).length} Active Sections
              </span>
            </div>

            <div className="space-y-2">
              {homeSections.map((sec, idx) => (
                <div
                  key={sec.key}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    sec.enabled ? "bg-white border-gray-200" : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{sec.icon}</span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">{sec.label}</div>
                      <div className="text-xs font-mono text-gray-400">key: {sec.key}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSection(sec.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        sec.enabled
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {sec.enabled ? "Visible" : "Hidden"}
                    </button>

                    <div className="flex items-center gap-1 border-l pl-2 border-gray-200">
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, "down")}
                        disabled={idx === homeSections.length - 1}
                        className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── SECTION 5: Contact Channels & WhatsApp ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="text-xl">📞</span>
              <h2 className="text-base font-bold text-gray-900">Contact Channels & WhatsApp Support</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Customer Care Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Helpdesk Support Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Business Number</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Corporate Office Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* ─── SECTION 6: SEO & Meta Tags ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="text-xl">🌐</span>
              <h2 className="text-base font-bold text-gray-900">SEO & Metadata</h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Default Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. Gujju Tours | Premier Gujarat & Dubai Holiday Packages"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Meta Description</label>
                <textarea
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Comprehensive description for Google and search crawlers…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="tours, holiday, packages, dubai, gujarat"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">OpenGraph Share Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ogImageUrl}
                      onChange={(e) => setOgImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono"
                    />
                    <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl text-xs font-bold cursor-pointer">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadLogo(e, "og")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── SECTION 7: Enabled Modules ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="text-xl">🧩</span>
              <h2 className="text-base font-bold text-gray-900">Enabled Modules</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
              {Object.keys(moduleFlags).map((mod) => (
                <label
                  key={mod}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={moduleFlags[mod as keyof typeof moduleFlags]}
                    onChange={(e) =>
                      setModuleFlags((prev) => ({
                        ...prev,
                        [mod]: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-gray-800 capitalize">{mod}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ─── SECTION 8: Promo Coupons ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏷️</span>
                <h2 className="text-base font-bold text-gray-900">Promotional Coupons & Vouchers</h2>
              </div>
            </div>

            <div className="space-y-2">
              {coupons.map((c) => (
                <div
                  key={c.code}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-mono font-bold rounded-lg">
                      {c.code}
                    </span>
                    <div>
                      <div className="font-bold text-gray-900">{c.discountPercent}% Discount</div>
                      <div className="text-xs text-gray-500">Max savings: ₹{c.maxDiscount}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCoupon(c.code)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCoupon} className="pt-2 flex flex-wrap gap-2 text-xs">
              <input
                type="text"
                placeholder="Code (e.g. SUMMER30)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl uppercase font-mono"
              />
              <input
                type="number"
                placeholder="Discount %"
                value={newCouponDiscount}
                onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-xl"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={newCouponMax}
                onChange={(e) => setNewCouponMax(Number(e.target.value))}
                className="w-28 px-3 py-2 border border-gray-300 rounded-xl"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                + Add Coupon
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
