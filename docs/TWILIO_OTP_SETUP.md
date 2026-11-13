# Twilio Verify SMS OTP setup for Eggsclusive

Eggsclusive uses **Twilio Verify v2** for customer login OTP delivery and code validation. Twilio generates and validates the six-digit code; Eggsclusive never stores the raw OTP. The application retains its own request throttling, short-lived challenge record, customer upsert, and HttpOnly session cookie.

## Vercel environment variables

Set these server-only environment variables for the Vercel project:

| Variable | Value |
| --- | --- |
| `SMS_PROVIDER` | `twilio-verify` |
| `TWILIO_ACCOUNT_SID` | Account SID from Twilio Console (`AC...`) |
| `TWILIO_API_KEY_SID` | US1 API Key SID (`SK...`) |
| `TWILIO_API_KEY_SECRET` | Secret for that API Key (**Sensitive**) |
| `TWILIO_VERIFY_SERVICE_SID` | Verify Service SID (`VA...`) |

Keep `NATIVE_AUTH_SECRET` and `DATABASE_URL` configured. They are required for HMAC-based requester throttling and persistent customer sessions. Set the Twilio variables for Production and Preview if both environments are used. After changing variables, redeploy.

**No `TWILIO_FROM_NUMBER` or Messaging Service SID is needed for Verify.** Twilio Verify handles the OTP sender and message body. The old Programmable Messaging adapter remains available if `SMS_PROVIDER=twilio`, but customer login should use `twilio-verify`.

## Create and scope the Twilio API key

1. In Twilio Console, use the **United States (US1)** region.
2. Create a Restricted API key, or edit an existing Restricted key.
3. Enable only:
   - Verify → Verification → Create (`twilio/verify/verification/create`)
   - Verify → Verification Check → Create (`twilio/verify/verification-check/create`)
4. Disable unrelated permissions, including Messaging, Billing, Voice and service-management permissions.
5. Save the key SID and secret securely. Twilio displays the secret only once.

Twilio's Verify REST API uses HTTP Basic authentication with the API Key SID as username and the API Key Secret as password.

## Create the Verify service

1. Open Twilio Console → Identity → Verify → Overview.
2. Create or use the existing service named `Eggsclusive OTP`.
3. Use SMS as the channel and a six-digit code.
4. Copy its Service SID (`VA...`) to `TWILIO_VERIFY_SERVICE_SID`.

## How the app calls Verify

- Start: `POST https://verify.twilio.com/v2/Services/{ServiceSid}/Verifications` with `To=+91...` and `Channel=sms`.
- Check: `POST https://verify.twilio.com/v2/Services/{ServiceSid}/VerificationCheck` with `To=+91...` and `Code=123456`.
- Login is allowed only when Verify returns `status=approved` and `valid=true`.

Twilio Verify Service SID, Account SID and API credentials are only used by server routes. Never expose credentials in browser code or commit them to GitHub.

## Trial limitations

Twilio trial Verify only sends to recipient phone numbers verified in the Twilio Console (up to five recipients per account). Trial messaging uses Twilio's fixed test template and does not allow a custom OTP message. Trial quota and daily limits apply. A successful Console test confirms the Verify service works for that verified number, but the production app must still be tested through its own login form.

## Test checklist

1. Confirm the Vercel deployment is READY.
2. Confirm `SMS_PROVIDER=twilio-verify` and all four `TWILIO_*` variables are configured.
3. Confirm the Restricted API key has both Verify Create permissions above.
4. Open the deployed Eggsclusive app in a private browser window.
5. Request one OTP for a Twilio-verified test phone number.
6. Enter the received six-digit code and verify that the app creates a customer session.
7. Refresh the page and confirm the session is restored.
8. Inspect Twilio Console → Identity → Verify → Logs if sending or code checking fails.

The application enforces a 60-second resend cooldown, five requests per phone per hour, a requester/IP hourly limit, a five-minute local challenge window, and a maximum of five local attempts per challenge.

## Provider selection / rollback

- Twilio Verify: `SMS_PROVIDER=twilio-verify`
- Twilio Programmable Messaging (custom app-generated OTP): `SMS_PROVIDER=twilio`
- Existing 2Factor adapter: `SMS_PROVIDER=2factor`

Changing provider does not change the customer session format or customer data.
