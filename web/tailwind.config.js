/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic design tokens mapped directly to dynamic CSS variables
        background: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        foreground: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          subtle: "var(--text-subtle)",
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          contrast: "var(--primary-contrast)",
          text: "var(--primary-text)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
          50: "var(--color-primary-50, #f0f9ff)",
          100: "var(--color-primary-100, #e0f2fe)",
          200: "var(--color-primary-200, #bae6fd)",
          300: "var(--color-primary-300, #7dd3fc)",
          400: "var(--color-primary-400, #38bdf8)",
          500: "var(--color-primary-500, #0ea5e9)",
          600: "var(--color-primary-600, #0284c7)",
          700: "var(--color-primary-700, #0369a1)",
          800: "var(--color-primary-800, #075985)",
          900: "var(--color-primary-900, #0c3d66)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          contrast: "var(--secondary-contrast)",
          50: "var(--color-secondary-50, #f8fafc)",
          100: "var(--color-secondary-100, #f1f5f9)",
          200: "var(--color-secondary-200, #e2e8f0)",
          500: "var(--color-secondary-500, #64748b)",
          600: "var(--color-secondary-600, #475569)",
          800: "var(--color-secondary-800, #1e293b)",
          900: "var(--color-secondary-900, #0f172a)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          contrast: "var(--accent-contrast)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      boxShadow: {
        "soft-sm": "var(--shadow-sm)",
        "soft-md": "var(--shadow-md)",
        "soft-lg": "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
