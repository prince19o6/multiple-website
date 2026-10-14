/**
 * lib/homepageScraper.ts
 * =========================================================================
 * Fetches a public website's homepage and pulls out a short summary:
 * title, meta description, headings, phone numbers, emails.
 *
 * This is UNRELATED to the multi-tenant lib/website/* config layer — that
 * one reads YOUR OWN backend's structured JSON for your own sites. This
 * file instead downloads someone's live HTML homepage and parses it with
 * regex, for the three reference sites below (or any hostname you pass in).
 *
 * SERVER-SIDE ONLY: don't import this from a "use client" component.
 * Regex-based HTML parsing is intentionally used instead of a DOM library
 * (cheerio, jsdom) so this file has zero dependencies to install.
 */

/** websiteName -> homepage URL. Add more sites here as needed. */
export const SITE_URLS: Record<string, string> = {
    gujjutours: "https://www.gujjutours.com",
    tripgoasia: "https://www.tripgoasia.com",
    technoheaven: "https://www.technoheaven.com",
};

export interface ScrapedSite {
    input: string; // what was passed in (name or hostname)
    url: string; // final URL actually fetched
    finalUrl: string; // URL after following redirects
    status: number;
    title: string | null;
    metaDescription: string | null;
    headings: { h1: string[]; h2: string[] };
    phones: string[];
    emails: string[];
    fetchedAt: string;
}

export interface ScrapeError {
    input: string;
    url: string | null;
    code: "INVALID_INPUT" | "TIMEOUT" | "NETWORK" | "HTTP_ERROR" | "PARSE_ERROR";
    message: string;
    status: number | null;
}

export type ScrapeResult =
    | { ok: true; data: ScrapedSite }
    | { ok: false; error: ScrapeError };

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 3 * 1024 * 1024; // 3MB is plenty for a homepage's <head>+<body> text

// A normal desktop browser's User-Agent + Accept headers. Some sites block
// requests that look like a bot/script (no User-Agent, or a generic one).
const BROWSER_HEADERS: Record<string, string> = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};

/* ------------------------------------------------------------------ */
/*  Tiny, dependency-free HTML text helpers                           */
/* ------------------------------------------------------------------ */

function decodeEntities(str: string): string {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&mdash;/g, "\u2014")
        .replace(/&ndash;/g, "\u2013")
        .replace(/&nbsp;/g, " ")
        .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html: string): string {
    return decodeEntities(html.replace(/<[^>]*>/g, " "))
        .replace(/\s+/g, " ")
        .trim();
}

function stripNonContentTags(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ");
}

/** All <tag>...</tag> inner text blocks, tags stripped, cleaned, deduped-but-ordered. */
function extractTagText(html: string, tag: "h1" | "h2" | "title"): string[] {
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
        const text = stripTags(m[1]);
        if (text && !out.includes(text)) out.push(text);
    }
    return out;
}

function extractMetaDescription(html: string): string | null {
    const metaTagRe = /<meta\b[^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = metaTagRe.exec(html))) {
        const tag = m[0];
        if (!/(?:name|property)\s*=\s*["'](?:description|og:description)["']/i.test(tag)) {
            continue;
        }
        // Match content="..." or content='...' WITHOUT excluding the other
        // quote char from inside the value (e.g. an apostrophe in "India's").
        const c = tag.match(/content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i);
        const value = c ? (c[1] ?? c[2] ?? "") : "";
        if (value.trim()) return decodeEntities(value).trim();
    }
    return null;
}

