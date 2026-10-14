"use client";

/**
 * components/examples/HostnameConfigPanel.tsx
 * =========================================================================
 * Client-side usage: resolve a hostname/slug and fetch its config through
 * the API route (never import lib/hostnameRegistry.ts's server logic
 * directly into a "use client" file that needs Node-only env access —
 * this component only talks to /api/website-config/<id>).
 */
import { useState } from "react";
import type { SiteConfigResponse } from "@/lib/siteConfig";

const EXAMPLES = ["website1", "website2", "website3", "gujjutours", "not-a-real-site"];

export function HostnameConfigPanel() {
    const [input, setInput] = useState(EXAMPLES[0]);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [body, setBody] = useState<SiteConfigResponse | null>(null);
    const [httpStatus, setHttpStatus] = useState<number | null>(null);

    async function handleFetch() {
        setStatus("loading");
        const res = await fetch(`/api/website-config/${encodeURIComponent(input)}?lang=en`, {
            cache: "no-store",
        });
        setHttpStatus(res.status);
        const json = (await res.json()) as SiteConfigResponse;
        setBody(json);
        setStatus(res.ok && json.isSuccess ? "success" : "error");
    }

    return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                Resolve hostname → website config
            </h1>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="website1, gujjutours, www.tripgoasia.com..."
                    style={{ flex: 1, padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
                />
                <button
                    onClick={handleFetch}
                    disabled={status === "loading"}
                    style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff" }}
                >
                    Fetch
                </button>
            </div>

            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                Try: {EXAMPLES.join(", ")} — the last one demonstrates the strict 404.
            </div>

            {httpStatus !== null && (
                <div style={{ marginBottom: 8 }}>
                    HTTP status: <strong>{httpStatus}</strong>
                </div>
            )}

            {status === "error" && body && (
                <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#b91c1c" }}>
                    {body.error}
                </div>
            )}

            {status === "success" && body?.result && (
                <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 6, overflowX: "auto", fontSize: 12 }}>
                    {JSON.stringify(body.result.website, null, 2)}
                </pre>
            )}
        </div>
    );
}