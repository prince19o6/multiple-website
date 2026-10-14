/**
 * config/website2.ts
 *
 * Adventure World (TripGoAsia) — static theme + default dynamic data.
 * TypeScript port of web/config/website2.js — identical content.
 */

const staticTheme = {
  id: 'website2',
  name: 'Adventure World',
  tagline: 'Adventure Starts Here',
  logo: 'https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/headerLogoId/237a7ac1-5310-4d08-8990-5e0e72f048f8_logo.svg',


  concept: { type: 'adventure', style: 'bold', mood: 'energetic', layout: 'dynamic' },

  theme: {
    primary: '#16a34a',
    primaryDark: '#15803d',
    primaryLight: '#dcfce7',
    secondary: '#052e16',
    accent: '#f97316',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#14532d',
    heading: '#052e16',
    mutedText: '#4b5563',
    border: '#bbf7d0',
    success: '#16a34a',
    danger: '#dc2626',
    footerBg: '#052e16',
    footerText: '#f0fdf4',
  },

  typography: {
    headingFont: 'Poppins',
    bodyFont: 'Inter',
    headingWeight: '800',
    bodyWeight: '400',
    headingStyle: 'bold',
    heroTitleSize: 'extra-large',
    letterSpacing: 'tight',
  },

  navigation: {
    style: 'adventure',
    position: 'top',
    sticky: true,
    transparentOnHero: true,
    logoPosition: 'left',
    menuAlignment: 'right',
    showHome: true,
    showTours: true,
    showDestinations: true,
    showBooking: true,
    showLogin: true,
    showRegister: true,
    showContact: false,
    mobileMenuStyle: 'fullscreen',
    activeMenuStyle: 'pill',
    loginButton: true,
    registerButton: true,
    registerButtonText: 'Join Adventure',
    background: '#052e16',
    textColor: '#ffffff',
    activeColor: '#f97316',
  },

  buttons: {
    style: 'pill',
    size: 'large',
    uppercase: true,
    fontWeight: '700',
    animation: 'bounce',
    primary: { background: '#f97316', text: '#ffffff', hover: '#ea580c' },
    secondary: { background: 'transparent', text: '#ffffff', border: '#ffffff', hover: '#ffffff' },
    danger: { background: '#dc2626', text: '#ffffff' },
  },

  cards: {
    style: 'adventure',
    radius: 'medium',
    shadow: 'large',
    hoverEffect: 'scale',
    border: true,
    imageHeight: '240px',
    padding: 'large',
    showRating: true,
    showPrice: true,
    showDuration: true,
    showDifficulty: true,
    showLocation: true,
  },

  tourCard: {
    layout: 'image-overlay',
    imagePosition: 'background',
    showImage: true,
    showRating: true,
    showDuration: true,
    showLocation: true,
    showDifficulty: true,
    showDescription: true,
    showPrice: true,
    showBookButton: true,
    bookButtonText: 'JOIN ADVENTURE',
    detailsButtonText: 'VIEW ADVENTURE',
    pricePrefix: 'Starting',
    currency: '$',
    badge: { enabled: true, text: 'Adventure' },
    difficultyColors: {
      Easy: '#16a34a',
      Moderate: '#f59e0b',
      Hard: '#ea580c',
      Extreme: '#dc2626',
    },
  },

  icons: {
    style: 'square',
    position: 'left',
    size: 'medium',
    background: 'light',
    animation: 'bounce',
  },

  booking: {
    style: 'adventure',
    requireLogin: true,
    showGuestForm: false,
    showDate: true,
    showTravelers: true,
    showSpecialRequest: true,
    showPayment: true,
    showEmergencyContact: true,
    showExperienceLevel: true,
    showEquipmentSelection: true,
    confirmationPage: true,
    successMessage: 'Your adventure has been booked! Get ready for an unforgettable experience.',
    buttonText: 'CONFIRM ADVENTURE',
  },

  authentication: {
    style: 'dark',
    showSocialLogin: true,
    showRememberMe: true,
    showForgotPassword: true,
    loginTitle: 'Welcome Back, Explorer',
    registerTitle: 'Join The Adventure',
    loginButtonText: 'LOGIN',
    registerButtonText: 'CREATE ADVENTURE ACCOUNT',
  },

  homeSections: ['hero', 'activities', 'featuredTours', 'difficulty', 'destinations', 'whyChooseUs', 'stats', 'cta'],

  features: {
    showWhyChooseUs: true,
    showStats: true,
    showFeaturedTours: true,
    showDestinations: true,
    showActivities: true,
    showDifficulty: true,
    showCTA: true,
    showNewsletter: true,
    showSearch: true,
    showAdventureFilters: true,
  },
} as const;

