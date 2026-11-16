import type { ExpoConfig, ConfigContext } from 'expo/config';
import fs from 'fs';
import path from 'path';

/**
 * Dynamic Expo config.
 * Reads EXPO_PUBLIC_SITE_ID and EXPO_PUBLIC_SITE_HOSTNAME to configure separate app identity
 * (name, slug, bundleIdentifier, package, theme colors, splash) per website.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const siteId = (process.env.EXPO_PUBLIC_SITE_ID || 'gujjutours').toLowerCase().trim();
  const rawHostname = (process.env.EXPO_PUBLIC_SITE_HOSTNAME || '').toLowerCase().trim();

  // Cleartext traffic (HTTP) is permitted in development only for local backend testing.
  const isDev =
    process.env.NODE_ENV !== 'production' &&
    !process.env.EAS_BUILD_PROFILE?.includes('production');

  // Default: Gujju Tours
  let siteName = 'Gujju Tours';
  let appSlug = 'gujjutours';
  let appScheme = 'gujjutours';
  let bundleId = 'com.toursapp.gujjutours';
  let brandColor = '#2882c5';
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
    brandColor = '#FF932C';
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
    brandColor = '#00aacf';
    defaultHostname = 'stagingb2b.technoheaven.com';
    defaultApiUrl = 'https://stagingapi.technoheaven.com';
  }

  // Check generated brand assets from fetch-site-assets.js
  const genDir = path.join(__dirname, 'assets/generated', siteId);
  const iconPath = fs.existsSync(path.join(genDir, 'icon.png'))
    ? `./assets/generated/${siteId}/icon.png`
    : './assets/icon.png';
  const splashPath = fs.existsSync(path.join(genDir, 'splash.png'))
    ? `./assets/generated/${siteId}/splash.png`
    : './assets/splash-icon.png';
  const adaptivePath = fs.existsSync(path.join(genDir, 'adaptive-icon.png'))
    ? `./assets/generated/${siteId}/adaptive-icon.png`
    : './assets/adaptive-icon.png';

  return {
    ...config,
    name: siteName,
    slug: appSlug,
    version: '1.0.0',
    sdkVersion: '58.0.0',
    orientation: 'portrait',
    icon: iconPath,
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
        foregroundImage: adaptivePath,
        backgroundColor: '#ffffff',
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
          image: splashPath,
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            image: splashPath,
            backgroundColor: '#0b0f19',
          },
        },
      ],
      'expo-font',
      'expo-secure-store',
      'expo-web-browser',
      [
        'expo-notifications',
        {
          icon: iconPath,
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
