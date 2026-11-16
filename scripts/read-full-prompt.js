const fs = require('fs');
const path = 'C:/Users/Charmi/.gemini/antigravity/brain/ff40dd25-56c9-464e-8b61-a4b9fce7a057/.system_generated/logs/transcript_full.jsonl';
const readline = require('readline');

async function processFile() {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line) continue;
    try {
      const o = JSON.parse(line);
      if (o.step_index === 4096) {
        fs.writeFileSync('C:/Users/Charmi/prince/toursapp/scratch/user_prompt_4096_full.txt', o.content);
        console.log('Successfully saved full prompt 4096, length:', o.content.length);
        break;
      }
    } catch (e) {}
  }
}

processFile();

