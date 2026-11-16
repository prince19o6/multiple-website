const fs = require('fs');

const text = fs.readFileSync('scratch/gujjutours_stream.txt', 'utf8');
const idx = text.indexOf('aiBannerPrefetchData');
console.log('Index of aiBannerPrefetchData:', idx);
if (idx !== -1) {
  console.log(text.slice(idx - 100, idx + 1000));
}

