const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'my-app');
const backendRoot = path.join(repoRoot, 'backend', 'toursApi');
const webRoot = path.join(repoRoot, 'web');

console.log('Generating Phase 1 Inventory from:', repoRoot);

// Helper to recursively collect files
function walk(dir, exts = ['.ts', '.tsx', '.js', '.cs']) {
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

// 1. Screens in my-app/app
const appFiles = walk(path.join(appRoot, 'app'), ['.tsx', '.ts']);
const screens = appFiles.filter((f) => !path.basename(f).startsWith('_') && path.extname(f) === '.tsx');

// 2. Components in my-app/components
const compFiles = walk(path.join(appRoot, 'components'), ['.tsx']);

// 3. Components in my-app/src
const srcFiles = walk(path.join(appRoot, 'src'), ['.tsx', '.ts']);

// 4. Scan Pressables across all mobile files
const pressablePattern = /<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button|IconButton)\b([\s\S]*?)>/g;
const onPressPattern = /onPress\s*=\s*({[\s\S]*?})/i;
const testIdPattern = /testID\s*=\s*(?:{([^}]+)}|"([^"]+)")/i;
const a11yLabelPattern = /accessibilityLabel\s*=\s*(?:{([^}]+)}|"([^"]+)")/i;

let totalPressables = 0;
let pressablesMissingTestId = [];
let pressablesMissingA11y = [];
let deadButtons = [];

const allMobileTsx = walk(path.join(appRoot, 'app'), ['.tsx'])
  .concat(walk(path.join(appRoot, 'components'), ['.tsx']))
  .concat(walk(path.join(appRoot, 'src'), ['.tsx']));

allMobileTsx.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  
  // Find all elements with onPress or pressable components
  const lines = content.split('\n');
  lines.forEach((line, lineIdx) => {
    if (line.includes('onPress') || line.includes('<Pressable') || line.includes('<TouchableOpacity') || line.includes('<Button')) {
      // Find full tag if multiline or singleline
      let tagText = line;
      let j = lineIdx;
      while (!tagText.includes('>') && j < lines.length - 1 && j < lineIdx + 15) {
        j++;
        tagText += ' ' + lines[j];
      }

      // Check if it's an interactive element
      if (tagText.includes('onPress') || tagText.includes('<Pressable') || tagText.includes('<TouchableOpacity') || tagText.includes('<Button')) {
        totalPressables++;
        const hasTestId = testIdPattern.test(tagText);
        const hasA11y = a11yLabelPattern.test(tagText);
        
        // Check for dead button (e.g. onPress={() => {}} or onPress={undefined} or no onPress on Pressable/TouchableOpacity)
        const hasOnPress = onPressPattern.test(tagText);
        const isEmptyHandler = tagText.includes('onPress={() => {}}') || tagText.includes('onPress={() => { }}') || tagText.includes('onPress={undefined}');
        
        const info = {
          file: relPath,
          line: lineIdx + 1,
          snippet: line.trim().slice(0, 80),
          hasTestId,
          hasA11y,
          hasOnPress,
          isEmptyHandler
        };

        if (!hasTestId) pressablesMissingTestId.push(info);
        if (!hasA11y) pressablesMissingA11y.push(info);
        if (!hasOnPress || isEmptyHandler) {
          // If it's a Pressable/TouchableOpacity without an onPress handler
          if (tagText.includes('<Pressable') || tagText.includes('<TouchableOpacity') || tagText.includes('<Button')) {
            deadButtons.push(info);
          }
        }
      }
    }
  });
});

// 5. Scan Backend Controllers for Endpoints
const controllerFiles = walk(path.join(backendRoot, 'controllers'), ['.cs']);
let backendEndpoints = [];

controllerFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
  const ctrlMatch = path.basename(file).replace('Controller.cs', '').replace('.cs', '');
  
  // Route attribute on controller
  const routeMatch = content.match(/\[Route\("([^"]+)"\)\]/i);
  let baseRoute = routeMatch ? routeMatch[1] : `api/[controller]`;
  baseRoute = baseRoute.replace('[controller]', ctrlMatch.toLowerCase());

  // Method attributes
  const methodRegex = /\[(HttpGet|HttpPost|HttpPut|HttpDelete|HttpPatch)(?:\("([^"]*)"\))?\][\s\S]*?(?:public|async)\s+[^{]+?\s+(\w+)\s*\(/g;
  let m;
  while ((m = methodRegex.exec(content)) !== null) {
    const httpMethod = m[1].replace('Http', '').toUpperCase();
    const subRoute = m[2] !== undefined ? m[2] : '';
    const actionName = m[3];
    
    let fullRoute = '/' + baseRoute;
    if (subRoute) {
      if (subRoute.startsWith('/')) {
        fullRoute = subRoute;
      } else {
        fullRoute = fullRoute + '/' + subRoute;
      }
    }
    fullRoute = fullRoute.replace('//', '/');

    // Auth check
    const isAnonymous = content.slice(Math.max(0, m.index - 200), m.index).includes('[AllowAnonymous]') || content.includes('[AllowAnonymous]');
    const isAuthorize = content.slice(Math.max(0, m.index - 200), m.index).includes('[Authorize]') || content.includes('[Authorize]');
    const isAdmin = content.slice(Math.max(0, m.index - 200), m.index).includes('Roles = "Admin"') || content.includes('Roles = "Admin"') || ctrlMatch.toLowerCase().includes('admin');

    backendEndpoints.push({
      controller: ctrlMatch,
      action: actionName,
      method: httpMethod,
      route: fullRoute,
      file: rel,
      auth: isAdmin ? 'Admin' : (isAuthorize ? 'Bearer JWT' : 'Public'),
      websiteScoped: true
    });
  }
});

