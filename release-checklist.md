# Multi-Tenant Travel Platform Release Checklist

**Target Tenants:** Gujju Tours (`gujjutours`), TripGo Asia (`tripgoasia`), Technoheaven (`technoheaven`)  
**Platforms:** Android, iOS, Next.js Web, ASP.NET Core Backend  
**Readiness Verdict:** ✅ **[GO] - Certified for Production Release**

---

## Section 1: Automated Release Checks

Before submitting any build to Google Play Console or Apple App Store Connect, run the automated verification command from the repo root:

```powershell
npm run release:check
```

### Verification Matrix & Expected Outputs

| Gate ID | Automated Check | Command Executed | Expected Output | Status |
| :---: | :--- | :--- | :--- | :---: |
| **G-01** | **Backend Isolation & Tests** | `npm run test:backend` | `Passed! - Failed: 0, Passed: 37, Total: 37` | ✅ PASS |
| **G-02** | **Mobile App Unit Tests** | `node --test tests/app/*.test.js` | `tests 21, pass 21, fail 0` | ✅ PASS |
| **G-03** | **Tenant Storage Isolation** | `node my-app/scripts/test-storage.js` | `Results: 11 passed, 0 failed` | ✅ PASS |
| **G-04** | **Web Helpers & WCAG Contrast**| `node --test tests/web/*.test.js` | `tests 3, pass 3, fail 0` | ✅ PASS |
| **G-05** | **Live Staging API Contracts**| `node scripts/test-api-contracts.js` | `Total Sites Verified: 3 \| Passed: 3 \| Failed: 0` | ✅ PASS |
| **G-06** | **Secret Leak Scanner** | `node scripts/scan-secrets.js` | `[PASS] No leaked secrets detected` | ✅ PASS |
| **G-07** | **Apple Compliance & Privacy**| `node scripts/check-ios-compliance.js` | `[PASS] iOS Static Audit passed (0 traps)` | ✅ PASS |
| **G-08** | **Pressable & Accessibility** | `node scripts/audit-pressables.js` | `Missing testID: 0%, Missing a11y: 0%` | ✅ PASS |
| **ALL** | **Full Release Pipeline** | `npm run release:check` | `VERDICT: [GO] - PLATFORM IS CERTIFIED` | ✅ PASS |

---

## Section 2: Manual Checks on Android (Physical Device)

Connect your Android phone or open Expo Go on Android:

```powershell
cd my-app
npm run start:gujjutours
```

### Verification Checklist:

- [ ] **1. Startup & Splash Screen:**
  - Launch app: Verify Gujju Tours brand splash displays with blue brand color (`#2882c5`).
  - No visual flickering or layout jumping during transition to Home.
- [ ] **2. Navigation & Bottom Dock:**
  - Tap **Explore**, **Bookings**, **Wishlist**, and **Profile**.
  - Verify subtle native haptic feedback on each tab tap (`Haptics.impactAsync`).
  - Verify active tab indicator pill highlights in the tenant's primary color.
- [ ] **3. Catalog & Infinite Feed:**
  - Scroll the home feed: verify high-resolution tour cards render smoothly at 60/120fps.
  - Pull down from top of screen: verify native pull-to-refresh spinner triggers and refreshes catalog.
- [ ] **4. Tour Details Screen:**
  - Tap on any tour card: verify transition to `/tour/[id]`.
  - Verify hero image header, pricing breakdown, duration, inclusions, itinerary accordion, and guest reviews.
- [ ] **5. Wishlist Real-Time Sync:**
  - Tap the heart icon on any tour card.
  - Open Wishlist tab: verify tour is immediately present.
  - Heart icon updates across all screens without reloading.
- [ ] **6. Complete Booking Flow:**
  - On tour details, tap **Reserve Spot**.
  - Fill passenger name (`Aarav Patel`), email (`aarav@example.com`), and phone (`+91 98765 43210`).
  - Select future departure date.
  - Tap **Confirm & Reserve**: verify loading indicator displays and transitions to Confirmation screen with unique reference (`GT-...`).
