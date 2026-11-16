"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import type { ComponentConfig } from "@/lib/config/siteConfigSchema";

interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

interface FaqAccordionSectionProps {
  config: MergedWebsiteConfig | any;
  component?: ComponentConfig;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: "How do I receive my booking voucher and e-tickets?",
    answer:
      "Your digital booking voucher with instant QR code access is sent to your email immediately upon booking confirmation. You can also view, download, or print your vouchers anytime under your account in 'My Bookings'.",
    category: "Bookings",
  },
  {
    question: "What is your cancellation and refund policy?",
    answer:
      "Most tours and activities provide 100% free cancellation up to 48 hours prior to your scheduled departure. Legitimate cancellations within the permitted window are refunded directly to your original payment method with zero hidden fees.",
    category: "Cancellations",
  },
  {
    question: "Are airport transfers and hotel pickups included?",
    answer:
      "Complimentary hotel pickups and airport transfers are included on all curated holiday packages and select private excursions. Specific pickup timings and chauffeur contact details are confirmed 24 hours prior to travel.",
    category: "Transfers",
  },
  {
    question: "Are pure vegetarian and Jain dietary meals guaranteed?",
    answer:
      "Yes! We have established verified dietary partnerships across international circuits including Dubai, Southeast Asia, and Europe, guaranteeing fresh Pure Vegetarian and Jain catering prepared according to traditional culinary guidelines.",
    category: "Meals",
  },
  {
    question: "Can I customize an existing package or create a multi-city itinerary?",
    answer:
      "Absolutely. You can use our interactive 1-click 'Build Package' engine to combine custom flights, 4-star/5-star hotels, daily excursions, and private airport transfers, or contact our 24/7 travel desk for a bespoke itinerary.",
    category: "Customization",
  },
  {
    question: "How do I contact customer support during my trip?",
    answer:
      "You have direct access to our 24/7 dedicated regional support specialists via WhatsApp, phone, and email. Emergency desk contact details are provided on your digital confirmation voucher.",
    category: "Support",
  },
];

export default function FaqAccordionSection({
  config,
  component,
}: FaqAccordionSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Read site-configured FAQs or fallback to rich defaults
  const faqs: FaqItem[] = React.useMemo(() => {
    const configured = config?.content?.faqs;
    if (Array.isArray(configured) && configured.length > 0) {
      return configured.map((f: any) => ({
        question: f.question || f.title || "",
        answer: f.answer || f.description || "",
        category: f.category || "General",
      }));
    }
    return DEFAULT_FAQS;
  }, [config]);

  const title =
    component?.title ||
    config?.content?.faqTitle ||
    "Frequently Asked Questions";

  const toggleAccordion = (idx: number) => {
    setOpenIndex((curr) => (curr === idx ? null : idx));
  };

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground"
      data-section="faq"
    >
      <div className="bg-surface-2 rounded-3xl p-6 sm:p-10 shadow-soft-sm border border-border">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-light text-primary text-[11px] font-bold uppercase tracking-widest border border-primary/20 mb-3">
            Help &amp; Answers
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted mt-2 leading-relaxed">
            Everything you need to know about booking, e-vouchers, dietary requests, and flexible cancellation policies.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={`${faq.question}-${idx}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "bg-surface border-primary shadow-soft-sm"
                    : "bg-surface/70 border-border hover:border-border-strong hover:bg-surface"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-foreground transition-colors outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-primary font-black text-xs">Q.</span>
                    <span>{faq.question}</span>
                  </span>
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform duration-200 ${
                      isOpen
                        ? "bg-primary text-white rotate-180"
                        : "bg-surface-2 text-foreground-muted"
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-foreground-muted leading-relaxed border-t border-border/50 animate-fadeIn">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Link to Full FAQ */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-foreground-muted">
            Still have questions? Our 24/7 dedicated travel desk is ready to help.
          </span>
          <Link
            href="/en/faq"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary-light transition-colors"
          >
            <span>Browse Full Knowledge Base</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

