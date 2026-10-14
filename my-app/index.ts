/**
 * index.ts
 *
 * Primary entry point for the Expo app.
 * Configured as "main": "index.ts" in package.json.
 */

import 'react-native-gesture-handler';
import { Platform, LogBox } from 'react-native';

// Suppress known development API fallback / debug notices from triggering LogBox overlay
LogBox.ignoreLogs([
  '[DEBUG] [Tours API',
  'no Route matched with those values',
  'HTTP 404',
]);

// On web with React 19, intercept recoverable concurrent rendering notices
// so that Expo Metro Runtime's error overlay does not treat them as fatal crashes.
if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const isRecoverable = (msg: unknown) => {
    if (typeof msg !== 'string') return false;
    return (
      msg.includes('concurrent rendering') ||
      msg.includes('recover by instead synchronously rendering') ||
      msg.includes('Hydration failed') ||
      msg.includes('did not match') ||
      msg.includes('"shadow*" style props are deprecated') ||
      msg.includes('style props are deprecated')
    );
  };

  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (isRecoverable(first)) return;
    origWarn.apply(console, args);
  };

  const origError = console.error;
  console.error = (...args: any[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (isRecoverable(first)) return;
    origError.apply(console, args);
  };

  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      const msg = event?.error?.message || event?.message || '';
      if (isRecoverable(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.info('[React 19 Recovery Suppressed on Web]:', msg);
      }
    },
    true // Capturing phase ensures this runs before Expo's unhandled error listener
  );

  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const msg = reason?.message || String(reason || '');
      if (isRecoverable(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.info('[React 19 Rejection Suppressed on Web]:', msg);
      }
    },
    true
  );
}

import 'expo-router/entry';
