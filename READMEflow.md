# Poultech Solutions app flow

This guide explains how to start the app locally and navigate its current demo experiences.

## 1. Start locally

1. Install Node.js LTS and npm.
2. From the project directory, run:

   ```sh
   npm install
   npm run start
   ```

3. Use the Expo terminal to open web, Android, or iOS. To launch web directly, run `npm run web` (or `npm.cmd run web` in Windows PowerShell).
4. If Metro reports stale module resolution after a dependency change, stop the old server with `Ctrl+C` and restart using `npm run web -- --clear` (or `npm.cmd run web -- --clear` in Windows PowerShell).
5. To check types, run `npm run typecheck` (or `npm.cmd run typecheck` in Windows PowerShell).

On Windows PowerShell, replace `npm` with `npm.cmd` in these commands if PowerShell blocks the `npm.ps1` script. Native integrations such as Razorpay require a development build and are not available in Expo Go.

## 2. First launch and authentication

The app opens on the login screen if there is no saved session. During development, mock authentication is enabled when `EXPO_PUBLIC_API_URL` is unset, so the demo accounts can be used without a server.

Use the login screen's demo buttons or enter one of these accounts:

| Role | Email | Password |
|---|---|---|
| Customer | `demo@poultech.in` | `Poultech123` |
| Poultry owner | `owner@poultech.in` | `PoultechOwner123` |
| Admin | `admin@poultech.in` | `PoultechAdmin123` |

The app can also be explored as a guest where available. Account registration is a separate flow. Phone OTP sign-in is not currently offered. Google authentication requires client IDs and redirect settings configured for the target platform.

## 3. Role-based experiences

### Customer

The customer demo opens the customer dashboard. Use the main navigation to explore:

- **Home** — dashboard and sample overview.
- **Market** — sample poultry products and marketplace content.
- **Services** — service information and booking preview.
- **Wallet** — sample balance and activity.
- **Profile** — account details and language selection.

Farm-management and owner-only billing tools are restricted to poultry-owner accounts.

### Poultry owner

The poultry-owner demo opens a farm-focused dashboard with sample farm activity and quick actions:

- **My Farm** — view sample flock/shed records and seller options.
- **Billing** — create an invoice, save its PDF and record locally, then open or share a saved invoice. The **Back to My Farm** control returns to farm records.
- **Market** — browse sample products.
- **Services** — view and preview farm service bookings.
- **Wallet** — view sample balance/activity.
- **Profile** — review profile and change the app language.

On wide screens, Billing shows invoice creation on the left and saved invoice records on the right. On smaller screens the two sections stack. Created invoices are locally persisted per user/device or browser; they are not sent to a backend.

### Admin

The admin demo opens an admin dashboard with sample farm reports and demo market-rate controls. Rate changes are temporary in-memory demo state; they are not live rates and are not sent to a backend.

## 4. Demo data and real integrations

The main screens are populated with demo/sample UI data to make the application explorable without a backend. This includes sample farm and flock records, marketplace catalog/listings, service requests, market rates and updates, wallet activity, and admin reports. Demo values are not live business data. Most actions preview the flow rather than perform a real server operation or transaction.

The Billing demo form is prefilled to make invoice generation easy to preview. You can edit the sample values before creating the invoice. The resulting branded PDF and invoice record are saved locally and can be reopened from the saved list. Web sharing uses the browser's file-sharing feature if supported, otherwise it downloads the PDF. Native sharing uses the system share sheet. PDF labels are currently English even when the app UI is Hindi or Marathi.

For backend testing, copy `.env.example` to `.env`, set `EXPO_PUBLIC_API_URL` to the backend origin, and disable mock auth with `EXPO_PUBLIC_USE_MOCK_AUTH=false` when appropriate. For Android emulators, use an address reachable from the emulator rather than `localhost`. A configured URL alone does not provide missing API endpoints.

## 5. Language

English, Hindi, and Marathi are supported in the app UI. Choose a language during login/registration or later in Profile. The selection is saved on the device and applies immediately. Generated invoice PDF template labels remain in English.
