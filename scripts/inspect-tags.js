const fs = require('fs');

function inspectHeadAndTags(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  console.log('--- File:', filename, '---');
  // Title
  const title = content.match(/<title>([^<]*)<\/title>/i);
  console.log('Title:', title ? title[1] : 'No title');

  // Script tags
  const scripts = [];
  const scriptRegex = /<script\b([^>]*)src=["']([^"']+)["']/gi;
  let m;
  while ((m = scriptRegex.exec(content)) !== null) {
    scripts.push(m[2]);
  }
  console.log('Scripts:', scripts.slice(0, 10));

  // CSS stylesheets
  const css = [];
  const cssRegex = /<link\b([^>]*)href=["']([^"']+\.css[^"']*)["']/gi;
  while ((m = cssRegex.exec(content)) !== null) {
    css.push(m[2]);
  }
  console.log('CSS:', css.slice(0, 10));

  // Look for any inline JSON scripts or state
  const inlineScripts = [];
  const inlineRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  while ((m = inlineRegex.exec(content)) !== null) {
    const attrs = m[1];
    const body = m[2].trim();
    if (attrs.includes('json') || body.includes('window.') || body.includes('__')) {
      inlineScripts.push({ attrs, snippet: body.slice(0, 150) });
    }
  }
  console.log('Notable inline scripts:', inlineScripts.slice(0, 5));

  // Check major headings / section tags
  const sections = [];
  const sectionRegex = /<(section|div|header|footer)\b([^>]*id=["'][^"']+["'][^>]*)>/gi;
  while ((m = sectionRegex.exec(content)) !== null) {
    sections.push(m[2]);
  }
  console.log('Sections with IDs:', sections.slice(0, 15));
}

inspectHeadAndTags('scratch/gujjutours_home.html');
inspectHeadAndTags('scratch/tripgoasia_home.html');

