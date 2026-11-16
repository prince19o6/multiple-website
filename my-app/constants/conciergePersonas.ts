/**
 * constants/conciergePersonas.ts
 *
 * Dedicated brand specialist profiles and pre-canned inquiries.
 *
 * Features:
 *   - Culturally authentic specialist personas:
 *     - GujjuTours: Pradeep Bhai (Pilgrimage & Pure Veg Cultural Guide)
 *     - TripGoAsia: Nok Somchai (Southeast Asia Island & Rainforest Guide)
 *     - Technoheaven: Alexandre Laurent (VIP Clefs d'Or Private Butler)
 *   - Pre-canned quick inquiries tailored to tenant
 *   - Offline-first fallbacks
 *   - Strict TypeScript typing with zero `any`
 */

import type { ConciergeSpecialist } from '@/types';

export const CONCIERGE_PERSONAS: Record<string, ConciergeSpecialist> = {
  gujjutours: {
    specialistName: 'Pradeep Bhai',
    role: 'Cultural Expeditions & Pilgrimage Specialist',
    bio: 'Specialized in cultural heritage, sacred Gujarat & North India darshans, and pure Jain culinary catering with 14+ years experience.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    languages: ['ગુજરાતી (Gujarati)', 'हिन्दी (Hindi)', 'English'],
    welcomeGreeting: 'જય શ્રી કૃષ્ણ! Namaste! I am Pradeep Bhai, your personal GujjuTours concierge. How can I help customize your journey, arrange Pure Jain meals, or fast-track temple darshans today?',
    status: 'online',
    typicalReplyTime: 'Under 2 minutes',
    whatsAppNumber: '+919825012345',
    supportPhone: '+91 98250 12345',
    supportEmail: 'concierge@gujjutours.com',
    quickInquiries: [
      'Are 100% Pure Jain & Swaminarayan meals arranged?',
      'Can we get VIP Fast-Track temple entry passes?',
      'Do you provide Gujarati-speaking tour escorts?',
      'Can we customize dates for private family groups?',
    ],
  },

  tripgoasia: {
    specialistName: 'Nok Somchai',
    role: 'Southeast Asia Island & Rainforest Guide',
    bio: 'Certified marine naturalist and regional specialist for Thailand, Vietnam, Bali, and Singapore adventures.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    languages: ['ภาษาไทย (Thai)', 'Tiếng Việt (Vietnamese)', 'English'],
    welcomeGreeting: 'Sawatdee Khrap! Welcome to TripGoAsia. I\'m Nok Somchai. Ready for tropical islands and jungle adventures? Ask me about visas, island speedboats, or weather conditions!',
    status: 'online',
    typicalReplyTime: 'Under 2 minutes',
    whatsAppNumber: '+66812345678',
    supportPhone: '+66 2 123 4567',
    supportEmail: 'adventures@tripgoasia.com',
    quickInquiries: [
      'What are the visa on arrival rules for Thailand & Vietnam?',
      'What is the best month for scuba diving in Phuket & Krabi?',
      'Is the 5G Traveler eSIM ready on arrival?',
      'Can we book a private speedboat island hopping day?',
    ],
  },

  technoheaven: {
    specialistName: 'Alexandre Laurent',
    role: 'VIP Private Butler & Bespoke Expeditions Lead',
    bio: 'Member of "Les Clefs d\'Or". Curating private aviation, luxury yacht charters, and bespoke private estates globally.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Français', 'العربية (Arabic)'],
    welcomeGreeting: 'Bonjour. Welcome to Technoheaven VIP Travel. I am Alexandre Laurent, at your service for private aviation charters, bespoke chauffeur limousines, and Michelin culinary reservations.',
    status: 'online',
    typicalReplyTime: 'Under 1 minute',
    whatsAppNumber: '+971501234567',
    supportPhone: '+971 4 321 0000',
    supportEmail: 'vip@technoheaven.com',
    quickInquiries: [
      'Can we arrange a Mercedes Maybach VIP airport chauffeur?',
      'Are private helicopter transfers available between cities?',
      'Can you reserve a private Chef’s Table Michelin experience?',
      'What is the policy for bespoke luxury itinerary alterations?',
    ],
  },
};

/**
 * Resolves the specialist persona for the active tenant.
 */
export function getSpecialistForSite(siteId: string): ConciergeSpecialist {
  const normalized = (siteId || '').toLowerCase();
  if (normalized.includes('tripgo')) return CONCIERGE_PERSONAS.tripgoasia;
  if (normalized.includes('techno')) return CONCIERGE_PERSONAS.technoheaven;
  return CONCIERGE_PERSONAS.gujjutours;
}
