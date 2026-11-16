const https = require('https');
const fs = require('fs');

async function fetchHtml(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000
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
    }).on('error', (err) => {
      resolve({ error: err.message });
    }).on('timeout', () => {
      resolve({ error: 'Timeout' });
    });
  });
}

async function run() {
  console.log('Fetching Gujju Tours live HTML...');
  const gHtml = await fetchHtml('https://www.gujjutours.com/en');
  console.log('Gujju status:', gHtml.status, 'Length:', gHtml.body ? gHtml.body.length : 0);
  if (gHtml.body) {
    fs.writeFileSync('scratch/gujjutours_home.html', gHtml.body);
    console.log('Saved scratch/gujjutours_home.html');
  }

  console.log('Fetching TripGo Asia live HTML...');
  const tHtml = await fetchHtml('https://www.tripgoasia.com/en');
  console.log('TripGo status:', tHtml.status, 'Length:', tHtml.body ? tHtml.body.length : 0);
  if (tHtml.body) {
    fs.writeFileSync('scratch/tripgoasia_home.html', tHtml.body);
    console.log('Saved scratch/tripgoasia_home.html');
  }

  console.log('Fetching Technoheaven live HTML...');
  const thHtml = await fetchHtml('https://stagingb2b.technoheaven.com');
  console.log('Techno status:', thHtml.status, 'Length:', thHtml.body ? thHtml.body.length : 0);
  if (thHtml.body) {
    fs.writeFileSync('scratch/technoheaven_home.html', thHtml.body);
    console.log('Saved scratch/technoheaven_home.html');
  }
}

run();

