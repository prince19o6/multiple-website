const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('my-app/services/api.ts', 'utf8');
const lines = content.split('\n');

const endpoints = [];
let currentFn = null;

lines.forEach((line, idx) => {
  const fnMatch = line.match(/export\s+(?:async\s+)?function\s+(\w+)\s*\(/);
  if (fnMatch) {
    currentFn = fnMatch[1];
  }

  // Check for endpoint string or request call
  const reqMatch = line.match(/(?:request|fetchWithRetry)[^'"`]*['"`]([^'"`]+)['"`]/);
  if (reqMatch) {
    // Determine method
    let method = 'GET';
    // scan surrounding lines for method: 'POST' etc
    const surrounding = lines.slice(Math.max(0, idx - 5), Math.min(lines.length, idx + 15)).join('\n');
    const methodMatch = surrounding.match(/method:\s*['"](GET|POST|PUT|DELETE|PATCH)['"]/i);
    if (methodMatch) {
      method = methodMatch[1].toUpperCase();
    } else if (currentFn && (currentFn.startsWith('create') || currentFn.startsWith('submit') || currentFn.startsWith('save') || currentFn.startsWith('register') || currentFn.startsWith('login') || currentFn.startsWith('update'))) {
      if (currentFn.startsWith('update')) method = 'PUT';
      else if (currentFn.startsWith('delete')) method = 'DELETE';
      else method = 'POST';
    }

    endpoints.push({
      functionName: currentFn,
      method,
      endpoint: reqMatch[1],
      line: idx + 1
    });
  }
});

console.log('Total extracted endpoints:', endpoints.length);
const unique = [...new Map(endpoints.map(e => [`${e.method} ${e.endpoint}`, e])).values()];
console.log('Unique endpoints in api.ts:', unique.length);

fs.writeFileSync('tests/all_app_endpoints.json', JSON.stringify(unique, null, 2));

