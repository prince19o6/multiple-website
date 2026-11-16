/**
 * lib/websiteModules.ts
 *
 * Parses websiteRights and websiteModules from the API config into the flat WebsiteServices
 * object every component uses to show/hide service tabs and features.
 *
 * Pure TypeScript — zero web dependencies. Works identically in React Native.
 */

import type { SiteConfigResult } from './siteConfig';

export interface WebsiteModuleItem {
  serviceTypeId: number;
  serviceName: string;
  serviceCode: string;
  serviceIcon?: string;
  displayOrder: number;
  url?: string | null;
  route: string;
}

export type WebsiteServices = {
  tours: boolean;
  hotels: boolean;
  activities: boolean;
  transfers: boolean;
  flights: boolean;
  visa: boolean;
  restaurants: boolean;
  insurance: boolean;
  packages: boolean;
  carRental: boolean;
  buildPackage: boolean;
  featureCodes: Set<string>;
  fromApi: boolean;
  moduleList: WebsiteModuleItem[];
};

const DEFAULT_SERVICES: Omit<WebsiteServices, 'featureCodes' | 'fromApi' | 'moduleList'> = {
  tours: true,
  hotels: true,
  activities: true,
  transfers: true,
  flights: true,
  visa: true,
  restaurants: true,
  insurance: true,
  packages: true,
  carRental: false,
  buildPackage: true,
};

function resolveNativeModuleRoute(code: string): string {
  switch (code.toUpperCase()) {
    case 'HOTEL':
      return '/(tabs)/explore?category=hotel';
    case 'TOUR':
    case 'ACTIVITY':
    case 'ACTIVITIES':
      return '/featured-tours';
    case 'PACKAGE':
    case 'HOLIDAYS':
      return '/destinations';
    case 'FLIGHT':
      return '/flight-enquiry';
    case 'TRANSFER':
      return '/airport-transfer';
    case 'VISA':
      return '/visa-hub';
    case 'RESTAURANT':
      return '/culinary-guide';
    case 'BUILDPACKAGE':
      return '/group-planning';
    case 'CARRENTAL':
      return '/airport-transfer';
    default:
      return '/(tabs)/explore';
  }
}

function codesFromRights(dynamic: SiteConfigResult | null): Set<string> {
  const set = new Set<string>();
  if (!dynamic?.websiteRights || !Array.isArray(dynamic.websiteRights)) return set;
  for (const item of dynamic.websiteRights) {
    if (item && typeof item === 'object') {
      const code = (item as { featureCode?: string }).featureCode;
      if (typeof code === 'string' && code) set.add(code.toUpperCase());
      const feature = (item as { feature?: string }).feature;
      if (typeof feature === 'string' && feature) set.add(feature.toUpperCase());
    }
  }
  return set;
}

