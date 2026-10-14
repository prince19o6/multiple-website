// scripts/push-website-configs.mjs
//
// Copies the home page / section config of website1, website2 and website3
// into the database (through your backend), so the sites read it from the API
// instead of from the static files, and you can edit it in the database.
//
//   node scripts/push-website-configs.mjs --dry-run   (look, change nothing)
//   node scripts/push-website-configs.mjs             (do it)
//
// SAFE BY DESIGN
//  - Whatever is already saved for a hostname WINS. Static values only fill
//    the gaps, so existing content (e.g. your Tripgoasia texts/colors) is kept.
//  - A backup of every existing saved config is written to
//    scripts/backup-website-configs-<time>.json before anything is changed.
//  - If the live config API already supplies a real color palette / font for
//    a hostname (Gujju Tours does), "theme" / "typography" are NOT pushed, so
//    the API's values are the ones the site uses.
//
// Needs Node 18+ (built-in fetch) and the backend running.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.argv.includes("--dry-run");

const SITES = [
    { file: "config/website1.js", name: "website1", hostname: "www.gujjutours.com" },
    { file: "config/website2.js", name: "website2", hostname: "www.tripgoasia.com" },
    { file: "config/website3.js", name: "website3", hostname: "stagingb2b.technoheaven.com" },
];

function readEnvValue(key) {
    for (const f of [".env.local", ".env"]) {
        const p = path.join(root, f);
        if (!fs.existsSync(p)) continue;
        for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
            const m = line.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)\\s*$`));
            if (m) return m[1].replace(/^["']|["']$/g, "");
        }
    }
    return "";
}

const API = (
    process.env.API_URL ||
    readEnvValue("NEXT_PUBLIC_API_URL") ||
    "http://localhost:5000"
).replace(/\/+$/, "");

function isObj(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
}

// base = static defaults, over = what is already saved (wins)
function deepMerge(base, over) {
    if (!isObj(base) || !isObj(over)) return over !== undefined ? over : base;
    const out = { ...base };
    for (const k of Object.keys(over)) {
        out[k] = isObj(base[k]) && isObj(over[k]) ? deepMerge(base[k], over[k]) : over[k];
    }
    return out;
}

function loadStaticConfig(file) {
    const raw = fs.readFileSync(path.join(root, file), "utf8");

    // Strip any import lines (config files shouldn't have any, but be safe)
    // and find "export default <name>" WHEREVER it is (not just at EOF —
    // some editors add trailing blank lines / comments after it).
    let body = raw.replace(/^\s*import\s+.*?;?\s*$/gm, "");

    const m = body.match(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/);
    if (!m) {
        throw new Error(
            `${file}: could not find "export default <name>". ` +
            `Make sure the file ends with something like "export default website1;"`
        );
    }
    const exportedName = m[1];

    // Remove the "export default X;" statement itself, then strip any
    // OTHER "export " keywords (named exports) so the rest still parses
    // as plain JS when run through new Function().
    body = body.replace(m[0], "");
    body = body.replace(/\bexport\s+(?=const|let|var|function|class)/g, "");

    let obj;
    try {
        obj = new Function(`${body}\n;return ${exportedName};`)();
    } catch (err) {
        throw new Error(`${file}: failed to evaluate config — ${err.message}`);
    }
    return JSON.parse(JSON.stringify(obj)); // plain JSON only
}

async function getJson(url) {
    let res;
    try {
        res = await fetch(url, { headers: { Accept: "application/json" } });
    } catch {
        throw new Error(`Cannot reach ${url}. Is the backend running (dotnet run in toursApi)?`);
    }
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, json, text };
}

async function main() {
    console.log(`Backend: ${API}${DRY_RUN ? "   (dry run: nothing will be changed)" : ""}\n`);

    const backup = {};
    const plans = [];

    for (const site of SITES) {
        const staticConfig = loadStaticConfig(site.file);

        // 1. what does the live config API already provide for this hostname?
        const live = await getJson(`${API}/api/core/v1/config/${site.hostname}?lang=en`);
        if (!live.json) {
            throw new Error(
                `Cannot reach ${API}. Start the backend first (dotnet run). Response: ${live.text.slice(0, 120)}`
            );
        }
        const colors = live.json?.result?.colors;
        const realPalette = ["primary", "secondary", "neutral"].some(
            (k) => isObj(colors?.[k]) && Object.keys(colors[k]).length > 0
        );
        const realFont = !!live.json?.result?.font?.family;

        // 2. what is already saved?
        const saved = await getJson(`${API}/api/admin/website-config/${site.hostname}`);
        const existing = saved.status === 200 && isObj(saved.json?.config) ? saved.json.config : null;
        if (existing) backup[site.hostname] = existing;

        // 3. build what to store
        const fromStatic = { ...staticConfig };
        const skipped = [];
        if (realPalette) { delete fromStatic.theme; skipped.push("theme"); }
        if (realFont) { delete fromStatic.typography; skipped.push("typography"); }

        const merged = existing ? deepMerge(fromStatic, existing) : fromStatic;
        plans.push({ site, merged, hadExisting: !!existing, skipped });

        console.log(`${site.name}  ${site.hostname}`);
        console.log(`  saved config in database : ${existing ? "yes (kept, gaps filled from static)" : "no (creating)"}`);
        console.log(`  API color palette        : ${realPalette ? "real (site will use it)" : "none (theme stored from static file)"}`);
        console.log(`  API font                 : ${realFont ? "real (site will use it)" : "none (typography stored from static file)"}`);
        console.log(`  top-level keys stored    : ${Object.keys(merged).length}${skipped.length ? `   (skipped: ${skipped.join(", ")})` : ""}\n`);
    }

    if (DRY_RUN) { console.log("Dry run finished. Run again without --dry-run to save."); return; }

    if (Object.keys(backup).length > 0) {
        const file = path.join(root, "scripts", `backup-website-configs-${Date.now()}.json`);
        fs.writeFileSync(file, JSON.stringify(backup, null, 2));
        console.log(`Backup of existing saved configs: ${path.relative(root, file)}\n`);
    }

    for (const { site, merged } of plans) {
        const res = await fetch(`${API}/api/admin/website-config/${site.hostname}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(merged),
        });
        const body = await res.text();
        console.log(`${site.name}: ${res.ok ? "saved" : "FAILED"} (${res.status}) ${res.ok ? "" : body.slice(0, 200)}`);
        if (!res.ok) process.exitCode = 1;
    }
    console.log("\nDone. Reload the websites (the site caches config for up to 60 seconds).");
}

main().catch((e) => { console.error("\nError:", e.message); process.exit(1); });
