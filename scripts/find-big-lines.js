const fs = require('fs');

const text = fs.readFileSync('scratch/gujjutours_stream.txt', 'utf8');
const lines = text.split('\n');

lines.forEach((l, idx) => {
  if (l.length > 500) {
    console.log(`Line ${idx}: Length ${l.length}, starts with: ${l.slice(0, 100)}`);
  }
});

