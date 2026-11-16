const fs = require('fs');
const content = fs.readFileSync('my-app/services/api.ts', 'utf8');

// Find all export async function or export function
const exportRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
const exportedFunctions = [];
let m;
while ((m = exportRegex.exec(content)) !== null) {
  exportedFunctions.push(m[1]);
}
console.log('Exported functions in my-app/services/api.ts:', exportedFunctions.length);

// Find all internal request calls
const reqRegex = /request(?:Json)?(?:<[^>]+>)?\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
const reqUrls = [];
while ((m = reqRegex.exec(content)) !== null) {
  reqUrls.push(m[1]);
}
console.log('Total request URLs in api.ts:', reqUrls.length);
const uniqueUrls = [...new Set(reqUrls)];
console.log('Unique request URLs in api.ts:', uniqueUrls.length);
console.log('Sample request URLs:');
uniqueUrls.slice(0, 25).forEach(u => console.log('  -', u));

fs.writeFileSync('tests/api_calls_in_app.json', JSON.stringify({
  exportedFunctionsCount: exportedFunctions.length,
  exportedFunctions,
  uniqueUrlsCount: uniqueUrls.length,
  uniqueUrls
}, null, 2));

