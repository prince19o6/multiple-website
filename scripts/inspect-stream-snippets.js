const fs = require('fs');

function inspectAroundSnippet(filename, keyword, contextLen = 2000) {
  const text = fs.readFileSync(filename, 'utf8');
  let idx = 0;
  let count = 0;
  console.log(`\n=== Finding '${keyword}' in ${filename} ===`);
  while ((idx = text.indexOf(keyword, idx)) !== -1) {
    count++;
    console.log(`\n--- Match ${count} (offset ${idx}) ---`);
    const start = Math.max(0, idx - 200);
    const end = Math.min(text.length, idx + contextLen);
    console.log(text.slice(start, end));
    idx += keyword.length;
    if (count >= 2) break;
  }
}

inspectAroundSnippet('scratch/gujjutours_stream.txt', 'Al Khoory Executive Hotel');
inspectAroundSnippet('scratch/gujjutours_stream.txt', 'Dubai Packages');
inspectAroundSnippet('scratch/tripgoasia_stream.txt', 'ATV Adventure Ride Langkawi');
inspectAroundSnippet('scratch/tripgoasia_stream.txt', 'Things to do in Kuala Lumpur');