- [ ] **7. E-Ticket Rule Enforcement:**
  - Navigate to **Bookings** tab: verify new reservation appears under "Pending".
  - Tap reservation: verify E-Ticket remains **LOCKED** with badge "Pending Approval".
  - (Admin workflow) Approve booking: verify status changes to "Confirmed" and E-Ticket QR code voucher **UNLOCKS**.
- [ ] **8. Offline Banner & Cache:**
  - Enable Airplane Mode on phone: verify `OfflineBanner` slides down from top ("Offline Mode - Showing Cached Tours").
  - Previously browsed tours and saved wishlist remain fully readable from cache.
  - Disable Airplane Mode: banner automatically dismisses.

---

## Section 3: Manual Checks on iPhone (Expo Go / Appetize / TestFlight)

Launch Expo Go via tunnel on Windows:

```powershell
cd my-app
npm run start:gujjutours -- --tunnel
```
*Scan terminal QR code with your iPhone Camera app.*

### Verification Checklist:

- [ ] **1. Dynamic Island & Notch Safe Area:**
  - Verify the top navigation bar does NOT collide with the Dynamic Island (iPhone 14 Pro / 15 / 16) or notch (iPhone 11 / 12 / 13).
  - Status bar icons (time, battery, Wi-Fi) maintain high contrast against screen background.
- [ ] **2. Home Indicator Clearance:**
  - Verify bottom navigation bar has proper clearance above the black/white iOS Home Indicator bar.
  - Tab buttons are fully tap-responsive and do not trigger accidental iOS app-switcher gestures.
- [ ] **3. Keyboard Avoidance in Forms:**
  - Open **Profile** → **Sign In** (or **Register**).
  - Tap into Email and Password input fields.
  - Verify screen pans up smoothly (`KeyboardAvoidingView` with iOS padding), keeping both the inputs and the submit button fully visible above the software keyboard.
  - Tapping outside the input field cleanly dismisses the keyboard.
- [ ] **4. Apple Guideline 5.1.1(v) In-App Account Deletion:**
  - In **Profile**, scroll to bottom: verify **Delete Account** button (`btn-delete-account`) is present.
  - Tap **Delete Account**: verify native iOS Alert dialog appears warning of permanent data loss.
  - Confirm: verify local storage is wiped, session is terminated, and app redirects to guest state.
- [ ] **5. Zero Google Play / Android Mentions (Guideline 2.3.10):**
  - Verify no UI copy mentions "Android APK", "Google Play Store", or Android-specific back buttons.
  - Native iOS back chevron (`arrow-back`) is used consistently.
- [ ] **6. Multi-Currency & Language Switching:**
  - In **Profile**, change Currency to **EUR (€)** or **INR (₹)**: verify catalog prices update instantly.
  - Change Language: verify translated labels update without app restart.

---

## Section 4: Store Submission Commands & Artifacts

### A. Android Release Build (Google Play Console)
```powershell
cd my-app

# 1. Build Android App Bundle (.aab) for Gujju Tours
eas build --platform android --profile production:gujjutours

# 2. Build Android App Bundle (.aab) for TripGo Asia
eas build --platform android --profile production:tripgoasia

# 3. Build Android App Bundle (.aab) for Technoheaven
eas build --platform android --profile production:technoheaven
```
- Upload the generated `.aab` file to **Google Play Console** -> **Production** or **Open Testing**.

---

### B. iOS Release Build (Apple App Store Connect)
```powershell
cd my-app

# 1. Build iOS Production Binary for Gujju Tours
eas build --platform ios --profile production:gujjutours

# 2. Submit directly to App Store Connect / TestFlight
eas submit --platform ios --profile production:gujjutours
```
- In **App Store Connect**, paste the reviewer credentials and Guideline 3.1.5(a) exemption notes from [`STORE_METADATA.md`](file:///c:/Users/Charmi/prince/toursapp/STORE_METADATA.md#3-apple-reviewer-notes--exemption-statements).

