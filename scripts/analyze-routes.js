const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'my-app');

function walk(dir, exts = ['.tsx', '.ts']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.expo') {
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

const screenFiles = walk(path.join(appRoot, 'app'), ['.tsx']);
const allFiles = walk(path.join(appRoot, 'app'), ['.tsx'])
  .concat(walk(path.join(appRoot, 'components'), ['.tsx']))
  .concat(walk(path.join(appRoot, 'src'), ['.tsx']));

const navigatedRoutes = new Set();
const deadLinks = [];

const navRegex = /(?:router\.(?:push|replace)|href=)[^/`'"]*[`'"](\/[^`'"?#]+)[`'"]/g;

allFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const rel = path.relative(repoRoot, f).replace(/\\/g, '/');
  let m;
  while ((m = navRegex.exec(content)) !== null) {
    const target = m[1];
    navigatedRoutes.add(target);

    // check if target matches any known screen
    let cleanTarget = target.replace(/^\/+/, '');
    let exists = false;
    for (const sf of screenFiles) {
      let sRel = path.relative(path.join(appRoot, 'app'), sf).replace(/\\/g, '/').replace(/\.tsx$/, '');
      const sPattern = sRel
        .replace(/\+/g, '\\+')
        .replace(/\[\.\.\.[^\]]+\]/g, '.*')
        .replace(/\[[^\]]+\]/g, '[^/]+')
        .replace(/\(tabs\)\//, '')
        .replace(/\(auth\)\//, '')
        .replace(/\(admin\)\//, 'admin/');

      const reg = new RegExp('^' + sPattern + '$');
      if (reg.test(cleanTarget) || sRel === cleanTarget || ('/' + sRel) === target) {
        exists = true;
        break;
      }
    }

    if (!exists && !target.startsWith('/api') && !target.startsWith('http') && target !== '/') {
      deadLinks.push({
        from: rel,
        target
      });
    }
  }
});

console.log('Total screens:', screenFiles.length);
console.log('Total navigated routes detected:', navigatedRoutes.size);
console.log('Dead links / unresolved routes:', deadLinks.length);
const uniqueDead = [...new Map(deadLinks.map(d => [`${d.from} -> ${d.target}`, d])).values()];
console.log('Unique unresolved navigation calls:', uniqueDead);

const unreferencedScreens = [];
screenFiles.forEach(sf => {
  let sRel = path.relative(path.join(appRoot, 'app'), sf).replace(/\\/g, '/');
  if (sRel.startsWith('_') || sRel.includes('+not-found')) return;
  
  let baseName = path.basename(sf, '.tsx');
  let isReferenced = false;
  for (const nr of navigatedRoutes) {
    if (nr.includes(baseName)) {
      isReferenced = true;
      break;
    }
  }
  if (!isReferenced) {
    unreferencedScreens.push(sRel);
  }
});

console.log('Unreferenced screens:', unreferencedScreens.length);
console.log('Sample unreferenced screens:', unreferencedScreens.slice(0, 15));

fs.writeFileSync('tests/dead_routes_audit.json', JSON.stringify({
  totalScreens: screenFiles.length,
  deadLinks: uniqueDead,
  unreferencedScreens
}, null, 2));
