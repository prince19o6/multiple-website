const https = require('https');
const http = require('http');

async function fetchUrl(url, headers = {}) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/json,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          ...headers
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      req.on('error', (err) => {
        resolve({ error: err.message });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ error: 'Timeout' });
      });
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

async function probe() {
  console.log('--- Probing Gujju Tours Config ---');
  const gConfig = await fetchUrl('https://stagingapi.gujjutours.com/api/core/v1/config/www.gujjutours.com?lang=en');
  console.log('Gujju Config status:', gConfig.status, 'Body len:', gConfig.body ? gConfig.body.length : 0);
  if (gConfig.body) {
    try {
      const json = JSON.parse(gConfig.body);
      console.log('Gujju isSuccess:', json.isSuccess);
      if (json.result) {
        console.log('Keys in result:', Object.keys(json.result));
        console.log('Website info:', JSON.stringify(json.result.website || {}));
        console.log('Colors:', JSON.stringify(json.result.colors || {}));
        console.log('Theme:', JSON.stringify(json.result.theme || {}));
        console.log('Font:', JSON.stringify(json.result.font || {}));
        console.log('Modules:', JSON.stringify(json.result.websiteModules || []));
      }
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  }

  console.log('\n--- Probing TripGo Asia Config ---');
  const tConfig = await fetchUrl('https://stagingapi.tripgoasia.com/api/core/v1/config/www.tripgoasia.com?lang=en');
  console.log('TripGo Config status:', tConfig.status, 'Body len:', tConfig.body ? tConfig.body.length : 0);
  if (tConfig.body) {
    try {
      const json = JSON.parse(tConfig.body);
      console.log('TripGo isSuccess:', json.isSuccess);
      if (json.result) {
        console.log('Keys in result:', Object.keys(json.result));
        console.log('Website info:', JSON.stringify(json.result.website || {}));
        console.log('Colors:', JSON.stringify(json.result.colors || {}));
        console.log('Modules:', JSON.stringify(json.result.websiteModules || []));
      }
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  }

  console.log('\n--- Probing Technoheaven Config ---');
  const thConfig = await fetchUrl('https://stagingapi.technoheaven.com/api/core/v1/config/stagingb2b.technoheaven.com?lang=en');
  console.log('Techno Config status:', thConfig.status, 'Body len:', thConfig.body ? thConfig.body.length : 0);
  if (thConfig.body) {
    try {
      const json = JSON.parse(thConfig.body);
      console.log('Techno isSuccess:', json.isSuccess);
      if (json.result) {
        console.log('Keys in result:', Object.keys(json.result));
        console.log('Website info:', JSON.stringify(json.result.website || {}));
        console.log('Colors:', JSON.stringify(json.result.colors || {}));
        console.log('Modules:', JSON.stringify(json.result.websiteModules || []));
      }
    } catch (e) {
      console.log('Parse error or raw body:', gConfig.body ? gConfig.body.slice(0, 300) : 'none');
    }
  }
}

probe();

