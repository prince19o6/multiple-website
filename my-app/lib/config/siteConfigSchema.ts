import { z } from 'zod';
import { FeatureItemSchema } from '../features/featureRegistrySchema';

// ─── Component Configuration Schema ──────────────────────────────────────────

export const ComponentConfigSchema = z.object({
  id: z.string(),
  type: z.string(),
  variant: z.string().default('default'),
  enabled: z.boolean().default(true),
  title: z.string().default(''),
  subtitle: z.string().optional(),
  order: z.number().default(0),
  props: z.record(z.string(), z.unknown()).default({}),
  dataSource: z.string().optional(),
  maxItems: z.number().default(10),
  viewMore: z
    .object({
      enabled: z.boolean().default(false),
      label: z.string().default('View All'),
      targetUrl: z.string().default(''),
    })
    .optional(),
  platforms: z.array(z.enum(['web', 'app'])).default(['web', 'app']),
});

export type ComponentConfig = z.infer<typeof ComponentConfigSchema>;

// ─── Main SiteConfig Schema ──────────────────────────────────────────────────

export const SiteConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  updatedAt: z.string().default(() => new Date().toISOString()),

  site: z.object({
    id: z.enum(['gujjutours', 'tripgoasia', 'technoheaven']),
    name: z.string(),
    fullName: z.string(),
    tagline: z.string().default(''),
    canonicalHostname: z.string(),
    hostnames: z.array(z.string()).default([]),
    defaultLanguage: z.string().default('en'),
    languages: z
      .array(
        z.object({
          code: z.string(),
          name: z.string(),
          isRTL: z.boolean().default(false),
        })
      )
      .default([{ code: 'en', name: 'English', isRTL: false }]),
    currency: z.object({
      code: z.string().default('USD'),
      symbol: z.string().default('$'),
      name: z.string().default('US Dollar'),
      decimalPlaces: z.number().default(2),
    }),
    timeZone: z.string().default('UTC'),
  }),

  theme: z.object({
    defaultMode: z.enum(['light', 'dark']).default('light'),
    colors: z.object({
      primary: z.string(),
      primaryDark: z.string(),
      primaryLight: z.string(),
      primaryContrast: z.string().default('#ffffff'),
      primaryText: z.string().default('#0f172a'),
      secondary: z.string(),
      accent: z.string(),
      background: z.string().default('#ffffff'),
      surface: z.string().default('#ffffff'),
      surface2: z.string().default('#f8fafc'),
      text: z.string().default('#0f172a'),
      heading: z.string().default('#0f172a'),
      mutedText: z.string().default('#64748b'),
      border: z.string().default('#e2e8f0'),
      success: z.string().default('#16a34a'),
      danger: z.string().default('#dc2626'),
      footerBg: z.string().default('#0f172a'),
      footerText: z.string().default('#f8fafc'),
    }),
    darkColors: z
      .object({
        background: z.string().default('#0b0f19'),
        surface: z.string().default('#131b2e'),
        surface2: z.string().default('#1e293b'),
        text: z.string().default('#f8fafc'),
        heading: z.string().default('#f8fafc'),
        mutedText: z.string().default('#94a3b8'),
        border: z.string().default('#1e293b'),
        footerBg: z.string().default('#020617'),
        footerText: z.string().default('#cbd5e1'),
      })
      .optional(),
    radius: z.object({
      xs: z.number().default(4),
      sm: z.number().default(8),
      md: z.number().default(12),
      lg: z.number().default(16),
      xl: z.number().default(24),
      full: z.number().default(9999),
    }).default({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999 }),
    shadows: z.object({
      none: z.string().default('none'),
      sm: z.string().default('0 1px 2px 0 rgb(0 0 0 / 0.05)'),
      md: z.string().default('0 4px 6px -1px rgb(0 0 0 / 0.1)'),
      lg: z.string().default('0 10px 15px -3px rgb(0 0 0 / 0.1)'),
    }).default({
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    }),
    spacing: z.object({
      xs: z.number().default(4),
      sm: z.number().default(8),
      md: z.number().default(16),
      lg: z.number().default(24),
      xl: z.number().default(32),
      xxl: z.number().default(48),
    }).default({ xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }),
  }),

  typography: z.object({
    headingFont: z.string().default('Inter'),
    bodyFont: z.string().default('Inter'),
    headingWeight: z.string().default('700'),
    bodyWeight: z.string().default('400'),
    customFonts: z
      .array(
        z.object({
          family: z.string(),
          url: z.string(),
          weight: z.number().default(400),
          style: z.string().default('normal'),
        })
      )
      .default([]),
  }),

  assets: z.object({
    logoUrl: z.string().default(''),
    logoLight: z.string().default(''),
    logoDark: z.string().default(''),
    favicon: z.string().default(''),
    ogImage: z.string().default(''),
    appIcon: z.string().default(''),
    appSplash: z.string().default(''),
    adaptiveIcon: z.string().default(''),
  }),

  layout: z.object({
    headerVariant: z.enum(['default', 'centered', 'minimal', 'transparent']).default('default'),
    footerVariant: z.enum(['default', 'columns', 'minimal', 'luxury']).default('default'),
    topBar: z.boolean().default(true),
    stickyHeader: z.boolean().default(true),
    pageWidth: z.enum(['default', 'wide', 'contained']).default('default'),
  }).default({
    headerVariant: 'default',
    footerVariant: 'default',
    topBar: true,
    stickyHeader: true,
    pageWidth: 'default',
  }),

  components: z.object({
    home: z.array(ComponentConfigSchema).default([]),
    listing: z.array(ComponentConfigSchema).default([]),
    detail: z.array(ComponentConfigSchema).default([]),
  }),

  navigation: z.object({
    web: z.object({
      menuItems: z
        .array(
          z.object({
            label: z.string(),
            href: z.string(),
            icon: z.string().optional(),
            openInNewTab: z.boolean().default(false),
            requiresAuth: z.boolean().default(false),
          })
        )
        .default([]),
      serviceTabs: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            href: z.string(),
            icon: z.string(),
            enabled: z.boolean().default(true),
            badge: z.string().optional(),
          })
        )
        .default([]),
      footerColumns: z
        .array(
          z.object({
            title: z.string(),
            links: z.array(z.object({ label: z.string(), href: z.string() })),
          })
        )
        .default([]),
      socialLinks: z
        .array(
          z.object({
            platform: z.string(),
            url: z.string(),
            icon: z.string().optional(),
          })
        )
        .default([]),
    }),
    app: z.object({
      tabs: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            icon: z.string(),
            activeIcon: z.string().optional(),
            route: z.string(),
            enabled: z.boolean().default(true),
            order: z.number().default(0),
            badgeKey: z.string().optional(),
          })
        )
        .default([]),
      profileMenu: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            icon: z.string(),
            route: z.string(),
            enabled: z.boolean().default(true),
            section: z.enum(['account', 'preferences', 'support', 'legal']).default('account'),
          })
        )
        .default([]),
    }),
  }),

  features: z.object({
    hotels: z.boolean().default(true),
    tours: z.boolean().default(true),
    packages: z.boolean().default(true),
    flights: z.boolean().default(true),
    transfers: z.boolean().default(true),
    visas: z.boolean().default(true),
    restaurants: z.boolean().default(false),
    rentals: z.boolean().default(false),
    insurance: z.boolean().default(false),
    buildPackage: z.boolean().default(false),
    bookingApproval: z.boolean().default(true),
    wishlist: z.boolean().default(true),
    reviews: z.boolean().default(true),
    promoCodes: z.boolean().default(true),
    conciergeChat: z.boolean().default(true),
    languageSwitch: z.boolean().default(true),
    currencySwitch: z.boolean().default(true),
    darkModeToggle: z.boolean().default(true),
    biometricLogin: z.boolean().default(false),
    pushNotifications: z.boolean().default(true),
  }),

  featureRegistry: z.array(FeatureItemSchema).default([]),

  content: z.object({
    banners: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          subtitle: z.string().default(''),
          code: z.string().optional(),
          discount: z.string().optional(),
          imageUrl: z.string(),
          targetUrl: z.string().default('/tours'),
          enabled: z.boolean().default(true),
        })
      )
      .default([]),
    trustBadges: z
      .array(
        z.object({
          icon: z.string(),
          title: z.string(),
          description: z.string(),
        })
      )
      .default([]),
    partners: z
      .array(
        z.object({
          name: z.string(),
          logoUrl: z.string(),
        })
      )
      .default([]),
    faqs: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
          category: z.string().optional(),
        })
      )
      .default([]),
    bookingAddOns: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
          currency: z.string().default('USD'),
          description: z.string(),
          icon: z.string().default('shield-checkmark-outline'),
        })
      )
      .default([]),
    concierge: z
      .object({
        name: z.string().default('Travel Specialist'),
        title: z.string().default('Dedicated Concierge'),
        avatarUrl: z.string().default(''),
        phone: z.string().default(''),
        whatsapp: z.string().default(''),
        email: z.string().default(''),
        welcomeMessage: z.string().default('Hello! How can I help customize your journey today?'),
      })
      .default({
        name: 'Travel Specialist',
        title: 'Dedicated Concierge',
        avatarUrl: '',
        phone: '',
        whatsapp: '',
        email: '',
        welcomeMessage: 'Hello! How can I help customize your journey today?',
      }),
    contact: z.object({
      phone: z.string().default(''),
      email: z.string().default(''),
      address: z.string().optional(),
      supportHours: z.string().default('24/7 Dedicated Support'),
    }),
    cancellationPolicy: z.string().default('Free cancellation up to 48 hours before departure.'),
    termsUrl: z.string().default('/terms'),
    privacyUrl: z.string().default('/privacy'),
    deleteAccountUrl: z.string().default('/delete-account'),
  }),

  seo: z.object({
    titleTemplate: z.string().default('%s | Travel Platform'),
    defaultTitle: z.string().default('Extraordinary Travel Experiences'),
    defaultDescription: z.string().default('Book bespoke tours, luxury stays, flights, and authentic local activities.'),
    keywords: z.array(z.string()).default(['travel', 'tours', 'hotels', 'flights']),
    ogImage: z.string().default(''),
    twitterHandle: z.string().default(''),
  }),

  integrations: z.object({
    googleAnalyticsId: z.string().optional(),
    chatWidgetId: z.string().optional(),
    recaptchaSiteKey: z.string().optional(),
  }).default({}),

  app: z.object({
    minSupportedVersion: z.string().default('1.0.0'),
    latestVersion: z.string().default('1.0.0'),
    forceUpdate: z.boolean().default(false),
    forceUpdateMessage: z.string().default('A critical update is required. Please download the latest version to continue.'),
    maintenance: z.boolean().default(false),
    maintenanceMessage: z.string().default('Our systems are currently undergoing scheduled maintenance. Please check back shortly.'),
    storeUrls: z.object({
      ios: z.string().default(''),
      android: z.string().default(''),
    }).default({ ios: '', android: '' }),
    deepLinkScheme: z.string().default('toursapp'),
    supportEmail: z.string().default('support@travelplatform.com'),
  }),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

