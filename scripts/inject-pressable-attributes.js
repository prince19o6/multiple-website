#!/usr/bin/env node
/**
 * scripts/inject-pressable-attributes.js
 *
 * Automated Code Modifier for Apple & Android Automated Testing Compliance.
 * Scans all React Native pressable components in my-app/ and injects:
 *   1. testID="btn-..." or testID="tab-..." for Maestro & Appium automation.
 *   2. accessibilityLabel="..." for screen readers and WCAG compliance.
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

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

function deriveTestIdAndLabel(tagType, attributes, innerContent, lineNum, baseFilename) {
  let label = '';
  let id = '';

  // 1. Check inner text
  const textMatch = />\s*([A-Za-z0-9 ]{2,25})\s*</.exec(innerContent);
  if (textMatch && textMatch[1].trim()) {
    label = textMatch[1].trim();
    id = `btn-${slugify(label)}`;
  }

  // 2. Check icon names
  if (!label) {
    const iconMatch = /name\s*=\s*['"]([a-zA-Z0-9_-]+)['"]/.exec(innerContent);
    if (iconMatch) {
      const iconName = iconMatch[1];
      if (iconName.includes('close')) {
        label = 'Close';
        id = 'btn-close';
      } else if (iconName.includes('heart')) {
        label = 'Toggle wishlist';
        id = 'btn-wishlist-toggle';
      } else if (iconName.includes('search')) {
        label = 'Search';
        id = 'btn-search';
      } else if (iconName.includes('share')) {
        label = 'Share';
        id = 'btn-share';
      } else if (iconName.includes('chevron') || iconName.includes('arrow')) {
        label = 'Navigate';
        id = 'btn-navigate';
      } else if (iconName.includes('filter') || iconName.includes('options')) {
        label = 'Open filters';
        id = 'btn-filters';
      } else {
        label = `${iconName.replace(/[-_]/g, ' ')}`;
        id = `btn-${slugify(iconName)}`;
      }
    }
  }

  // 3. Check onPress handler name
  if (!label) {
    const onPressMatch = /onPress\s*=\s*{?\s*([a-zA-Z0-9_$.]+)/.exec(attributes);
    if (onPressMatch) {
      const fnName = onPressMatch[1];
      if (fnName.includes('close') || fnName.includes('Close') || fnName.includes('dismiss')) {
        label = 'Dismiss';
        id = 'btn-dismiss';
      } else if (fnName.includes('back') || fnName.includes('Back')) {
        label = 'Go back';
        id = 'btn-back';
      } else if (fnName.includes('submit') || fnName.includes('Submit')) {
        label = 'Submit';
        id = 'btn-submit';
      } else if (fnName.includes('filter') || fnName.includes('Filter')) {
        label = 'Filter';
        id = 'btn-filter';
      } else {
        const cleanFn = fnName.replace(/^(handle|on|toggle|set)/, '');
        label = cleanFn ? cleanFn.replace(/([A-Z])/g, ' $1').trim() : 'Action';
        id = `btn-${slugify(cleanFn || 'action')}`;
      }
    }
  }

  // 4. Fallback based on component / file
  if (!label) {
    const fileSlug = slugify(baseFilename.replace(/\.tsx?$/, ''));
    label = `${fileSlug} action`;
    id = `btn-${fileSlug}-${lineNum}`;
  }

  return { id, label };
}

let modifiedFilesCount = 0;
let totalInjected = 0;

const TARGET_TAGS = ['Pressable', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'Button'];

allFiles.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasModified = false;
  const baseFilename = path.basename(filePath);

  for (const tagType of TARGET_TAGS) {
    const pattern = new RegExp(`<${tagType}\\b`, 'g');
    let match;

    // We scan indices backwards or match repeatedly
    while ((match = pattern.exec(content)) !== null) {
      const startIndex = match.index;
      let currentIndex = startIndex + match[0].length;
      let braceDepth = 0;
      let inString = null;
      let tagClosed = false;

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

      const hasTestId = /testID\s*=/i.test(attributes);
      const hasA11y = /accessibilityLabel\s*=/i.test(attributes) || /aria-label\s*=/i.test(attributes);

      if (hasTestId && hasA11y) continue;

      // Extract up to 250 characters of inner content after the tag
      const innerSample = content.substring(currentIndex, currentIndex + 250);
      const lineNum = content.substring(0, startIndex).split('\n').length;

      const { id, label } = deriveTestIdAndLabel(tagType, attributes, innerSample, lineNum, baseFilename);

      let injectedProps = '';
      if (!hasTestId) {
        injectedProps += ` testID="${id}"`;
      }
      if (!hasA11y) {
        injectedProps += ` accessibilityLabel="${label}"`;
      }

      // Inject right after the tag name
      const insertPos = startIndex + match[0].length;
      content = content.substring(0, insertPos) + injectedProps + content.substring(insertPos);

      // Adjust regex index after insertion
      pattern.lastIndex = insertPos + injectedProps.length;
      hasModified = true;
      totalInjected++;
    }
  }

  if (hasModified) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFilesCount++;
  }
});

console.log('====================================================');
console.log('   ✨ PRESSABLE TESTID & A11Y AUTO-INJECTION        ');
console.log('====================================================');
console.log(`Files Modified     : ${modifiedFilesCount}`);
console.log(`Attributes Injected: ${totalInjected}`);

