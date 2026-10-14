"use client";

/**
 * components/examples/WebsiteScraperPanel.tsx
 * =========================================================================
 * Pick one of the three sites, fetch its homepage summary from
 * /api/scrape, and show it. Drop this anywhere in an App Router page:
 *
 *   import { WebsiteScraperPanel } from "@/components/examples/WebsiteScraperPanel";
 *   export default function Page() { return <WebsiteScraperPanel />; }
 */
import { useState } from "react";
import type { ScrapedSite, ScrapeError } from "@/lib/homepageScraper";

const SITES = [
    { value: "gujjutours", label: "Gujju Tours" },
    { value: "tripgoasia", label: "TripGoAsia" },
    { value: "technoheaven", label: "Technoheaven" },
];

type Status = "idle" | "loading" | "success" | "error";

export function WebsiteScraperPanel() {
    const [site, setSite] = useState(SITES[0].value);
    const [status, setStatus] = useState<Status>("idle");
    const [data, setData] = useState<ScrapedSite | null>(null);
    const [error, setError] = useState<ScrapeError | null>(null);

    async function handleFetch() {
        setStatus("loading");
        setError(null);
        setData(null);

        try {
            const res = await fetch(`/api/scrape?site=${encodeURIComponent(site)}`, {
                cache: "no-store",
            });
            const body = await res.json();

            if (!res.ok || !body.ok) {
                setError(body.error ?? { message: "Unknown error" });
                setStatus("error");
                return;
            }

            setData(body.data);
            setStatus("success");
        } catch (err) {
            setError({
                input: site,
                url: null,
                code: "NETWORK",
                message: err instanceof Error ? err.message : String(err),
                status: null,
            });
            setStatus("error");
        }
    }

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Website Homepage Summary</h1>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <select
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db" }}
                >
                    {SITES.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleFetch}
                    disabled={status === "loading"}
                    style={{
                        padding: "8px 16px",
                        borderRadius: 6,
                        border: "none",
                        background: status === "loading" ? "#9ca3af" : "#2563eb",
                        color: "#fff",
                        cursor: status === "loading" ? "default" : "pointer",
                    }}
                >
                    {status === "loading" ? "Fetching…" : "Fetch"}
                </button>
            </div>

            {status === "error" && error && (
                <div
                    style={{
                        padding: 12,
                        borderRadius: 6,
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                        marginBottom: 16,
                    }}
                >
                    <strong>{error.code}:</strong> {error.message}
                </div>
            )}

            {status === "success" && data && (
                <div style={{ display: "grid", gap: 16 }}>
                    <div>
                        <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase" }}>Title</div>
                        <div>{data.title || "—"}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase" }}>
                            Meta description
                        </div>
                        <div>{data.metaDescription || "—"}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase" }}>H1</div>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {data.headings.h1.length ? (
                                data.headings.h1.map((h, i) => <li key={i}>{h}</li>)
                            ) : (
                                <li>—</li>
                            )}
                        </ul>
                    </div>

                    <div>
                        <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase" }}>H2</div>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {data.headings.h2.length ? (
                                data.headings.h2.map((h, i) => <li key={i}>{h}</li>)
                            ) : (
                                <li>—</li>
                            )}
                        </ul>
                    </div>

                    <div>
                        <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase" }}>Phone numbers</div>
                        <div>{data.phones.length ? data.phones.join(", ") : "—"}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase" }}>Emails</div>
                        <div>{data.emails.length ? data.emails.join(", ") : "—"}</div>
                    </div>

                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        Fetched {data.finalUrl} at {new Date(data.fetchedAt).toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
}