const https = require('https');

async function checkDocEndpoints(baseUrl) {
  const paths = [
    '/swagger',
    '/swagger/index.html',
    '/swagger/v1/swagger.json',
    '/openapi.json',
    '/api/swagger',
    '/api-docs'
  ];

  console.log(`\n=== Checking docs on ${baseUrl} ===`);
  for (const p of paths) {
    await new Promise(r => {
      https.get(baseUrl + p, res => {
        console.log(`${p} -> ${res.statusCode} (${res.headers['content-type'] || 'no ct'})`);
        r();
      }).on('error', e => {
        console.log(`${p} -> error: ${e.message}`);
        r();
      });
    });
  }
}

async function run() {
  await checkDocEndpoints('https://stagingapi.gujjutours.com');
  await checkDocEndpoints('https://stagingapi.tripgoasia.com');
  await checkDocEndpoints('https://stagingapi.technoheaven.com');
}

run();

