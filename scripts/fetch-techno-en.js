const https = require('https');
const fs = require('fs');

async function fetchTechnoEn() {
  const req = https.request({
    hostname: 'stagingb2b.technoheaven.com',
    path: '/en',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cookie': 'device_id=66af45f3-6f05-4ffe-a86b-eba48110493c; site_routing_info=%7B%22supportedLocales%22%3A%5B%22en%22%5D%2C%22defaultLocale%22%3A%22en%22%2C%22siteType%22%3A%22B2B%22%2C%22defaultServiceSlug%22%3A%22hotels%22%7D; geo_country=IN; geo_ip=1.38.163.49; trace_id=fc60181d6a395e6f0a4b16ec63a811e0'
    }
  }, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Length:', data.length);
      fs.writeFileSync('scratch/technoheaven_en.html', data);
      console.log('Saved scratch/technoheaven_en.html');
    });
  });
  req.on('error', err => console.log('Error:', err.message));
  req.end();
}

fetchTechnoEn();

