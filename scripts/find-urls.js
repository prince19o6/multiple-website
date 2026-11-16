const fs = require('fs');

function findFetchAndUrls(filename) {
  const text = fs.readFileSync(filename, 'utf8');
  console.log(`\n=== URL search in ${filename} ===`);
  const regex = /"(https?:\/\/[^"]+)"/g;
  const urls = new Set();
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (!m[1].includes('.woff') && !m[1].includes('.png') && !m[1].includes('.jpg') && !m[1].includes('.webp') && !m[1].includes('.svg') && !m[1].includes('.js') && !m[1].includes('.css')) {
      urls.add(m[1]);
    }
  }
  console.log('Non-asset URLs found:');
  Array.from(urls).forEach(u => console.log('  ', u));
}

findFetchAndUrls('scratch/gujjutours_stream.txt');
findFetchAndUrls('scratch/tripgoasia_stream.txt');

