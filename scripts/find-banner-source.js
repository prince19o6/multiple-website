const fs = require('fs');

const text = fs.readFileSync('scratch/gujjutours_stream.txt', 'utf8');
const idx = text.indexOf('"bannerMasterId":171');
console.log('Index of bannerMasterId:171:', idx);
if (idx !== -1) {
  console.log('500 chars before:');
  console.log(text.slice(Math.max(0, idx - 500), idx));
}

