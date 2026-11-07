# Poultech Solutions

Poultech Solutions is an Expo / React Native poultry-farm management and marketplace app. It has web, Android, and iOS targets, English/Hindi/Marathi language selection, and a demo mode for exploring the screens without a backend.

## Requirements

- Node.js (LTS recommended) and npm
- For mobile testing: Expo Go where supported, or an Android/iOS development build
- For native payments: a development build; Razorpay's React Native SDK does not run in Expo Go

## Install and run locally

From the project directory, install dependencies and start Expo:

```sh
npm install
npm run start
```

On Windows PowerShell, use `npm.cmd` instead if PowerShell blocks the `npm.ps1` script. To start the web app directly:

```sh
npm run web
```

In Windows PowerShell:

```powershell
npm.cmd run web
```

For Android or iOS, start Expo and scan the QR code with Expo Go, or select a running emulator/device from the Expo terminal. Some native integrations require a development build. To clear Metro's cache after dependency changes or stale bundler errors:

```sh
npm run web -- --clear
```

In Windows PowerShell:

```powershell
npm.cmd run web -- --clear
```

Check TypeScript with:

```sh
npm run typecheck
```

In Windows PowerShell:

```powershell
npm.cmd run typecheck
```

## Demo mode and sample data

The app's screens are populated with demo/sample data so you can preview the main experiences without a live backend. The login screen provides buttons to fill these demo credentials:

| Account | Email | Password | Experience |
|---|---|---|---|
| Customer | `demo@poultech.in` | `Poultech123` | Customer dashboard and marketplace |
| Poultry owner | `owner@poultech.in` | `PoultechOwner123` | Farm dashboard, records, billing, and seller tools |
| Admin | `admin@poultech.in` | `PoultechAdmin123` | Admin overview, sample farm reports, and demo rate controls |

With no `EXPO_PUBLIC_API_URL` set, mock authentication is enabled automatically in development. To set up local environment variables, copy `.env.example` to `.env`. Use `EXPO_PUBLIC_USE_MOCK_AUTH=true` to explicitly enable mock authentication, or set it to `false` to disable the development fallback.

Demo farms, flock counts, products, service bookings, wallet activity, market rates, and admin reports are sample data—not live platform information. Most demo actions are previews and do not send changes to a backend. Admin rate edits are temporary. Invoices created from Billing are an exception: their PDF and invoice record are saved locally on the current device/browser for that demo user.

To connect a backend, set `EXPO_PUBLIC_API_URL` to its origin. When testing from an Android emulator, use the host machine's emulator-accessible address instead of `localhost`. Connecting an API does not make endpoints available unless the backend implements them.

Phone OTP sign-in is currently not part of the login flow. Google sign-in requires valid platform client IDs and matching OAuth redirect configuration; see `.env.example`.

## App features

- Switch between English, Hindi, and Marathi using the language selector at sign-in/registration or in Profile.
- Explore customer and poultry-owner experiences through the demo accounts above.
- Review farm records, browse marketplace products, view sample market updates, explore service bookings, and inspect wallet sample activity.
- Create, save, open, and share branded PDF invoices from **My Farm → Billing**. Invoice PDFs include the Poultech Solutions letterhead. Invoice template labels are currently in English. On web, sharing uses native browser file sharing where supported and otherwise downloads the PDF; native builds use the device share sheet.

For the step-by-step navigation and role-specific journeys, see [READMEflow.md](./READMEflow.md).
