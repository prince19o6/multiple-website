"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  fetchAdminWebsiteConfig,
  updateAdminWebsiteConfig,
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

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Tenant Config State
  const [rawConfig, setRawConfig] = useState<any>({});
  const [primaryColor, setPrimaryColor] = useState("#E05A1F");
  const [secondaryColor, setSecondaryColor] = useState("#2563EB");
  const [accentColor, setAccentColor] = useState("#F59E0B");

  // Contact Info
  const [phone, setPhone] = useState("+91 9875095616");
  const [email, setEmail] = useState("support@gujjutours.com");
  const [whatsapp, setWhatsapp] = useState("+91 9875095616");
  const [address, setAddress] = useState("Sandhya Wad, Bilimora - Chikhli Rd, Gujarat, India");

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

  // New Coupon Input
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);
  const [newCouponMax, setNewCouponMax] = useState(1000);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.tripgoasia;
  const hostname = getAdminHostname(activeSite);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await fetchAdminWebsiteConfig(hostname, activeSite);
      if (cfg) {
        setRawConfig(cfg);

        // Theme colors
        const theme = cfg.theme || {};
        const colors = theme.colors || {};
        if (colors.primary) setPrimaryColor(colors.primary);
        else if (currentBrand.color) setPrimaryColor(currentBrand.color);
        if (colors.secondary) setSecondaryColor(colors.secondary);
        if (colors.accent) setAccentColor(colors.accent);

        // Contact Info
        const contact = cfg.websiteContact || cfg.contact || {};
        if (contact.phone) setPhone(contact.phone);
        if (contact.email) setEmail(contact.email);
        if (contact.whatsapp) setWhatsapp(contact.whatsapp);
        if (contact.address) setAddress(contact.address);

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
      // Default fallback from brand if no dynamic config exists yet
      setPrimaryColor(currentBrand.color);
    } finally {
      setLoading(false);
    }
  }, [hostname, activeSite, currentBrand.color]);

  useEffect(() => {
    loadConfig();
    return onAdminSessionChange(() => {
      loadConfig();
    });
  }, [loadConfig]);

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
        theme: {
          ...(rawConfig.theme || {}),
          colors: {
            ...(rawConfig.theme?.colors || {}),
            primary: primaryColor,
            secondary: secondaryColor,
            accent: accentColor,
          },
        },
        websiteContact: {
          phone,
          email,
          whatsapp,
          address,
        },
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
              Tenant Customization
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Website Settings & Branding
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage live brand colors, contact channels, enabled modules, and coupons for {currentBrand.label} ({hostname}).
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition-all cursor-pointer"
          >
            {saving ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-gray-400 text-sm font-semibold">
          Loading settings for {currentBrand.label}…
        </div>
      ) : (
        <div className="space-y-6">
          {/* ─── SECTION 1: Brand Colors ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Brand Colors & Palette</h2>
                <p className="text-xs text-gray-500">Live theme tokens applied across navigation, buttons, and badges</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Preview:</span>
                <span className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: primaryColor }} />
                <span className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: secondaryColor }} />
                <span className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: accentColor }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── SECTION 2: Contact Info ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Tenant Contact Information</h2>
              <p className="text-xs text-gray-500">Displayed in website header, footer, vouchers, and confirmation emails</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Hotline</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Office Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ─── SECTION 3: Module Feature Flags ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Module Feature Flags</h2>
              <p className="text-xs text-gray-500">Toggle public availability of verticals on {currentBrand.label}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(moduleFlags).map(([key, enabled]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setModuleFlags((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
                  }
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold cursor-pointer transition-colors ${
                    enabled
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                >
                  <span className="capitalize">{key}</span>
                  <span>{enabled ? "✓ On" : "✕ Off"}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ─── SECTION 4: Promotional Coupons ─── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Promotional Coupons & Codes</h2>
              <p className="text-xs text-gray-500">Discount codes redeemable at checkout for this tenant</p>
            </div>

            {/* Existing Coupons List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.code}
                  className="p-3.5 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-blue-100 text-blue-800">
                        {coupon.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {coupon.discountPercent}% OFF
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Max discount: ₹{coupon.maxDiscount.toLocaleString()} • {coupon.description || "Active promo"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCoupon(coupon.code)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Coupon Form */}
            <form onSubmit={handleAddCoupon} className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Code (e.g. SUMMER25)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="w-full sm:w-1/3 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:outline-none"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Discount %"
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                  className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  min={1}
                  placeholder="Max ₹"
                  value={newCouponMax}
                  onChange={(e) => setNewCouponMax(Number(e.target.value))}
                  className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none"
                />
                <span className="text-xs text-gray-500">₹ max</span>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
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

