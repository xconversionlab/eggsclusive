# Spencer's Enterprises — Android customer app

This is an installable native Android app built with Kotlin and Jetpack Compose. It is built as a debug APK by GitHub Actions.

## Customer app

The customer app includes native Order, Status and Profile screens, a map-based delivery location picker, saved addresses, customer login, order placement and server-backed order status.

## SMS OTP login

Native login uses the same authentication service and customer/session tables as the web customer app:

- \`POST /api/native/auth/request-otp\` — starts an SMS verification through Twilio Verify.
- \`POST /api/native/auth/verify-otp\` — checks the code with Twilio Verify, creates a customer session and returns a bearer token.
- The app stores only the bearer session token locally. The token is hashed in the database.
- Codes are generated and checked by Twilio Verify. Eggsclusive never stores the actual OTP.
- App and web logins share customer records and sessions.

The app never contains Twilio credentials. All Verify credentials remain server-side in Vercel.

## Vercel server environment

Configure these server-only variables on the \`eggsclusive-preview\` Vercel project:

| Variable | Purpose |
| --- | --- |
| \`SMS_PROVIDER=twilio-verify\` | Select Twilio Verify for login OTP |
| \`TWILIO_ACCOUNT_SID\` | Twilio Account SID |
| \`TWILIO_API_KEY_SID\` | Restricted US1 API Key SID |
| \`TWILIO_API_KEY_SECRET\` | Restricted API Key secret (Sensitive) |
| \`TWILIO_VERIFY_SERVICE_SID\` | Verify Service SID |
| \`NATIVE_AUTH_SECRET\` | Server-side HMAC and session secret |
| \`DATABASE_URL\` | Persistent Neon Postgres connection |

The Twilio API key must have only **Verify → Verification → Create** and **Verify → Verification Check → Create** permissions. No phone number or \`TWILIO_FROM_NUMBER\` is required for Verify.

## Data and order status

- The app uses the native API under \`/api/native\`.
- Orders and status events are stored in shared Postgres tables created by \`migrations/0005_native_phone_auth_orders.sql\`.
- The Status screen refreshes server orders while the tab is open.
- The protected web operations desk is at \`/admin/native-orders\`. It needs \`NATIVE_OPS_API_KEY\` to be configured securely in Vercel.
- Order-status SMS is a separate transactional notification and is not sent by Verify. The app still displays server status updates; a separate approved transactional SMS channel is needed for outbound status texts.

## Build the APK

1. Open GitHub → Actions.
2. Select **Build Spencer's Enterprises Native Android APK**.
3. Open the latest successful run on \`main\`.
4. Download the \`Spencers-Enterprices-Native-APK\` artifact.
5. Extract the ZIP and install \`app-debug.apk\` on an Android device.

This workflow creates a debug APK for testing. A signed release build and Play Store publishing setup are separate release tasks.

## Current pilot data

The native order service still includes seeded Chennai delivery-partner examples and egg-focused order pricing. Replace those pilot records and extend the native product/order-line model before treating this APK as the complete customer catalogue for eggs, water cans, milk and curd.
