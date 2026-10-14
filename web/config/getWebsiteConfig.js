import website1 from "./website1";
import website2 from "./website2";
import website3 from "./website3";
import {
  resolveStaticSlug,
  isAllowedWebsite,
} from "@/lib/hostnameRegistry";

const websites = {
  website1,
  website2,
  website3,
};

export function getWebsiteConfig(site) {
  if (!isAllowedWebsite(site)) return null;
  const slug = resolveStaticSlug(site);
  return slug ? websites[slug] : null;
}

/**
 * Only GujjuTours, Technoheaven, TripGoAsia are valid.
 * Everything else → notFound / blocked.
 */
export function isValidWebsite(site) {
  return isAllowedWebsite(site);
}