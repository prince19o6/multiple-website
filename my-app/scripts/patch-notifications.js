const fs = require('fs');
const path = require('path');

const targets = [
  path.resolve(__dirname, '../node_modules/expo-notifications/build/TopicSubscriptionModule.android.js'),
  path.resolve(__dirname, '../node_modules/expo-notifications/src/TopicSubscriptionModule.android.ts'),
];

const safeStub = `const module = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};
export default module;
`;

for (const target of targets) {
  if (fs.existsSync(target)) {
    fs.writeFileSync(target, safeStub, 'utf8');
    console.log(`[patch-notifications] Successfully stubbed ${path.basename(path.dirname(target))}/${path.basename(target)}`);
  }
}
