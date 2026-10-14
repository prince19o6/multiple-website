/**
 * components/Navigation.tsx
 *
 * Upgraded/refactored top navigation component.
 * Re-exports the modular Navbar component to maintain backward compatibility
 * across existing screens and imports while delivering all new features:
 *   - Animated Reanimated slide-in drawer
 *   - Swipe-to-close & backdrop tap-to-close gestures
 *   - Dynamic theme updates upon runtime site switching
 *   - Back button on inner screens (e.g. Tour Details)
 *   - Safe area handling and accessible 44px+ touch targets
 */

export { default } from './Navbar';
export * from './Navbar';
