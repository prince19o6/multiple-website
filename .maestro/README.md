# Maestro Mobile End-to-End Test Suite

Automated UI flows for Gujju Tours, TripGo Asia, and Technoheaven native apps.

## Flows Overview

| Flow File | Target User Journey | Key Validations |
| :--- | :--- | :--- |
| `browse-and-search.yaml` | First launch, home catalog, destination search, filter modal | Dynamic section rendering, search query input, filter chips |
| `tour-details-and-wishlist.yaml` | Tour detail screen, inclusions, wishlist toggle | State persistence, bottom tab navigation |
| `auth-and-booking.yaml` | User login, passenger details form, payment mock, confirmation | Form validation, double-submit protection, reference ID generation |
| `bookings-and-eticket.yaml` | Bookings list, status evaluation, e-ticket QR voucher | Locked on Pending, unlocked on Confirmed, cancellation reason |
| `admin-approval-workflow.yaml` | Admin portal, pending bookings inbox, approval transition | State transition, outbox email trigger |
| `account-deletion.yaml` | Apple Guideline 5.1.1(v) in-app account deletion | Permanent deletion alert, session cleanup, redirection |

---

## Running Locally

### Prerequisites
1. Install Maestro CLI:
   ```bash
   # Windows (PowerShell)
   curl -fsSL "https://get.maestro.mobile.dev" | bash
   ```
2. Start your Android Emulator or connect a real Android phone with USB Debugging enabled:
   ```bash
   adb devices
   ```

### Execution
Run individual flows or the complete suite:
```bash
# Run single flow
maestro test .maestro/browse-and-search.yaml

# Run all flows sequentially
maestro test .maestro/
```

---

## Running in CI: Maestro Cloud & GitHub Actions

### Pricing Breakdown: Free Tier vs Paid

| Tier | Monthly Allowance | Parallelism | Platform Support | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Maestro Cloud Free** | **100 test runs / month** | 1 device | Android & iOS | **$0 / month** |
| **GitHub Actions macOS Runner** | **2,000 free minutes** / month (for public repos) | 1 runner | iOS Simulator & Android Emulator | **$0 / month** |
| **Maestro Cloud Team** | Unlimited runs | Up to 10 parallel devices | Android & iOS | **$99 / month** |
| **GitHub Actions macOS Paid** | Beyond free quota | Pay-as-you-go | macOS M1/M2 | **$0.08 / min** |

### Free Setup Recommendation
For zero-cost CI:
1. Use **GitHub Actions macOS Runner** with iOS Simulator for weekly release regression smoke tests (runs within the free 2,000 GitHub Action minutes).
2. Use **Maestro Cloud Free Tier** (100 runs/month) for PR smoke checks on the critical booking flow.
3. Sign up at [cloud.mobile.dev](https://cloud.mobile.dev) and generate an API key (`MAESTRO_CLOUD_API_KEY`).
4. Execute via CLI in CI:
   ```bash
   maestro cloud --apiKey $MAESTRO_CLOUD_API_KEY --app app-release.apk .maestro/
   ```

