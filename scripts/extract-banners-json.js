const fs = require('fs');

function extractBannersToRender(streamFile, outFile) {
  const text = fs.readFileSync(streamFile, 'utf8');
  const key = '"bannersToRender":';
  const idx = text.indexOf(key);
  if (idx === -1) {
    console.log(`Could not find ${key} in ${streamFile}`);
    return;
  }

  const start = idx + key.length;
  // It starts with '['
  let depth = 0;
  let end = -1;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '[') depth++;
      else if (ch === ']') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
  }

  if (end !== -1) {
    const jsonStr = text.slice(start, end);
    try {
      const parsed = JSON.parse(jsonStr);
      fs.writeFileSync(outFile, JSON.stringify(parsed, null, 2));
      console.log(`Successfully extracted ${parsed.length} banners to ${outFile}`);
      parsed.forEach((b, i) => {
        console.log(`  ${i+1}. [${b.bannerMasterId}] ${b.name} (${b.patternDetails?.patternName}) - ${b.productDetails?.length || 0} products`);
      });
    } catch (e) {
      console.log(`JSON parse error for ${outFile}:`, e.message);
      fs.writeFileSync(outFile + '.raw.txt', jsonStr);
    }
  } else {
    console.log(`Could not find matching bracket for ${outFile}`);
  }
}

console.log('--- Gujju Tours ---');
extractBannersToRender('scratch/gujjutours_stream.txt', 'scratch/gujjutours_banners.json');

console.log('\n--- TripGo Asia ---');
extractBannersToRender('scratch/tripgoasia_stream.txt', 'scratch/tripgoasia_banners.json');

