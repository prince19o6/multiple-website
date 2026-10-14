/**
 * config/website3.ts
 *
 * Holiday Paradise (Technoheaven) — static theme + default dynamic data.
 * TypeScript port of web/config/website3.js — identical content.
 */

const staticTheme = {
  id: 'website3',
  name: 'Holiday Paradise',
  tagline: 'Relax. Escape. Enjoy.',
  logo: 'https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/headerLogoId/1f5bdd1e-28e7-4e96-8977-82f6b3cb4a7e_technologomain.svg',


  concept: { type: 'luxury-holiday', style: 'elegant', mood: 'relaxing', layout: 'editorial' },

  theme: {
    primary: '#dc2626',
    primaryDark: '#b91c1c',
    primaryLight: '#fee2e2',
    secondary: '#450a0a',
    accent: '#d4af37',
    background: '#fffaf7',
    surface: '#ffffff',
    text: '#3f3f46',
    heading: '#27120f',
    mutedText: '#71717a',
    border: '#e4d4cf',
    success: '#16a34a',
    danger: '#dc2626',
    footerBg: '#27120f',
    footerText: '#fffaf7',
  },

  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    headingWeight: '700',
    bodyWeight: '400',
    headingStyle: 'elegant',
    heroTitleSize: 'extra-large',
    letterSpacing: 'normal',
  },

  navigation: {
    style: 'luxury',
    position: 'top',
    sticky: true,
    transparentOnHero: true,
    logoPosition: 'center',
    menuAlignment: 'center',
    showHome: true,
    showTours: true,
    showDestinations: true,
    showBooking: true,
    showLogin: true,
    showRegister: false,
    showContact: true,
    mobileMenuStyle: 'drawer',
    activeMenuStyle: 'underline',
    loginButton: true,
    registerButton: false,
    registerButtonText: 'Join',
    background: '#ffffff',
    textColor: '#27120f',
    activeColor: '#dc2626',
  },

  buttons: {
    style: 'square',
    size: 'medium',
    uppercase: false,
    fontWeight: '600',
    animation: 'fade',
    primary: { background: '#dc2626', text: '#ffffff', hover: '#b91c1c' },
    secondary: { background: '#ffffff', text: '#dc2626', border: '#dc2626', hover: '#fff1f2' },
    danger: { background: '#991b1b', text: '#ffffff' },
  },

  cards: {
    style: 'luxury',
    radius: 'small',
    shadow: 'small',
    hoverEffect: 'image-zoom',
    border: true,
    imageHeight: '280px',
    padding: 'medium',
    showRating: true,
    showPrice: true,
    showDuration: true,
    showDifficulty: false,
    showLocation: true,
  },

  tourCard: {
    layout: 'luxury',
    imagePosition: 'top',
    showImage: true,
    showRating: true,
    showDuration: true,
    showLocation: true,
    showDifficulty: false,
    showDescription: true,
    showPrice: true,
    showBookButton: true,
    bookButtonText: 'Reserve Package',
    detailsButtonText: 'View Package',
    pricePrefix: 'Package from',
    currency: '$',
    badge: { enabled: true, text: 'Luxury Escape' },
    showIncluded: true,
    includedLabel: 'Package Includes',
  },

  icons: {
    style: 'hexagon',
    position: 'right',
    size: 'small',
    background: 'dark',
    animation: 'none',
  },

  booking: {
    style: 'holiday-package',
    requireLogin: false,
    showGuestForm: true,
    showDate: true,
    showTravelers: true,
    showSpecialRequest: true,
    showPayment: true,
    showRoomType: true,
    showMealPlan: true,
    showAirportTransfer: true,
    showAddOns: true,
    showInsurance: true,
    confirmationPage: true,
    successMessage: 'Your holiday reservation has been received. We look forward to making your stay special.',
    buttonText: 'Reserve My Holiday',
  },

  authentication: {
    style: 'luxury',
    showSocialLogin: true,
    showRememberMe: true,
    showForgotPassword: true,
    loginTitle: 'Welcome Back',
    registerTitle: 'Create Your Holiday Account',
    loginButtonText: 'Sign In',
    registerButtonText: 'Create Account',
  },

  homeSections: ['hero', 'packages', 'featuredTours', 'destinations', 'offers', 'whyChooseUs', 'testimonials', 'cta'],

  features: {
    showWhyChooseUs: true,
    showStats: false,
    showFeaturedTours: true,
    showDestinations: true,
    showPackages: true,
    showOffers: true,
    showTestimonials: true,
    showCTA: true,
    showNewsletter: true,
    showSearch: true,
    showRoomSelection: true,
  },
} as const;

