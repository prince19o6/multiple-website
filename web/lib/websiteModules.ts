import type { SiteConfigResult } from "./siteConfig";

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

const DEFAULT_SERVICES: Omit<WebsiteServices, "featureCodes" | "fromApi" | "moduleList"> = {
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

function resolveModuleRoute(code: string): string {
  switch (code.toUpperCase()) {
    case "HOTEL":
      return "/en/hotels";
    case "TOUR":
    case "ACTIVITY":
    case "ACTIVITIES":
      return "/en/tours";
    case "PACKAGE":
    case "HOLIDAYS":
      return "/en/holidays";
    case "FLIGHT":
      return "/en/flights";
    case "TRANSFER":
      return "/en/transfers";
    case "VISA":
      return "/en/visas";
    case "RESTAURANT":
      return "/en/restaurants";
    case "BUILDPACKAGE":
      return "/en/buildpackage";
    case "CARRENTAL":
      return "/en/transfers";
    default:
      return `/en/${code.toLowerCase()}`;
  }
}

function codesFromRights(dynamic: SiteConfigResult | null): Set<string> {
  const set = new Set<string>();
  if (!dynamic?.websiteRights || !Array.isArray(dynamic.websiteRights)) return set;
  for (const item of dynamic.websiteRights) {
    if (item && typeof item === "object") {
      const code = (item as { featureCode?: string }).featureCode;
      if (typeof code === "string" && code) set.add(code.toUpperCase());
      const feature = (item as { feature?: string }).feature;
      if (typeof feature === "string" && feature) set.add(feature.toUpperCase());
    }
  }
  return set;
}

export function servicesFromConfig(dynamic: SiteConfigResult | null): WebsiteServices {
  const featureCodes = codesFromRights(dynamic);
  const rawModules = Array.isArray(dynamic?.websiteModules) ? dynamic!.websiteModules : [];
  const fromApi = featureCodes.size > 0 || rawModules.length > 0;

  const moduleList: WebsiteModuleItem[] = rawModules.map((m: any) => ({
    serviceTypeId: Number(m.serviceTypeId ?? 0),
    serviceName: String(m.serviceName ?? "Service"),
    serviceCode: String(m.serviceCode ?? "TOUR").toUpperCase(),
    serviceIcon: m.serviceIcon ? String(m.serviceIcon) : undefined,
    displayOrder: Number(m.displayOrder ?? 99),
    url: m.url ? String(m.url) : null,
    route: resolveModuleRoute(String(m.serviceCode ?? "TOUR")),
  })).sort((a, b) => a.displayOrder - b.displayOrder);

  if (!fromApi || moduleList.length === 0) {
    const fallbackList: WebsiteModuleItem[] = [
      { serviceTypeId: 1, serviceName: "Hotels", serviceCode: "HOTEL", displayOrder: 1, route: "/en/hotels" },
      { serviceTypeId: 3, serviceName: "Tours", serviceCode: "TOUR", displayOrder: 2, route: "/en/tours" },
      { serviceTypeId: 2, serviceName: "Packages", serviceCode: "PACKAGE", displayOrder: 3, route: "/en/holidays" },
      { serviceTypeId: 4, serviceName: "Flight", serviceCode: "FLIGHT", displayOrder: 4, route: "/en/flights" },
      { serviceTypeId: 5, serviceName: "Transfer", serviceCode: "TRANSFER", displayOrder: 5, route: "/en/transfers" },
      { serviceTypeId: 6, serviceName: "Visa", serviceCode: "VISA", displayOrder: 6, route: "/en/visas" },
      { serviceTypeId: 7, serviceName: "Restaurant", serviceCode: "RESTAURANT", displayOrder: 7, route: "/en/restaurants" },
      { serviceTypeId: 9, serviceName: "Build Package", serviceCode: "BUILDPACKAGE", displayOrder: 8, route: "/en/buildpackage" },
    ];
    return {
      ...DEFAULT_SERVICES,
      featureCodes,
      fromApi: false,
      moduleList: fallbackList,
    };
  }

  const hasCode = (...keys: string[]) =>
    keys.some((k) =>
      featureCodes.has(k.toUpperCase()) ||
      moduleList.some((m) => m.serviceCode === k.toUpperCase())
    );

  return {
    tours: hasCode("TOUR", "TOURS", "ACTIVITY", "ACTIVITIES"),
    hotels: hasCode("HOTEL", "HOTELS", "HSEARCHV2"),
    activities: hasCode("ACTIVITY", "ACTIVITIES", "TOUR"),
    transfers: hasCode("TRANSFER", "TRANSFERS"),
    flights: hasCode("FLIGHT", "FLIGHTS"),
    visa: hasCode("VISA"),
    restaurants: hasCode("RESTAURANT", "RESTAURANTS"),
    insurance: hasCode("INSURANCE"),
    packages: hasCode("PACKAGE", "PACKAGES"),
    carRental: hasCode("CARRENTAL"),
    buildPackage: hasCode("BUILDPACKAGE"),
    featureCodes,
    fromApi: true,
    moduleList,
  };
}

export function isServiceEnabled(
  services: WebsiteServices,
  name: keyof Omit<WebsiteServices, "featureCodes" | "fromApi" | "moduleList">
): boolean {
  return Boolean(services[name]);
}