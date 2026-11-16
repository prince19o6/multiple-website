import type { SupportedSiteId } from "./types";
import { RemotePlatformProvider } from "./remoteProvider";
import { LocalBackendProvider } from "./localProvider";

const remoteProvider = new RemotePlatformProvider();
const localProvider = new LocalBackendProvider();

export function getCatalogProvider(): RemotePlatformProvider {
  return remoteProvider;
}

export function getLocalBackendProvider(): LocalBackendProvider {
  return localProvider;
}

export function getSiteCurrency(siteId: SupportedSiteId): { symbol: string; code: string } {
  if (siteId === "gujjutours" || siteId === "website1") {
    return { symbol: "₹", code: "INR" };
  }
  if (siteId === "tripgoasia" || siteId === "website2") {
    return { symbol: "$", code: "USD" };
  }
  return { symbol: "$", code: "USD" };
}

export function formatPrice(amount: number, siteId: SupportedSiteId, overrideCurrency?: string): string {
  const currency = overrideCurrency ? { symbol: overrideCurrency === "INR" ? "₹" : "$", code: overrideCurrency } : getSiteCurrency(siteId);

  if (currency.code === "INR") {
    // If amount came in AED or small USD, convert approximately to INR or format with Indian grouping
    const inrValue = amount < 1000 ? Math.round(amount * 22.8) : Math.round(amount);
    return `₹${inrValue.toLocaleString("en-IN")}`;
  }

  return `$${amount.toFixed(2)}`;
}

