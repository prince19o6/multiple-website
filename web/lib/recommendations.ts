// lib/recommendations.ts
//
// Reads config.dynamic.recommendations (from the staging config API)
// to decide whether a given service/feature should be shown. If the
// API hasn't returned recommendation data yet, defaults to showing
// everything rather than hiding features on missing data.

export function isServiceEnabled(config: any, service: string): boolean {
    const recs = config?.dynamic?.recommendations as
        | Array<{ isEnabled: number; favService: string }>
        | undefined;

    if (!recs) return true;

    const match = recs.find((r) => r.favService === service);
    return match ? match.isEnabled === 1 : true;
}