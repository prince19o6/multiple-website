const fs = require('fs');

function extractHtmlStyles(filename, site) {
  const html = fs.readFileSync(filename, 'utf8');
  console.log(`\n=== INLINE HTML STYLES: ${site} ===`);
  const match = html.match(/<html[^>]*style=["']([^"']*)["'][^>]*>/i);
  if (match) {
    console.log('Style on <html>:');
    match[1].split(';').forEach(s => {
      if (s.trim()) console.log('  ', s.trim());
    });
  } else {
    // Look in __next_f stream for style
    const stream = fs.readFileSync(`scratch/${site.toLowerCase().replace(/\s/g, '')}_stream.txt`, 'utf8');
    const sMatch = stream.match(/"style":\{([^}]+)\}/);
    if (sMatch) {
      console.log('Style in stream:');
      console.log(sMatch[1]);
    }
  }
}

extractHtmlStyles('scratch/gujjutours_home.html', 'Gujju Tours');
extractHtmlStyles('scratch/tripgoasia_home.html', 'TripGo Asia');

