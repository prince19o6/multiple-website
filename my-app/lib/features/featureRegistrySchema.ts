import { z } from "zod";

// ─── Enums & Literals ────────────────────────────────────────────────────────

export const FeatureTypeEnum = z.enum(["service", "module", "page"]);
export type FeatureType = z.infer<typeof FeatureTypeEnum>;

export const PlatformEnum = z.enum(["web", "app"]);
export type Platform = z.infer<typeof PlatformEnum>;

export const SearchTypeEnum = z.enum([
  "tour",
  "hotel",
  "flight",
  "transfer",
  "car",
  "holiday",
  "visa",
  "restaurant",
  "buildpackage",
  "none",
]);
export type SearchType = z.infer<typeof SearchTypeEnum>;

export const ProviderEnum = z.enum(["remote_api", "local_backend"]);
export type Provider = z.infer<typeof ProviderEnum>;

// ─── Feature Icon Schema ─────────────────────────────────────────────────────

export const FeatureIconSchema = z.object({
  url: z.string().optional().default(""),
  fallbackKey: z.string().optional().default("sparkles-outline"),
});
export type FeatureIcon = z.infer<typeof FeatureIconSchema>;

// ─── Feature Item Schema ─────────────────────────────────────────────────────

export const FeatureItemSchema = z.object({
  id: z.string().min(1, "Feature id is required"),
  type: FeatureTypeEnum.default("service"),
  label: z.record(z.string(), z.string()).default({ en: "" }),
  icon: FeatureIconSchema.default({ url: "", fallbackKey: "sparkles-outline" }),
  route: z.string().default(""),
  order: z.number().int().default(0),
  enabled: z.boolean().default(true),
  platforms: z.array(PlatformEnum).default(["web", "app"]),
  visibleInNav: z.boolean().default(true),
  visibleOnHome: z.boolean().default(true),
  searchType: SearchTypeEnum.default("none"),
  dependsOn: z.array(z.string()).default([]),
  requiresAuth: z.boolean().default(false),
  roles: z.array(z.string()).default(["Public"]),
  badge: z.string().optional(),
  provider: ProviderEnum.default("local_backend"),
});
export type FeatureItem = z.infer<typeof FeatureItemSchema>;

export const FeatureRegistrySchema = z.array(FeatureItemSchema);
export type FeatureRegistry = z.infer<typeof FeatureRegistrySchema>;

// ─── Dependency Resolver & Helpers ───────────────────────────────────────────

export function resolveFeatureDependencies(items: FeatureItem[]): FeatureItem[] {
  const itemMap = new Map<string, FeatureItem>(
    items.map((item) => [item.id, { ...item }])
  );

  let changed = true;
  let iterations = 0;
  const maxIterations = items.length + 1;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const [, item] of itemMap) {
      if (!item.enabled) continue;

      if (Array.isArray(item.dependsOn) && item.dependsOn.length > 0) {
        for (const depId of item.dependsOn) {
          const parent = itemMap.get(depId);
          if (!parent || !parent.enabled) {
            item.enabled = false;
            changed = true;
            break;
          }
        }
      }
    }
  }

  return Array.from(itemMap.values()).sort((a, b) => a.order - b.order);
}

export function getEnabledFeatures(
  items: FeatureItem[] | undefined,
  platform: Platform = "app"
): FeatureItem[] {
  if (!Array.isArray(items)) return [];
  const resolved = resolveFeatureDependencies(items);
  return resolved.filter(
    (item) => item.enabled && item.platforms.includes(platform)
  );
}

export function isFeatureItemEnabled(
  items: FeatureItem[] | undefined,
  featureId: string,
  platform: Platform = "app"
): boolean {
  if (!Array.isArray(items)) return false;
  const resolved = resolveFeatureDependencies(items);
  const found = resolved.find((item) => item.id.toLowerCase() === featureId.toLowerCase());
  if (!found || !found.enabled) return false;
  if (!found.platforms.includes(platform)) return false;
  return true;
}

export function getNavFeatures(
  items: FeatureItem[] | undefined,
  platform: Platform = "app"
): FeatureItem[] {
  return getEnabledFeatures(items, platform).filter((item) => item.visibleInNav);
}

export function getHomeFeatures(
  items: FeatureItem[] | undefined,
  platform: Platform = "app"
): FeatureItem[] {
  return getEnabledFeatures(items, platform).filter((item) => item.visibleOnHome);
}

export function getSearchFeatures(
  items: FeatureItem[] | undefined,
  platform: Platform = "app"
): FeatureItem[] {
  return getEnabledFeatures(items, platform).filter(
    (item) => item.searchType !== "none"
  );
}
