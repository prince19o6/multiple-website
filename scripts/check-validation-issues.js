const fs = require('fs');
const path = require('path');
const { z } = require('../web/node_modules/zod');

// Read web/lib/features/featureRegistrySchema.ts & web/lib/config/siteConfigSchema.ts
// Or let's see what the backend returns for config or what gujjutours.siteConfig.json has.
const seedPath = path.join(__dirname, '../backend/toursApi/seed/gujjutours.siteConfig.json');
const raw = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

console.log("Raw config has keys:", Object.keys(raw));

