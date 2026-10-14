/**
 * ==========================================================================
 *  THE ONE FILE YOU EDIT TO CONNECT ANOTHER WEBSITE'S API
 * ==========================================================================
 *
 *  1. Add a block to EXTRA_SITES (a new website) or SOURCE_OVERRIDES
 *     (point website1 / website2 / website3 at their own API).
 *  2. Put the API URL / key in .env.local (never in this file):
 *         SUNRISE_API_URL=https://api.sunrisetours.com
 *         SUNRISE_API_KEY=xxxxxxxx
 *  3. Restart `npm run dev` and open:
 *         http://localhost:3000/preview/www.sunrisetours.com
 *     If something looks wrong, open the debug page:
 *         http://localhost:3000/api/website-config/www.sunrisetours.com/debug
 *     It shows the URL called, the raw answer, what was mapped, and what is missing.
 *
 *  What an API can provide (all optional, whatever it has is used):
 *     name, logo, theme colors, fonts, home page texts/sections, contact...
 *  Whatever the API does NOT provide comes from the template site
 *  (website1/2/3) and finally from the defaults, so a site never breaks.
 *
 *  Priority (lowest -> highest):  defaults < template/static file < API < your saved database config
 *
 *  Placeholders you can use in `path` and `headers`:
 *     {hostname}  {lang}  {websiteId}  {env:ANY_ENV_NAME}
 */
import type { ExtraSiteDefinition, RestSourceConfig, WebsiteId } from "./types";

/* ------------------------------------------------------------------ */
/*  A) Brand-new websites                                              */
/* ------------------------------------------------------------------ */
export const EXTRA_SITES: ExtraSiteDefinition[] = [
    /* ---- EXAMPLE 1: the other API has the SAME format as the Gujju Tours config API ----
    {
        id: "sunrise",
        label: "Sunrise Tours",
        hostnames: ["www.sunrisetours.com", "sunrisetours.com"],
        template: "website1",            // borrow layout / sections / footer from website1
        source: {
            type: "rest",
            baseUrlEnv: "SUNRISE_API_URL",
            path: "/api/core/v1/config/{hostname}?lang={lang}",
            format: "native",
            responsePath: "result",
            successPath: "isSuccess",
            overlaySavedConfig: true,    // home page saved in YOUR database wins
        },
    },
    */

    /* ---- EXAMPLE 2: a completely different API, mapped field by field ----
    // Their API answers e.g.:
    //   { "data": { "site": { "title": "Sunrise", "logo": "https://.../logo.png" },
    //               "branding": { "primaryColor": "#ea580c", "font": "Poppins" },
    //               "home": { "heroTitle": "Sunrise over Bali", "sections": ["hero","featuredTours","cta"] } } }
    {
        id: "sunrise",
        label: "Sunrise Tours",
        hostnames: ["www.sunrisetours.com"],
        template: "website2",
        source: {
            type: "rest",
            baseUrlEnv: "SUNRISE_API_URL",
            path: "/v1/site?domain={hostname}",
            headers: { Authorization: "Bearer {env:SUNRISE_API_KEY}" },
            responsePath: "data",
            mapping: {
                // left side  = same names as in config/website1.js
                // right side = where the value is in THEIR json (relative to responsePath)
                "name": "site.title",
                "logo": "site.logo",
                "theme.primary": "branding.primaryColor",
                "theme.secondary": "branding.secondaryColor",
                "theme.accent": { from: "branding.accentColor", default: "#f59e0b" },
                "typography.headingFont": "branding.font",
                "typography.bodyFont": "branding.font",
                "hero.title": "home.heroTitle",
                "hero.description": "home.heroSubtitle",
                "homeSections": { from: "home.sections", as: "array" },
                "contact.email": "contact.email",
                "contact.phone": "contact.phone",
            },
        },
    },
    */
];

/* ------------------------------------------------------------------ */
/*  B) Point website1 / website2 / website3 at their OWN API           */
/*     (by default they use your backend, which also serves the saved  */
/*      config from the database)                                      */
/* ------------------------------------------------------------------ */
export const SOURCE_OVERRIDES: Partial<Record<WebsiteId, RestSourceConfig>> = {
    website1: {
        type: "rest",
        baseUrl: "https://stagingapi.gujjutours.com",
        baseUrlEnv: "GUJJUTOURS_API_URL",
        path: "/api/core/v1/config/{hostname}?lang={lang}",
        format: "native",
        responsePath: "result",
        successPath: "isSuccess",
        overlaySavedConfig: true,
    },
    website2: {
        type: "rest",
        baseUrl: "https://stagingapi.tripgoasia.com",
        baseUrlEnv: "TRIPGOASIA_API_URL",
        path: "/api/core/v1/config/{hostname}?lang={lang}",
        format: "native",
        responsePath: "result",
        successPath: "isSuccess",
        overlaySavedConfig: true,
    },
    website3: {
        type: "rest",
        baseUrl: "https://stagingapi.technoheaven.com",
        baseUrlEnv: "TECHNOHEAVEN_API_URL",
        path: "/api/core/v1/config/{hostname}?lang={lang}",
        format: "native",
        responsePath: "result",
        successPath: "isSuccess",
        overlaySavedConfig: true,
    },
};