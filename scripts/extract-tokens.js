const fs = require('fs');

function extractTokens(filename) {
  const css = fs.readFileSync(filename, 'utf8');
  console.log(`\n=== Design Tokens from ${filename} ===`);

  // Root CSS variables
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch) {
    const vars = rootMatch[1].split(';').map(v => v.trim()).filter(Boolean);
    console.log(`Found ${vars.length} root variables. Sample:`);
    vars.slice(0, 25).forEach(v => console.log('  ', v));
  } else {
    // Find all --c- or --tw- or --
    const customProps = new Set();
    const regex = /--[a-zA-Z0-9_-]+:\s*[^;]+/g;
    let m;
    while ((m = regex.exec(css)) !== null) {
      if (!m[0].includes('tw-')) customProps.add(m[0]);
    }
    console.log(`Found ${customProps.size} custom properties. Sample:`);
    Array.from(customProps).slice(0, 30).forEach(p => console.log('  ', p));
  }
}

extractTokens('scratch/site_0.css');
extractTokens('scratch/site_1.css');

