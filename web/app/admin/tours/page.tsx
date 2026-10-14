"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  fetchAdminTours,
  createAdminTour,
  updateAdminTour,
  deleteAdminTour,
  toggleAdminTour,
  onAdminSessionChange,
  ADMIN_SITE_NAMES,
  getAdminSite,
  type AdminTour,
} from "@/lib/adminApi";

export default function AdminTours() {
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">("name");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState<AdminTour | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState("Beach");
  const [formDestination, setFormDestination] = useState("");
  const [formPrice, setFormPrice] = useState<number>(599);
  const [formDiscountedPrice, setFormDiscountedPrice] = useState<number | undefined>(undefined);
  const [formDuration, setFormDuration] = useState("4 Days");
  const [formDifficulty, setFormDifficulty] = useState("Easy");
  const [formMaxGroupSize, setFormMaxGroupSize] = useState<number>(12);
  const [formImage, setFormImage] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formHighlights, setFormHighlights] = useState("");
  const [formIncluded, setFormIncluded] = useState("");
  const [formExcluded, setFormExcluded] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formPopular, setFormPopular] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadTours = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminTours();
      setTours(data);
    } catch (err: any) {
      showToast(err?.message || "Failed to load tour catalog", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTours();
    return onAdminSessionChange(() => {
      loadTours();
    });
  }, [loadTours]);

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.website1;

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>(["all"]);
    tours.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tours]);

  // Filtered & Sorted Tours
  const filteredTours = useMemo(() => {
    return tours
      .filter((t) => {
        const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
        const matchesSearch =
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.destination || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        return a.name.localeCompare(b.name);
      });
  }, [tours, categoryFilter, searchTerm, sortBy]);

  const openCreateModal = () => {
    setEditingTour(null);
    setFormName("");
    setFormSlug("");
    setFormCategory("Beach");
    setFormDestination("Goa");
    setFormPrice(499);
    setFormDiscountedPrice(undefined);
    setFormDuration("4 Days / 3 Nights");
    setFormDifficulty("Easy");
    setFormMaxGroupSize(15);
    setFormImage("https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800");
    setFormDescription("Experience pristine beaches, cultural discovery, and unforgettable memories.");
    setFormHighlights("Sunset cruise\nHeritage church walk\nTraditional culinary dinner");
    setFormIncluded("Hotel accommodation\nDaily breakfast\nGuided transport");
    setFormExcluded("Flights\nPersonal expenses\nTravel insurance");
    setFormFeatured(false);
    setFormPopular(false);
    setShowModal(true);
  };

  const openEditModal = (tour: AdminTour) => {
    setEditingTour(tour);
    setFormName(tour.name);
    setFormSlug(tour.slug || "");
    setFormCategory(tour.category || "Beach");
    setFormDestination(tour.destination || tour.location || "");
    setFormPrice(tour.price);
    setFormDiscountedPrice(tour.discountedPrice);
    setFormDuration(tour.duration || "3 Days");
    setFormDifficulty(tour.difficulty || "Moderate");
    setFormMaxGroupSize(tour.maxGroupSize || 12);
    setFormImage(tour.image || "");
    setFormDescription(tour.description || "");
    setFormHighlights((tour.highlights || []).join("\n"));
    setFormIncluded((tour.included || []).join("\n"));
    setFormExcluded((tour.excluded || []).join("\n"));
    setFormFeatured(!!tour.featured);
    setFormPopular(!!tour.popular);
    setShowModal(true);
  };

  const handleDuplicate = async (tour: AdminTour) => {
    if (!confirm(`Duplicate tour "${tour.name}"?`)) return;
    try {
      const cloned: Partial<AdminTour> = {
        name: `${tour.name} (Copy)`,
        slug: `${tour.slug || "tour"}-copy-${Date.now()}`,
        category: tour.category,
        destination: tour.destination,
        location: tour.location,
        price: tour.price,
        discountedPrice: tour.discountedPrice,
        duration: tour.duration,
        difficulty: tour.difficulty,
        maxGroupSize: tour.maxGroupSize,
        image: tour.image,
        description: tour.description,
        highlights: tour.highlights,
        included: tour.included,
        excluded: tour.excluded,
        featured: false,
        popular: false,
      };

      const created = await createAdminTour(cloned);
      setTours((prev) => [created, ...prev]);
      showToast(`Duplicated "${tour.name}" successfully!`);
    } catch (err: any) {
      showToast(err?.message || "Failed to duplicate tour", "error");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteAdminTour(id);
      setTours((prev) => prev.filter((t) => (t.id || t._id) !== id));
      showToast(`Tour "${name}" deleted.`);
    } catch (err: any) {
      showToast(err?.message || "Failed to delete tour", "error");
    }
  };

  const handleToggle = async (id: string, property: "featured" | "popular", currentVal: boolean) => {
    const newVal = !currentVal;
    try {
      await toggleAdminTour(id, property, newVal);
      setTours((prev) =>
        prev.map((t) => ((t.id || t._id) === id ? { ...t, [property]: newVal } : t))
      );
      showToast(`Updated ${property} status.`);
    } catch (err: any) {
      showToast(err?.message || "Failed to toggle status", "error");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDescription.trim()) {
      showToast("Please enter a tour title and description", "error");
      return;
    }

    setSubmitting(true);

    const payload: Partial<AdminTour> = {
      name: formName.trim(),
      slug: formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: formCategory,
      destination: formDestination.trim(),
      location: formDestination.trim(),
      price: Number(formPrice) || 0,
      discountedPrice: formDiscountedPrice ? Number(formDiscountedPrice) : undefined,
      duration: formDuration.trim(),
      difficulty: formDifficulty,
      maxGroupSize: Number(formMaxGroupSize) || 10,
      image: formImage.trim() || "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800",
      description: formDescription.trim(),
      highlights: formHighlights
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      included: formIncluded
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      excluded: formExcluded
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      featured: formFeatured,
      popular: formPopular,
    };

    try {
      if (editingTour) {
        const id = editingTour.id || editingTour._id || "";
        const updated = await updateAdminTour(id, payload);
        setTours((prev) =>
          prev.map((t) => ((t.id || t._id) === id ? { ...t, ...updated } : t))
        );
        showToast("Tour updated successfully!");
      } else {
        const created = await createAdminTour(payload);
        setTours((prev) => [created, ...prev]);
        showToast("New tour package created!");
      }
      setShowModal(false);
    } catch (err: any) {
      showToast(err?.message || "Failed to save tour", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Toast Alert ─── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Tours Catalog
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage packages, pricing, categories, and highlights for {currentBrand.label}.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Create New Tour</span>
        </button>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search tours..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Title (A-Z)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
          </select>
        </div>
      </div>

      {/* ─── Catalog Table ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading tours catalog...</div>
        ) : filteredTours.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No tours found matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Tour Details</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3 text-center">Featured</th>
                  <th className="px-5 py-3 text-center">Popular</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTours.map((tour) => {
                  const tourId = tour.id || tour._id || "";
                  return (
                    <tr key={tourId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            {tour.image ? (
                              <Image
                                src={tour.image}
                                alt={tour.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                🏞️
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">{tour.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {tour.destination || tour.location || "General"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {tour.category || "General"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{tour.duration}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-gray-900">${tour.price}</div>
                        {tour.discountedPrice && (
                          <div className="text-xs text-emerald-600 font-semibold">
                            Sale: ${tour.discountedPrice}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleToggle(tourId, "featured", !!tour.featured)}
                          className={`text-lg transition-transform active:scale-75 ${
                            tour.featured ? "opacity-100" : "opacity-30 grayscale"
                          }`}
                          title="Toggle Featured"
                        >
                          ⭐
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleToggle(tourId, "popular", !!tour.popular)}
                          className={`text-lg transition-transform active:scale-75 ${
                            tour.popular ? "opacity-100" : "opacity-30 grayscale"
                          }`}
                          title="Toggle Popular"
                        >
                          🔥
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(tour)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(tour)}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-all"
                          title="Duplicate Tour"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleDelete(tourId, tour.name)}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Tour Add / Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 my-8 border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTour ? "Edit Tour Package" : "Add New Tour Package"}
                </h2>
                <p className="text-xs text-gray-500">Tenant: {currentBrand.label}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tour Title *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Bali Sunset & Temples"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="auto-generated-if-empty"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Beach, Adventure, Cultural, Wildlife..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Destination / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    placeholder="e.g. Dubai, Phuket, Goa..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Pricing & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sale Price ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={formDiscountedPrice ?? ""}
                    onChange={(e) =>
                      setFormDiscountedPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Duration *</label>
                  <input
                    type="text"
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. 5 Days / 4 Nights"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Difficulty & Group Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Challenging">Challenging</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Max Group Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formMaxGroupSize}
                    onChange={(e) => setFormMaxGroupSize(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Highlights (One per line) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Key Highlights (one per line)
                </label>
                <textarea
                  rows={3}
                  value={formHighlights}
                  onChange={(e) => setFormHighlights(e.target.value)}
                  placeholder="Private island transfer&#10;Sunset yacht champagne dinner"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Included & Excluded */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    What&apos;s Included (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={formIncluded}
                    onChange={(e) => setFormIncluded(e.target.value)}
                    placeholder="Hotels&#10;Transfers"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    What&apos;s Excluded (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={formExcluded}
                    onChange={(e) => setFormExcluded(e.target.value)}
                    placeholder="Flights&#10;Visa fees"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Featured & Popular checkboxes */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Mark as Featured Tour</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPopular}
                    onChange={(e) => setFormPopular(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Mark as Popular Tour</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-60"
                >
                  {submitting ? "Saving..." : editingTour ? "Update Tour" : "Create Tour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}