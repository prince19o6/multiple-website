const fs = require('fs');

function extractNextChunks(filename, outFile) {
  const content = fs.readFileSync(filename, 'utf8');
  const chunks = [];
  const regex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    let unescaped = m[1];
    try {
      unescaped = JSON.parse(`"${unescaped}"`);
    } catch (e) {
      unescaped = unescaped.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
    }
    chunks.push(unescaped);
  }

  const fullText = chunks.join('\n');
  fs.writeFileSync(outFile, fullText);
  console.log(`Extracted ${chunks.length} chunks to ${outFile} (Length: ${fullText.length})`);
  return fullText;
}

const gText = extractNextChunks('scratch/gujjutours_home.html', 'scratch/gujjutours_stream.txt');
const tText = extractNextChunks('scratch/tripgoasia_home.html', 'scratch/tripgoasia_stream.txt');

