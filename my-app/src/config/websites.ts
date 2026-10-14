import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface Website {
  /** Unique id. Used as the tab route name and in deep links: multisite://<id> */
  id: string;
  /** Name shown in the header, tab bar and switcher menu */
  name: string;
  /** Start URL */
  url: string;
  /** Tab icon (unfocused / focused) - any Ionicons name */
  icon: IconName;
  iconFocused: IconName;
  /** Accent colour for this site (progress bar, header badge, spinner) */
  accent: string;
  /**
   * Extra domains that should stay INSIDE the app
   * (e.g. payment gateways, social login). Sub-domains are included automatically.
   */
  extraInternalHosts?: string[];
  /** Android only: force the web page into dark mode */
  forceDark?: boolean;
  /** Optional custom user agent */
  userAgent?: string;
}

/**
 * External links (a different domain than the site) open:
 *  - 'inApp'   -> in an in-app browser sheet (SFSafariViewController / Chrome Custom Tabs)
 *  - 'browser' -> in the phone's default browser app
 */
export const EXTERNAL_LINK_MODE: 'inApp' | 'browser' = 'inApp';

// ---------------------------------------------------------------------------
// ADD / EDIT WEBSITES HERE. Every entry automatically becomes a tab,
// a deep link and an entry in the floating switcher menu.
// ---------------------------------------------------------------------------
export const WEBSITES: Website[] = [
  {
    id: 'gujjutours',
    name: 'Gujju Tours',
    url: 'https://stagingapi.gujjutours.com',
    icon: 'airplane-outline',
    iconFocused: 'airplane',
    accent: '#F97316',
  },
  {
    id: 'tripgoasia',
    name: 'TripGo Asia',
    url: 'https://stagingapi.tripgoasia.com',
    icon: 'globe-outline',
    iconFocused: 'globe',
    accent: '#0EA5E9',
  },
  {
    id: 'technoheaven',
    name: 'Techno Heaven',
    url: 'https://stagingapi.technoheaven.com',
    icon: 'hardware-chip-outline',
    iconFocused: 'hardware-chip',
    accent: '#8B5CF6',
  },
];
