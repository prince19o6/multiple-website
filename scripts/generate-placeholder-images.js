/**
 * scripts/generate-placeholder-images.js
 *
 * Deterministically generates local lightweight WebP / SVG placeholder images
 * for seeded modules without hotlinking external websites.
 * Places images into:
 *   - web/public/seed-images/<module>/
 *   - my-app/assets/seed-images/<module>/
 */

const fs = require('fs');
const path = require('path');

const MODULE_STYLES = {
  hotels: [
    { name: 'hotel-luxury', color1: '#1e3a8a', color2: '#3b82f6', label: 'Luxury Stays' },
    { name: 'hotel-resort', color1: '#065f46', color2: '#10b981', label: 'Beach & Coastal Resort' },
    { name: 'hotel-hillstation', color1: '#0f766e', color2: '#14b8a6', label: 'Hill Station Retreat' },
    { name: 'hotel-pilgrimage', color1: '#9a3412', color2: '#f97316', label: 'Pilgrimage Sacred Stays' },
    { name: 'hotel-boutique', color1: '#831843', color2: '#ec4899', label: 'Boutique Heritage Haveli' },
    { name: 'hotel-villa', color1: '#4c1d95', color2: '#8b5cf6', label: 'Private Pool Villa' },
    { name: 'hotel-apartment', color1: '#374151', color2: '#6b7280', label: 'Serviced Residence & Apt' },
    { name: 'hotel-hostel', color1: '#7c2d12', color2: '#ea580c', label: 'Explorer Backpacker Hostel' },
  ],
  activities: [
    { name: 'desert-safari', color1: '#b45309', color2: '#f59e0b', label: 'Desert Dune Safari & BBQ' },
    { name: 'water-sports', color1: '#0284c7', color2: '#38bdf8', label: 'Ocean Watersports & Diving' },
    { name: 'city-tour', color1: '#4338ca', color2: '#6366f1', label: 'Guided City & Landmark Tour' },
    { name: 'theme-park', color1: '#be185d', color2: '#f43f5e', label: 'Theme Park & Attractions' },
    { name: 'boat-tour', color1: '#0f766e', color2: '#14b8a6', label: 'Yacht Cruise & Island Hopping' },
    { name: 'walking-tour', color1: '#047857', color2: '#10b981', label: 'Heritage Walk & Street Food' },
    { name: 'wildlife-safari', color1: '#15803d', color2: '#22c55e', label: 'National Park Wildlife Safari' },
    { name: 'cultural-experience', color1: '#7c2d12', color2: '#ea580c', label: 'Folklore & Cultural Evening' },
  ],
  packages: [
    { name: 'package-honeymoon', color1: '#831843', color2: '#f43f5e', label: 'Romantic Honeymoon Getaway' },
    { name: 'package-family', color1: '#1e3a8a', color2: '#3b82f6', label: 'Complete Family Vacation' },
    { name: 'package-jain', color1: '#b45309', color2: '#eab308', label: '100% Pure Veg & Jain Tour' },
    { name: 'package-scenic', color1: '#065f46', color2: '#10b981', label: 'Scenic Mountains & Nature' },
    { name: 'package-spiritual', color1: '#9a3412', color2: '#ea580c', label: 'Sacred Pilgrimage Circuit' },
    { name: 'package-dubai', color1: '#d97706', color2: '#fbbf24', label: 'Dubai & Emirates Escapes' },
    { name: 'package-international', color1: '#0f766e', color2: '#06b6d4', label: 'International Escapes' },
    { name: 'package-domestic', color1: '#3b82f6', color2: '#60a5fa', label: 'Incredible India Domestic' },
  ],
  flights: [
    { name: 'flight-domestic', color1: '#1e40af', color2: '#60a5fa', label: 'Domestic Express Flight' },
    { name: 'flight-international', color1: '#0e7490', color2: '#22d3ee', label: 'International Long-Haul' },
  ],
  transfers: [
    { name: 'transfer-sedan', color1: '#374151', color2: '#9ca3af', label: 'Premium Airport Sedan' },
    { name: 'transfer-suv', color1: '#1e293b', color2: '#64748b', label: 'Executive Luxury SUV' },
  ],
  visas: [
    { name: 'visa-tourist', color1: '#047857', color2: '#34d399', label: 'Express Tourist E-Visa' },
    { name: 'visa-business', color1: '#4338ca', color2: '#818cf8', label: 'Fast-Track Business Entry' },
  ],
  restaurants: [
    { name: 'dining-pureveg', color1: '#15803d', color2: '#4ade80', label: '100% Pure Veg Gourmet Dining' },
    { name: 'dining-finedine', color1: '#701a75', color2: '#d946ef', label: 'Signature Fine Dining & Rooftop' },
  ],
};

function generateSvgPlaceholder(style, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="grad-${style.name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${style.color1}" />
      <stop offset="100%" stop-color="${style.color2}" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#grad-${style.name})" />
  <rect width="1200" height="800" fill="url(#grid)" />
  <circle cx="600" cy="340" r="110" fill="rgba(255,255,255,0.12)" />
  <circle cx="600" cy="340" r="85" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity="0.4" />
  <text x="600" y="355" font-family="system-ui, -apple-system, sans-serif" font-size="52" fill="#ffffff" text-anchor="middle" font-weight="900">
    ✦
  </text>
  <text x="600" y="500" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">
    ${title || style.label}
  </text>
  <text x="600" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.8)" text-anchor="middle" letter-spacing="2">
    ${style.label.toUpperCase()}
  </text>
  <rect x="500" y="580" width="200" height="36" rx="18" fill="rgba(255,255,255,0.2)" />
  <text x="600" y="603" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle">
    VERIFIED OPERATOR
  </text>
</svg>`;
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');

  console.log('Generating seed image placeholders for all travel verticals...');

  for (const [moduleName, styles] of Object.entries(MODULE_STYLES)) {
    const webDir = path.join(rootDir, 'web', 'public', 'seed-images', moduleName);
    const appDir = path.join(rootDir, 'my-app', 'assets', 'seed-images', moduleName);

    fs.mkdirSync(webDir, { recursive: true });
    fs.mkdirSync(appDir, { recursive: true });

    styles.forEach((style) => {
      const svgContent = generateSvgPlaceholder(style, style.label);
      const fileName = `${style.name}.svg`;

      fs.writeFileSync(path.join(webDir, fileName), svgContent, 'utf8');
      fs.writeFileSync(path.join(appDir, fileName), svgContent, 'utf8');
    });

    console.log(`  ✓ Generated ${styles.length} placeholders for ${moduleName}`);
  }

  console.log('✅ All placeholder graphics generated successfully with zero external dependencies.');
}

main().catch(console.error);
