// components/dynamic/RemoteComponent.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { fetchRemoteContent } from "@/lib/remoteFetcher";
import { executeRemoteFunction } from "@/lib/remoteFunctionLoader";

interface RemoteComponentProps {
    siteId: string;
    componentName: string;
    props?: Record<string, any>;
    localOverride?: React.ComponentType<any>;
    fallback?: React.ReactNode;
    onLoaded?: () => void;
}

export const RemoteComponent: React.FC<RemoteComponentProps> = ({
    siteId,
    componentName,
    props = {},
    localOverride: LocalOverrideComponent,
    fallback = <div className="p-4 bg-gray-100 animate-pulse rounded">Loading Remote Component...</div>,
    onLoaded,
}) => {
    // ─── All hooks must be called unconditionally, before any return ────────────
    const [htmlContent, setHtmlContent] = useState<string | null>(null);
    const [isFallback, setIsFallback] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch the remote HTML — skipped when a local override is provided so we
    // don't make a pointless network request, but the hook itself always runs.
    useEffect(() => {
        if (LocalOverrideComponent) return; // no fetch needed

        let isMounted = true;

        async function loadComponent() {
            const { content, isFallback: fallbackState } = await fetchRemoteContent<string>({
                siteId,
                path: `/components/${componentName}.html`,
            });

            if (isMounted) {
                setHtmlContent(content);
                setIsFallback(fallbackState);
                if (onLoaded) onLoaded();
            }
        }

        loadComponent();

        return () => {
            isMounted = false;
        };
        // LocalOverrideComponent intentionally not in deps — it is stable per render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteId, componentName]);

    // Hydrate inline <script> tags in fetched HTML after mount.
    useEffect(() => {
        if (LocalOverrideComponent || !containerRef.current || !htmlContent) return;

        const container = containerRef.current;
        const scripts = container.querySelectorAll<HTMLScriptElement>("script");

        scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) =>
                newScript.setAttribute(attr.name, attr.value)
            );

            if (oldScript.textContent) {
                executeRemoteFunction(oldScript.textContent, {
                    element: container,
                    props,
                });
            } else if (oldScript.src) {
                newScript.src = oldScript.src;
                document.head.appendChild(newScript);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [htmlContent, props]);
    // ────────────────────────────────────────────────────────────────────────────

    // 1. Local override takes priority — rendered after all hooks are settled.
    if (LocalOverrideComponent) {
        return <LocalOverrideComponent {...props} />;
    }

    // 2. Show fallback skeleton while the remote HTML is still loading.
    if (!htmlContent) return <>{fallback}</>;

    // 3. Render sanitised remote HTML.
    return (
        <div
            ref={containerRef}
            className={`remote-component-wrapper ${isFallback ? "is-fallback" : ""}`}
            data-remote-site={siteId}
            data-remote-component={componentName}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};
