const fs = require('fs');

const text = fs.readFileSync('scratch/gujjutours_stream.txt', 'utf8');

// Find all `["$","$L...` lines or component declarations
const lines = text.split('\n');
console.log('Total stream lines:', lines.length);

for (let i = 0; i < Math.min(lines.length, 50); i++) {
  const line = lines[i];
  if (line.includes('banner') || line.includes('pattern') || line.includes('Page') || line.includes('layout')) {
    console.log(`Line ${i}:`, line.slice(0, 300));
  }
}

