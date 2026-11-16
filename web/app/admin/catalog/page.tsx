"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  fetchAdminCatalog,
  createAdminCatalogItem,
  updateAdminCatalogItem,
  deleteAdminCatalogItem,
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
  { key: "flights", name: "Flights", icon: "✈️", singular: "Flight", titleField: "flightNumber", priceField: "price", capacityField: "availableSeats" },
  { key: "transfers", name: "Transfers", icon: "🚖", singular: "Transfer", titleField: "name", priceField: "price", capacityField: "vehicleType" },
  { key: "visas", name: "Visas", icon: "🛂", singular: "Visa", titleField: "country", priceField: "price", capacityField: "visaType" },
  { key: "restaurants", name: "Restaurants", icon: "🍽️", singular: "Restaurant", titleField: "name", priceField: "averageCost", capacityField: "cuisine" },
  { key: "packages", name: "Holiday Packages", icon: "🌴", singular: "Package", titleField: "title", priceField: "price", capacityField: "durationDays" },
  { key: "buildpackage", name: "Custom Package", icon: "🧩", singular: "Destination", titleField: "destinationName", priceField: "startingPrice", capacityField: "country" },
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
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.tripgoasia;
  const currentModDef = MODULES.find((m) => m.key === activeModule) || MODULES[0];

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminCatalog(activeModule, { search: searchTerm, limit: 100 });
      setItems(res.data || []);
      setCurrentPage(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load catalog items";
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
      const title = String(item[currentModDef.titleField] || item.title || item.name || "").toLowerCase();
      const slug = String(item.slug || item.destinationSlug || "").toLowerCase();
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
      price: 150,
      capacity: "",
      category: "",
      description: "",
      imageUrl: "",
    });
    setModalMode("create");
  };

  // Open Edit Modal
  const openEditModal = (item: any) => {
    setEditingItem(item);
    const titleVal = item[currentModDef.titleField] || item.title || item.name || "";
    const slugVal = item.slug || item.destinationSlug || "";
    const priceVal = item[currentModDef.priceField] || item.price || 0;
    const rawCap = item[currentModDef.capacityField];
    const capVal = typeof rawCap === "object" && rawCap !== null
      ? (rawCap.cityName || rawCap.name || "")
      : (rawCap || "");
    const imgVal = item.image || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : "") || "";

    const catVal = typeof item.category === "string" && item.category
      ? item.category
      : typeof item.destination === "string" && item.destination
      ? item.destination
      : typeof item.destination === "object" && item.destination
      ? (item.destination.cityName || item.destination.address || item.destination.country || "")
      : typeof item.city === "string" && item.city
      ? item.city
      : "";

    setFormData({
      title: String(titleVal),
      slug: String(slugVal),
      price: Number(priceVal),
      capacity: String(capVal),
      category: String(catVal),
      description: item.description || item.overview || "",
      imageUrl: String(imgVal),
    });
    setModalMode("edit");
  };

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug:
        modalMode === "create"
          ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
          : prev.slug,
    }));
  };

  // Image File Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadAdminCatalogImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: res.url }));
      showToast("Image uploaded successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed";
      showToast(msg, "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Create or Edit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Title / Name is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        [currentModDef.titleField]: formData.title.trim(),
        [currentModDef.priceField]: Number(formData.price),
        slug: formData.slug.trim(),
        destinationSlug: formData.slug.trim(),
        description: formData.description.trim(),
        image: formData.imageUrl.trim(),
        imageUrl: formData.imageUrl.trim(),
        category: formData.category.trim(),
      };

      if (currentModDef.key === "flights") {
        payload.flightNumber = formData.title.trim();
        payload.availableSeats = Number(formData.capacity) || 20;
      } else if (currentModDef.key === "hotels") {
        payload.title = formData.title.trim();
        payload.starRating = Number(formData.capacity) || 4;
      } else if (currentModDef.key === "transfers") {
        payload.vehicleType = formData.capacity || "Sedan";
      } else if (currentModDef.key === "buildpackage") {
        payload.destinationName = formData.title.trim();
        payload.startingPrice = Number(formData.price);
        payload.country = formData.capacity || "India";
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
    const title = item[currentModDef.titleField] || item.title || item.name || id;
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
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.text}</span>
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
              Catalog Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Universal Service Catalog
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Create, edit, price, and manage live inventory across all 8 modules for {currentBrand.label}.
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
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
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
          className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1"
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400 text-sm">
            Loading {currentModDef.name.toLowerCase()} from database…
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
                  <th className="px-5 py-3">Item Details</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Rate / Price</th>
                  <th className="px-5 py-3">Capacity / Feature</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedItems.map((item) => {
                  const id = item.id || item._id;
                  const title = item[currentModDef.titleField] || item.title || item.name || "Untitled";
                  const slug = item.slug || item.destinationSlug || "—";
                  const price = item[currentModDef.priceField] || item.price || 0;
                  const rawCap = item[currentModDef.capacityField];
                  const capacity = typeof rawCap === "object" && rawCap !== null
                    ? (rawCap.cityName || rawCap.name || "—")
                    : (rawCap || "—");
                  const img = item.image || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : null);

                  const subtitle =
                    typeof item.category === "string" && item.category
                      ? item.category
                      : typeof item.destination === "string" && item.destination
                      ? item.destination
                      : typeof item.destination === "object" && item.destination
                      ? (item.destination.cityName || item.destination.address || item.destination.country || "Destination")
                      : typeof item.city === "string" && item.city
                      ? item.city
                      : "Catalog Record";

                  return (
                    <tr key={id} className="hover:bg-gray-50/70 transition-colors">
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
                            <div className="text-xs text-gray-400 line-clamp-1">
                              {subtitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{slug}</td>
                      <td className="px-5 py-3.5 font-black text-gray-900">
                        ₹{Number(price).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        <span className="px-2 py-0.5 rounded bg-gray-100 font-semibold">
                          {String(capacity)}
                        </span>
                      </td>
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
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={`e.g. Deluxe ${currentModDef.singular} Option`}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Slug (URL identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Capacity / Attribute ({currentModDef.capacityField})
                  </label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g. 20 seats, 4-star, Sedan, 3 Days"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Category / Destination
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Dubai, Luxury, Hill Station"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Image URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://... or /seed-images/..."
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer whitespace-nowrap border border-gray-200">
                    {uploadingImage ? "Uploading…" : "📁 Upload File"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview and highlight features…"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-all"
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

