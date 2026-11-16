const fs = require('fs');

function extractDataObjects(filename, site) {
  const text = fs.readFileSync(filename, 'utf8');
  console.log(`\n================== DATA OBJECTS IN ${site} ==================`);

  // Look for occurrences of "bannersDetails"
  const bannerIdx = text.indexOf('bannersDetails');
  if (bannerIdx !== -1) {
    const slice = text.slice(Math.max(0, bannerIdx - 100), bannerIdx + 1500);
    console.log('--- Banner snippet ---');
    console.log(slice.slice(0, 800));
  }

  // Look for section titles or headers (e.g. "Perfect Stays", "Best Cities", etc.)
  const headings = [];
  const regex = /"title":"([^"]+)"/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    headings.push(m[1]);
  }
  console.log('--- Extracted Titles (first 20) ---', headings.slice(0, 20));

  // Look for sections/modules in page payload
  const sectionMatches = [];
  const secRegex = /"sectionName":"([^"]+)"/g;
  while ((m = secRegex.exec(text)) !== null) {
    sectionMatches.push(m[1]);
  }
  console.log('--- Extracted sectionNames ---', Array.from(new Set(sectionMatches)));

  // Look for component names or patterns
  const patterns = [];
  const patRegex = /"pattern":"([^"]+)"/g;
  while ((m = patRegex.exec(text)) !== null) {
    patterns.push(m[1]);
  }
  console.log('--- Extracted patterns ---', Array.from(new Set(patterns)));
}

extractDataObjects('scratch/gujjutours_stream.txt', 'Gujju Tours');
extractDataObjects('scratch/tripgoasia_stream.txt', 'TripGo Asia');

