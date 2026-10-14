import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo config.
 * Reads EXPO_PUBLIC_SITE_ID and EXPO_PUBLIC_SITE_HOSTNAME to configure separate app identity
 * (name, slug, bundleIdentifier, package, theme colors, splash) per website.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const siteId = (process.env.EXPO_PUBLIC_SITE_ID || '').toLowerCase().trim();
  const rawHostname = (process.env.EXPO_PUBLIC_SITE_HOSTNAME || '').toLowerCase().trim();

  // Cleartext traffic (HTTP) is permitted in development only for local backend testing.
  // In production builds and staging, HTTPS is strictly enforced.
  const isDev =
    process.env.NODE_ENV !== 'production' &&
    !process.env.EAS_BUILD_PROFILE?.includes('production');

  // Default: Gujju Tours
  let siteName = 'Gujju Tours';
  let appSlug = 'gujjutours';
  let appScheme = 'gujjutours';
  let bundleId = 'com.toursapp.gujjutours';
  let brandColor = '#2563eb';
  let defaultHostname = 'www.gujjutours.com';
  let defaultApiUrl = 'https://stagingapi.gujjutours.com';

  if (
    siteId === 'tripgoasia' ||
    siteId === 'website2' ||
    rawHostname.includes('tripgo') ||
    rawHostname.includes('adventure')
  ) {
    siteName = 'TripGo Asia';
    appSlug = 'tripgoasia';
    appScheme = 'tripgoasia';
    bundleId = 'com.toursapp.tripgoasia';
    brandColor = '#16a34a';
    defaultHostname = 'www.tripgoasia.com';
    defaultApiUrl = 'https://stagingapi.tripgoasia.com';
  } else if (
    siteId === 'technoheaven' ||
    siteId === 'website3' ||
    rawHostname.includes('techno') ||
    rawHostname.includes('holiday')
  ) {
    siteName = 'Technoheaven';
    appSlug = 'technoheaven';
    appScheme = 'technoheaven';
    bundleId = 'com.toursapp.technoheaven';
    brandColor = '#dc2626';
    defaultHostname = 'stagingb2b.technoheaven.com';
    defaultApiUrl = 'https://stagingapi.technoheaven.com';
  }

  return {
    ...config,
    name: siteName,
    slug: appSlug,
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: appScheme,
    userInterfaceStyle: 'automatic',

    ios: {
      supportsTablet: true,
      bundleIdentifier: bundleId,
      infoPlist: {
        NSCameraUsageDescription:
          'Allow camera access for uploading profile and tour photos.',
        NSPhotoLibraryUsageDescription:
          'Allow photo library access for uploading images.',
        NSLocationWhenInUseUsageDescription:
          'Allow location access for location-based tour features.',
      },
    },

    android: {
      package: bundleId,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundImage: './assets/android-icon-background.png',
        backgroundColor: brandColor,
      },
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
    },

    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },

    plugins: [
      'expo-router',
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: isDev,
          },
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: brandColor,
          dark: {
            image: './assets/splash-icon.png',
            backgroundColor: '#0B0F19',
          },
        },
      ],
      'expo-font',
      'expo-secure-store',
      'expo-web-browser',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: brandColor,
        },
      ],
    ],

    extra: {
      siteId: siteId || 'gujjutours',
      siteHostname: rawHostname || defaultHostname,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl,
      backendFallbackUrl: process.env.EXPO_PUBLIC_BACKEND_FALLBACK_URL ?? '',
      configApiUrl: process.env.EXPO_PUBLIC_CONFIG_API_URL ?? defaultApiUrl,
    },

    experiments: {
      typedRoutes: false,
    },
  };
};
