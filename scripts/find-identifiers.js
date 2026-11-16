const fs = require('fs');

function findIdentifiersInChunks() {
  const chunks = ['scratch/chunk_0.js', 'scratch/chunk_1.js', 'scratch/chunk_2.js', 'scratch/chunk_3.js'];
  const ids = ['bannersToRender', 'patternDetails', 'productDetails', 'bannerMasterId'];

  chunks.forEach(c => {
    const txt = fs.readFileSync(c, 'utf8');
    ids.forEach(id => {
      const idx = txt.indexOf(id);
      if (idx !== -1) {
        console.log(`Found '${id}' in ${c} at offset ${idx}!`);
        console.log('Context:', txt.slice(Math.max(0, idx - 100), idx + 200));
      }
    });
  });
}

findIdentifiersInChunks();

