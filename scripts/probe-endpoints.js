const https = require('https');

async function testEndpoint(baseUrl, path, token, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(baseUrl + path);
    const reqHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'application/json',
      ...headers
    };
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: reqHeaders,
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'] || '',
          data: data.slice(0, 300)
        });
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'timeout' });
    });
    req.end();
  });
}

async function probeApis() {
  // Let's get the serviceAuthToken from Gujju config
  const gConfigRes = await testEndpoint('https://stagingapi.gujjutours.com', '/api/core/v1/config/www.gujjutours.com?lang=en');
  let gToken = '';
  try {
    const gJson = JSON.parse(gConfigRes.data ? (await new Promise(r => {
      https.get('https://stagingapi.gujjutours.com/api/core/v1/config/www.gujjutours.com?lang=en', res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => r(d));
      });
    })) : '{}');
    gToken = gJson?.result?.website?.serviceAuthToken;
    console.log('Got Gujju serviceAuthToken (length:', gToken?.length || 0, ')');
  } catch(e) {}

  // Let's get TripGo serviceAuthToken
  let tToken = '';
  try {
    const tJson = await new Promise(r => {
      https.get('https://stagingapi.tripgoasia.com/api/core/v1/config/www.tripgoasia.com?lang=en', res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => r(JSON.parse(d)));
      });
    });
    tToken = tJson?.result?.website?.serviceAuthToken;
    console.log('Got TripGo serviceAuthToken (length:', tToken?.length || 0, ')');
  } catch(e) {}

  const endpointsToTest = [
    // Banner / Home
    '/api/core/v1/banner/www.gujjutours.com?lang=en',
    '/api/core/v1/banner?lang=en',
    '/api/core/v1/homepage/www.gujjutours.com?lang=en',
    '/api/tour/v1/banner?lang=en',
    '/api/tour/v1/tour/featured?lang=en',
    '/api/tour/v1/tour/popular?lang=en',
    '/api/tour/v1/tour/search?lang=en',
    '/api/tour/v1/destination?lang=en',
    '/api/hotel/v1/hotel/search?lang=en',
    '/api/hotel/v1/city/search?lang=en',
    '/api/hotel/v1/destination/search?query=dubai&lang=en',
    '/api/core/v1/city/search?query=dubai&lang=en',
    '/api/core/v1/review?lang=en',
    '/api/weather/v1/weather?lang=en'
  ];

  console.log('\n--- Testing Endpoints on Gujju Staging API ---');
  for (const ep of endpointsToTest) {
    const r = await testEndpoint('https://stagingapi.gujjutours.com', ep, gToken, { 'X-Website-Hostname': 'www.gujjutours.com' });
    console.log(`${ep} => Status: ${r.status || r.error}`);
    if (r.status === 200) console.log('   Sample:', r.data.slice(0, 100));
  }

  console.log('\n--- Testing Endpoints on TripGo Staging API ---');
  for (const ep of endpointsToTest) {
    const r = await testEndpoint('https://stagingapi.tripgoasia.com', ep, tToken, { 'X-Website-Hostname': 'www.tripgoasia.com' });
    console.log(`${ep} => Status: ${r.status || r.error}`);
    if (r.status === 200) console.log('   Sample:', r.data.slice(0, 100));
  }
}

probeApis();

