"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  fetchAdminCatalog,
  createAdminCatalogItem,
  updateAdminCatalogItem,
  deleteAdminCatalogItem,
  toggleAdminCatalogItem,
  reorderAdminCatalog,
  uploadAdminCatalogImage,
  onAdminSessionChange,
  ADMIN_SITE_NAMES,
  getAdminSite,
} from "@/lib/adminApi";

interface CatalogModuleDef {
  key: string;
  name: string;
  icon: string;
  singular: string;
  titleField: string;
  priceField: string;
  capacityField: string;
}

const MODULES: CatalogModuleDef[] = [
  { key: "hotels", name: "Hotels & Stays", icon: "🏨", singular: "Hotel", titleField: "title", priceField: "pricePerNight", capacityField: "starRating" },
  { key: "tours", name: "Tours & Activities", icon: "🗺️", singular: "Tour", titleField: "name", priceField: "price", capacityField: "duration" },
  { key: "packages", name: "Holiday Packages", icon: "🌴", singular: "Package", titleField: "title", priceField: "price", capacityField: "durationDays" },
  { key: "flights", name: "Flights", icon: "✈️", singular: "Flight", titleField: "flightNumber", priceField: "price", capacityField: "availableSeats" },
  { key: "transfers", name: "Transfers", icon: "🚖", singular: "Transfer", titleField: "name", priceField: "price", capacityField: "vehicleType" },
  { key: "visas", name: "Visas", icon: "🛂", singular: "Visa", titleField: "country", priceField: "price", capacityField: "visaType" },
  { key: "restaurants", name: "Restaurants", icon: "🍽️", singular: "Restaurant", titleField: "name", priceField: "costForTwo", capacityField: "cuisine" },
  { key: "buildpackage", name: "Custom Package", icon: "🧩", singular: "Destination", titleField: "destinationName", priceField: "startingPrice", capacityField: "country" },
  { key: "banners", name: "Hero Banners", icon: "🖼️", singular: "Banner", titleField: "title", priceField: "sortOrder", capacityField: "module" },
  { key: "offers", name: "Special Offers", icon: "🏷️", singular: "Offer", titleField: "title", priceField: "discountPercent", capacityField: "code" },
  { key: "videos", name: "Travel Videos", icon: "🎬", singular: "Video", titleField: "title", priceField: "viewsCount", capacityField: "destination" },
  { key: "reviews", name: "Reviews", icon: "⭐", singular: "Review", titleField: "author", priceField: "rating", capacityField: "tourName" },
  { key: "faqs", name: "FAQs", icon: "❓", singular: "FAQ", titleField: "question", priceField: "sortOrder", capacityField: "category" },
  { key: "partners", name: "Partners", icon: "🤝", singular: "Partner", titleField: "name", priceField: "sortOrder", capacityField: "category" },
  { key: "pages", name: "Static Pages", icon: "📄", singular: "Page", titleField: "title", priceField: "slug", capacityField: "slug" },
];

