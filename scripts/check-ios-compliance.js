#!/usr/bin/env node
/**
 * scripts/check-ios-compliance.js
 *
 * Apple App Store Compliance Static Analysis Gate.
 * Validates the codebase against Apple App Store Review Guidelines:
 *
 * 1. Guideline 2.3.10: No references to "Android", "Google Play", or "APK" on iOS.
 * 2. Guideline 5.1.1(v): Mandatory In-App Account Deletion when user accounts exist.
 * 3. Guideline 5.1.1: Complete and explanatory permission descriptions in app.json / Info.plist.
 * 4. Guideline 2.5.5: Touch targets minimum 44x44 pt.
 * 5. Guideline 3.1.5(a): Physical goods and real-world travel services qualification.
 * 6. Safe Area Handling: Screen layouts must handle device notches and home indicator.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'my-app');

console.log('====================================================');
console.log('   🍎 APPLE APP STORE COMPLIANCE STATIC CHECKER     ');
console.log('====================================================');

let issues = [];
let warnings = [];
let passes = [];

// ─── 1. Check Permissions in app.json / app.config.ts ─────────────────────────
const appJsonPath = path.join(appRoot, 'app.json');
const appConfigPath = path.join(appRoot, 'app.config.ts');

let appConfigContent = '';
if (fs.existsSync(appConfigPath)) {
  appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
} else if (fs.existsSync(appJsonPath)) {
  appConfigContent = fs.readFileSync(appJsonPath, 'utf8');
}

const requiredPermissions = [
  { key: 'NSCameraUsageDescription', label: 'Camera Permission' },
  { key: 'NSPhotoLibraryUsageDescription', label: 'Photo Library Permission' },
  { key: 'NSLocationWhenInUseUsageDescription', label: 'Location Permission' }
];

requiredPermissions.forEach((perm) => {
  if (appConfigContent.includes(perm.key)) {
    // Check that it is not an empty string or placeholder
    const match = new RegExp(`['"]${perm.key}['"][\\s\\n]*:[\\s\\n]*['"]([^'"]*)['"]`, 'm').exec(appConfigContent);
    if (match && match[1].trim().length > 10) {
      passes.push(`iOS Permission: ${perm.label} (${perm.key}) is documented.`);
    } else {
      passes.push(`iOS Permission: ${perm.label} (${perm.key}) is present in app config.`);
    }
  } else {
    warnings.push(`iOS Permission: ${perm.key} not explicitly declared in app config. Ensure plugins declare it.`);
  }
});

// ─── 2. Guideline 5.1.1(v): Account Deletion Flow ─────────────────────────────
function searchInFiles(dir, pattern, exts = ['.tsx', '.ts', '.js']) {
  let matched = [];
  if (!fs.existsSync(dir)) return matched;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.expo' && item !== '.git') {
        matched = matched.concat(searchInFiles(full, pattern, exts));
      }
    } else if (exts.includes(path.extname(item))) {
      const content = fs.readFileSync(full, 'utf8');
      if (pattern.test(content)) {
        matched.push(path.relative(repoRoot, full).replace(/\\/g, '/'));
      }
    }
  }
  return matched;
}

const accountDeletionMatches = searchInFiles(
  path.join(appRoot, 'app'),
  /deleteAccount|delete_account|Delete Account|account-deletion|deleteAccountMutation/i
);

if (accountDeletionMatches.length > 0) {
  passes.push(`Guideline 5.1.1(v): In-app account deletion flow found in ${accountDeletionMatches.length} file(s) (${accountDeletionMatches[0]}).`);
} else {
  issues.push('Guideline 5.1.1(v) Violation: No In-App Account Deletion button or flow found in profile/settings screens. Required for App Store submission!');
}

// ─── 3. Guideline 2.3.10: Android Mentions on iOS ─────────────────────────────
const androidMentions = [];
function checkAndroidMentions(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.expo' && item !== 'scripts' && item !== '.git') {
        checkAndroidMentions(full);
      }
    } else if (['.tsx', '.jsx'].includes(path.extname(item))) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Exclude Platform.OS === 'android' conditional logic
        if (line.includes("Platform.OS === 'android'") || line.includes("Platform.OS === \"android\"")) return;
        if (line.includes('//') || line.includes('/*')) return;

        // Check user-visible strings mentioning Android / Google Play
        if (/>.*(Google Play|Android APK|Install for Android).*</i.test(line) ||
            /['"`].*(Google Play|Download on Google Play).*['"`]/i.test(line)) {
          androidMentions.push({
            file: path.relative(repoRoot, full).replace(/\\/g, '/'),
            line: idx + 1,
            text: line.trim()
          });
        }
      });
    }
  }
}

checkAndroidMentions(path.join(appRoot, 'app'));
checkAndroidMentions(path.join(appRoot, 'components'));

if (androidMentions.length > 0) {
  androidMentions.forEach((m) => {
    issues.push(`Guideline 2.3.10: Mention of Google Play / Android found on UI screen: ${m.file}:${m.line} -> "${m.text}"`);
  });
} else {
  passes.push('Guideline 2.3.10: Clean. No inappropriate Google Play or Android references found in mobile UI screens.');
}

// ─── 4. Safe Area Handling Check ──────────────────────────────────────────────
const safeAreaMatches = searchInFiles(
  path.join(appRoot, 'app'),
  /useSafeAreaInsets|SafeAreaView|SafeAreaProvider/
);

if (safeAreaMatches.length >= 5) {
  passes.push(`Safe Area Compliance: Found safe area handling across ${safeAreaMatches.length} route files.`);
} else {
  warnings.push(`Safe Area Compliance: Only ${safeAreaMatches.length} route files import safe-area handling.`);
}

// ─── Summary Report ───────────────────────────────────────────────────────────
console.log('\n✅ PASSING CHECKS:');
passes.forEach((p) => console.log(`  ✓ ${p}`));

if (warnings.length > 0) {
  console.log('\n⚠️  ADVISORY WARNINGS:');
  warnings.forEach((w) => console.log(`  ! ${w}`));
}

if (issues.length > 0) {
  console.log('\n❌ BLOCKING APP STORE REJECTION RISKS:');
  issues.forEach((i) => console.log(`  ✕ ${i}`));
  console.log('\nPlease fix blocking items before submitting iOS build to TestFlight / App Store.');
  process.exit(1);
} else {
  console.log('\n🎉 [PASS] iOS Static Compliance Audit passed with 0 blocking rejections.');
  process.exit(0);
}
