const fs = require('fs');
const path = 'C:/Users/Charmi/.gemini/antigravity/brain/ff40dd25-56c9-464e-8b61-a4b9fce7a057/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').trim().split('\n');
for (const line of lines) {
  if (!line) continue;
  try {
    const o = JSON.parse(line);
    if (o.step_index === 4096) {
      fs.writeFileSync('C:/Users/Charmi/prince/toursapp/scratch/user_prompt_4096.txt', o.content);
      console.log('Saved user prompt 4096 to scratch/user_prompt_4096.txt, length:', o.content.length);
    }
  } catch (e) {}
}