const defaultDynamicData = {
  hero: {
    style: 'full-screen',
    height: 'extra-large',
    title: 'Start Your Adventure',
    subtitle: 'Adventure Starts Here',
    description: 'Climb mountains, explore hidden places, experience wild nature, and create stories you\'ll never forget.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&h=900&fit=crop',
    imagePosition: 'center',
    alignment: 'center',
    overlay: true,
    overlayOpacity: 'medium',
    showBadge: true,
    badgeText: '🔥 Explore. Experience. Conquer.',
    showSearch: true,
    searchPlaceholder: 'Search adventure activities...',
    primaryButton: { text: 'Find Adventure', action: 'explore', icon: '🏔️' },
    secondaryButton: { text: 'Explore Activities', action: 'activities', icon: '🔥' },
  },

  activities: {
    enabled: true,
    title: 'Choose Your Adventure',
    subtitle: 'From peaceful hikes to extreme experiences — choose how you want to explore.',
    layout: 'horizontal-scroll',
    items: [
      { id: 'trekking', icon: '🥾', title: 'Trekking', description: 'Explore breathtaking mountain trails.', filter: 'trekking' },
      { id: 'camping', icon: '🏕️', title: 'Camping', description: 'Sleep under the stars and enjoy nature.', filter: 'camping' },
      { id: 'rafting', icon: '🚣', title: 'River Rafting', description: 'Experience the thrill of rushing rivers.', filter: 'rafting' },
      { id: 'climbing', icon: '🧗', title: 'Rock Climbing', description: 'Challenge yourself on amazing cliffs.', filter: 'climbing' },
      { id: 'safari', icon: '🦁', title: 'Wildlife Safari', description: 'Discover wildlife in its natural habitat.', filter: 'safari' },
      { id: 'water', icon: '🌊', title: 'Water Sports', description: 'Enjoy exciting experiences on the water.', filter: 'water-sports' },
    ],
  },

  whyChooseUs: {
    enabled: true,
    style: 'dark-cards',
    title: 'Why Choose Adventure World?',
    description: 'Real experiences, professional guides, and unforgettable adventures.',
    columns: 3,
    items: [
      { icon: '🧭', title: 'Expert Adventure Guides', description: 'Experienced guides who know every trail, river, and mountain.' },
      { icon: '⛑️', title: 'Safety First', description: 'Professional equipment and carefully planned adventure experiences.' },
      { icon: '🔥', title: 'Real Adventures', description: 'Authentic experiences designed for people who love adventure.' },
    ],
  },

  featuredTours: {
    enabled: true,
    title: 'Trending Adventures',
    subtitle: 'Discover the adventures everyone is talking about.',
    limit: 6,
    layout: 'large-grid',
    columns: 3,
    showViewAll: true,
    viewAllText: 'EXPLORE ALL ADVENTURES',
  },

  destinations: {
    enabled: true,
    title: 'Adventure Destinations',
    subtitle: 'Places made for explorers, thrill seekers and nature lovers.',
    layout: 'large-image-grid',
    columns: 3,
    showViewAll: true,
    viewAllText: 'EXPLORE DESTINATIONS',
    cardStyle: 'image-overlay',
  },

  difficulty: {
    enabled: true,
    title: 'Choose Your Difficulty',
    levels: [
      { id: 'easy', label: 'Easy', icon: '🟢', description: 'Perfect for beginners.' },
      { id: 'moderate', label: 'Moderate', icon: '🟡', description: 'For active travelers.' },
      { id: 'hard', label: 'Hard', icon: '🟠', description: 'For experienced adventurers.' },
      { id: 'extreme', label: 'Extreme', icon: '🔴', description: 'Only for serious adventurers.' },
    ],
  },

  stats: {
    enabled: true,
    style: 'dark',
    background: 'secondary',
    items: [
      { number: '25K+', label: 'Adventurers' },
      { number: '300+', label: 'Adventure Tours' },
      { number: '75+', label: 'Adventure Destinations' },
      { number: '98%', label: 'Happy Explorers' },
    ],
  },

  cta: {
    enabled: true,
    style: 'full-image',
    title: 'The Mountains Are Calling',
    description: 'Stop dreaming about adventure. Start experiencing it.',
    buttonText: 'START MY ADVENTURE',
    buttonAction: 'explore',
  },

  footer: {
    style: 'dark',
    showLogo: true,
    showDescription: true,
    description: 'Adventure World connects explorers with unforgettable experiences across the planet.',
    showQuickLinks: true,
    showContact: true,
    showSocialLinks: true,
    showNewsletter: true,
    newsletterTitle: 'Get Adventure Updates',
    copyright: '© 2026 Adventure World. Adventure is waiting.',
  },

  contact: {
    email: 'info@adventureworld.com',
    phone: '+91 98765 43210',
    address: 'India',
    workingHours: 'Every Day: 8:00 AM - 8:00 PM',
  },

  social: { instagram: '#', facebook: '#', twitter: '#', youtube: '#' },
};

export function createWebsiteConfig(dynamicData: Partial<typeof defaultDynamicData> = {}) {
  const data = { ...defaultDynamicData, ...dynamicData };
  return {
    ...staticTheme,
    hero: data.hero,
    activities: data.activities,
    whyChooseUs: data.whyChooseUs,
    featuredTours: data.featuredTours,
    destinations: data.destinations,
    difficulty: data.difficulty,
    stats: data.stats,
    cta: data.cta,
    footer: data.footer,
    contact: data.contact,
    social: data.social,
  };
}

const website2 = createWebsiteConfig();
export default website2;
