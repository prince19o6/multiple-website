const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../node_modules/expo-notifications/build/TopicSubscriptionModule.android.js');

const safeStub = `const module = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};
export default module;
`;

if (fs.existsSync(targetFile)) {
  fs.writeFileSync(targetFile, safeStub, 'utf8');
  console.log('[patch-notifications] Successfully stubbed TopicSubscriptionModule.android.js for Expo Go');
}
