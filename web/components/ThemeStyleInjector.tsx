import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import type { SiteConfig } from "@/lib/config/siteConfigSchema";
import { contrastRatioHex, deriveReadableTextColorHex } from "@/lib/contrast";

type Props = {
  config: MergedWebsiteConfig | SiteConfig | any;
  selector?: string;
};

export function ThemeStyleInjector({
  config,
  selector = ":root",
}: Props) {
  if (!config) return null;

  // Extract theme colors
  const theme = config.theme || {};
  const colors = theme.colors || {};
  const darkColors = theme.darkColors || {};
  const radius = theme.radius || { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
  const shadows = theme.shadows || {
    none: "none",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  };
  const spacing = theme.spacing || { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

  // WCAG AA contrast check against white (#ffffff)
  const primary = colors.primary || theme.primary || "#2563eb";
  const primaryLight = colors.primaryLight || theme.primaryLight || "#dbeafe";
  const primaryDark = colors.primaryDark || theme.primaryDark || "#1d4ed8";
  let primaryText = colors.primaryText || theme.primaryText || primaryDark;

  const bg = colors.background || "#ffffff";
  const contrastRatio = contrastRatioHex(primaryText, bg);
  if (contrastRatio < 4.5) {
    primaryText = deriveReadableTextColorHex(primary, bg, 4.5);
  }

  const secondary = colors.secondary || theme.secondary || "#0f172a";
  const accent = colors.accent || theme.accent || "#f59e0b";
  const surface = colors.surface || theme.surface || "#ffffff";
  const surface2 = colors.surface2 || theme.surface2 || "#f8fafc";
  const text = colors.text || theme.text || "#0f172a";
  const heading = colors.heading || theme.heading || text;
  const mutedText = colors.mutedText || theme.mutedText || "#64748b";
  const border = colors.border || theme.border || "#e2e8f0";
  const success = colors.success || theme.success || "#16a34a";
  const danger = colors.danger || theme.danger || "#dc2626";
  const footerBg = colors.footerBg || theme.footerBg || "#0f172a";
  const footerText = colors.footerText || theme.footerText || "#f8fafc";

  // Dark palette
  const darkBg = darkColors.background || "#0b0f19";
  const darkSurface = darkColors.surface || "#131b2e";
  const darkSurface2 = darkColors.surface2 || "#1e293b";
  const darkText = darkColors.text || "#f8fafc";
  const darkHeading = darkColors.heading || "#f8fafc";
  const darkMutedText = darkColors.mutedText || "#94a3b8";
  const darkBorder = darkColors.border || "#1e293b";
  const darkFooterBg = darkColors.footerBg || "#020617";
  const darkFooterText = darkColors.footerText || "#cbd5e1";

  // Typography
  const typography = config.typography || {};
  const headingFont = typography.headingFont || "Inter";
  const bodyFont = typography.bodyFont || "Inter";
  const customFonts: Array<{ family: string; url: string; weight?: number; style?: string }> =
    Array.isArray(typography.customFonts) ? typography.customFonts : [];

  // Font-face declarations (with CloudFront 404 fallback sanitization)
  const fontFaceRules = customFonts
    .map((f) => {
      const sanitizedUrl = f.url ? f.url.replace("Poppins-Bold.woff2", "Poppins-SemiBold.woff2") : f.url;
      return `
@font-face {
  font-family: '${f.family}';
  src: url('${sanitizedUrl}');
  font-weight: ${f.weight || 400};
  font-style: ${f.style || "normal"};
  font-display: swap;
}`;
    })
    .join("\n");

  const css = `
${fontFaceRules}

${selector}, [data-theme="light"] {
  /* Color Tokens */
  --color-primary: ${primary};
  --color-primary-dark: ${primaryDark};
  --color-primary-light: ${primaryLight};
  --color-primary-contrast: #ffffff;
  --color-primary-text: ${primaryText};
  --color-secondary: ${secondary};
  --color-accent: ${accent};
  --color-background: ${bg};
  --color-surface: ${surface};
  --color-surface2: ${surface2};
  --color-text: ${text};
  --color-heading: ${heading};
  --color-muted: ${mutedText};
  --color-border: ${border};
  --color-success: ${success};
  --color-danger: ${danger};
  --color-footer-bg: ${footerBg};
  --color-footer-text: ${footerText};

  /* Tailwind Semantic Token Mappings */
  --primary: ${primary};
  --primary-dark: ${primaryDark};
  --primary-light: ${primaryLight};
  --primary-contrast: #ffffff;
  --primary-text: ${primaryText};
  --secondary: ${secondary};
  --accent: ${accent};
  --bg: ${bg};
  --background: ${bg};
  --surface: ${surface};
  --surface-2: ${surface2};
  --text: ${text};
  --foreground: ${text};
  --heading: ${heading};
  --text-muted: ${mutedText};
  --foreground-muted: ${mutedText};
  --border: ${border};
  --success: ${success};
  --danger: ${danger};
  --footer-bg: ${footerBg};
  --footer-text: ${footerText};

  /* Border Radii Scale */
  --radius-xs: ${radius.xs ?? 4}px;
  --radius-sm: ${radius.sm ?? 8}px;
  --radius-md: ${radius.md ?? 12}px;
  --radius-lg: ${radius.lg ?? 16}px;
  --radius-xl: ${radius.xl ?? 24}px;
  --radius-full: ${radius.full ?? 9999}px;

  /* Shadows Scale */
  --shadow-sm: ${shadows.sm || "0 1px 2px 0 rgb(0 0 0 / 0.05)"};
  --shadow-md: ${shadows.md || "0 4px 6px -1px rgb(0 0 0 / 0.1)"};
  --shadow-lg: ${shadows.lg || "0 10px 15px -3px rgb(0 0 0 / 0.1)"};

  /* Spacing Scale */
  --spacing-xs: ${spacing.xs ?? 4}px;
  --spacing-sm: ${spacing.sm ?? 8}px;
  --spacing-md: ${spacing.md ?? 16}px;
  --spacing-lg: ${spacing.lg ?? 24}px;
  --spacing-xl: ${spacing.xl ?? 32}px;
  --spacing-xxl: ${spacing.xxl ?? 48}px;

  /* Fonts */
  --font-heading: '${headingFont}', system-ui, -apple-system, sans-serif;
  --font-body: '${bodyFont}', system-ui, -apple-system, sans-serif;
}

html.dark,
.dark,
[data-theme="dark"] {
  --color-background: ${darkBg};
  --color-surface: ${darkSurface};
  --color-surface2: ${darkSurface2};
  --color-text: ${darkText};
  --color-heading: ${darkHeading};
  --color-muted: ${darkMutedText};
  --color-border: ${darkBorder};
  --color-footer-bg: ${darkFooterBg};
  --color-footer-text: ${darkFooterText};

  --bg: ${darkBg};
  --background: ${darkBg};
  --surface: ${darkSurface};
  --surface-2: ${darkSurface2};
  --text: ${darkText};
  --foreground: ${darkText};
  --heading: ${darkHeading};
  --text-muted: ${darkMutedText};
  --foreground-muted: ${darkMutedText};
  --border: ${darkBorder};
  --footer-bg: ${darkFooterBg};
  --footer-text: ${darkFooterText};
}

body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
`;

  return (
    <style
      id="site-theme-vars"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
