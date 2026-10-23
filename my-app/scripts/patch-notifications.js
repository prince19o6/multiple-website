const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../node_modules/expo-notifications/build/TopicSubscriptionModule.android.js');

if (fs.existsSync(targetFile)) {
  const content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')")) {
    const patched = content.replace(
      "import { requireNativeModule } from 'expo';\nexport default requireNativeModule('ExpoTopicSubscriptionModule');",
      "import { requireOptionalNativeModule } from 'expo';\nconst nativeModule = requireOptionalNativeModule('ExpoTopicSubscriptionModule') || {\n  addListener: () => {},\n  removeListeners: () => {},\n  subscribeToTopicAsync: () => Promise.resolve(null),\n  unsubscribeFromTopicAsync: () => Promise.resolve(null),\n};\nexport default nativeModule;"
    );
    fs.writeFileSync(targetFile, patched, 'utf8');
    console.log('[patch-notifications] Successfully patched TopicSubscriptionModule.android.js for Expo Go');
  }
}
