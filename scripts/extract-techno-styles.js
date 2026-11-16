const fs = require('fs');

const html = fs.readFileSync('scratch/technoheaven_en.html', 'utf8');
const match = html.match(/<html[^>]*style=["']([^"']*)["'][^>]*>/i);
console.log('=== TECHNOHEAVEN INLINE STYLES ===');
if (match) {
  match[1].split(';').forEach(s => {
    if (s.trim()) console.log('  ', s.trim());
  });
} else {
  console.log('No style on <html> tag. Checking config...');
}

