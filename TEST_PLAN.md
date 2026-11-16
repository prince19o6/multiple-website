# Comprehensive Test Plan & Architecture Inventory

**Date Generated:** 2026-10-30  
**Multi-Website Platforms Covered:**
- **Gujju Tours** (`gujjutours` / `www.gujjutours.com`)
- **TripGo Asia** (`tripgoasia` / `www.tripgoasia.com`)
- **Technoheaven** (`technoheaven` / `stagingb2b.technoheaven.com`)  
**Operating Environments:** Android (Expo Go / APK), iOS (Expo Go / Simulator / IPA), Web (Next.js 15), Backend (ASP.NET Core 9 / MongoDB Atlas).

---

## 1. Executive Summary & Quality Metrics

| Metric | Measured Value | Quality Standard / Target | Status |
| :--- | :---: | :---: | :---: |
| **Total Test Inventory Items** | **378** | 100% itemized tracking | ✅ Captured |
| **Mobile Screens & Routes** | **55** | 100% screen render testing | ✅ Inventoried |
| **Mobile App Components** | **164** | Unit + 4 states (Loading/Empty/Error/Populated) | ✅ Inventoried |
| **Backend API Endpoints** | **144** | Tenant isolation + Auth + DTO validation | ✅ Inventoried |
| **Web Critical Routes** | **15** | HTTP 200 + E2E Journey | ✅ Inventoried |
| **Total Pressables Analyzed** | **909** | All pressables with testID & a11y | ⚠️ Action Required |
| **Pressables Missing `testID`** | **908** (99.9%) | 0% (Must be 100% selectable by Maestro/RNTL) | 🚨 High Gap |
| **Pressables Missing `accessibilityLabel`** | **753** (82.8%) | 0% (Apple App Store Guideline 2.1 & 4.2) | 🚨 High Gap |
| **Truly Dead / Non-Functional Buttons** | **6** | 0% (Zero dead buttons allowed in store builds) | 🛑 Blocker Gap |
| **API Endpoints Missing in Backend** | **1** (`/api/bargain/data`) | 0% (Exact route agreement required) | 🛑 Blocker Gap |

---

## 2. Critical Coverage Gaps & Blocker Defects

### 2.1 Blocker Defect: Dead Buttons (Zero Handler / Unresponsive Controls)
The static AST/JSX parser identified **6 pressable elements** that have no `onPress` handler or have empty no-ops. These violate Apple App Review Guideline 2.1 ("App Completeness"):

| File | Line | Element | Impact |
| :--- | :---: | :---: | :--- |
| `my-app/app/(admin)/bookings.tsx` | 392 | `<TouchableOpacity>` | Admin booking status filter tabs cannot be tapped/switched. |
| `my-app/app/(tabs)/explore.tsx` | 629 | `<TouchableOpacity>` | Explore search filter badge pill is completely unclickable. |
| `my-app/app/search-results.tsx` | 338 | `<TouchableOpacity>` | Search results filter modal trigger button has no `onPress`. |
| `my-app/components/home/TravelHubModal.tsx` | 254 | `<TouchableWithoutFeedback>` | Travel hub modal dismiss / backdrop tap has no handler. |
| `my-app/components/SiteSwitcherModal.tsx` | 61 | `<TouchableOpacity>` | Modal card container intercepts touch events without action. |
| `my-app/components/TipCalculatorModal.tsx` | 212 | `<TouchableOpacity>` | Bill split step decrement button has no click handler. |

### 2.2 Blocker Defect: API Route Discrepancy
- **Endpoint called in App:** `GET /api/bargain/data` (`fetchBargainHubData` in `my-app/services/api.ts`)
- **Endpoint implemented in Backend:** `GET /api/bargain/hub` (`BargainController.cs:43`)
- **Root Cause:** Path mismatch between `/data` and `/hub`. Causes runtime HTTP 404 in Bargain Assistant screen.
- **Fix Required:** Update `my-app/services/api.ts` to call `/api/bargain/hub` (or add an alias attribute `[HttpGet("data")]` in `BargainController.cs`).

### 2.3 Quality Gate Gap: `testID` and `accessibilityLabel` Coverage
- **`testID` Coverage:** Only **1 of 909** pressables has a `testID` (0.1% coverage). Automated E2E testing with Maestro requires deterministic `testID` locators to run reliably across different screen sizes, languages, and websites.
- **`accessibilityLabel` Coverage:** **753 pressables** lack VoiceOver / TalkBack labels, causing Apple App Store review rejection under Accessibility standards.

---

## 3. Complete Test Inventory Table

```
ID | Type | Name | Path | Depends on API | Platforms | Test type planned | Status
```

