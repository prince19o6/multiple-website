const fs = require('fs');

function extractAllBanners(filename, site) {
  const text = fs.readFileSync(filename, 'utf8');
  console.log(`\n================== ALL BANNERS IN ${site} ==================`);

  const banners = [];
  const regex = /\{"bannerMasterId":(\d+),"name":"([^"]+)"([\s\S]*?)(?=\{"bannerMasterId":|\n\d+:|$)/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const id = m[1];
    const name = m[2];
    const rest = m[3];

    // Extract patternName, serviceType, product count
    const patMatch = rest.match(/"patternName":"([^"]+)"/);
    const sTypeMatch = rest.match(/"serviceType":\{"id":\d+,"name":"([^"]+)"/);
    const prodCountMatch = (rest.match(/"id":\d+,"name":"/g) || []).length;

    banners.push({
      id,
      name,
      pattern: patMatch ? patMatch[1] : 'unknown',
      serviceType: sTypeMatch ? sTypeMatch[1] : 'unknown',
      productCount: prodCountMatch
    });
  }

  console.log(`Found ${banners.length} banners/sections:`);
  banners.forEach((b, i) => {
    console.log(`  ${i+1}. [ID: ${b.id}] "${b.name}" (Pattern: ${b.pattern}, Type: ${b.serviceType}, Products: ${b.productCount})`);
  });
}

extractAllBanners('scratch/gujjutours_stream.txt', 'Gujju Tours');
extractAllBanners('scratch/tripgoasia_stream.txt', 'TripGo Asia');