export default function AdminCatalogPage() {
  const [activeModule, setActiveModule] = useState<string>("hotels");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Modal State
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Generic Form Fields
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    price: 99,
    capacity: "",
    category: "",
    description: "",
    imageUrl: "",
    extra1: "", // subtitle, code, videoUrl, author, question, name
    extra2: "", // ctaLink, badge, travelerName, rating, answer, websiteUrl
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    let cleanText = text;
    if (
      cleanText.includes("CompositeServerSelector") ||
      cleanText.includes("TimeoutException") ||
      cleanText.includes("selecting a server") ||
      cleanText.includes("HeartbeatException") ||
      cleanText.includes("ReplicaSet")
    ) {
      cleanText = "Database connection timed out. Showing offline catalog data.";
    }
    setToast({ text: cleanText, type });
    setTimeout(() => setToast(null), 5000);
  };

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.gujjutours;
  const currentModDef = MODULES.find((m) => m.key === activeModule) || MODULES[0];

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminCatalog(activeModule, { search: searchTerm, limit: 100 });
      setItems(res.data || []);
      setCurrentPage(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load items";
      showToast(msg, "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeModule, searchTerm]);

  useEffect(() => {
    loadItems();
    return onAdminSessionChange(() => {
      loadItems();
    });
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter((item) => {
      const title = String(item[currentModDef.titleField] || item.title || item.name || item.question || item.author || "").toLowerCase();
      const slug = String(item.slug || item.code || item.destination || item.category || "").toLowerCase();
      return title.includes(q) || slug.includes(q);
    });
  }, [items, searchTerm, currentModDef]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      slug: "",
      price: activeModule === "offers" ? 15 : activeModule === "reviews" ? 5 : 99,
      capacity: "",
      category: activeModule === "faqs" ? "general" : activeModule === "banners" ? "home" : "",
      description: "",
      imageUrl: "",
      extra1: "",
      extra2: "",
    });
    setModalMode("create");
  };

  // Open Edit Modal
  const openEditModal = (item: any) => {
    setEditingItem(item);
    const title = item[currentModDef.titleField] || item.title || item.name || item.question || item.author || "";
    const slug = item.slug || item.destinationSlug || item.code || "";
    const price = item[currentModDef.priceField] ?? item.price ?? item.discountPercent ?? item.rating ?? 0;
    const capacity = item[currentModDef.capacityField] || "";
    const img = item.imageUrl || item.image || item.logoUrl || item.thumbnailUrl || (Array.isArray(item.images) ? item.images[0] : "");

    setFormData({
      title: String(title),
      slug: String(slug),
      price: Number(price),
      capacity: typeof capacity === "object" ? (capacity?.name || "") : String(capacity || ""),
      category: item.category || item.module || "",
      description: item.description || item.comment || item.answer || item.contentHtml || "",
      imageUrl: String(img || ""),
      extra1: item.subtitle || item.code || item.videoUrl || item.question || item.author || "",
      extra2: item.ctaLink || item.badge || item.travelerName || item.answer || item.websiteUrl || "",
    });
    setModalMode("edit");
  };

  // Handle Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadAdminCatalogImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: res.url }));
      showToast("Image uploaded successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      showToast(msg, "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Toggle Active
  const handleToggleActive = async (item: any) => {
    const id = item.id || item._id;
    try {
      await toggleAdminCatalogItem(activeModule, id);
      showToast("Status toggled successfully!");
      await loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Toggle failed";
      showToast(msg, "error");
    }
  };

  // Handle Reorder (Move Up / Down)
  const handleMove = async (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= items.length) return;

    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;

    setItems(copy);

    try {
      const ids = copy.map((it) => it.id || it._id);
      await reorderAdminCatalog(activeModule, ids);
      showToast("Order updated!");
    } catch {
      // Revert if API failed
      await loadItems();
    }
  };

  // Save Modal (Create / Edit)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        [currentModDef.titleField]: formData.title.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        image: formData.imageUrl.trim(),
        imageUrl: formData.imageUrl.trim(),
        category: formData.category.trim(),
      };

      if (activeModule === "banners") {
        payload.title = formData.title.trim();
        payload.subtitle = formData.extra1.trim();
        payload.ctaLink = formData.extra2.trim();
        payload.module = formData.category.trim() || "home";
        payload.sortOrder = Number(formData.price) || 0;
      } else if (activeModule === "offers") {
        payload.title = formData.title.trim();
        payload.code = formData.slug.trim().toUpperCase() || formData.extra1.trim().toUpperCase();
        payload.discountPercent = Number(formData.price) || 10;
        payload.badge = formData.extra2.trim() || "SPECIAL";
      } else if (activeModule === "videos") {
        payload.title = formData.title.trim();
        payload.destination = formData.capacity.trim() || "Dubai";
        payload.videoUrl = formData.extra1.trim();
        payload.travelerName = formData.extra2.trim();
        payload.thumbnailUrl = formData.imageUrl.trim();
      } else if (activeModule === "reviews") {
        payload.author = formData.title.trim();
        payload.rating = Number(formData.price) || 5;
        payload.comment = formData.description.trim();
        payload.tourName = formData.capacity.trim();
        payload.avatar = formData.imageUrl.trim();
      } else if (activeModule === "faqs") {
        payload.question = formData.title.trim();
        payload.answer = formData.description.trim();
        payload.category = formData.category.trim() || "general";
      } else if (activeModule === "partners") {
        payload.name = formData.title.trim();
        payload.logoUrl = formData.imageUrl.trim();
        payload.websiteUrl = formData.extra2.trim();
        payload.category = formData.category.trim() || "airline";
      } else if (activeModule === "pages") {
        payload.title = formData.title.trim();
        payload.slug = formData.slug.trim().toLowerCase();
        payload.contentHtml = formData.description.trim();
      } else {
        // Standard catalog items
        payload[currentModDef.priceField] = Number(formData.price);
        if (activeModule === "flights") {
          payload.flightNumber = formData.title.trim();
          payload.availableSeats = Number(formData.capacity) || 20;
        } else if (activeModule === "hotels") {
          payload.title = formData.title.trim();
          payload.starRating = Number(formData.capacity) || 4;
        } else if (activeModule === "transfers") {
          payload.vehicleType = formData.capacity || "Sedan";
        } else if (activeModule === "buildpackage") {
          payload.destinationName = formData.title.trim();
          payload.startingPrice = Number(formData.price);
          payload.country = formData.capacity || "India";
        }
      }

      if (modalMode === "create") {
        await createAdminCatalogItem(activeModule, payload);
        showToast(`${currentModDef.singular} created successfully!`);
      } else if (modalMode === "edit" && editingItem) {
        const id = editingItem.id || editingItem._id;
        await updateAdminCatalogItem(activeModule, id, { ...editingItem, ...payload });
        showToast(`${currentModDef.singular} updated successfully!`);
      }

      setModalMode(null);
      await loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (item: any) => {
    const id = item.id || item._id;
    const title = item[currentModDef.titleField] || item.title || item.name || item.question || item.author || id;
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteAdminCatalogItem(activeModule, id);
      showToast(`Deleted ${title}`);
      await loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      showToast(msg, "error");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 max-w-lg px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold flex items-center gap-3 transition-all break-words ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <span className="text-base shrink-0">{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span className="flex-1">{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            className="text-white/80 hover:text-white ml-2 text-xs font-bold uppercase shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: currentBrand.color }}
            >
              {currentBrand.label}
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Service & Content Catalog
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Universal Content & Catalog Manager
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage live inventory, hero banners, special offers, videos, FAQs, and pages for {currentBrand.label}.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>+ Add New</span>
          <span>{currentModDef.singular}</span>
        </button>
      </div>

      {/* ─── Module Tabs ─── */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
        {MODULES.map((mod) => (
          <button
            key={mod.key}
            type="button"
            onClick={() => {
              setActiveModule(mod.key);
              setSearchTerm("");
            }}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeModule === mod.key
                ? "bg-slate-900 text-white shadow font-bold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>{mod.icon}</span>
            <span>{mod.name}</span>
          </button>
        ))}
      </div>

      {/* Search & Refresh */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-gray-400 pl-1">🔍</span>
          <input
            type="text"
            placeholder={`Search ${currentModDef.name.toLowerCase()}…`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm text-gray-900 focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="text-xs text-gray-400 hover:text-gray-600 pr-1"
            >
              Clear
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={loadItems}
          disabled={loading}
          className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400 text-sm font-semibold">
            Loading {currentModDef.name.toLowerCase()} from MongoDB…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-gray-400 text-sm">
            No {currentModDef.name.toLowerCase()} found in active database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Item Details</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Key / Price</th>
                  <th className="px-5 py-3">Category / Tag</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedItems.map((item, idx) => {
                  const id = item.id || item._id;
                  const title = item[currentModDef.titleField] || item.title || item.name || item.question || item.author || "Untitled";
                  const slug = item.slug || item.destinationSlug || item.code || "—";
                  const price = item[currentModDef.priceField] ?? item.price ?? item.discountPercent ?? item.rating ?? 0;
                  const rawCap = item[currentModDef.capacityField] || item.category || item.destination;
                  const capacity = typeof rawCap === "object" && rawCap !== null
                    ? (rawCap.cityName || rawCap.name || "—")
                    : (rawCap || "—");
                  const img = item.image || item.imageUrl || item.logoUrl || item.thumbnailUrl || (Array.isArray(item.images) ? item.images[0] : null);

                  const isActive = item.isActive !== false && item.status !== "inactive" && item.status !== "Inactive";

                  return (
                    <tr key={id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Reorder Buttons */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMove(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(idx, "down")}
                            disabled={idx === paginatedItems.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      {/* Item Details */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {img ? (
                            <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                              <Image
                                src={img.startsWith("http") || img.startsWith("/") ? img : `/${img}`}
                                alt={title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0 border border-gray-200">
                              {currentModDef.icon}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-900 line-clamp-1">{title}</div>
                            <div className="text-xs text-gray-400 font-mono line-clamp-1">
                              {slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                          }`}
                        >
                          {isActive ? "● Active" : "○ Inactive"}
                        </button>
                      </td>

                      {/* Price / Rate / Number */}
                      <td className="px-5 py-3.5 font-black text-gray-900">
                        {activeModule === "offers" ? `${price}% OFF` : activeModule === "reviews" ? `★ ${price}` : typeof price === "number" ? `₹${price.toLocaleString()}` : price}
                      </td>

                      {/* Tag / Category */}
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        <span className="px-2 py-0.5 rounded bg-gray-100 font-semibold">
                          {String(capacity)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {filteredItems.length > 0 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
                <div>
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} items
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 font-bold hover:bg-gray-100 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-1.5 font-bold text-gray-900 bg-white border border-gray-200 rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 font-bold hover:bg-gray-100 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL: Create / Edit Item ─── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {modalMode === "create" ? "Create New" : "Edit"} {currentModDef.singular}
                </h3>
                <p className="text-xs text-gray-500">
                  Tenant: <strong className="text-gray-800">{currentBrand.label}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Title / Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={`Enter ${currentModDef.singular.toLowerCase()} title…`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Slug / Code
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. desert-safari or GUJJU20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {activeModule === "offers" ? "Discount %" : activeModule === "reviews" ? "Rating (1-5)" : "Price / Cost / Order"}
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Category / Scoped Module
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Adventure, Luxury, home"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Feature / Tag / Capacity
                  </label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g. 5 Stars, 4 Nights, Sedan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Module-Specific Extra Fields */}
              {(activeModule === "banners" || activeModule === "videos" || activeModule === "partners" || activeModule === "offers") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {activeModule === "banners" ? "Subtitle / Subtext" : activeModule === "videos" ? "Video URL (.mp4)" : "Code / Extra"}
                    </label>
                    <input
                      type="text"
                      value={formData.extra1}
                      onChange={(e) => setFormData({ ...formData, extra1: e.target.value })}
                      placeholder="e.g. Promotional subtext or video stream URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {activeModule === "banners" ? "CTA Action Link" : activeModule === "partners" ? "Website URL" : "Badge / Subtitle"}
                    </label>
                    <input
                      type="text"
                      value={formData.extra2}
                      onChange={(e) => setFormData({ ...formData, extra2: e.target.value })}
                      placeholder="e.g. /en/tours or https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Image URL & File Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Image URL / Upload Photo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/... or /uploads/..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1">
                    <span>{uploadingImage ? "Uploading…" : "📁 Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.imageUrl && (
                  <div className="mt-2 relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                    <Image
                      src={formData.imageUrl.startsWith("http") || formData.imageUrl.startsWith("/") ? formData.imageUrl : `/${formData.imageUrl}`}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description / Body / Details
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide comprehensive details for customers…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  {submitting ? "Saving…" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