| ID | Type | Name | Path | Depends on API | Platforms | Test type planned | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| SCR-0001 | Screen / Route | `/(admin)/analytics` | `my-app/app/(admin)/analytics.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0002 | Screen / Route | `/(admin)/bookings` | `my-app/app/(admin)/bookings.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0003 | Screen / Route | `/(admin)/index` | `my-app/app/(admin)/index.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0004 | Screen / Route | `/(admin)/login` | `my-app/app/(admin)/login.tsx` | Yes | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0005 | Screen / Route | `/(admin)/tours` | `my-app/app/(admin)/tours.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0006 | Screen / Route | `/(admin)/users` | `my-app/app/(admin)/users.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0007 | Screen / Route | `/(auth)/login` | `my-app/app/(auth)/login.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0008 | Screen / Route | `/(auth)/onboarding` | `my-app/app/(auth)/onboarding.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0009 | Screen / Route | `/(auth)/register` | `my-app/app/(auth)/register.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0010 | Screen / Route | `/(auth)/reset-password` | `my-app/app/(auth)/reset-password.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0011 | Screen / Route | `/(tabs)/bookings` | `my-app/app/(tabs)/bookings.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0012 | Screen / Route | `/(tabs)/explore` | `my-app/app/(tabs)/explore.tsx` | Yes | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0013 | Screen / Route | `/(tabs)/index` | `my-app/app/(tabs)/index.tsx` | Yes | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0014 | Screen / Route | `/(tabs)/profile` | `my-app/app/(tabs)/profile.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0015 | Screen / Route | `/(tabs)/wishlist` | `my-app/app/(tabs)/wishlist.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0016 | Screen / Route | `/+not-found` | `my-app/app/+not-found.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0017 | Screen / Route | `/about` | `my-app/app/about.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0018 | Screen / Route | `/airport-transfer` | `my-app/app/airport-transfer.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0019 | Screen / Route | `/audio-guide` | `my-app/app/audio-guide.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0020 | Screen / Route | `/baggage-calculator` | `my-app/app/baggage-calculator.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0021 | Screen / Route | `/bargain-assistant` | `my-app/app/bargain-assistant.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0022 | Screen / Route | `/booking/[id]` | `my-app/app/booking/[id].tsx` | Yes | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0023 | Screen / Route | `/category/[slug]` | `my-app/app/category/[slug].tsx` | Yes | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0024 | Screen / Route | `/contact` | `my-app/app/contact.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0025 | Screen / Route | `/culinary-guide` | `my-app/app/culinary-guide.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0026 | Screen / Route | `/culture-etiquette` | `my-app/app/culture-etiquette.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0027 | Screen / Route | `/day-cockpit` | `my-app/app/day-cockpit.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0028 | Screen / Route | `/destinations` | `my-app/app/destinations.tsx` | Yes | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0029 | Screen / Route | `/drive-safety` | `my-app/app/drive-safety.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0030 | Screen / Route | `/eco-travel` | `my-app/app/eco-travel.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0031 | Screen / Route | `/esim-roaming` | `my-app/app/esim-roaming.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0032 | Screen / Route | `/featured-tours` | `my-app/app/featured-tours.tsx` | Yes | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0033 | Screen / Route | `/forex-radar` | `my-app/app/forex-radar.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0034 | Screen / Route | `/group-planning` | `my-app/app/group-planning.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0035 | Screen / Route | `/index` | `my-app/app/index.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0036 | Screen / Route | `/insurance` | `my-app/app/insurance.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0037 | Screen / Route | `/map-explorer` | `my-app/app/map-explorer.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0038 | Screen / Route | `/not-allowed` | `my-app/app/not-allowed.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0039 | Screen / Route | `/passport` | `my-app/app/passport.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0040 | Screen / Route | `/pharmacy-guide` | `my-app/app/pharmacy-guide.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0041 | Screen / Route | `/phrasebook` | `my-app/app/phrasebook.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0042 | Screen / Route | `/power-guide` | `my-app/app/power-guide.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0043 | Screen / Route | `/search-results` | `my-app/app/search-results.tsx` | Yes | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0044 | Screen / Route | `/site-switcher` | `my-app/app/site-switcher.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0045 | Screen / Route | `/special-offers` | `my-app/app/special-offers.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0046 | Screen / Route | `/tax-refund` | `my-app/app/tax-refund.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0047 | Screen / Route | `/tipping-guide` | `my-app/app/tipping-guide.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0048 | Screen / Route | `/tour/[id]` | `my-app/app/tour/[id].tsx` | Yes | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0049 | Screen / Route | `/transit-guide` | `my-app/app/transit-guide.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0050 | Screen / Route | `/travel-journal` | `my-app/app/travel-journal.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0051 | Screen / Route | `/travel-vault` | `my-app/app/travel-vault.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0052 | Screen / Route | `/travel-wrapped` | `my-app/app/travel-wrapped.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0053 | Screen / Route | `/trip-budget` | `my-app/app/trip-budget.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0054 | Screen / Route | `/visa-hub` | `my-app/app/visa-hub.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| SCR-0055 | Screen / Route | `/weather-forecast` | `my-app/app/weather-forecast.tsx` | No | Android, iOS | Component + RNTL + Maestro E2E | Pending Test |
| CMP-0056 | App Component | `AddExpenseModal` | `my-app/components/AddExpenseModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0057 | App Component | `AddTaxReceiptModal` | `my-app/components/AddTaxReceiptModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0058 | App Component | `AdventureTourCard` | `my-app/components/AdventureTourCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0059 | App Component | `AirportKioskGuideModal` | `my-app/components/AirportKioskGuideModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0060 | App Component | `AirportTransferCard` | `my-app/components/AirportTransferCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0061 | App Component | `AirportWifiModal` | `my-app/components/AirportWifiModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0062 | App Component | `ApplianceSafetyModal` | `my-app/components/ApplianceSafetyModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0063 | App Component | `ArrivalCardGuideModal` | `my-app/components/ArrivalCardGuideModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0064 | App Component | `AtmDccShieldCard` | `my-app/components/AtmDccShieldCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0065 | App Component | `AudioMiniPlayer` | `my-app/components/AudioMiniPlayer.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0066 | App Component | `AudioPlayerModal` | `my-app/components/AudioPlayerModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0067 | App Component | `BaggageAllowanceCard` | `my-app/components/BaggageAllowanceCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0068 | App Component | `BaggageCalculatorModal` | `my-app/components/BaggageCalculatorModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0069 | App Component | `BaggageHeroCard` | `my-app/components/BaggageHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0070 | App Component | `BargainHeroCard` | `my-app/components/BargainHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0071 | App Component | `BargainSavingsLogModal` | `my-app/components/BargainSavingsLogModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0072 | App Component | `BootstrapErrorScreen` | `my-app/components/BootstrapErrorScreen.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0073 | App Component | `CarbonCalculatorModal` | `my-app/components/CarbonCalculatorModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0074 | App Component | `CarbonGaugeCard` | `my-app/components/CarbonGaugeCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0075 | App Component | `ChauffeurPlacardModal` | `my-app/components/ChauffeurPlacardModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0076 | App Component | `ClaimAssistanceModal` | `my-app/components/ClaimAssistanceModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0077 | App Component | `AppHeader` | `my-app/components/common/AppHeader.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0078 | App Component | `BrandLogo` | `my-app/components/common/BrandLogo.tsx` | Yes | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0079 | App Component | `MobileEnquirySheet` | `my-app/components/common/MobileEnquirySheet.tsx` | Yes | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0080 | App Component | `MobileFloatingWhatsApp` | `my-app/components/common/MobileFloatingWhatsApp.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0081 | App Component | `ConciergeChatModal` | `my-app/components/ConciergeChatModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0082 | App Component | `ConciergeFloatingPill` | `my-app/components/ConciergeFloatingPill.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0083 | App Component | `ConsularEmergencyCard` | `my-app/components/ConsularEmergencyCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0084 | App Component | `CounterOfferCalculatorCard` | `my-app/components/CounterOfferCalculatorCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0085 | App Component | `CouponSelectionModal` | `my-app/components/CouponSelectionModal.tsx` | Yes | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0086 | App Component | `CulinaryHighlightCard` | `my-app/components/CulinaryHighlightCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0087 | App Component | `CulturalEtiquetteCard` | `my-app/components/CulturalEtiquetteCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0088 | App Component | `CultureHeroCard` | `my-app/components/CultureHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0089 | App Component | `CurrencyModal` | `my-app/components/CurrencyModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0090 | App Component | `CustomsAllowanceSheet` | `my-app/components/CustomsAllowanceSheet.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0091 | App Component | `DayOfCockpitCard` | `my-app/components/DayOfCockpitCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0092 | App Component | `DevBanner` | `my-app/components/DevBanner.tsx` | Yes | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0093 | App Component | `DigitalBoardingPassModal` | `my-app/components/DigitalBoardingPassModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0094 | App Component | `DressCodeCheckerModal` | `my-app/components/DressCodeCheckerModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0095 | App Component | `DriveRuleCard` | `my-app/components/DriveRuleCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0096 | App Component | `DriveSafetyHeroCard` | `my-app/components/DriveSafetyHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0097 | App Component | `DynamicFontLoader` | `my-app/components/DynamicFontLoader.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0098 | App Component | `DynamicLogo` | `my-app/components/DynamicLogo.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0099 | App Component | `DynamicRenderer` | `my-app/components/DynamicRenderer.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0100 | App Component | `EcoCertificateModal` | `my-app/components/EcoCertificateModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0101 | App Component | `EcoHeroCard` | `my-app/components/EcoHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0102 | App Component | `EmergencySosModal` | `my-app/components/EmergencySosModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0103 | App Component | `EmptyState` | `my-app/components/EmptyState.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0104 | App Component | `EnvErrorScreen` | `my-app/components/EnvErrorScreen.tsx` | Yes | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0105 | App Component | `ErrorScreen` | `my-app/components/ErrorScreen.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0106 | App Component | `EsimActiveCard` | `my-app/components/EsimActiveCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0107 | App Component | `EsimHeroCard` | `my-app/components/EsimHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0108 | App Component | `EsimPackageCard` | `my-app/components/EsimPackageCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0109 | App Component | `EsimQrModal` | `my-app/components/EsimQrModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0110 | App Component | `EsimTopUpModal` | `my-app/components/EsimTopUpModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0111 | App Component | `ExpeditionCertificateModal` | `my-app/components/ExpeditionCertificateModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0112 | App Component | `ExpeditionHeroCard` | `my-app/components/ExpeditionHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0113 | App Component | `ExpeditionMapView` | `my-app/components/ExpeditionMapView.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0114 | App Component | `ExpeditionWrappedHeroCard` | `my-app/components/ExpeditionWrappedHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0115 | App Component | `FilterModal` | `my-app/components/FilterModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0116 | App Component | `FlightStatusCard` | `my-app/components/FlightStatusCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0117 | App Component | `Footer` | `my-app/components/Footer.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0118 | App Component | `ForexCalculatorModal` | `my-app/components/ForexCalculatorModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0119 | App Component | `ForexKioskCard` | `my-app/components/ForexKioskCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0120 | App Component | `ForexRadarHeroCard` | `my-app/components/ForexRadarHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0121 | App Component | `ForexRateTableCard` | `my-app/components/ForexRateTableCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0122 | App Component | `GalleryLightbox` | `my-app/components/GalleryLightbox.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0123 | App Component | `GroupPollCard` | `my-app/components/GroupPollCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0124 | App Component | `GroupTripCard` | `my-app/components/GroupTripCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0125 | App Component | `AboutUsHomeSection` | `my-app/components/home/AboutUsHomeSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0126 | App Component | `CollapsibleSection` | `my-app/components/home/CollapsibleSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0127 | App Component | `GujjuFlightHeroSearch` | `my-app/components/home/GujjuFlightHeroSearch.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0128 | App Component | `HorizontalList` | `my-app/components/home/HorizontalList.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0129 | App Component | `MobileCityStaysSection` | `my-app/components/home/MobileCityStaysSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0130 | App Component | `MobileCuratedPackagesSection` | `my-app/components/home/MobileCuratedPackagesSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0131 | App Component | `MobilePerfectStaysSection` | `my-app/components/home/MobilePerfectStaysSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0132 | App Component | `MobilePromoCarousel` | `my-app/components/home/MobilePromoCarousel.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0133 | App Component | `MobileSearchWidget` | `my-app/components/home/MobileSearchWidget.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0134 | App Component | `QuickActionsGrid` | `my-app/components/home/QuickActionsGrid.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0135 | App Component | `RecentlyViewedSection` | `my-app/components/home/RecentlyViewedSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0136 | App Component | `SectionHeader` | `my-app/components/home/SectionHeader.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0137 | App Component | `SectionSkeleton` | `my-app/components/home/SectionSkeleton.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0138 | App Component | `ServiceTabsGrid` | `my-app/components/home/ServiceTabsGrid.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0139 | App Component | `SpecialOffersSection` | `my-app/components/home/SpecialOffersSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0140 | App Component | `TravelGuidesCards` | `my-app/components/home/TravelGuidesCards.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0141 | App Component | `TravelHubModal` | `my-app/components/home/TravelHubModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0142 | App Component | `ViewMoreButton` | `my-app/components/home/ViewMoreButton.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0143 | App Component | `HospitalNetworkCard` | `my-app/components/HospitalNetworkCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0144 | App Component | `InsuranceHeroCard` | `my-app/components/InsuranceHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0145 | App Component | `JournalEntryCard` | `my-app/components/JournalEntryCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0146 | App Component | `JournalHeroCard` | `my-app/components/JournalHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0147 | App Component | `LandmarkCard` | `my-app/components/LandmarkCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0148 | App Component | `LandmarkDetailsSheet` | `my-app/components/LandmarkDetailsSheet.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0149 | App Component | `LanguageModal` | `my-app/components/LanguageModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0150 | App Component | `LoyaltyTierProgressCard` | `my-app/components/LoyaltyTierProgressCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0151 | App Component | `LuxuryTourCard` | `my-app/components/LuxuryTourCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0152 | App Component | `MarketDirectoryCard` | `my-app/components/MarketDirectoryCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0153 | App Component | `MedicationCustomsSheet` | `my-app/components/MedicationCustomsSheet.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0154 | App Component | `MedicineCard` | `my-app/components/MedicineCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0155 | App Component | `Navbar` | `my-app/components/Navbar.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0156 | App Component | `NavDrawer` | `my-app/components/NavDrawer.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0157 | App Component | `CustomTabBar` | `my-app/components/navigation/CustomTabBar.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0158 | App Component | `NavItem` | `my-app/components/NavItem.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0159 | App Component | `NotificationCenterModal` | `my-app/components/NotificationCenterModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0160 | App Component | `OfflineBanner` | `my-app/components/OfflineBanner.tsx` | Yes | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0161 | App Component | `OffsetProjectCard` | `my-app/components/OffsetProjectCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0162 | App Component | `PassportValidityCheckerModal` | `my-app/components/PassportValidityCheckerModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0163 | App Component | `PharmacyDirectoryCard` | `my-app/components/PharmacyDirectoryCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0164 | App Component | `PharmacyHeroCard` | `my-app/components/PharmacyHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0165 | App Component | `PhrasebookCard` | `my-app/components/PhrasebookCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0166 | App Component | `PhraseCard` | `my-app/components/PhraseCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0167 | App Component | `PolicyCard` | `my-app/components/PolicyCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0168 | App Component | `PowerBankKioskCard` | `my-app/components/PowerBankKioskCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0169 | App Component | `PowerHeroCard` | `my-app/components/PowerHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0170 | App Component | `PowerSocketVisualizerCard` | `my-app/components/PowerSocketVisualizerCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0171 | App Component | `PreRideInspectionModal` | `my-app/components/PreRideInspectionModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0172 | App Component | `AppearanceSection` | `my-app/components/profile/AppearanceSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0173 | App Component | `ProhibitedItemsSheet` | `my-app/components/ProhibitedItemsSheet.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0174 | App Component | `RentalScamChecklistCard` | `my-app/components/RentalScamChecklistCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0175 | App Component | `ReviewBoostModal` | `my-app/components/ReviewBoostModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0176 | App Component | `ReviewModal` | `my-app/components/ReviewModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0177 | App Component | `RewardVoucherCard` | `my-app/components/RewardVoucherCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0178 | App Component | `SacredSiteDressCard` | `my-app/components/SacredSiteDressCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0179 | App Component | `ScreenTorchModal` | `my-app/components/ScreenTorchModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0180 | App Component | `ActivitiesSection` | `my-app/components/sections/ActivitiesSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0181 | App Component | `CtaSection` | `my-app/components/sections/CtaSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0182 | App Component | `DestinationsSection` | `my-app/components/sections/DestinationsSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0183 | App Component | `DifficultySection` | `my-app/components/sections/DifficultySection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0184 | App Component | `FeaturedToursSection` | `my-app/components/sections/FeaturedToursSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0185 | App Component | `HeroSection` | `my-app/components/sections/HeroSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0186 | App Component | `OffersSection` | `my-app/components/sections/OffersSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0187 | App Component | `PackagesSection` | `my-app/components/sections/PackagesSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0188 | App Component | `StatsSection` | `my-app/components/sections/StatsSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0189 | App Component | `TestimonialsSection` | `my-app/components/sections/TestimonialsSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0190 | App Component | `WhyChooseUsSection` | `my-app/components/sections/WhyChooseUsSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0191 | App Component | `SetBudgetModal` | `my-app/components/SetBudgetModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0192 | App Component | `ShowPharmacistModal` | `my-app/components/ShowPharmacistModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0193 | App Component | `ShowToLocalModal` | `my-app/components/ShowToLocalModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0194 | App Component | `SimilarToursSection` | `my-app/components/SimilarToursSection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0195 | App Component | `SiteSwitcherFab` | `my-app/components/SiteSwitcherFab.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0196 | App Component | `SiteSwitcherModal` | `my-app/components/SiteSwitcherModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0197 | App Component | `SkeletonLoader` | `my-app/components/SkeletonLoader.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0198 | App Component | `StampModal` | `my-app/components/StampModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0199 | App Component | `StoryReelCard` | `my-app/components/StoryReelCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0200 | App Component | `TableReservationModal` | `my-app/components/TableReservationModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0201 | App Component | `TaxiMeterShieldModal` | `my-app/components/TaxiMeterShieldModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0202 | App Component | `TaxReceiptCard` | `my-app/components/TaxReceiptCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0203 | App Component | `TaxRefundHeroCard` | `my-app/components/TaxRefundHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0204 | App Component | `TipCalculatorModal` | `my-app/components/TipCalculatorModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0205 | App Component | `TippingCategoryCard` | `my-app/components/TippingCategoryCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0206 | App Component | `TippingHeroCard` | `my-app/components/TippingHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0207 | App Component | `TourCard` | `my-app/components/TourCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0208 | App Component | `TourCardHorizontal` | `my-app/components/TourCardHorizontal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0209 | App Component | `TourItinerarySection` | `my-app/components/TourItinerarySection.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0210 | App Component | `TransitHeroCard` | `my-app/components/TransitHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0211 | App Component | `TransitLineCard` | `my-app/components/TransitLineCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0212 | App Component | `TransitRouteCard` | `my-app/components/TransitRouteCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0213 | App Component | `TravelWrappedStoryCard` | `my-app/components/TravelWrappedStoryCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0214 | App Component | `UpcomingTripCountdown` | `my-app/components/UpcomingTripCountdown.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0215 | App Component | `VaultAddDocumentModal` | `my-app/components/VaultAddDocumentModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0216 | App Component | `VendorFlashcardModal` | `my-app/components/VendorFlashcardModal.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0217 | App Component | `VisaHeroCard` | `my-app/components/VisaHeroCard.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0218 | App Component | `VisaStatusBadge` | `my-app/components/VisaStatusBadge.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| CMP-0219 | App Component | `WeatherWidget` | `my-app/components/WeatherWidget.tsx` | No | Android, iOS | Unit + Snapshot + State Matrix (Loading/Empty/Error/Populated) | Pending Test |
| API-0220 | Backend Endpoint | `GET /api/admin/stats` | `backend/toursApi/controllers/AdminController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0221 | Backend Endpoint | `GET /api/admin/analytics` | `backend/toursApi/controllers/AdminController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0222 | Backend Endpoint | `POST /api/admin/seed-admin` | `backend/toursApi/controllers/AdminController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0223 | Backend Endpoint | `POST /api/admin/create-admin` | `backend/toursApi/controllers/AdminController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0224 | Backend Endpoint | `POST /api/admin/migrate-from-tours70` | `backend/toursApi/controllers/AdminController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0225 | Backend Endpoint | `GET /api/audioguide/stories` | `backend/toursApi/controllers/AudioGuideController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0226 | Backend Endpoint | `POST /api/audioguide/listen/{id}` | `backend/toursApi/controllers/AudioGuideController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0227 | Backend Endpoint | `POST /api/auth/register` | `backend/toursApi/controllers/AuthController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0228 | Backend Endpoint | `POST /api/auth/login` | `backend/toursApi/controllers/AuthController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0229 | Backend Endpoint | `POST /api/auth/refresh` | `backend/toursApi/controllers/AuthController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0230 | Backend Endpoint | `POST /api/auth/logout` | `backend/toursApi/controllers/AuthController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0231 | Backend Endpoint | `POST /api/auth/forgot-password` | `backend/toursApi/controllers/AuthController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0232 | Backend Endpoint | `POST /api/auth/reset-password` | `backend/toursApi/controllers/AuthController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0233 | Backend Endpoint | `GET /api/auth/me` | `backend/toursApi/controllers/AuthController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0234 | Backend Endpoint | `POST /api/auth/dev-reset-lockout` | `backend/toursApi/controllers/AuthController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0235 | Backend Endpoint | `POST /api/auth/dev-reset-ratelimit` | `backend/toursApi/controllers/AuthController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0236 | Backend Endpoint | `GET /api/baggage/hub` | `backend/toursApi/controllers/BaggageController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0237 | Backend Endpoint | `POST /api/baggage/calculate-excess` | `backend/toursApi/controllers/BaggageController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0238 | Backend Endpoint | `GET /api/bargain/hub` | `backend/toursApi/controllers/BargainController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0239 | Backend Endpoint | `GET /api/bookings/inbox/counts` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0240 | Backend Endpoint | `GET /api/bookings` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0241 | Backend Endpoint | `GET /api/bookings/{id}` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0242 | Backend Endpoint | `POST /api/bookings` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0243 | Backend Endpoint | `POST /api/bookings/{id}/confirm` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0244 | Backend Endpoint | `POST /api/bookings/{id}/reject` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0245 | Backend Endpoint | `POST /api/bookings/{id}/cancel` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0246 | Backend Endpoint | `POST /api/bookings/bulk-confirm` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0247 | Backend Endpoint | `POST /api/bookings/bulk-reject` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0248 | Backend Endpoint | `POST /api/bookings/{id}/resend-email` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0249 | Backend Endpoint | `POST /api/bookings/{id}/request-cancellation` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0250 | Backend Endpoint | `POST /api/bookings/{id}/review-cancellation` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0251 | Backend Endpoint | `GET /api/bookings/action-token/verify` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0252 | Backend Endpoint | `POST /api/bookings/action-token/execute` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0253 | Backend Endpoint | `GET /api/bookings/{id}/outbox` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0254 | Backend Endpoint | `POST /api/bookings/lookup` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0255 | Backend Endpoint | `GET /api/bookings/lookup` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0256 | Backend Endpoint | `POST /api/bookings/validate-coupon` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0257 | Backend Endpoint | `POST /api/bookings/claim` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0258 | Backend Endpoint | `POST /api/bookings/{id}/pay` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0259 | Backend Endpoint | `DELETE /api/bookings/{id}` | `backend/toursApi/controllers/BookingsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0260 | Backend Endpoint | `GET /api/budget/guide` | `backend/toursApi/controllers/BudgetController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0261 | Backend Endpoint | `POST /api/budget/sync` | `backend/toursApi/controllers/BudgetController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0262 | Backend Endpoint | `GET /api/concierge/specialist` | `backend/toursApi/controllers/ConciergeController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0263 | Backend Endpoint | `POST /api/concierge/inquire` | `backend/toursApi/controllers/ConciergeController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0264 | Backend Endpoint | `GET /api/core/v1/config` | `backend/toursApi/controllers/ConfigController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0265 | Backend Endpoint | `GET /api/core/v1/config/{hostname}` | `backend/toursApi/controllers/ConfigController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0266 | Backend Endpoint | `PUT /api/core/v1/config` | `backend/toursApi/controllers/ConfigController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0267 | Backend Endpoint | `PUT /api/core/v1/config/{hostname}` | `backend/toursApi/controllers/ConfigController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0268 | Backend Endpoint | `GET /api/culinary/trail` | `backend/toursApi/controllers/CulinaryController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0269 | Backend Endpoint | `GET /api/culinary/destinations` | `backend/toursApi/controllers/CulinaryController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0270 | Backend Endpoint | `POST /api/culinary/reserve` | `backend/toursApi/controllers/CulinaryController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0271 | Backend Endpoint | `GET /api/culture/hub` | `backend/toursApi/controllers/CultureController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0272 | Backend Endpoint | `POST /api/culture/check-outfit` | `backend/toursApi/controllers/CultureController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0273 | Backend Endpoint | `GET /api/culture/etiquette` | `backend/toursApi/controllers/CultureController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0274 | Backend Endpoint | `GET /api/dispatch/today` | `backend/toursApi/controllers/DayOfDispatchController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0275 | Backend Endpoint | `POST /api/dispatch/announcement` | `backend/toursApi/controllers/DayOfDispatchController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0276 | Backend Endpoint | `GET /api/health/db` | `backend/toursApi/controllers/DbHealthController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0277 | Backend Endpoint | `GET /api/destinations` | `backend/toursApi/controllers/DestinationsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0278 | Backend Endpoint | `GET /api/destinations/landmarks` | `backend/toursApi/controllers/DestinationsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0279 | Backend Endpoint | `GET /api/destinations/landmarks/{id}` | `backend/toursApi/controllers/DestinationsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0280 | Backend Endpoint | `POST /api/destinations` | `backend/toursApi/controllers/DestinationsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0281 | Backend Endpoint | `PUT /api/destinations/{id}` | `backend/toursApi/controllers/DestinationsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0282 | Backend Endpoint | `DELETE /api/destinations/{id}` | `backend/toursApi/controllers/DestinationsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0283 | Backend Endpoint | `GET /api/drive-safety/hub` | `backend/toursApi/controllers/DriveSafetyController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0284 | Backend Endpoint | `GET /api/drive-safety/rules` | `backend/toursApi/controllers/DriveSafetyController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0285 | Backend Endpoint | `GET /api/eco/hub` | `backend/toursApi/controllers/EcoController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0286 | Backend Endpoint | `POST /api/eco/calculate` | `backend/toursApi/controllers/EcoController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0287 | Backend Endpoint | `POST /api/eco/offset` | `backend/toursApi/controllers/EcoController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0288 | Backend Endpoint | `POST /api/eco/pledge` | `backend/toursApi/controllers/EcoController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0289 | Backend Endpoint | `GET /api/emergency/contacts` | `backend/toursApi/controllers/EmergencyController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0290 | Backend Endpoint | `GET /api/esim/hub` | `backend/toursApi/controllers/EsimController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0291 | Backend Endpoint | `POST /api/esim/activate` | `backend/toursApi/controllers/EsimController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0292 | Backend Endpoint | `POST /api/esim/topup` | `backend/toursApi/controllers/EsimController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0293 | Backend Endpoint | `GET /api/expedition-summary/hub` | `backend/toursApi/controllers/ExpeditionSummaryController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0294 | Backend Endpoint | `GET /api/expedition-summary/wrapped` | `backend/toursApi/controllers/ExpeditionSummaryController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0295 | Backend Endpoint | `GET /api/expedition-summary/loyalty` | `backend/toursApi/controllers/ExpeditionSummaryController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0296 | Backend Endpoint | `POST /api/expedition-summary/claim-reward` | `backend/toursApi/controllers/ExpeditionSummaryController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0297 | Backend Endpoint | `POST /api/expedition-summary/review-boost` | `backend/toursApi/controllers/ExpeditionSummaryController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0298 | Backend Endpoint | `GET /api/expedition-summary/certificate` | `backend/toursApi/controllers/ExpeditionSummaryController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0299 | Backend Endpoint | `GET /api/transfers/active` | `backend/toursApi/controllers/FlightTransferController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0300 | Backend Endpoint | `POST /api/transfers/status` | `backend/toursApi/controllers/FlightTransferController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0301 | Backend Endpoint | `GET /api/forex/radar` | `backend/toursApi/controllers/ForexRadarController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0302 | Backend Endpoint | `GET /api/forex/kiosks` | `backend/toursApi/controllers/ForexRadarController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0303 | Backend Endpoint | `GET /api/groups/active` | `backend/toursApi/controllers/GroupTripController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0304 | Backend Endpoint | `POST /api/groups/polls/vote` | `backend/toursApi/controllers/GroupTripController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0305 | Backend Endpoint | `POST /api/groups/gear` | `backend/toursApi/controllers/GroupTripController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0306 | Backend Endpoint | `GET /api/insurance/policy` | `backend/toursApi/controllers/InsuranceController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0307 | Backend Endpoint | `GET /api/insurance/hospitals` | `backend/toursApi/controllers/InsuranceController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0308 | Backend Endpoint | `POST /api/insurance/claim-inquiry` | `backend/toursApi/controllers/InsuranceController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0309 | Backend Endpoint | `GET /api/journal/scrapbook` | `backend/toursApi/controllers/JournalController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0310 | Backend Endpoint | `POST /api/journal/entry` | `backend/toursApi/controllers/JournalController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0311 | Backend Endpoint | `GET /api/notifications` | `backend/toursApi/controllers/NotificationsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0312 | Backend Endpoint | `GET /api/notifications/unread-count` | `backend/toursApi/controllers/NotificationsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0313 | Backend Endpoint | `PATCH /api/notifications/{id}/read` | `backend/toursApi/controllers/NotificationsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0314 | Backend Endpoint | `POST /api/notifications/read-all` | `backend/toursApi/controllers/NotificationsController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0315 | Backend Endpoint | `GET /api/passport/profile` | `backend/toursApi/controllers/PassportController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0316 | Backend Endpoint | `POST /api/passport/claim-stamp` | `backend/toursApi/controllers/PassportController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0317 | Backend Endpoint | `POST /api/passport/claim-challenge` | `backend/toursApi/controllers/PassportController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0318 | Backend Endpoint | `GET /api/pharmacy/hub` | `backend/toursApi/controllers/PharmacyController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0319 | Backend Endpoint | `GET /api/pharmacy/search` | `backend/toursApi/controllers/PharmacyController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0320 | Backend Endpoint | `GET /api/phrasebook` | `backend/toursApi/controllers/PhrasebookController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0321 | Backend Endpoint | `GET /api/power/hub` | `backend/toursApi/controllers/PowerController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0322 | Backend Endpoint | `POST /api/power/check-appliance` | `backend/toursApi/controllers/PowerController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0323 | Backend Endpoint | `POST /api/seed` | `backend/toursApi/controllers/SeedController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0324 | Backend Endpoint | `GET /api/seedcontroller.tools/status` | `backend/toursApi/controllers/SeedController.Tools.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0325 | Backend Endpoint | `GET /api/seedcontroller.tools/bookings` | `backend/toursApi/controllers/SeedController.Tools.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0326 | Backend Endpoint | `POST /api/seedcontroller.tools/tours` | `backend/toursApi/controllers/SeedController.Tools.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0327 | Backend Endpoint | `GET /api/seedcontroller.tools/category-counts` | `backend/toursApi/controllers/SeedController.Tools.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0328 | Backend Endpoint | `POST /api/seedcontroller.tools/admin` | `backend/toursApi/controllers/SeedController.Tools.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0329 | Backend Endpoint | `POST /api/seedcontroller.tools/destinations` | `backend/toursApi/controllers/SeedController.Tools.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0330 | Backend Endpoint | `GET /api/tax-refund/rules` | `backend/toursApi/controllers/TaxRefundController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0331 | Backend Endpoint | `GET /api/tax-refund/allowances` | `backend/toursApi/controllers/TaxRefundController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0332 | Backend Endpoint | `GET /api/tax-refund/claims` | `backend/toursApi/controllers/TaxRefundController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0333 | Backend Endpoint | `POST /api/tax-refund/claims` | `backend/toursApi/controllers/TaxRefundController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0334 | Backend Endpoint | `PUT /api/tax-refund/claims/{claimId}/status` | `backend/toursApi/controllers/TaxRefundController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0335 | Backend Endpoint | `DELETE /api/tax-refund/claims/{claimId}` | `backend/toursApi/controllers/TaxRefundController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0336 | Backend Endpoint | `GET /api/tipping/guide` | `backend/toursApi/controllers/TippingController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0337 | Backend Endpoint | `POST /api/tipping/calculate` | `backend/toursApi/controllers/TippingController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0338 | Backend Endpoint | `GET /api/tours` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0339 | Backend Endpoint | `GET /api/tours/search` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0340 | Backend Endpoint | `GET /api/tours/{id}` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0341 | Backend Endpoint | `GET /api/tours/by-slug/{slug}` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0342 | Backend Endpoint | `GET /api/tours/by-number/{id:int}` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0343 | Backend Endpoint | `GET /api/tours/{id}/similar` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0344 | Backend Endpoint | `POST /api/tours/{id}/reviews` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0345 | Backend Endpoint | `POST /api/tours` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0346 | Backend Endpoint | `PUT /api/tours/{id}` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0347 | Backend Endpoint | `PATCH /api/tours/{id}/toggle` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0348 | Backend Endpoint | `DELETE /api/tours/{id}` | `backend/toursApi/controllers/ToursController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0349 | Backend Endpoint | `GET /api/transit/hub` | `backend/toursApi/controllers/TransitController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0350 | Backend Endpoint | `POST /api/transit/calculate-fare` | `backend/toursApi/controllers/TransitController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0351 | Backend Endpoint | `POST /api/transit/estimate-taxi` | `backend/toursApi/controllers/TransitController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0352 | Backend Endpoint | `GET /api/users` | `backend/toursApi/controllers/UsersController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0353 | Backend Endpoint | `PUT /api/users/{id}/role` | `backend/toursApi/controllers/UsersController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0354 | Backend Endpoint | `PUT /api/users/{id}/status` | `backend/toursApi/controllers/UsersController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0355 | Backend Endpoint | `DELETE /api/users/{id}` | `backend/toursApi/controllers/UsersController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0356 | Backend Endpoint | `GET /api/visa/hub` | `backend/toursApi/controllers/VisaController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0357 | Backend Endpoint | `GET /api/visa/check` | `backend/toursApi/controllers/VisaController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0358 | Backend Endpoint | `POST /api/visa/check-validity` | `backend/toursApi/controllers/VisaController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0359 | Backend Endpoint | `GET /api/visa/embassies` | `backend/toursApi/controllers/VisaController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0360 | Backend Endpoint | `GET /api/weather/current` | `backend/toursApi/controllers/WeatherController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0361 | Backend Endpoint | `GET /api/weather/destinations` | `backend/toursApi/controllers/WeatherController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0362 | Backend Endpoint | `GET /api/admin/website-config/{hostname}` | `backend/toursApi/controllers/WebsiteConfigAdminController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| API-0363 | Backend Endpoint | `PUT /api/admin/website-config/{hostname}` | `backend/toursApi/controllers/WebsiteConfigAdminController.cs` | Yes | Backend | xUnit + WebApplicationFactory + Isolation | Pending Test |
| WEB-0364 | Web Route | `/` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0365 | Web Route | `/en` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0366 | Web Route | `/en/hotels` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0367 | Web Route | `/en/tours` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0368 | Web Route | `/en/flights` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0369 | Web Route | `/en/holidays` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0370 | Web Route | `/en/transfers` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0371 | Web Route | `/en/visas` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0372 | Web Route | `/en/restaurants` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0373 | Web Route | `/en/buildpackage` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0374 | Web Route | `/en/about-us` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0375 | Web Route | `/en/contact-us` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0376 | Web Route | `/en/faq` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0377 | Web Route | `/admin` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |
| WEB-0378 | Web Route | `/admin/bookings` | `web/app` | Yes | Web | Vitest + Playwright E2E | Pending Test |


---

## 4. Multi-Tenant & Platform Test Matrix

Each test item must execute across all 3 active tenant websites:

```
+-------------------+--------------------+-----------------------+---------------------+
| Feature / Screen  | Gujju Tours (gt)   | TripGo Asia (tga)     | Technoheaven (th)   |
+-------------------+--------------------+-----------------------+---------------------+
| Primary Palette   | #2882c5 (Ocean)    | #0d9488 (Teal)        | #f97316 (Orange)    |
| Currency Symbol   | ₹ (INR)            | $ (USD)               | AED (Dirham)        |
| Enabled Services  | Tours, Hotels,     | Tours, Hotels,        | All 13 services     |
|                   | Flights, Visas,    | Transfers, Packages,  | enabled             |
|                   | Packages, Transfers| Car Rentals           |                     |
| App Title         | Gujju Tours        | TripGo Asia           | Technoheaven B2B    |
| Build Scheme      | gujjutours://      | tripgoasia://         | technoheaven://     |
+-------------------+--------------------+-----------------------+---------------------+
```

---

## 5. Items Verifiable on Windows vs What Requires User Action

### What Will Be Fully Verified Here on Windows (Automated & Green):
1. **App Unit & Component Tests:** Full Jest + `jest-expo` test suite mocking API responses and testing all 4 component states (Loading, Empty, Error, Populated).
2. **Backend Integration Tests:** Full xUnit test suite testing all 140 API endpoints with tenant isolation, JWT authentication, and booking approval workflow.
3. **Web Critical Tests:** Next.js build verification, Vitest component tests, and secret scans.
4. **API Contract Verification:** Dynamic schema validation against staging APIs.
5. **Static Analysis & Linters:** Zero TypeScript errors (`tsc --noEmit`), `expo-doctor`, and security scanner.
6. **Maestro E2E Flows:** Written YAML flows ready to run locally on your Android phone (or EAS/Simulator).

### What You Must Check Yourself (Requires Mac, iOS Hardware, or Production Credentials):
1. **Apple Developer Account & Team Provisioning:** Enrolling in the Apple Developer Program ($99/yr) and registering your App Store Connect bundle identifiers.
2. **Real iOS Device Testing:** Scanning the Expo Go QR code on an iPhone using Expo Go to test iOS haptics, swipe-back gesture, and dynamic island safe areas.
3. **EAS iOS Build Execution:** Running `eas build --platform ios --profile preview` or `production` (uses Expo's cloud macOS runners).
4. **App Store Connect Submission:** Uploading screenshots, providing review login credentials, and completing the App Privacy questionnaire.
