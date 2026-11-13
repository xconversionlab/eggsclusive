# Eggsclusive — Android customer app

**Customer-facing app name:** Eggsclusive  
**Business identity:** Spencer's Enterprises  
**Application ID:** \`com.xconversionlab.spencersenterprices\`

This is a native Android application built with Kotlin and Jetpack Compose. It does not embed the website.

## Customer app scope

- Secure mobile-number login using the same Twilio Verify-backed customer API as the web app.
- Fresh Egg ordering (₹7 per egg in the current client brief).
- Water Can ordering at ₹30 per can.
- A ₹150 bottle deposit per can only when the customer selects that they do not have empty bottles to return.
- Floor delivery fee currently ₹0; change only after the business confirms a fee.
- Order Activity with status, delivery partner details, delivery OTP and cancellation/refund status.
- Up to four named delivery addresses with a map pin, city and pincode.
- Central support tickets submitted to the operations API.
- Server-backed wallet balance and refund transaction history.

Milk and Curd are intentionally not enabled for checkout until the business supplies approved prices, pack sizes and stock rules. Do not infer these values.

## Server API

The Android app calls the Vercel API at \`https://eggsclusive-preview.vercel.app\`:

- \`POST /api/native/auth/request-otp\`
- \`POST /api/native/auth/verify-otp\`
- \`GET /api/native/orders\`
- \`POST /api/native/orders\`
- \`GET /api/native/addresses\`
- \`POST /api/native/addresses\`
- \`GET /api/native/wallet\`
- \`POST /api/native/complaints\`

Operations endpoints are protected by the \`NATIVE_OPS_API_KEY\` and are never embedded in the APK.

## Vercel environment variables

Server-only variables required:

| Variable | Purpose |
| --- | --- |
| \`SMS_PROVIDER=twilio-verify\` | Twilio Verify login OTP |
| \`TWILIO_ACCOUNT_SID\` | Twilio account |
| \`TWILIO_API_KEY_SID\` | Restricted US1 API key SID |
| \`TWILIO_API_KEY_SECRET\` | Restricted API key secret (Sensitive) |
| \`TWILIO_VERIFY_SERVICE_SID\` | Verify service |
| \`NATIVE_AUTH_SECRET\` | Server-side session/HMAC secret |
| \`NATIVE_OPS_API_KEY\` | Operations API key |
| \`DATABASE_URL\` | Persistent Neon/Postgres connection |

The restricted Twilio API key needs only **Verify → Verification → Create** and **Verify → Verification Check → Create**. No \`TWILIO_FROM_NUMBER\` is used by Verify.

The database migration files are applied at deployment when \`DATABASE_URL\` exists. Native authentication, saved addresses, complaints, orders and wallet data deliberately fail closed without persistent Postgres; the in-memory PGLite fallback is not production storage.

## Current external launch blockers

1. Configure a persistent Postgres database and add \`DATABASE_URL\` to Vercel Production. The project was inspected during the current implementation and this variable was not present.
2. Configure a payment gateway and server-side payment verification/webhooks before taking real payments. Current orders are created with \`payment_status=pending\`; the app must not display them as paid.
3. Replace the seeded Chennai delivery-partner records in \`src/lib/native-api.server.ts\` with verified live vendor, stock, service-area and rider data. These sample records are not production vendor assignments.
4. Configure an Android release keystore and create a signed release APK/AAB. The GitHub Actions workflow currently creates a debug APK for testing.
5. Confirm business-approved bottle return, floor-delivery and service-area policies before launch.

## Order and wallet rules

- Water Can: ₹30 × quantity.
- Bottle deposit: ₹150 × quantity only when empty bottles are not returned.
- Floor delivery fee: ₹0 until a rate is approved.
- Operations cancellation credits the customer wallet only when the order's payment state is \`paid\`. Pending/unpaid orders do not create a refund credit.
- Twilio Verify is for authentication only. Transactional order-status SMS needs a separately approved SMS route/template; in-app Activity is the current status channel.

## Build the debug APK

1. Open GitHub → Actions.
2. Select **Build Spencer's Enterprises Native Android APK**.
3. Open the latest successful run on \`main\`.
4. Download \`Spencers-Enterprices-Native-APK\`.
5. Extract and install \`app-debug.apk\` for device testing.

A debug APK is not the signed release needed for a public Play Store launch.
