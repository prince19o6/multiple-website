const https = require('https');

async function checkRedirect(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Body:', data.slice(0, 500));
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', err => {
      console.log('Error:', err.message);
      resolve({ error: err.message });
    });
    req.end();
  });
}

checkRedirect('https://stagingb2b.technoheaven.com');