const defaultDynamicData = {
  hero: {
    style: 'luxury-image',
    height: 'extra-large',
    title: 'Your Perfect Holiday Starts Here',
    subtitle: 'Relax. Escape. Enjoy.',
    description: 'Escape to extraordinary destinations, stay in beautiful resorts, and experience holidays designed around you.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&h=900&fit=crop',
    imagePosition: 'center',
    alignment: 'center',
    overlay: true,
    overlayOpacity: 'light',
    showBadge: true,
    badgeText: '✦ Curated Luxury Holidays',
    showSearch: true,
    searchPlaceholder: 'Where would you like to relax?',
    primaryButton: { text: 'Discover Holidays', action: 'explore', icon: '🏖️' },
    secondaryButton: { text: 'View Destinations', action: 'destinations', icon: '🌴' },
  },

  packages: {
    enabled: true,
    title: 'Choose Your Perfect Escape',
    subtitle: 'Select a holiday style and let us take care of the details.',
    layout: 'cards',
    items: [
      { id: 'beach', icon: '🏖️', title: 'Beach Escapes', description: 'Relax beside beautiful beaches and crystal-clear waters.', filter: 'beach' },
      { id: 'honeymoon', icon: '💑', title: 'Honeymoon', description: 'Romantic experiences created for unforgettable moments.', filter: 'honeymoon' },
      { id: 'family', icon: '👨‍👩‍👧‍👦', title: 'Family Holidays', description: 'Fun and comfortable holidays for the whole family.', filter: 'family' },
      { id: 'luxury', icon: '✨', title: 'Luxury Holidays', description: 'Premium stays, private experiences, and exceptional service.', filter: 'luxury' },
      { id: 'wellness', icon: '🧘', title: 'Wellness Retreats', description: 'Slow down, recharge, and focus on yourself.', filter: 'wellness' },
      { id: 'city', icon: '🏙️', title: 'City Breaks', description: 'Discover culture, food, shopping, and iconic cities.', filter: 'city' },
    ],
  },

  whyChooseUs: {
    enabled: true,
    style: 'minimal',
    title: 'The Holiday Experience You Deserve',
    description: 'Beautiful destinations, carefully selected stays, and personal service.',
    columns: 3,
    items: [
      { icon: '🏨', title: 'Beautiful Stays', description: 'Carefully selected hotels and resorts for a comfortable stay.' },
      { icon: '🍽️', title: 'Wonderful Experiences', description: 'Discover local food, culture, activities, and unforgettable moments.' },
      { icon: '💎', title: 'Personal Service', description: 'We help create a holiday experience tailored to you.' },
    ],
  },

  featuredTours: {
    enabled: true,
    title: 'Featured Holiday Packages',
    subtitle: 'Beautiful getaways selected for your next escape.',
    limit: 6,
    layout: 'editorial-grid',
    columns: 3,
    showViewAll: true,
    viewAllText: 'View All Packages',
  },

  destinations: {
    enabled: true,
    title: 'Beautiful Places to Escape',
    subtitle: 'From tropical beaches to charming cities, find your perfect getaway.',
    layout: 'masonry',
    columns: 3,
    showViewAll: true,
    viewAllText: 'Explore All Destinations',
    cardStyle: 'large-image',
  },

  offers: {
    enabled: true,
    title: 'Special Holiday Offers',
    subtitle: 'Enjoy exceptional holidays at special prices.',
    showDiscount: true,
    showLimitedTime: true,
    badgeText: 'Special Offer',
    buttonText: 'View Offer',
  },

  stats: {
    enabled: false,
    style: 'minimal',
    background: 'surface',
    items: [
      { number: '20K+', label: 'Happy Guests' },
      { number: '100+', label: 'Luxury Packages' },
      { number: '80+', label: 'Destinations' },
      { number: '4.9', label: 'Guest Rating' },
    ],
  },

  roomOptions: {
    enabled: true,
    title: 'Choose Your Stay',
    options: [
      { id: 'standard', name: 'Standard Room', description: 'Comfortable and elegant.', priceMultiplier: 1 },
      { id: 'deluxe', name: 'Deluxe Room', description: 'More space with premium amenities.', priceMultiplier: 1.4 },
      { id: 'suite', name: 'Luxury Suite', description: 'Our most premium accommodation.', priceMultiplier: 2 },
    ],
  },

  testimonials: {
    enabled: true,
    title: 'What Our Guests Say',
    layout: 'slider',
    items: [
      { name: 'Happy Traveler', rating: 5, text: 'Everything was beautifully organized. The hotel, destination, and experience were perfect.' },
      { name: 'Holiday Guest', rating: 5, text: 'A wonderful experience from booking to the end of our holiday.' },
      { name: 'Satisfied Guest', rating: 5, text: 'The attention to detail made our trip truly special.' },
    ],
  },

  cta: {
    enabled: true,
    style: 'luxury',
    title: 'Your Dream Holiday Is Waiting',
    description: 'Take a break from everyday life and discover a place where you can truly relax.',
    buttonText: 'Plan My Holiday',
    buttonAction: 'explore',
  },

  footer: {
    style: 'elegant',
    showLogo: true,
    showDescription: true,
    description: 'Creating beautiful holidays and unforgettable experiences for travelers around the world.',
    showQuickLinks: true,
    showContact: true,
    showSocialLinks: true,
    showNewsletter: true,
    newsletterTitle: 'Inspire Your Next Escape',
    copyright: '© 2026 Holiday Paradise. All rights reserved.',
  },

  contact: {
    email: 'info@holidayparadise.com',
    phone: '+91 98765 43210',
    address: 'India',
    workingHours: 'Mon - Sat: 9:00 AM - 7:00 PM',
  },

  social: { instagram: '#', facebook: '#', twitter: '#', youtube: '#' },
};

export function createWebsiteConfig(dynamicData: Partial<typeof defaultDynamicData> = {}) {
  const data = { ...defaultDynamicData, ...dynamicData };
  return {
    ...staticTheme,
    hero: data.hero,
    packages: data.packages,
    whyChooseUs: data.whyChooseUs,
    featuredTours: data.featuredTours,
    destinations: data.destinations,
    offers: data.offers,
    stats: data.stats,
    roomOptions: data.roomOptions,
    testimonials: data.testimonials,
    cta: data.cta,
    footer: data.footer,
    contact: data.contact,
    social: data.social,
  };
}

const website3 = createWebsiteConfig();
export default website3;
