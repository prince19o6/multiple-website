/**
 * lib/apiBase.ts
 *
 * Resolves the shared backend base URL for tours, bookings, and admin.
 * Routes directly through the single centralized ENV configuration.
 */

import { ENV } from '@/src/config/env';

export function getApiBase(): string {
  return ENV.apiUrl;
}

export const API_BASE: string = ENV.apiUrl;
