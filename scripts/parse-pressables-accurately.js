const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'my-app');

function walk(dir, exts = ['.tsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.expo' && file !== 'bin' && file !== 'obj') {
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

const allTsx = walk(path.join(appRoot, 'app'))
  .concat(walk(path.join(appRoot, 'components')))
  .concat(walk(path.join(appRoot, 'src')));

let allPressables = [];

allTsx.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  
  // Match full opening tag of Pressable, TouchableOpacity, TouchableHighlight, TouchableWithoutFeedback, Button
  // Matches <TagName ... >
  const tagRegex = /<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button)\b([^>]*?)(\/?>)/gs;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tagType = match[1];
    const attributes = match[2];
    const isSelfClosing = match[3] === '/>';
    
    // Line number calculation
    const linesBefore = content.substring(0, match.index).split('\n').length;
    
    const hasTestId = /testID\s*=/i.test(attributes);
    const hasA11y = /accessibilityLabel\s*=/i.test(attributes) || /aria-label\s*=/i.test(attributes);
    const hasOnPress = /onPress\s*=/i.test(attributes);
    
    // Check if onPress is a no-op or placeholder
    const isEmptyHandler = /onPress\s*=\s*{\s*\(\s*\)\s*=>\s*{\s*}\s*}/.test(attributes) ||
                           /onPress\s*=\s*{\s*undefined\s*}/.test(attributes) ||
                           /onPress\s*=\s*{\s*\(\s*\)\s*=>\s*undefined\s*}/.test(attributes);
                           
    const isDead = !hasOnPress || isEmptyHandler;

    allPressables.push({
      file: relPath,
      line: linesBefore,
      tagType,
      hasTestId,
      hasA11y,
      hasOnPress,
      isEmptyHandler,
      isDead,
      snippet: attributes.replace(/\s+/g, ' ').trim().slice(0, 100)
    });
  }
});

console.log('Total Pressables Found:', allPressables.length);
console.log('With testID:', allPressables.filter(p => p.hasTestId).length);
console.log('Missing testID:', allPressables.filter(p => !p.hasTestId).length);
console.log('With accessibilityLabel:', allPressables.filter(p => p.hasA11y).length);
console.log('Missing accessibilityLabel:', allPressables.filter(p => !p.hasA11y).length);
console.log('Truly Dead (no onPress or empty handler):', allPressables.filter(p => p.isDead).length);

const sampleDead = allPressables.filter(p => p.isDead);
console.log('\nSample Dead Buttons:');
sampleDead.slice(0, 15).forEach(d => {
  console.log(`- ${d.file}:${d.line} (${d.tagType}) -> ${d.snippet}`);
});

fs.writeFileSync('tests/accurate_pressables.json', JSON.stringify({
  total: allPressables.length,
  missingTestId: allPressables.filter(p => !p.hasTestId).length,
  missingA11y: allPressables.filter(p => !p.hasA11y).length,
  deadCount: sampleDead.length,
  deadList: sampleDead,
  missingTestIdList: allPressables.filter(p => !p.hasTestId),
  missingA11yList: allPressables.filter(p => !p.hasA11y)
}, null, 2));

