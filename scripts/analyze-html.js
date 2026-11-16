const fs = require('fs');

function analyzeHtml(site, filename) {
  console.log(`\n================== ANALYZING ${site} ==================`);
  if (!fs.existsSync(filename)) {
    console.log(`File ${filename} not found.`);
    return;
  }
  const content = fs.readFileSync(filename, 'utf8');
  console.log(`Size: ${(content.length / 1024).toFixed(1)} KB`);

  // Check for Next.js __NEXT_DATA__
  const nextDataMatch = content.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    console.log('Found __NEXT_DATA__!');
    try {
      const data = JSON.parse(nextDataMatch[1]);
      console.log('BuildId:', data.buildId);
      console.log('Page:', data.page);
      console.log('Props keys:', Object.keys(data.props || {}));
      if (data.props && data.props.pageProps) {
        console.log('pageProps keys:', Object.keys(data.props.pageProps));
        // Check for specific layout or modules
        fs.writeFileSync(`scratch/${site}_pageProps.json`, JSON.stringify(data.props.pageProps, null, 2));
        console.log(`Saved scratch/${site}_pageProps.json`);
      }
    } catch (e) {
      console.log('Error parsing __NEXT_DATA__:', e.message);
    }
  } else {
    console.log('No __NEXT_DATA__ found. Checking other framework markers...');
  }

  // Look for API endpoints in scripts / strings
  const apiMatches = new Set();
  const regex = /https?:\/\/[a-zA-Z0-9.-]+\/api\/[a-zA-Z0-9_\-\/]+/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    apiMatches.add(m[0]);
  }
  console.log('Direct API URL matches found:', Array.from(apiMatches));

  // Find relative API calls like "/api/..."
  const relApiMatches = new Set();
  const relRegex = /"(\/api\/[a-zA-Z0-9_\-\/]+)"/g;
  while ((m = relRegex.exec(content)) !== null) {
    relApiMatches.add(m[1]);
  }
  console.log('Relative API URLs found:', Array.from(relApiMatches).slice(0, 15));
}

analyzeHtml('gujjutours', 'scratch/gujjutours_home.html');
analyzeHtml('tripgoasia', 'scratch/tripgoasia_home.html');

