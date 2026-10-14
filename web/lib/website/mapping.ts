/**
 * Turns "some other website's JSON" into the shape this project understands.
 * Pure functions, no I/O.
 *
 * Mapping keys use the SAME names as your static config files
 * (config/website1.js), so you already know them:
 *
 *   "name"                  -> site name
 *   "logo"                  -> logo URL
 *   "theme.primary"         -> theme color
 *   "typography.headingFont"-> heading font
 *   "hero.title"            -> hero text on the home page
 *   "homeSections"          -> which sections the home page shows, in order
 *
 * Keys that start with an API root (website., colors., font., websiteContact.,
 * websiteLinks., websiteModules. ...) are written to that root as-is.
 */
import type { SiteConfigResult } from "@/lib/siteConfig";
import type { FieldMapping, MappingRule } from "./types";

const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);

/** Roots of the config API envelope. Anything else lives inside websiteConfiguration. */
const API_ROOTS = new Set([
    "website",
    "colors",
    "font",
    "websiteContact",
    "websiteLinks",
    "websiteModules",
    "websiteRights",
    "websiteExtra",
    "websiteConfiguration",
    "websiteCurrency",
    "websiteLaunguage",
    "socialMediaConfig",
    "socialMediaScript",
    "recommendations",
    "geo",
]);

/** Friendly short names. */
const ALIASES: Record<string, string> = {
    name: "website.name",
    logo: "website.logoUrl",
    fontFamily: "font.family",
};

function isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function splitPath(path: string): string[] {
    return path
        .replace(/\[(\d+)\]/g, ".$1")
        .split(".")
        .map((p) => p.trim())
        .filter(Boolean);
}

export function getPath(obj: unknown, path: string): unknown {
    if (!path) return obj;
    let cur: any = obj;
    for (const part of splitPath(path)) {
        if (FORBIDDEN.has(part) || cur === null || cur === undefined) return undefined;
        cur = cur[part];
    }
    return cur;
}

export function setPath(target: Record<string, any>, path: string, value: unknown): void {
    const parts = splitPath(path);
    if (parts.length === 0 || parts.some((p) => FORBIDDEN.has(p))) return;
    let cur = target;
    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (!isPlainObject(cur[key])) cur[key] = {};
        cur = cur[key];
    }
    cur[parts[parts.length - 1]] = value;
}

export function deepMerge(base: unknown, over: unknown): unknown {
    if (!isPlainObject(base) || !isPlainObject(over)) return over !== undefined ? over : base;
    const out: Record<string, any> = { ...base };
    for (const key of Object.keys(over)) {
        if (FORBIDDEN.has(key)) continue;
        out[key] = isPlainObject(base[key]) && isPlainObject(over[key]) ? deepMerge(base[key], over[key]) : over[key];
    }
    return out;
}

export function resolveTarget(target: string): string {
    const key = target.trim();
    if (ALIASES[key]) return ALIASES[key];
    const root = splitPath(key)[0];
    if (root && API_ROOTS.has(root)) return key;
    return `websiteConfiguration.${key}`;
}

function isEmptyValue(value: unknown): boolean {
    return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
    );
}

function coerce(value: unknown, as: MappingRule["as"]): unknown {
    switch (as) {
        case "string":
            return typeof value === "string" ? value : String(value);
        case "number": {
            const n = typeof value === "number" ? value : Number(value);
            return Number.isFinite(n) ? n : undefined;
        }
        case "boolean":
            if (typeof value === "boolean") return value;
            if (typeof value === "string") return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
            return Boolean(value);
        case "array":
            return Array.isArray(value) ? value : [value];
        default:
            return value;
    }
}

export interface MappingOutcome {
    /** Nested object, keys already placed at their final paths */
    result: Record<string, any>;
    /** Mapping targets that found a value */
    filled: string[];
    /** Mapping targets whose source path had no value (and no default) */
    missing: string[];
}

export function applyMapping(payload: unknown, mapping: FieldMapping): MappingOutcome {
    const result: Record<string, any> = {};
    const filled: string[] = [];
    const missing: string[] = [];

    for (const [target, rule] of Object.entries(mapping)) {
        const spec: MappingRule = typeof rule === "string" ? { from: rule } : rule;
        const sources = Array.isArray(spec.from) ? spec.from : [spec.from];

        let value: unknown = undefined;
        for (const source of sources) {
            const candidate = getPath(payload, source);
            if (!isEmptyValue(candidate)) {
                value = candidate;
                break;
            }
        }
        if (isEmptyValue(value)) value = spec.default;

        if (isEmptyValue(value)) {
            missing.push(target);
            continue;
        }

        const converted = spec.as ? coerce(value, spec.as) : value;
        if (isEmptyValue(converted)) {
            missing.push(target);
            continue;
        }

        setPath(result, resolveTarget(target), converted);
        filled.push(target);
    }

    return { result, filled, missing };
}

/** A complete, empty API envelope so the rest of the app never meets undefined fields. */
export function emptySiteConfigResult(): SiteConfigResult {
    return {
        recommendations: [],
        theme: {},
        websiteConfiguration: null,
        websiteContact: { contact: [], email: [] },
        websiteLaunguage: [],
        websiteLinks: { headerType: [], footerTypes: [] },
        font: null,
        colors: {},
        websiteRights: [],
        website: null,
        websiteModules: [],
        websiteExtra: { social: [], cardInfo: [] },
        socialMediaScript: [],
        websiteCurrency: [],
        socialMediaConfig: [],
        geo: { country: null, city: null, ip: null },
    };
}

/** Wraps a partial API-shaped object into a full SiteConfigResult. */
export function toSiteConfigResult(
    partial: Record<string, any>,
    fallbackName: string
): SiteConfigResult {
    const full = deepMerge(emptySiteConfigResult(), partial) as SiteConfigResult;

    // The site must have a name, otherwise it looks "empty" to the merge step
    // and the whole payload (theme, home page...) would be thrown away.
    const website: Record<string, any> = isPlainObject(full.website) ? { ...full.website } : {};
    if (!website.name && !website.fullName) website.name = fallbackName;
    full.website = website as SiteConfigResult["website"];

    // font.files must always be an array.
    if (full.font && typeof full.font === "object" && !Array.isArray((full.font as any).files)) {
        full.font = { ...(full.font as any), files: [] };
    }
    return full;
}