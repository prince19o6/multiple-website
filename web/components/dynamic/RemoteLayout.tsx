// components/dynamic/RemoteLayout.tsx
"use client";

import React from "react";
import { RemoteComponent } from "./RemoteComponent";

interface RemoteLayoutProps {
    siteId: string;
    layoutType?: "header" | "footer" | "fullLayout";
    children?: React.ReactNode;
    overrides?: {
        header?: React.ComponentType<any>;
        footer?: React.ComponentType<any>;
    };
}

export const RemoteLayout: React.FC<RemoteLayoutProps> = ({
    siteId,
    layoutType = "fullLayout",
    children,
    overrides,
}) => {
    const showHeader = layoutType === "fullLayout" || layoutType === "header";
    const showFooter = layoutType === "fullLayout" || layoutType === "footer";

    return (
        <div className="remote-layout-container flex flex-col min-h-screen">
            {/* Remote Header */}
            {showHeader && (
                <header className="remote-header-slot sticky top-0 z-50">
                    <RemoteComponent
                        siteId={siteId}
                        componentName="header"
                        localOverride={overrides?.header}
                    />
                </header>
            )}

            {/* Local Main Page Content */}
            <main className="flex-1 container mx-auto p-4">{children}</main>

            {/* Remote Footer */}
            {showFooter && (
                <footer className="remote-footer-slot">
                    <RemoteComponent
                        siteId={siteId}
                        componentName="footer"
                        localOverride={overrides?.footer}
                    />
                </footer>
            )}
        </div>
    );
};
