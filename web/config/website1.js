// =========================================================
// STATIC THEME / UI CONFIG (never changes per request)
// =========================================================
const staticTheme = {
  id: "website1",
  name: "Travel Explorer",
  tagline: "Travel Beyond Boundaries",
  logo: "/websites/website1/logo.svg",
  favicon: "/websites/website1/favicon.ico",

  concept: {
    type: "modern-travel",
    style: "premium",
    mood: "clean",
    layout: "wide",
  },

  theme: {
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    primaryLight: "#dbeafe",
    secondary: "#0f172a",
    accent: "#f59e0b",
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#111827",
    heading: "#0f172a",
    mutedText: "#64748b",
    border: "#e2e8f0",
    success: "#16a34a",
    danger: "#dc2626",
  },

  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    bodyWeight: "400",
    headingStyle: "modern",
    heroTitleSize: "large",
    letterSpacing: "normal",
  },

  navigation: {
    style: "modern",
    position: "top",
    sticky: true,
    transparentOnHero: true,
    logoPosition: "left",
    menuAlignment: "center",
    showHome: true,
    showTours: true,
    showDestinations: true,
    showBooking: true,
    showLogin: true,
    showRegister: true,
    showContact: true,
    mobileMenuStyle: "drawer",
    activeMenuStyle: "underline",
    loginButton: true,
    registerButton: true,
    registerButtonText: "Get Started",
    background: "#ffffff",
    textColor: "#111827",
    activeColor: "#2563eb",
  },

  buttons: {
    style: "rounded",
    size: "medium",
    uppercase: false,
    fontWeight: "600",
    animation: "lift",
    primary: {
      background: "#2563eb",
      text: "#ffffff",
      hover: "#1d4ed8",
    },
    secondary: {
      background: "#ffffff",
      text: "#2563eb",
      border: "#2563eb",
      hover: "#eff6ff",
    },
    danger: {
      background: "#dc2626",
      text: "#ffffff",
    },
  },

  cards: {
    style: "rounded",
    radius: "large",
    shadow: "medium",
    hoverEffect: "lift",
    border: false,
    imageHeight: "220px",
    padding: "medium",
    showRating: true,
    showPrice: true,
    showDuration: true,
    showDifficulty: false,
    showLocation: true,
  },

  tourCard: {
    layout: "vertical",
    imagePosition: "top",
    showImage: true,
    showRating: true,
    showDuration: true,
    showLocation: true,
    showDifficulty: false,
    showDescription: true,
    showPrice: true,
    showBookButton: true,
    bookButtonText: "Book Now",
    detailsButtonText: "View Details",
    pricePrefix: "From",
    currency: "$",
    badge: {
      enabled: true,
      text: "Popular",
    },
  },

  destinationCard: {
    style: "image-overlay",
    imageHeight: "280px",
    showCountry: true,
    showTourCount: true,
    showDescription: false,
    showButton: true,
    buttonText: "Explore Destination",
    hoverEffect: "zoom",
  },

  icons: {
    style: "circle",
    position: "top",
    size: "large",
    background: "primary",
    animation: "none",
  },

  booking: {
    style: "standard",
    requireLogin: false,
    showGuestForm: true,
    showDate: true,
    showTravelers: true,
    showSpecialRequest: true,
    showPayment: false,
    confirmationPage: true,
    successMessage: "Your booking request has been submitted successfully!",
    buttonText: "Confirm Booking",
  },

  authentication: {
    style: "split",
    showSocialLogin: true,
    showRememberMe: true,
    showForgotPassword: true,
    loginTitle: "Welcome Back",
    registerTitle: "Create Your Account",
    loginButtonText: "Login",
    registerButtonText: "Create Account",
  },

  homeSections: [
    "hero",
    "whyChooseUs",
    "featuredTours",
    "destinations",
    "stats",
    "cta",
  ],

  features: {
    showWhyChooseUs: true,
    showStats: true,
    showFeaturedTours: true,
    showDestinations: true,
    showCTA: true,
    showNewsletter: true,
    showSearch: true,
  },
};

