const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'my-app');
const backendRoot = path.join(repoRoot, 'backend', 'toursApi');

function walk(dir, exts = ['.ts', '.tsx', '.cs']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.expo' && file !== 'bin' && file !== 'obj') {
        results = results.concat(walk(full, exts));
      }
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(full);
      }
    }
  });
  return results;
}

// 1. Backend Routes
const ctrlFiles = walk(path.join(backendRoot, 'controllers'), ['.cs']);
const backendRoutes = new Set();
ctrlFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const ctrlName = path.basename(f).replace('Controller.cs', '').replace('.cs', '').toLowerCase();
  
  // Route attributes
  const routeMatch = content.match(/\[Route\("([^"]+)"\)\]/i);
  let base = routeMatch ? routeMatch[1].replace('[controller]', ctrlName) : `api/${ctrlName}`;
  base = base.replace(/^\/+|\/+$/g, '');

  const methodRegex = /\[Http(Get|Post|Put|Delete|Patch)(?:\("([^"]*)"\))?\]/gi;
  let m;
  while ((m = methodRegex.exec(content)) !== null) {
    const method = m[1].toUpperCase();
    const sub = m[2] !== undefined ? m[2].replace(/^\/+|\/+$/g, '') : '';
    const full = ('/' + base + (sub ? '/' + sub : '')).toLowerCase();
    backendRoutes.add(`${method} ${full}`);
  }
});

// 2. Mobile App API calls
const mobileFiles = walk(path.join(appRoot, 'services'), ['.ts', '.tsx'])
  .concat(walk(path.join(appRoot, 'hooks'), ['.ts', '.tsx']))
  .concat(walk(path.join(appRoot, 'context'), ['.ts', '.tsx']))
  .concat(walk(path.join(appRoot, 'components'), ['.ts', '.tsx']))
  .concat(walk(path.join(appRoot, 'app'), ['.ts', '.tsx']));

const appCalls = [];
const apiCallRegex = /(?:api|fetchApi|request|client|http)\.(get|post|put|delete|patch)\s*(?:<[^>]+>)?\s*\(\s*[`'"]([^`'"]+)[`'"]/gi;
const fetchRegex = /fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/gi;

mobileFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const rel = path.relative(repoRoot, f).replace(/\\/g, '/');

  let m;
  while ((m = apiCallRegex.exec(content)) !== null) {
    appCalls.push({
      file: rel,
      method: m[1].toUpperCase(),
      path: m[2]
    });
  }
  while ((m = fetchRegex.exec(content)) !== null) {
    if (m[1].startsWith('/') || m[1].includes('/api/')) {
      appCalls.push({
        file: rel,
        method: 'GET',
        path: m[1]
      });
    }
  }
});

console.log('Total App API call instances:', appCalls.length);
console.log('Total Backend Endpoints:', backendRoutes.size);

// Check discrepancies
const missingFromBackend = [];
appCalls.forEach(call => {
  let clean = call.path.split('?')[0];
  // Replace template literals e.g. ${id} or :id with wildcard or check prefix
  let normalized = clean.replace(/\$\{[^}]+\}/g, '{id}').toLowerCase();
  if (!normalized.startsWith('/')) normalized = '/' + normalized;

  // Exact or prefix match
  let found = false;
  for (const bRoute of backendRoutes) {
    const [bMethod, bPath] = bRoute.split(' ');
    // Match route pattern
    const regexPattern = new RegExp('^' + bPath.replace(/\{[^}]+\}/g, '[^/]+') + '$');
    if (bMethod === call.method && regexPattern.test(normalized)) {
      found = true;
      break;
    }
  }

  if (!found) {
    missingFromBackend.push({
      method: call.method,
      path: call.path,
      file: call.file
    });
  }
});

console.log('API calls missing from backend or non-standard:', missingFromBackend.length);
const uniqueMissing = [...new Map(missingFromBackend.map(i => [`${i.method} ${i.path}`, i])).values()];
console.log('Unique missing endpoints:', uniqueMissing);

fs.writeFileSync(path.join(repoRoot, 'tests', 'api_gaps.json'), JSON.stringify({
  totalCallsInApp: appCalls.length,
  totalBackendRoutes: backendRoutes.size,
  uniqueMissingFromBackend: uniqueMissing
}, null, 2));

