# Backend API mapping (auth)

**API root:** `EXPO_PUBLIC_API_URL` → `http://localhost:8000/api/v1`

## Login (aligned with backend)

| Step | Frontend | Backend | Notes |
|------|----------|---------|--------|
| 1 | `loginChallenge(email, password, { remember_me, confirm_device_switch })` | `POST /auth/login` | Same fields as `LoginRequest` |
| 2 | `verifyLoginOtp(..., { remember_me, confirm_device_switch })` | `POST /auth/verify-otp` | `purpose: "login"`; sets refresh cookie |
| 3 | `fetchProfile(access_token)` | `GET /me` | Maps `is_profile_complete`, role |
| — | `resendOtpChallenge(session, purpose)` | `POST /auth/resend-otp` | `purpose`: `login`, `signup`, `reset` (not `restore`) |
| — | `refreshAccessToken()` | `POST /auth/refresh` | Header `X-Poultech-Refresh: 1`, cookie |
| — | `logoutSession()` | `POST /auth/logout` | `signOut()` → clears store + storage; deletes refresh cookie; revokes session + Redis cache; UI → `/(auth)/login` |

**Login errors:** `registration_required` (unknown email) → **Create account** link; `invalid_credentials` (wrong password); `email_not_verified` (signup OTP pending).

**Signup `email_taken`:** UI suggests sign in or another email.

**Device conflict:** `409` / `already_signed_in` → “Sign in on this device” retries login with `confirm_device_switch: true`, then OTP verify with same flag.

**Remember me:** Sent to API on login + verify-otp (refresh cookie lifetime). Local session storage still follows the checkbox.

**Post-login route:** Dashboard when `is_profile_complete` (name+phone) and email verified. Register for missing phone (e.g. new Google sign-in).

## Google Sign-In

| Step | Frontend | Backend |
|------|----------|---------|
| 1 | `useGoogleAuth` → Google OAuth **ID token** (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` on web) | `GOOGLE_CLIENT_ID` must match web client (audience) |
| 2 | `POST /auth/google` `{ id_token }` | Verifies token; uses `sub`, `email`, `email_verified`, `given_name`, `family_name`, `picture` |
| 3 | `fetchProfile` + `finishSignIn` | |

**Account linking:** Same **email** as an existing password signup → links `oauth_accounts` (user can use Google or email+password OTP).  
**New Google user:** Creates verified user + profile (name/avatar from Google); **phone still required** via register setup → `PATCH /me/profile`.  
**Configured in:** backend `.env` `GOOGLE_CLIENT_ID`; frontend `.env` `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`.

## Register / reset

Signup `POST /auth/signup` requires: `email`, `password`, `confirm_password`, `first_name`, `last_name`, **`phone`** (required Indian 10-digit, stored E.164). See `authService.ts` + `register.tsx`. Resend on verify step: same `otp_session_id`, `purpose: "signup"`. Responses include `resend_after` (default 60s cooldown).

## Errors (backend → app user)

Backend shape: `{ "error": { "code", "message", "request_id", "details?" } }`.

| Source | HTTP | Frontend helper |
|--------|------|-----------------|
| Pydantic / `validation_error` | 422 | `getAuthErrorMessage` → joins `details[].message` (strips `Value error,`) |
| `AuthError` (login, OTP, etc.) | 400 / 410 / … | `getAuthErrorMessage` → `error.message` |
| `ConflictError` (`email_taken`, `already_signed_in`, …) | 409 | Context helpers below |
| `RateLimitError` / IP limits | 429 | `getAuthErrorMessage` + `Retry-After` header |
| Login wrong / unknown email | 400 | `getLoginFailureMessage` + Create account link |
| Signup duplicate email | 409 | `getSignupFailureMessage` |
| OTP verify / resend | 4xx | `getOtpFailureMessage` |

Core: `getAuthErrorCode`, `isAlreadySignedInError`.