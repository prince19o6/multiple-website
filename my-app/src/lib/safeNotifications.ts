/**
 * src/lib/safeNotifications.ts
 *
 * Safe wrapper around expo-notifications that prevents unhandled native module
 * crashes in Expo Go on Android (such as missing ExpoTopicSubscriptionModule).
 */

let NativeNotifications: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NativeNotifications = require('expo-notifications');
} catch (e) {
  if (__DEV__) {
    console.log('[safeNotifications] expo-notifications unavailable in current runtime:', e);
  }
}

export const SafeNotifications = {
  setNotificationHandler: (handler: any) => {
    try {
      NativeNotifications?.setNotificationHandler?.(handler);
    } catch {
      // safe fallback
    }
  },

  setNotificationChannelAsync: async (channelId: string, channel: any) => {
    try {
      if (NativeNotifications?.setNotificationChannelAsync) {
        return await NativeNotifications.setNotificationChannelAsync(channelId, channel);
      }
    } catch {
      // safe fallback
    }
    return null;
  },

  getPermissionsAsync: async () => {
    try {
      if (NativeNotifications?.getPermissionsAsync) {
        return await NativeNotifications.getPermissionsAsync();
      }
    } catch {
      // safe fallback
    }
    return { status: 'granted' as const };
  },

  requestPermissionsAsync: async (permissions?: any) => {
    try {
      if (NativeNotifications?.requestPermissionsAsync) {
        return await NativeNotifications.requestPermissionsAsync(permissions);
      }
    } catch {
      // safe fallback
    }
    return { status: 'granted' as const };
  },

  addNotificationResponseReceivedListener: (listener: (response: any) => void) => {
    try {
      if (NativeNotifications?.addNotificationResponseReceivedListener) {
        return NativeNotifications.addNotificationResponseReceivedListener(listener);
      }
    } catch {
      // safe fallback
    }
    return { remove: () => {} };
  },

  scheduleNotificationAsync: async (request: any) => {
    try {
      if (NativeNotifications?.scheduleNotificationAsync) {
        return await NativeNotifications.scheduleNotificationAsync(request);
      }
    } catch {
      // safe fallback
    }
    return 'mock-notification-id';
  },

  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
    CALENDAR: 'calendar',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
  },

  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    LOW: 2,
    MAX: 5,
    MIN: 1,
    NONE: 0,
    UNSPECIFIED: -1000,
  },
};