// ─── Minimal Safe Default Config ─────────────────────────────────────────────

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  site: {
    id: 'gujjutours',
    name: 'Gujju Tours',
    fullName: 'Gujju Tours Private Limited',
    tagline: 'Your Gateway to Extraordinary Adventures',
    canonicalHostname: 'www.gujjutours.com',
    hostnames: ['www.gujjutours.com', 'gujjutours.com'],
    defaultLanguage: 'en',
    languages: [{ code: 'en', name: 'English', isRTL: false }],
    currency: {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee',
      decimalPlaces: 2,
    },
    timeZone: 'Asia/Kolkata',
  },
  theme: {
    defaultMode: 'light',
    colors: {
      primary: '#2882c5',
      primaryDark: '#1f679c',
      primaryLight: '#eaf3f9',
      primaryContrast: '#ffffff',
      primaryText: '#1f679c',
      secondary: '#0f172a',
      accent: '#f58e83',
      background: '#ffffff',
      surface: '#ffffff',
      surface2: '#f8fafc',
      text: '#0f172a',
      heading: '#0f172a',
      mutedText: '#64748b',
      border: '#e2e8f0',
      success: '#16a34a',
      danger: '#dc2626',
      footerBg: '#0f172a',
      footerText: '#f8fafc',
    },
    radius: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
    shadows: {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  },
  typography: {
    headingFont: 'Poppins',
    bodyFont: 'Poppins',
    headingWeight: '700',
    bodyWeight: '400',
    customFonts: [],
  },
  assets: {
    logoUrl: 'https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/headerLogoId/44df6d60-4c20-4590-b5d1-439796a6eae9_gujju-logo.svg',
    logoLight: 'https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/headerLogoId/44df6d60-4c20-4590-b5d1-439796a6eae9_gujju-logo.svg',
    logoDark: 'https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/darkThemeLogoId/adfa5ffd-232b-4cff-a0ce-cac1d4c8fc05_gujju-logo.svg',
    favicon: 'https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/faviconId/7e70a77e-d7fc-4b21-a364-497a69d296b2_favicon.ico',
    ogImage: '',
    appIcon: '',
    appSplash: '',
    adaptiveIcon: '',
  },
  layout: {
    headerVariant: 'default',
    footerVariant: 'default',
    topBar: true,
    stickyHeader: true,
    pageWidth: 'default',
  },
  components: {
    home: [
      { id: 'hero-1', type: 'hero', variant: 'carousel', enabled: true, title: '', order: 1, props: {}, maxItems: 1, platforms: ['web', 'app'] },
      { id: 'search-1', type: 'searchWidget', variant: 'default', enabled: true, title: 'Find Experiences', order: 2, props: {}, maxItems: 1, platforms: ['web', 'app'] },
      { id: 'cats-1', type: 'categoryList', variant: 'chips', enabled: true, title: 'Top Categories', order: 3, props: {}, maxItems: 8, platforms: ['web', 'app'] },
      { id: 'tours-1', type: 'tourCarousel', variant: 'classic', enabled: true, title: 'Featured Expeditions', order: 4, props: {}, dataSource: 'featuredTours', maxItems: 6, viewMore: { enabled: true, label: 'View All Tours', targetUrl: '/tours' }, platforms: ['web', 'app'] },
      { id: 'dests-1', type: 'destinationGrid', variant: 'cards', enabled: true, title: 'Trending Destinations', order: 5, props: {}, dataSource: 'destinations', maxItems: 8, viewMore: { enabled: true, label: 'Explore Destinations', targetUrl: '/destinations' }, platforms: ['web', 'app'] },
      { id: 'offers-1', type: 'offers', variant: 'banner', enabled: true, title: 'Exclusive Travel Deals', order: 6, props: {}, maxItems: 3, platforms: ['web', 'app'] },
      { id: 'reviews-1', type: 'reviews', variant: 'carousel', enabled: true, title: 'Traveler Reviews', order: 7, props: {}, maxItems: 6, platforms: ['web', 'app'] },
      { id: 'badges-1', type: 'partnersStrip', variant: 'marquee', enabled: true, title: 'Trusted Airline & Hotel Partners', order: 8, props: {}, maxItems: 12, platforms: ['web', 'app'] },
    ],
    listing: [],
    detail: [],
  },
  navigation: {
    web: {
      menuItems: [
        { label: 'Home', href: '/', openInNewTab: false, requiresAuth: false },
        { label: 'Tours', href: '/tours', openInNewTab: false, requiresAuth: false },
        { label: 'Hotels', href: '/hotels', openInNewTab: false, requiresAuth: false },
        { label: 'Flights', href: '/flights', openInNewTab: false, requiresAuth: false },
        { label: 'Holidays', href: '/holidays', openInNewTab: false, requiresAuth: false },
        { label: 'My Bookings', href: '/my-bookings', openInNewTab: false, requiresAuth: true },
      ],
      serviceTabs: [
        { id: 'tours', label: 'Tours', href: '/tours', icon: 'compass', enabled: true },
        { id: 'hotels', label: 'Hotels', href: '/hotels', icon: 'business', enabled: true },
        { id: 'flights', label: 'Flights', href: '/flights', icon: 'airplane', enabled: true },
        { id: 'holidays', label: 'Holidays', href: '/holidays', icon: 'calendar', enabled: true },
        { id: 'transfers', label: 'Transfers', href: '/transfers', icon: 'car', enabled: true },
        { id: 'visas', label: 'Visas', href: '/visas', icon: 'document-text', enabled: true },
      ],
      footerColumns: [
        {
          title: 'Discover',
          links: [
            { label: 'Popular Destinations', href: '/destinations' },
            { label: 'Featured Tours', href: '/tours' },
            { label: 'Special Offers', href: '/offers' },
          ],
        },
        {
          title: 'Company',
          links: [
            { label: 'About Us', href: '/about' },
            { label: 'Contact', href: '/contact' },
            { label: 'Partner With Us', href: '/partners' },
          ],
        },
        {
          title: 'Legal',
          links: [
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms & Conditions', href: '/terms' },
            { label: 'Cancellation Policy', href: '/cancellation' },
          ],
        },
      ],
      socialLinks: [
        { platform: 'facebook', url: 'https://facebook.com' },
        { platform: 'instagram', url: 'https://instagram.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
      ],
    },
    app: {
      tabs: [
        { id: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '(tabs)/index', enabled: true, order: 1 },
        { id: 'explore', label: 'Explore', icon: 'compass-outline', activeIcon: 'compass', route: '(tabs)/explore', enabled: true, order: 2 },
        { id: 'bookings', label: 'Bookings', icon: 'calendar-outline', activeIcon: 'calendar', route: '(tabs)/bookings', enabled: true, order: 3, badgeKey: 'upcomingCount' },
        { id: 'wishlist', label: 'Wishlist', icon: 'heart-outline', activeIcon: 'heart', route: '(tabs)/wishlist', enabled: true, order: 4, badgeKey: 'wishlistCount' },
        { id: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '(tabs)/profile', enabled: true, order: 5 },
      ],
      profileMenu: [
        { id: 'bookings', label: 'My Bookings', icon: 'calendar-outline', route: '/(tabs)/bookings', enabled: true, section: 'account' },
        { id: 'wishlist', label: 'Saved Wishlists', icon: 'heart-outline', route: '/(tabs)/wishlist', enabled: true, section: 'account' },
        { id: 'appearance', label: 'Appearance & Display', icon: 'contrast-outline', route: '/(tabs)/profile', enabled: true, section: 'preferences' },
        { id: 'language', label: 'Language & Currency', icon: 'globe-outline', route: '/(tabs)/profile', enabled: true, section: 'preferences' },
        { id: 'concierge', label: 'Concierge Desk', icon: 'chatbubbles-outline', route: '/(tabs)/profile', enabled: true, section: 'support' },
        { id: 'privacy', label: 'Privacy & Terms', icon: 'shield-checkmark-outline', route: '/about', enabled: true, section: 'legal' },
      ],
    },
  },
  features: {
    hotels: true,
    tours: true,
    packages: true,
    flights: true,
    transfers: true,
    visas: true,
    restaurants: true,
    rentals: true,
    insurance: true,
    buildPackage: true,
    bookingApproval: true,
    wishlist: true,
    reviews: true,
    promoCodes: true,
    conciergeChat: true,
    languageSwitch: true,
    currencySwitch: true,
    darkModeToggle: true,
    biometricLogin: false,
    pushNotifications: true,
  },
  featureRegistry: [
    {
      id: "hotels",
      type: "service",
      label: { en: "Hotels", ar: "فنادق" },
      icon: { url: "", fallbackKey: "business-outline" },
      route: "/hotels",
      order: 1,
      enabled: true,
      platforms: ["web", "app"],
      visibleInNav: true,
      visibleOnHome: true,
      searchType: "hotel",
      dependsOn: [],
      requiresAuth: false,
      roles: ["Public"],
      provider: "remote_api",
    },
    {
      id: "tours",
      type: "service",
      label: { en: "Tours", ar: "جولات" },
      icon: { url: "", fallbackKey: "compass-outline" },
      route: "/tours",
      order: 2,
      enabled: true,
      platforms: ["web", "app"],
      visibleInNav: true,
      visibleOnHome: true,
      searchType: "tour",
      dependsOn: [],
      requiresAuth: false,
      roles: ["Public"],
      provider: "remote_api",
    },
    {
      id: "packages",
      type: "service",
      label: { en: "Packages", ar: "باقات" },
      icon: { url: "", fallbackKey: "map-outline" },
      route: "/holidays",
      order: 3,
      enabled: true,
      platforms: ["web", "app"],
      visibleInNav: true,
      visibleOnHome: true,
      searchType: "holiday",
      dependsOn: [],
      requiresAuth: false,
      roles: ["Public"],
      provider: "remote_api",
    },
    {
      id: "flights",
      type: "service",
      label: { en: "Flights", ar: "طيران" },
      icon: { url: "", fallbackKey: "airplane-outline" },
      route: "/flights",
      order: 4,
      enabled: true,
      platforms: ["web", "app"],
      visibleInNav: true,
      visibleOnHome: true,
      searchType: "flight",
      dependsOn: [],
      requiresAuth: false,
      roles: ["Public"],
      provider: "remote_api",
    },
    {
      id: "transfers",
      type: "service",
      label: { en: "Transfers", ar: "توصيلات" },
      icon: { url: "", fallbackKey: "car-sport-outline" },
      route: "/transfers",
      order: 5,
      enabled: true,
      platforms: ["web", "app"],
      visibleInNav: true,
      visibleOnHome: true,
      searchType: "transfer",
      dependsOn: [],
      requiresAuth: false,
      roles: ["Public"],
      provider: "remote_api",
    },
    {
      id: "visas",
      type: "service",
      label: { en: "Visas", ar: "تأشيرات" },
      icon: { url: "", fallbackKey: "document-text-outline" },
      route: "/visas",
      order: 6,
      enabled: true,
      platforms: ["web", "app"],
      visibleInNav: true,
      visibleOnHome: true,
      searchType: "visa",
      dependsOn: [],
      requiresAuth: false,
      roles: ["Public"],
      provider: "remote_api",
    },
    {
      id: "restaurants",
      type: "service",
      label: { en: "Restaurants", ar: "مطاعم" },
      icon: { url: "", fallbackKey: "restaurant-outline" },
      route: "/restaurants",
      order: 7,
      enabled: true,
      platforms: ["web", "app"],
      visibleInNav: true,
      visibleOnHome: true,
      searchType: "restaurant",
      dependsOn: [],
      requiresAuth: false,
      roles: ["Public"],
      provider: "remote_api",
    },
    {
      id: "buildpackage",
      type: "service",
      label: { en: "Build Package", ar: "بناء باقة" },
      icon: { url: "", fallbackKey: "construct-outline" },
      route: "/buildpackage",
      order: 8,
      enabled: true,
      platforms: ["web", "app"],
      visibleInNav: true,
      visibleOnHome: true,
      searchType: "buildpackage",
      dependsOn: [],
      requiresAuth: false,
      roles: ["Public"],
      provider: "remote_api",
    },
  ],
  content: {
    banners: [
      {
        id: 'banner-1',
        title: 'Dubai Luxury Desert Safari',
        subtitle: 'Save up to 25% with code DUBAI2026',
        code: 'DUBAI2026',
        discount: '25% OFF',
        imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
        targetUrl: '/tours/dubai-desert-safari',
        enabled: true,
      },
      {
        id: 'banner-2',
        title: 'Southeast Asia Island Escapes',
        subtitle: 'Curated island hopping in Langkawi & Phuket',
        code: 'ASIA20',
        discount: '20% OFF',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
        targetUrl: '/tours',
        enabled: true,
      },
    ],
    trustBadges: [
      { icon: 'shield-checkmark', title: '100% Verified Bookings', description: 'Instant confirmation with full operator verification.' },
      { icon: 'time', title: '24/7 Dedicated Concierge', description: 'Reach our regional desk via WhatsApp and phone.' },
      { icon: 'card', title: 'Secure Global Payments', description: 'Encrypted transactions with zero hidden processing fees.' },
      { icon: 'refresh', title: 'Flexible Free Cancellation', description: 'Reschedule or cancel easily up to 48 hours prior.' },
    ],
    partners: [
      { name: 'Emirates', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg' },
      { name: 'Singapore Airlines', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6b/Singapore_Airlines_Logo_2.svg' },
      { name: 'Etihad Airways', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Etihad_Airways_Logo.svg' },
    ],
    faqs: [
      { question: 'How do I receive my booking voucher?', answer: 'Your digital voucher with QR access is sent immediately via email and saved in your account under My Bookings.' },
      { question: 'What is the cancellation policy?', answer: 'Most tours offer free cancellation up to 48 hours before scheduled departure. Check your tour details for specific terms.' },
      { question: 'Are pickup and drop-off included?', answer: 'Complimentary hotel transfers are included on select packages. Details are shown on each booking confirmation.' },
    ],
    bookingAddOns: [
      { id: 'addon-buffet', name: 'VIP Gourmet Buffet Dinner', price: 45, currency: 'USD', description: '5-star five-course international dining under the desert stars', icon: 'restaurant-outline' },
      { id: 'addon-transfer', name: 'Private Mercedes Transfer', price: 75, currency: 'USD', description: 'Private luxury door-to-door transfer in Mercedes V-Class', icon: 'car-sport-outline' },
      { id: 'addon-quad', name: '30-Min Desert Quad Bike', price: 35, currency: 'USD', description: 'High-power 400cc quad biking across open red dunes', icon: 'flash-outline' },
    ],
    concierge: {
      name: 'Aarav Patel',
      title: 'Senior Regional Travel Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
      phone: '+91 9875095616',
      whatsapp: '+91 9875095616',
      email: 'concierge@gujjutours.com',
      welcomeMessage: 'Namaste! I am Aarav, your personal Gujju Tours specialist. How may I assist your travel plans today?',
    },
    contact: {
      phone: '+91 9875095616',
      email: 'support@gujjutours.com',
      address: 'Sandhya Wad, Bilimora - Chikhli Rd, Gujarat, India',
      supportHours: '24/7 Dedicated Concierge Support',
    },
    cancellationPolicy: 'Free cancellation up to 48 hours before departure. Cancellations within 48 hours are subject to a 20% processing fee.',
    termsUrl: '/terms',
    privacyUrl: '/privacy',
    deleteAccountUrl: '/delete-account',
  },
  seo: {
    titleTemplate: '%s | Gujju Tours',
    defaultTitle: 'Gujju Tours - Extraordinary Adventures & Bespoke Holidays',
    defaultDescription: 'Discover hand-picked tours, luxury hotel stays, desert safaris, and seamless airport transfers.',
    keywords: ['gujjutours', 'dubai tours', 'desert safari', 'travel bookings', 'india travel'],
    ogImage: '',
    twitterHandle: '@gujjutours',
  },
  integrations: {
    googleAnalyticsId: 'G-GUJJUTOURS',
  },
  app: {
    minSupportedVersion: '1.0.0',
    latestVersion: '1.0.0',
    forceUpdate: false,
    forceUpdateMessage: 'A critical update is required. Please download the latest version to continue.',
    maintenance: false,
    maintenanceMessage: 'Our systems are currently undergoing scheduled maintenance. Please check back shortly.',
    storeUrls: {
      ios: 'https://apps.apple.com/app/gujjutours/id123456789',
      android: 'https://play.google.com/store/apps/details?id=com.gujjutours.app',
    },
    deepLinkScheme: 'gujjutours',
    supportEmail: 'support@gujjutours.com',
  },
};

// ─── Validation and Fallback Helper ──────────────────────────────────────────

export interface ValidateConfigResult {
  config: SiteConfig;
  isValid: boolean;
  errors: string[];
}

export function validateSiteConfig(raw: unknown, siteFallback?: SiteConfig): ValidateConfigResult {
  const fallback = siteFallback || DEFAULT_SITE_CONFIG;
  if (!raw || typeof raw !== 'object') {
    return {
      config: fallback,
      isValid: false,
      errors: ['Config payload is empty or not an object.'],
    };
  }

  // Handle both raw SiteConfig and API wrapped { result: SiteConfig }
  const payload = (raw as Record<string, unknown>).result || raw;

  const parsed = SiteConfigSchema.safeParse(payload);
  if (parsed.success) {
    return {
      config: parsed.data,
      isValid: true,
      errors: [],
    };
  }

  // Gracefully deep-merge raw payload over fallback
  try {
    const merged = deepMerge(fallback, payload);
    const rechecked = SiteConfigSchema.safeParse(merged);
    if (rechecked.success) {
      return { config: rechecked.data, isValid: true, errors: [] };
    }
    const mergeErrors = rechecked.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[SiteConfigValidator] Validation issues detected (${mergeErrors.length}):`, mergeErrors);
    }
    return {
      config: fallback,
      isValid: false,
      errors: mergeErrors,
    };
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[SiteConfigValidator] Fallback merge failed:', err);
    }
  }

  const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  return {
    config: fallback,
    isValid: false,
    errors,
  };
}

function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object') return target;
  if (Array.isArray(source)) return source;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key]) {
      output[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}
