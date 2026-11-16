const fs = require('fs');

function extractTechno(filename) {
  const html = fs.readFileSync(filename, 'utf8');
  console.log(`\n================== DOM HIERARCHY: Technoheaven ==================`);

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

  // Navigation / links
  const navLinks = [];
  const aRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  while ((m = aRegex.exec(html)) !== null) {
    const attrs = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    const hrefMatch = attrs.match(/href=["']([^"']*)["']/);
    const href = hrefMatch ? hrefMatch[1] : '';
    if (text && text.length < 50 && href) {
      navLinks.push({ text, href });
    }
  }
  console.log('--- Links (Sample) ---');
  const seen = new Set();
  navLinks.filter(n => {
    const key = `${n.text}|${n.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 30).forEach(n => console.log(`   [${n.text}] -> ${n.href}`));

  // Buttons & inputs
  const buttons = [];
  const bRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  while ((m = bRegex.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    if (text && text.length < 50) buttons.push(text);
  }
  console.log('--- Buttons ---');
  console.log(Array.from(new Set(buttons)));

  // Forms / Inputs
  const inputs = [];
  const inRegex = /<input\b([^>]*)>/gi;
  while ((m = inRegex.exec(html)) !== null) {
    const type = (m[1].match(/type=["']([^"']*)["']/) || [])[1] || 'text';
    const name = (m[1].match(/name=["']([^"']*)["']/) || [])[1] || '';
    const placeholder = (m[1].match(/placeholder=["']([^"']*)["']/) || [])[1] || '';
    inputs.push(`type="${type}" name="${name}" placeholder="${placeholder}"`);
  }
  console.log('--- Inputs ---');
  console.log(inputs.slice(0, 15));
}

extractTechno('scratch/technoheaven_en.html');

