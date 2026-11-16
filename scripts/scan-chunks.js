const https = require('https');
const fs = require('fs');

async function downloadChunk(url, dest) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        fs.writeFileSync(dest, data);
        resolve(data);
      });
    }).on('error', () => resolve(''));
  });
}

async function scanChunks() {
  const chunks = [
    'https://d3bfv5x1dw8ekm.cloudfront.net/next-js-chunks/prod/v125/_next/static/chunks/38312ktarv2f-.js',
    'https://d3bfv5x1dw8ekm.cloudfront.net/next-js-chunks/prod/v125/_next/static/chunks/0ab_ntohf1wik.js',
    'https://d3bfv5x1dw8ekm.cloudfront.net/next-js-chunks/prod/v125/_next/static/chunks/1h-nktqotvq9o.js',
    'https://d3bfv5x1dw8ekm.cloudfront.net/next-js-chunks/prod/v125/_next/static/chunks/386vwynp-0o0q.js'
  ];

  const apiPatterns = new Set();

  for (let i = 0; i < chunks.length; i++) {
    const file = `scratch/chunk_${i}.js`;
    console.log(`Downloading ${chunks[i]}...`);
    const content = await downloadChunk(chunks[i], file);
    console.log(`Downloaded ${file}, length: ${content.length}`);

    // Find /api/ occurrences
    const regex = /\/api\/[a-zA-Z0-9_\-\/]+/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      if (m[0].length < 60) apiPatterns.add(m[0]);
    }
  }

  console.log('\n--- Found API Routes in Client Chunks ---');
  Array.from(apiPatterns).sort().forEach(p => console.log('  ', p));
}

scanChunks();

