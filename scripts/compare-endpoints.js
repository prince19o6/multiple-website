const fs = require('fs');

const appEndpoints = JSON.parse(fs.readFileSync('tests/all_app_endpoints.json', 'utf8'));
const inventory = JSON.parse(fs.readFileSync('tests/inventory.json', 'utf8'));

const backendEndpoints = inventory.items.filter(i => i.type === 'Backend Endpoint');

console.log('App unique endpoints:', appEndpoints.length);
console.log('Backend unique endpoints:', backendEndpoints.length);

const backendRouteSet = new Set(backendEndpoints.map(e => e.name.toLowerCase()));

const discrepancies = [];

appEndpoints.forEach(ae => {
  let endpoint = ae.endpoint.split('?')[0].trim();
  // Strip ${...} or query expressions
  endpoint = endpoint.replace(/\$\{[^}]+\}/g, '{id}').toLowerCase();
  if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;

  const key = `${ae.method.toLowerCase()} ${endpoint}`;
  
  // Find match
  let found = false;
  for (const bKey of backendRouteSet) {
    // replace parameter placeholders in backend route e.g. {id} or {code} with wildcard regex
    const bPathPattern = bKey.replace(/\{[^}]+\}/g, '[^/]+');
    const regex = new RegExp(`^${bPathPattern}$`);
    if (regex.test(key) || key.includes(bKey.split(' ')[1])) {
      found = true;
      break;
    }
  }

  if (!found) {
    discrepancies.push({
      functionName: ae.functionName,
      method: ae.method,
      endpoint: ae.endpoint,
      normalized: key
    });
  }
});

console.log('Discrepancies found (endpoints called in app with no backend match):', discrepancies.length);
discrepancies.forEach(d => console.log(`  - [${d.method}] ${d.endpoint} (fn: ${d.functionName})`));

fs.writeFileSync('tests/endpoint_discrepancies.json', JSON.stringify(discrepancies, null, 2));