/** Build the WebsiteServices map from the dynamic config result. */
export function servicesFromConfig(dynamic: SiteConfigResult | null): WebsiteServices {
  const featureCodes = codesFromRights(dynamic);
  const rawModules = Array.isArray(dynamic?.websiteModules) ? dynamic!.websiteModules : [];
  const fromApi = featureCodes.size > 0 || rawModules.length > 0;

  const moduleList: WebsiteModuleItem[] = rawModules.map((m: any) => ({
    serviceTypeId: Number(m.serviceTypeId ?? 0),
    serviceName: String(m.serviceName ?? 'Service'),
    serviceCode: String(m.serviceCode ?? 'TOUR').toUpperCase(),
    serviceIcon: m.serviceIcon ? String(m.serviceIcon) : undefined,
    displayOrder: Number(m.displayOrder ?? 99),
    url: m.url ? String(m.url) : null,
    route: resolveNativeModuleRoute(String(m.serviceCode ?? 'TOUR')),
  })).sort((a, b) => a.displayOrder - b.displayOrder);

  if (!fromApi) {
    return {
      ...DEFAULT_SERVICES,
      featureCodes,
      fromApi: false,
      moduleList: [
        { serviceTypeId: 1, serviceName: 'Hotels', serviceCode: 'HOTEL', displayOrder: 1, route: '/(tabs)/explore?category=hotel' },
        { serviceTypeId: 2, serviceName: 'Tours', serviceCode: 'TOUR', displayOrder: 2, route: '/featured-tours' },
        { serviceTypeId: 3, serviceName: 'Packages', serviceCode: 'PACKAGE', displayOrder: 3, route: '/destinations' },
        { serviceTypeId: 4, serviceName: 'Flights', serviceCode: 'FLIGHT', displayOrder: 4, route: '/flight-enquiry' },
        { serviceTypeId: 5, serviceName: 'Transfers', serviceCode: 'TRANSFER', displayOrder: 5, route: '/airport-transfer' },
        { serviceTypeId: 6, serviceName: 'Visas', serviceCode: 'VISA', displayOrder: 6, route: '/visa-hub' },
        { serviceTypeId: 7, serviceName: 'Dining', serviceCode: 'RESTAURANT', displayOrder: 7, route: '/culinary-guide' },
        { serviceTypeId: 8, serviceName: 'Custom Trip', serviceCode: 'BUILDPACKAGE', displayOrder: 8, route: '/group-planning' },
      ],
    };
  }

  const has = (...keys: string[]) =>
    keys.some((k) => featureCodes.has(k.toUpperCase()));

  const hasModule = (code: string) =>
    rawModules.some((m: any) => String(m.serviceCode || '').toUpperCase() === code.toUpperCase());

  return {
    tours: has('TOUR', 'TOURS', 'AS', 'ALLSERVICES', 'TLRVHIT') || hasModule('TOUR') || true,
    hotels: has('HOTEL', 'HOTELS', 'HSEARCHV2', 'HOTELPOLYGONSEARCH', 'SHCAT', 'ISSHOWROOM', 'SPWH') || hasModule('HOTEL'),
    activities: has('ACTIVITY', 'ACTIVITIES') || hasModule('ACTIVITY') || hasModule('TOUR'),
    transfers: has('TRANSFER', 'TRANSFERS', 'TRANFER') || hasModule('TRANSFER'),
    flights: has('FLIGHT', 'FLIGHTS') || hasModule('FLIGHT'),
    visa: has('VISA', 'VISAWHYCHOOSEUS') || hasModule('VISA'),
    restaurants: has('RESTAURANT', 'RESTAURANTS') || hasModule('RESTAURANT'),
    insurance: has('INSURANCE') || hasModule('INSURANCE'),
    packages: has('PACKAGE', 'PACKAGES', 'SPWH', 'AS') || hasModule('PACKAGE') || true,
    carRental: has('CARRENTAL') || hasModule('CARRENTAL'),
    buildPackage: has('BUILDPACKAGE') || hasModule('BUILDPACKAGE') || true,
    featureCodes,
    fromApi: true,
    moduleList: moduleList.length > 0 ? moduleList : [
      { serviceTypeId: 1, serviceName: 'Hotels', serviceCode: 'HOTEL', displayOrder: 1, route: '/(tabs)/explore?category=hotel' },
      { serviceTypeId: 2, serviceName: 'Tours', serviceCode: 'TOUR', displayOrder: 2, route: '/featured-tours' },
      { serviceTypeId: 3, serviceName: 'Packages', serviceCode: 'PACKAGE', displayOrder: 3, route: '/destinations' },
      { serviceTypeId: 4, serviceName: 'Transfers', serviceCode: 'TRANSFER', displayOrder: 4, route: '/airport-transfer' },
      { serviceTypeId: 5, serviceName: 'Visas', serviceCode: 'VISA', displayOrder: 5, route: '/visa-hub' },
    ],
  };
}

export function isServiceEnabled(
  services: WebsiteServices,
  name: keyof Omit<WebsiteServices, 'featureCodes' | 'fromApi' | 'moduleList'>
): boolean {
  return Boolean(services[name]);
}
