"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { api } from "@/lib/api/client";

interface FAQItem {
  id: string;
  category: "booking" | "packages" | "jain" | "visa" | "cancellation";
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "f1",
    category: "booking",
    question: "How do I book a tour or holiday package on the platform?",
    answer:
      "You can select your preferred tour, hotel, or holiday package directly through our search widget. For instant attractions, click 'Book Now' to complete your dates and travelers. For tailor-made packages, use our 'Build Package' tool or submit an inquiry to receive a customized quote with direct supplier rates.",
  },
  {
    id: "f2",
    category: "booking",
    question: "What payment methods do you accept?",
    answer:
      "We accept major Credit & Debit cards (Visa, MasterCard, American Express), Net Banking, UPI (Google Pay, PhonePe, Paytm), and direct bank wire transfers. All transactions are protected by 256-bit SSL encryption.",
  },
  {
    id: "f3",
    category: "jain",
    question: "Are pure vegetarian and Jain food options guaranteed?",
    answer:
      "Yes, absolutely! We specialize in catering to travelers seeking authentic vegetarian and strictly Jain meals (prepared without onion, garlic, or root vegetables). On our curated group tours, we provide dedicated culinary staff and select verified restaurants to ensure your dietary practices are respected 100%.",
  },
  {
    id: "f4",
    category: "packages",
    question: "Can I customize an existing holiday itinerary?",
    answer:
      "Yes. Every itinerary can be adjusted to your preference. You can add extra nights, upgrade hotel room categories, substitute sightseeing attractions, or request private transfers instead of shared coaches.",
  },
  {
    id: "f5",
    category: "visa",
    question: "Do you provide tourist visa assistance for international travel?",
    answer:
      "Yes, our dedicated visa documentation desk assists with tourist visas for UAE (Dubai), Singapore, Thailand, Malaysia, Vietnam, Bali (Indonesia eVisa), Europe (Schengen), and the UK. We guide you through document requirements, photo specifications, and application tracking.",
  },
  {
    id: "f6",
    category: "cancellation",
    question: "What is your cancellation and refund policy?",
    answer:
      "Cancellation terms depend on the specific airline, hotel, and attraction policies. Most day tours and sightseeing tickets offer free cancellation up to 24-48 hours before the scheduled time. Complete package cancellations are subject to airline fare rules and hotel seasonal policies, which are always transparently provided before booking.",
  },
  {
    id: "f7",
    category: "packages",
    question: "Are airport transfers private or shared?",
    answer:
      "We offer both private and shared options. On private packages, you will have a dedicated chauffeur greeting you with a nameboard at the airport arrivals terminal. Shared transfers operate on scheduled timings between major hubs and hotels.",
  },
  {
    id: "f8",
    category: "booking",
    question: "How will I receive my booking vouchers and tickets?",
    answer:
      "Upon payment confirmation, your digital vouchers and tickets are instantly dispatched to your registered email and WhatsApp number. You can also view and download all past and upcoming vouchers anytime from your 'My Bookings' portal.",
  },
];

export default function FAQPage() {
  const config = useSiteConfig();
  const site = useSite();
  const brandName = config.name || "Gujju Tours";

  const [faqList, setFaqList] = useState<FAQItem[]>(FAQS);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>("f1");

  useEffect(() => {
    let isMounted = true;
    async function loadDynamicFaqs() {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>(
          `/api/faqs`,
          { siteId: site.siteId }
        );
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: FAQItem[] = res.data.map((item: any, idx: number) => ({
            id: String(item.id || `faq_${idx}`),
            category: item.category || "booking",
            question: item.question || item.title || "",
            answer: item.answer || item.description || "",
          }));
          setFaqList(mapped);
          if (mapped[0]?.id) setExpandedId(mapped[0].id);
        }
      } catch {
        // Keep fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDynamicFaqs();
    return () => {
      isMounted = false;
    };
  }, [site.siteId]);

  const filteredFaqs = faqList.filter((faq) => {
    const matchesCat = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/en" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
            Frequently Asked Questions
          </span>
        </nav>

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
            Help &amp; Support Center
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Find answers to common questions about booking, payments, Jain meals, visas, and cancellation policies at {brandName}.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords (e.g. Jain food, refund, visa, transfers)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs shadow-sm outline-none focus:border-primary-500"
          />
          <span className="absolute left-4 top-3.5 text-neutral-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-3.5 text-xs text-neutral-400 hover:text-neutral-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 justify-center text-xs font-bold">
          {[
            { id: "all", label: "All Questions" },
            { id: "booking", label: "Booking & Payments" },
            { id: "packages", label: "Holidays & Packages" },
            { id: "jain", label: "Jain & Dietary Meals" },
            { id: "visa", label: "Visas & Travel Docs" },
            { id: "cancellation", label: "Refunds & Cancellations" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeCategory === cat.id
                  ? "bg-primary-600 text-white shadow"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 animate-pulse flex items-center justify-between"
                >
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8">
              <span className="text-3xl">🤔</span>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-2">
                No matching questions found
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Try searching with different terms or contact our live help desk.
              </p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <span className="text-base text-neutral-400 font-mono shrink-0">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 pt-3 animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Need Help Box */}
        <div className="bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-3xl p-6 sm:p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Still Have Questions?
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
            Our destination experts are available 7 days a week to answer your specific requirements.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/en/contact-us"
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Contact Travel Desk
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
