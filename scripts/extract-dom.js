const fs = require('fs');

function extractDomHierarchy(filename, site) {
  const html = fs.readFileSync(filename, 'utf8');
  console.log(`\n================== DOM HIERARCHY: ${site} ==================`);

  // Headings
  const headings = [];
  const hRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = hRegex.exec(html)) !== null) {
    const cleanText = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    if (cleanText) headings.push(`${m[1].toUpperCase()}: ${cleanText}`);
  }
  console.log('--- Headings ---');
  headings.forEach(h => console.log('  ', h));

  // Service tabs or nav links
  console.log('--- Navigation / Tab Links ---');
  const navLinks = [];
  const aRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  while ((m = aRegex.exec(html)) !== null) {
    const attrs = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    const hrefMatch = attrs.match(/href=["']([^"']*)["']/);
    const href = hrefMatch ? hrefMatch[1] : '';
    if (text && text.length < 50 && href && !href.startsWith('javascript:')) {
      navLinks.push({ text, href });
    }
  }
  // Remove duplicates
  const seen = new Set();
  const uniqueNav = navLinks.filter(n => {
    const key = `${n.text}|${n.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`Total unique links: ${uniqueNav.length}`);
  console.log('Sample links (first 30):');
  uniqueNav.slice(0, 30).forEach(n => console.log(`   [${n.text}] -> ${n.href}`));

  // Buttons
  console.log('--- Buttons ---');
  const buttons = [];
  const bRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  while ((m = bRegex.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    if (text && text.length < 50) {
      buttons.push(text);
    }
  }
  console.log(Array.from(new Set(buttons)).slice(0, 25));
}

extractDomHierarchy('scratch/gujjutours_home.html', 'Gujju Tours');
extractDomHierarchy('scratch/tripgoasia_home.html', 'TripGo Asia');