// 6. Scan Mobile API client calls
const mobileServiceFiles = walk(path.join(appRoot, 'services'), ['.ts', '.tsx'])
  .concat(walk(path.join(appRoot, 'hooks'), ['.ts', '.tsx']))
  .concat(walk(path.join(appRoot, 'context'), ['.ts', '.tsx']))
  .concat(walk(path.join(appRoot, 'lib'), ['.ts', '.tsx']));

let mobileApiCalls = [];
mobileServiceFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
  
  // Look for api.get, api.post, fetch, etc.
  const apiCallRegex = /(?:api|fetchApi|request|client)\.(get|post|put|delete|patch)\s*(?:<[^>]+>)?\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
  let match;
  while ((match = apiCallRegex.exec(content)) !== null) {
    mobileApiCalls.push({
      file: rel,
      method: match[1].toUpperCase(),
      url: match[2]
    });
  }
});

// 7. Assemble Complete Inventory Items
let inventory = [];
let idCounter = 1;

function padId(prefix, num) {
  return `${prefix}-${String(num).padStart(4, '0')}`;
}

// A. Routes / Screens in my-app
screens.forEach((f) => {
  const rel = path.relative(appRoot, f).replace(/\\/g, '/');
  const routeName = rel.replace(/\.tsx$/, '').replace(/^app\//, '/');
  const dependsOnApi = contentHasApi(fs.readFileSync(f, 'utf8'));

  inventory.push({
    id: padId('SCR', idCounter++),
    type: 'Screen / Route',
    name: routeName,
    path: `my-app/${rel}`,
    dependsOnApi,
    platforms: ['Android', 'iOS'],
    testTypePlanned: 'Component + RNTL + Maestro E2E',
    status: 'Ready for Test'
  });
});

// B. Components in my-app/components
compFiles.forEach((f) => {
  const rel = path.relative(appRoot, f).replace(/\\/g, '/');
  const compName = path.basename(f, '.tsx');
  const dependsOnApi = contentHasApi(fs.readFileSync(f, 'utf8'));

  inventory.push({
    id: padId('CMP', idCounter++),
    type: 'App Component',
    name: compName,
    path: `my-app/${rel}`,
    dependsOnApi,
    platforms: ['Android', 'iOS'],
    testTypePlanned: 'Unit + Snapshot + States (Loading/Empty/Error/Populated)',
    status: 'Ready for Test'
  });
});

// C. Backend API Endpoints
backendEndpoints.forEach((ep) => {
  inventory.push({
    id: padId('API', idCounter++),
    type: 'Backend Endpoint',
    name: `${ep.method} ${ep.route}`,
    path: ep.file,
    dependsOnApi: true,
    platforms: ['Backend'],
    testTypePlanned: 'xUnit + WebApplicationFactory + Isolation Test',
    status: 'Ready for Test'
  });
});

// D. Critical Web Routes
const webRoutes = [
  '/', '/en', '/en/hotels', '/en/tours', '/en/flights', '/en/holidays',
  '/en/transfers', '/en/visas', '/en/restaurants', '/en/buildpackage',
  '/en/about-us', '/en/contact-us', '/en/faq', '/admin', '/admin/bookings'
];

webRoutes.forEach((wr) => {
  inventory.push({
    id: padId('WEB', idCounter++),
    type: 'Web Route',
    name: wr,
    path: 'web/app',
    dependsOnApi: true,
    platforms: ['Web'],
    testTypePlanned: 'Vitest + Playwright E2E',
    status: 'Ready for Test'
  });
});

function contentHasApi(content) {
  return content.includes('useQuery') || content.includes('fetch(') || content.includes('api.') || content.includes('apiService') || content.includes('/api/');
}

// Write inventory.json
const inventoryDir = path.join(repoRoot, 'tests');
if (!fs.existsSync(inventoryDir)) fs.mkdirSync(inventoryDir, { recursive: true });

const inventoryJsonPath = path.join(inventoryDir, 'inventory.json');
fs.writeFileSync(inventoryJsonPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totals: {
    totalItems: inventory.length,
    screensCount: screens.length,
    componentsCount: compFiles.length,
    backendEndpointsCount: backendEndpoints.length,
    webRoutesCount: webRoutes.length,
    pressablesTotal: totalPressables,
    pressablesMissingTestId: pressablesMissingTestId.length,
    pressablesMissingA11y: pressablesMissingA11y.length,
    deadButtonsCount: deadButtons.length
  },
  items: inventory,
  pressableAudit: {
    missingTestIdSample: pressablesMissingTestId.slice(0, 50),
    missingA11ySample: pressablesMissingA11y.slice(0, 50),
    deadButtonsSample: deadButtons.slice(0, 30)
  }
}, null, 2));

console.log('Successfully generated tests/inventory.json with', inventory.length, 'items');
console.log('Pressables analyzed:', totalPressables);
console.log('Missing testID:', pressablesMissingTestId.length);
console.log('Missing accessibilityLabel:', pressablesMissingA11y.length);
console.log('Dead / unhandled buttons:', deadButtons.length);
console.log('Backend endpoints:', backendEndpoints.length);
console.log('Screens:', screens.length);
console.log('Components:', compFiles.length);

