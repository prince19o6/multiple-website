const fs = require('fs');

const text = fs.readFileSync('scratch/gujjutours_stream.txt', 'utf8');
const lines = text.split('\n');
console.log('Line 140:');
console.log(lines[140]);

