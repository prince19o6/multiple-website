const fs = require('fs');

function analyzeStream(site, filename) {
  console.log(`\n================== STREAM ANALYSIS: ${site} ==================`);
  const text = fs.readFileSync(filename, 'utf8');

  // Search for section names, component names or keys
  const sectionKeywords = [
    'hero', 'banner', 'search', 'hotel', 'tour', 'package', 'activity',
    'review', 'testimonial', 'destination', 'city', 'weather', 'trusted',
    'partner', 'reel', 'video', 'faq', 'footer', 'whatsapp'
  ];

  console.log('Searching for key component occurrences:');
  for (const kw of sectionKeywords) {
    const regex = new RegExp(`["']?[a-zA-Z0-9_-]*${kw}[a-zA-Z0-9_-]*["']?`, 'gi');
    const matches = new Set();
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m[0].length < 40 && !m[0].includes('http') && !m[0].includes('.js')) {
        matches.add(m[0].replace(/['"]/g, ''));
      }
      if (matches.size >= 8) break;
    }
    if (matches.size > 0) {
      console.log(`  ${kw}:`, Array.from(matches).slice(0, 6).join(', '));
    }
  }

  // Find any API URLs
  const urls = new Set();
  const urlRegex = /https?:\/\/[a-zA-Z0-9.-]+(?:\/[a-zA-Z0-9_.-]+)+/g;
  let uMatch;
  while ((uMatch = urlRegex.exec(text)) !== null) {
    const url = uMatch[0];
    if (url.includes('/api/') || url.includes('stagingapi') || url.includes('/v1/')) {
      urls.add(url);
    }
  }
  console.log('\nFound API endpoints in stream:');
  console.log(Array.from(urls));
}

analyzeStream('Gujju Tours', 'scratch/gujjutours_stream.txt');
analyzeStream('TripGo Asia', 'scratch/tripgoasia_stream.txt');

