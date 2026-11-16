#!/usr/bin/env node
/**
 * scripts/audit-pressables.js
 *
 * Pressable & Accessibility Quality Gate.
 * Parses all UI screens and components in my-app/ with a robust JSX bracket-aware parser to ensure:
 * 1. Zero dead buttons (pressable components without onPress or with empty handlers).
 * 2. Proper testID coverage for automated testing (Maestro / Detox / Appium).
 * 3. Proper accessibilityLabel coverage for screen readers (WCAG & Apple Guideline 2.5.5).
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'my-app');

function walk(dir, exts = ['.tsx', '.jsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.expo' && file !== 'bin' && file !== 'obj' && file !== '.git') {
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

const targetDirs = [
  path.join(appRoot, 'app'),
  path.join(appRoot, 'components'),
  path.join(appRoot, 'src')
];

let allFiles = [];
targetDirs.forEach((d) => {
  allFiles = allFiles.concat(walk(d));
});

let totalPressables = 0;
let missingTestId = 0;
let missingA11y = 0;
let deadButtons = [];

const TARGET_TAGS = ['Pressable', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'Button'];

allFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/');

  for (const tagType of TARGET_TAGS) {
    const pattern = new RegExp(`<${tagType}\\b`, 'g');
    let match;

    while ((match = pattern.exec(content)) !== null) {
      totalPressables++;
      const startIndex = match.index;
      let currentIndex = startIndex + match[0].length;
      let braceDepth = 0;
      let inString = null;
      let tagClosed = false;

      // Scan until the closing '>' of the opening tag, respecting JSX expressions and strings
      while (currentIndex < content.length) {
        const char = content[currentIndex];
        const prevChar = currentIndex > 0 ? content[currentIndex - 1] : '';

        if (inString) {
          if (char === inString && prevChar !== '\\') {
            inString = null;
          }
        } else {
          if (char === '"' || char === "'" || char === '`') {
            inString = char;
          } else if (char === '{') {
            braceDepth++;
          } else if (char === '}') {
            if (braceDepth > 0) braceDepth--;
          } else if (char === '>' && braceDepth === 0) {
            tagClosed = true;
            currentIndex++;
            break;
          }
        }
        currentIndex++;
      }

      if (!tagClosed) continue;

      const fullTag = content.substring(startIndex, currentIndex);
      const attributes = content.substring(startIndex + match[0].length, currentIndex - 1);

      const linesBefore = content.substring(0, startIndex).split('\n').length;
      const hasTestId = /testID\s*=/i.test(attributes);
      const hasA11y = /accessibilityLabel\s*=/i.test(attributes) || /aria-label\s*=/i.test(attributes);
      const hasOnPress = /onPress\s*=/i.test(attributes);

      const isEmptyHandler =
        /onPress\s*=\s*{\s*undefined\s*}/.test(attributes) ||
        /onPress\s*=\s*{\s*\(\s*\)\s*=>\s*undefined\s*}/.test(attributes);

      if (!hasTestId) missingTestId++;
      if (!hasA11y) missingA11y++;

      if (!hasOnPress || isEmptyHandler) {
        deadButtons.push({
          file: relPath,
          line: linesBefore,
          tag: tagType,
          snippet: fullTag.slice(0, 120).replace(/\s+/g, ' ')
        });
      }
    }
  }
});

console.log('====================================================');
console.log('   📱 MOBILE APP PRESSABLE & ACCESSIBILITY AUDIT    ');
console.log('====================================================');
console.log(`Total Pressable Elements Scanned : ${totalPressables}`);
console.log(`Missing testID                   : ${missingTestId} (${Math.round((missingTestId / totalPressables) * 100)}%)`);
console.log(`Missing accessibilityLabel       : ${missingA11y} (${Math.round((missingA11y / totalPressables) * 100)}%)`);
console.log(`Dead Buttons (No onPress Handler): ${deadButtons.length}`);

if (deadButtons.length > 0) {
  console.log('\n⚠️  DEAD BUTTONS DETECTED:');
  deadButtons.forEach((d) => {
    console.log(`  - ${d.file}:${d.line} <${d.tag}>`);
  });
}

const args = process.argv.slice(2);
const failOnDead = args.includes('--fail-on-dead');
const strict = args.includes('--strict');

if (strict && (missingTestId > 0 || missingA11y > 0 || deadButtons.length > 0)) {
  console.error('\n❌ [FAIL] Strict pressable quality gate failed.');
  process.exit(1);
} else if (failOnDead && deadButtons.length > 0) {
  console.error('\n❌ [FAIL] Dead buttons must have handlers attached.');
  process.exit(1);
} else {
  console.log('\n✅ [PASS] Pressable audit finished successfully.');
  process.exit(0);
}