// =========================================================
// DYNAMIC CONTENT (can come from API / CMS / DB later)
// =========================================================
const defaultDynamicData = {
  hero: {
    style: "split",
    height: "large",
    title: "Discover Your Next Adventure",
    subtitle: "Travel Beyond Boundaries",
    description:
      "Explore breathtaking destinations, discover unforgettable experiences, and create memories that last a lifetime.",
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=800&fit=crop",
    imagePosition: "right",
    alignment: "left",
    overlay: false,
    showBadge: true,
    badgeText: "✈️ Explore the World",
    showSearch: true,
    searchPlaceholder: "Where do you want to go?",
    primaryButton: {
      text: "Explore Tours",
      action: "explore",
      icon: "🧭",
    },
    secondaryButton: {
      text: "View Destinations",
      action: "destinations",
      icon: "📍",
    },
  },

  whyChooseUs: {
    enabled: true,
    style: "cards",
    title: "Why Travel With Us?",
    description:
      "Everything you need for a smooth, memorable and enjoyable journey.",
    columns: 4,
    items: [
      {
        icon: "🌎",
        title: "Amazing Destinations",
        description: "Discover beautiful destinations around the world.",
      },
      {
        icon: "👨‍🏫",
        title: "Expert Guides",
        description: "Travel with experienced local professionals.",
      },
      {
        icon: "💰",
        title: "Best Prices",
        description: "Enjoy excellent experiences at competitive prices.",
      },
      {
        icon: "🛡️",
        title: "Safe & Secure",
        description: "Travel confidently with our complete support.",
      },
    ],
  },

  featuredTours: {
    enabled: true,
    title: "Popular Tours",
    subtitle: "Handpicked experiences loved by travelers around the world.",
    limit: 6,
    layout: "grid",
    columns: 3,
    showViewAll: true,
    viewAllText: "View All Tours",
    // Actual tours would normally come from an API
    // tours: [] 
  },

  destinations: {
    enabled: true,
    title: "Explore Top Destinations",
    subtitle: "Find your next unforgettable destination.",
    layout: "grid",
    columns: 4,
    showViewAll: true,
    viewAllText: "View All Destinations",
    // destinations: []
  },

  stats: {
    enabled: true,
    style: "simple",
    background: "primary",
    items: [
      { number: "50K+", label: "Happy Travelers" },
      { number: "150+", label: "Destinations" },
      { number: "500+", label: "Tours" },
      { number: "9+", label: "Years Experience" },
    ],
  },

  cta: {
    enabled: true,
    style: "gradient",
    title: "Ready for Your Next Adventure?",
    description:
      "Start exploring amazing destinations and book your perfect trip today.",
    buttonText: "Start Exploring",
    buttonAction: "explore",
  },

  footer: {
    style: "dark",
    showLogo: true,
    showDescription: true,
    description:
      "Making your travel dreams a reality with unforgettable experiences.",
    showQuickLinks: true,
    showContact: true,
    showSocialLinks: true,
    showNewsletter: true,
    newsletterTitle: "Get Travel Inspiration",
    copyright: "© 2026 Travel Explorer. All rights reserved.",
  },

  contact: {
    email: "info@travelexplorer.com",
    phone: "+91 98765 43210",
    address: "India",
    workingHours: "Mon - Sat: 9:00 AM - 6:00 PM",
  },

  social: {
    instagram: "#",
    facebook: "#",
    twitter: "#",
    youtube: "#",
  },
};

// =========================================================
// FACTORY – merges static theme + dynamic content
// =========================================================
export function createWebsiteConfig(dynamicData = {}) {
  const data = { ...defaultDynamicData, ...dynamicData };

  return {
    ...staticTheme,

    // Dynamic sections
    hero: data.hero,
    whyChooseUs: data.whyChooseUs,
    featuredTours: data.featuredTours,
    destinations: data.destinations,
    stats: data.stats,
    cta: data.cta,
    footer: data.footer,
    contact: data.contact,
    social: data.social,
  };
}

// Default export for backward compatibility
const website1 = createWebsiteConfig();
export default website1;