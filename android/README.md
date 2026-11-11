# Spencers Enterprices — Native Android app

This is a native Android application built with Kotlin and Jetpack Compose. It does not embed, load, or display the website.

## Customer app

The three bottom tabs are **Order**, **Status**, and **Profile**. The original logo/icon, map picker, saved-address flow, product catalogue, partner enquiry and complaint form are retained.

### Phone OTP login

The native app calls these server endpoints over HTTPS:

- `POST /api/native/auth/request-otp` — sends a 6-digit OTP via 2Factor.
- `POST /api/native/auth/verify-otp` — verifies the OTP, creates a customer session and returns a bearer token.
- Customer sessions expire after 30 days. OTPs expire after five minutes; resend is limited to once per minute and five requests per phone per hour.

The API key and OTP template are stored server-side in Vercel, never in the APK. The API requires a persistent Postgres database; it fails closed if only the in-memory preview database is present.

### Orders and status

- `POST /api/native/orders` creates a shared order, snapshots the delivery address, allocates the nearest seeded delivery partner and stores an event timeline.
- `GET /api/native/orders` returns only the signed-in customer's orders and status events.
- The native Status tab refreshes from the server every 20 seconds while the tab is open.
- `POST /api/native/ops/orders/:id/status` changes an order status with the operations key. Accepted values: `accepted`, `preparing`, `out_for_delivery`, `delivered`, and `cancelled`.
- The protected web operations desk is at `/admin/native-orders`. It lists orders and lets an operator update status. It requires the operations key; it is not included in the customer APK.

### SMS configuration required

Add these variables to the Vercel project:

| Variable | Type | Purpose |
|---|---|---|
| `TWOFACTOR_API_KEY` | Sensitive | 2Factor API key |
| `TWOFACTOR_OTP_TEMPLATE_NAME` | Plain | Approved 2Factor OTP template name |
| `TWOFACTOR_STATUS_TEMPLATE_ID` | Plain | Approved 2Factor transactional status template ID |
| `DATABASE_URL` | Sensitive | Injected by the Neon Vercel integration |

`NATIVE_AUTH_SECRET` and `NATIVE_OPS_API_KEY` are generated as sensitive server-side Vercel variables. Do not place any of these keys in Android resources, Gradle build config, or source control.

2Factor's documented OTP request uses `POST https://2factor.in/API/V1/OTP/SEND` with `X-API-Key`, `to`, `template_name` and `var1`. Order-status SMS uses the 2Factor SMS send endpoint with a DLT-registered template and `var1` (order ID), `var2` (status).

### Provider / DLT setup

1. Create a 2Factor account and obtain an API key.
2. Register the business Principal Entity, sender header and OTP + transactional templates on an operator DLT portal. 2Factor offers DLT onboarding assistance.
3. Create an OTP template containing the OTP variable and a transactional order-status template containing two variables (order ID and status).
4. Add the three 2Factor values above in **Vercel → Eggsclusive project → Settings → Environment Variables**.
5. Install **Neon** from the Vercel Marketplace and connect a new Postgres database to this project. The project already runs the SQL migrations during deploy.
6. Redeploy Vercel and build a fresh APK from GitHub Actions.

Until these external credentials and DLT approvals are configured, live SMS is not sent. The backend records SMS attempts in `native_sms_outbox` as `not_configured` or `failed` rather than pretending they were delivered.

### Demo limitations

- UPI checkout and wallet funds remain demo-only; no money moves.
- The delivery-partner list and stock/pricing are the current Chennai pilot seed data. They still need to be replaced with the real partner directory and inventory before launch.
- The app currently refreshes status while open. SMS status alerts are submitted through the transactional DLT template once configured; push notifications for a closed app would require a push service setup.
- The Android APK is a debug build, not a Play Store-signed release.

## Build the APK

1. Open the repository's **Actions** tab.
2. Select **Build Spencers Enterprices Native Android APK**.
3. Open the latest successful run.
4. Download **Spencers-Enterprices-Native-APK** under Artifacts.
5. Extract the ZIP and install `app-debug.apk` on an Android device.
