const fs = require('fs');

const text = fs.readFileSync('scratch/gujjutours_stream.txt', 'utf8');
const patternProps = new Set();
const regex = /"([a-zA-Z0-9]+Patterns\w*Data)":/g;
let m;
while ((m = regex.exec(text)) !== null) {
  patternProps.add(m[1]);
}
console.log('Found Pattern Data Props:', Array.from(patternProps));

// Let's also find all keys ending with Data or Patterns
const allProps = new Set();
const reg2 = /"([a-zA-Z0-9]+(?:Pattern|Patterns|Banner|Banners)\w*)":/g;
while ((m = reg2.exec(text)) !== null) {
  allProps.add(m[1]);
}
console.log('Found Pattern / Banner Props:', Array.from(allProps));

