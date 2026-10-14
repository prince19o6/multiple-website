import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

type Props = {
    config: MergedWebsiteConfig;
    selector?: string;
};

export function ThemeStyleInjector({
    config,
    selector = ":root",
}: Props) {
    const vars = config.cssVariables || {};
    if (!Object.keys(vars).length) return null;

    const declarations = Object.entries(vars)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join("\n");

    const fontFamily =
        (config.typography as { bodyFont?: string } | undefined)?.bodyFont ||
        config.dynamic?.font?.family;

    const bodyExtras = fontFamily
        ? `\n${selector === ":root" ? "body" : selector} {\n  font-family: '${fontFamily}', system-ui, sans-serif;\n}`
        : "";

    const css = `${selector} {\n${declarations}\n}${bodyExtras}`;

    return (
        <style
            id="site-theme-vars"
            dangerouslySetInnerHTML={{ __html: css }}
        />
    );
}