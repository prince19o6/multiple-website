const fs = require('fs');

function searchBannersApi() {
  // Let's check files in scratch
  const files = ['scratch/chunk_0.js', 'scratch/chunk_1.js', 'scratch/chunk_2.js', 'scratch/chunk_3.js', 'scratch/gujjutours_stream.txt'];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const txt = fs.readFileSync(f, 'utf8');
    const regex = /["']([^"']*(?:banner|product|service|home|b2b)[^"']*)["']/gi;
    const matches = new Set();
    let m;
    while ((m = regex.exec(txt)) !== null) {
      const str = m[1];
      if (str.startsWith('/api/') || str.includes('api/core') || str.includes('api/tour') || str.includes('api/banner')) {
        matches.add(str);
      }
    }
    if (matches.size > 0) {
      console.log(`Found in ${f}:`, Array.from(matches));
    }
  }
}

searchBannersApi();

