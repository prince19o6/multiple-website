/**
 * app/index.tsx
 *
 * Root entry point for the Expo Router app.
 * Immediately redirects into the bottom-tab native navigation structure.
 */

import React from 'react';
import { Redirect } from 'expo-router';

export default function RootIndex() {
  return <Redirect href="/(tabs)" />;
}
