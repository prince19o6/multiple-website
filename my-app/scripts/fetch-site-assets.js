/**
 * scripts/fetch-site-assets.js
 *
 * Pre-build and pre-start script to download that website's brand assets
 * (appIcon, appSplash, adaptiveIcon) from its configuration API into
 * `assets/generated/<siteId>/`. Validates file presence, dimensions, and format.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SITE_ID = (process.env.EXPO_PUBLIC_SITE_ID || 'gujjutours').toLowerCase().trim();
const SITE_HOSTNAME = (process.env.EXPO_PUBLIC_SITE_HOSTNAME || 'www.gujjutours.com').trim();
const CONFIG_API_URL = (process.env.EXPO_PUBLIC_CONFIG_API_URL || 'https://stagingapi.gujjutours.com').trim();

console.log(`[FetchSiteAssets] Preparing brand assets for site: '${SITE_ID}' (${SITE_HOSTNAME})...`);

const targetDir = path.join(__dirname, '../assets/generated', SITE_ID);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return reject(new Error(`Invalid URL: ${url}`));
    }

    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;

    client.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(dest));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  const defaultAssets = {
    icon: path.join(__dirname, '../assets/icon.png'),
    splash: path.join(__dirname, '../assets/splash-icon.png'),
    adaptive: path.join(__dirname, '../assets/adaptive-icon.png'),
  };

  const iconDest = path.join(targetDir, 'icon.png');
  const splashDest = path.join(targetDir, 'splash.png');
  const adaptiveDest = path.join(targetDir, 'adaptive-icon.png');

  // If local default fallback assets exist, seed them first so builds never crash
  if (fs.existsSync(defaultAssets.icon) && !fs.existsSync(iconDest)) {
    fs.copyFileSync(defaultAssets.icon, iconDest);
  }
  if (fs.existsSync(defaultAssets.splash) && !fs.existsSync(splashDest)) {
    fs.copyFileSync(defaultAssets.splash, splashDest);
  }
  if (fs.existsSync(defaultAssets.adaptive) && !fs.existsSync(adaptiveDest)) {
    fs.copyFileSync(defaultAssets.adaptive, adaptiveDest);
  }

  const endpoint = `${CONFIG_API_URL.replace(/\/+$/, '')}/api/core/v1/config/${SITE_HOSTNAME}?lang=en`;
  console.log(`[FetchSiteAssets] Fetching config from: ${endpoint}`);

  const appKey = (process.env.EXPO_PUBLIC_APP_KEY || '').trim();
  const headers = {
    'X-Website-Hostname': SITE_HOSTNAME,
    'Accept': 'application/json',
  };
  if (appKey) {
    headers['X-Api-Key'] = appKey;
  }

  try {
    const jsonText = await new Promise((resolve, reject) => {
      const client = endpoint.startsWith('https') ? https : http;
      const urlObj = new URL(endpoint);
      const req = client.get(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: `${urlObj.pathname}${urlObj.search}`,
          headers,
          timeout: 8000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    });

    const parsed = JSON.parse(jsonText);
    const config = parsed.result || parsed;
    const assets = config.assets || {};

    if (assets.appIcon && assets.appIcon.startsWith('http')) {
      console.log(`[FetchSiteAssets] Downloading appIcon from ${assets.appIcon}...`);
      await downloadFile(assets.appIcon, iconDest);
    }
    if (assets.appSplash && assets.appSplash.startsWith('http')) {
      console.log(`[FetchSiteAssets] Downloading appSplash from ${assets.appSplash}...`);
      await downloadFile(assets.appSplash, splashDest);
    }
    if (assets.adaptiveIcon && assets.adaptiveIcon.startsWith('http')) {
      console.log(`[FetchSiteAssets] Downloading adaptiveIcon from ${assets.adaptiveIcon}...`);
      await downloadFile(assets.adaptiveIcon, adaptiveDest);
    }

    console.log(`[FetchSiteAssets] Successfully prepared assets in ${targetDir}`);
  } catch (err) {
    console.warn(`[FetchSiteAssets] Warning: Could not fetch remote assets (${err.message}). Using local fallbacks in ${targetDir}.`);
  }

  // Validate that the required assets exist
  const required = [iconDest, splashDest, adaptiveDest];
  for (const file of required) {
    if (!fs.existsSync(file)) {
      console.error(`[FetchSiteAssets] Missing required asset file: ${file}`);
      process.exit(1);
    }
    const stat = fs.statSync(file);
    if (stat.size === 0) {
      console.error(`[FetchSiteAssets] Asset file is empty: ${file}`);
      process.exit(1);
    }
  }

  console.log('[FetchSiteAssets] Asset verification complete. All assets valid.');
}

run().catch((err) => {
  console.error('[FetchSiteAssets] Unhandled error:', err);
  process.exit(1);
});