function extractEmails(html: string): string[] {
    const found = new Set<string>();

    const mailtoRe = /mailto:([^"'\s?]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = mailtoRe.exec(html))) found.add(m[1].toLowerCase());

    const text = stripTags(stripNonContentTags(html));
    const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    while ((m = emailRe.exec(text))) found.add(m[0].toLowerCase());

    return Array.from(found).slice(0, 5);
}

function extractPhones(html: string): string[] {
    const cleaned = stripNonContentTags(html);
    const results: string[] = [];
    const seenDigits = new Set<string>();

    const add = (raw: string) => {
        const digits = raw.replace(/\D/g, "");
        if (digits.length < 7 || digits.length > 15) return; // ignore years, ids, etc.
        const key = digits.replace(/^0+/, "");
        if (seenDigits.has(key)) return; // same number in different formats
        seenDigits.add(key);
        results.push(raw.trim());
    };

    const telHrefRe = /tel:([+\d][\d\s\-().]{5,20})/gi;
    let m: RegExpExecArray | null;
    while ((m = telHrefRe.exec(cleaned))) add(m[1]);

    const text = stripTags(cleaned);
    // Optional leading "+" or "(", a digit, then digits/spaces/dots/dashes/parens.
    const phoneRe = /(?:\+|\()?\d[\d\s().-]{6,17}\d\)?/g;
    while ((m = phoneRe.exec(text))) add(m[0]);

    return results.slice(0, 5);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** "gujjutours" | "www.gujjutours.com" | "https://gujjutours.com/" -> full https URL to fetch. */
function resolveUrl(input: string): string | null {
    const raw = (input || "").trim();
    if (!raw) return null;

    const byName = SITE_URLS[raw.toLowerCase()];
    if (byName) return byName;

    if (/^https?:\/\//i.test(raw)) return raw;

    // Looks like a bare hostname ("gujjutours.com")
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(raw)) return `https://${raw}`;

    return null;
}

/**
 * Fetches one website's homepage and returns a short content summary.
 * Never throws — always resolves to { ok: true, data } or { ok: false, error }.
 *
 *   const result = await scrapeHomepage("gujjutours");
 *   const result = await scrapeHomepage("www.tripgoasia.com");
 */
export async function scrapeHomepage(
    input: string,
    options: { timeoutMs?: number } = {}
): Promise<ScrapeResult> {
    const url = resolveUrl(input);
    if (!url) {
        return {
            ok: false,
            error: {
                input,
                url: null,
                code: "INVALID_INPUT",
                message: `"${input}" is not a known site name or a valid hostname/URL`,
                status: null,
            },
        };
    }

    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: BROWSER_HEADERS,
            redirect: "follow", // safely follow redirects (http->https, www, etc.)
            signal: controller.signal,
            cache: "no-store",
        });

        if (!response.ok) {
            return {
                ok: false,
                error: {
                    input,
                    url,
                    code: "HTTP_ERROR",
                    message: `Site responded with HTTP ${response.status}`,
                    status: response.status,
                },
            };
        }

        // Cap how much we read, in case of a huge/unexpected response body.
        const reader = response.body?.getReader();
        let html = "";
        if (reader) {
            const decoder = new TextDecoder();
            let bytesRead = 0;
            for (; ;) {
                const { done, value } = await reader.read();
                if (done) break;
                bytesRead += value.byteLength;
                html += decoder.decode(value, { stream: true });
                if (bytesRead > MAX_HTML_BYTES) {
                    await reader.cancel();
                    break;
                }
            }
        } else {
            html = await response.text();
        }

        const data: ScrapedSite = {
            input,
            url,
            finalUrl: response.url || url,
            status: response.status,
            title: extractTagText(html, "title")[0] ?? null,
            metaDescription: extractMetaDescription(html),
            headings: {
                h1: extractTagText(html, "h1").slice(0, 10),
                h2: extractTagText(html, "h2").slice(0, 10),
            },
            phones: extractPhones(html),
            emails: extractEmails(html),
            fetchedAt: new Date().toISOString(),
        };

        return { ok: true, data };
    } catch (err) {
        const aborted = err instanceof Error && err.name === "AbortError";
        return {
            ok: false,
            error: {
                input,
                url,
                code: aborted ? "TIMEOUT" : "NETWORK",
                message: aborted
                    ? `Timed out after ${timeoutMs}ms`
                    : err instanceof Error
                        ? err.message
                        : String(err),
                status: null,
            },
        };
    } finally {
        clearTimeout(timer);
    }
}