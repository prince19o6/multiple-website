const fs = require('fs');
const inventory = JSON.parse(fs.readFileSync('tests/inventory.json', 'utf8'));

console.log('Dead buttons sample from inventory.json:');
inventory.pressableAudit.deadButtonsSample.slice(0, 25).forEach(b => {
  console.log(`- ${b.file}:${b.line} -> "${b.snippet}"`);
});

