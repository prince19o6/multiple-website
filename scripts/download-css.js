const https = require('https');
const fs = require('fs');

async function downloadCss() {
  const cssUrls = [
    'https://d3bfv5x1dw8ekm.cloudfront.net/next-js-chunks/prod/v125/_next/static/chunks/43z9se97srauk.css',
    'https://d3bfv5x1dw8ekm.cloudfront.net/next-js-chunks/prod/v125/_next/static/chunks/3b27uq0kgedto.css'
  ];

  for (let i = 0; i < cssUrls.length; i++) {
    const file = `scratch/site_${i}.css`;
    await new Promise(r => {
      https.get(cssUrls[i], res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => {
          fs.writeFileSync(file, d);
          console.log(`Saved ${file}, length: ${d.length}`);
          r();
        });
      });
    });
  }
}

downloadCss();

