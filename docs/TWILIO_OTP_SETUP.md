# Twilio SMS OTP setup for Eggsclusive

The customer login supports two server-side delivery adapters. The default remains `2factor`; set `SMS_PROVIDER=twilio` to use Twilio Programmable Messaging. OTP creation, HMAC hashing, expiry, rate limits, verification and customer sessions remain in the app.

## 1. Create Twilio credentials

In Twilio Console:

1. Open **Settings → Account settings → API keys & auth tokens**.
2. Create an API key named `Eggsclusive OTP` with type **Standard**.
3. Copy the API Key SID and Secret immediately. Twilio displays the Secret only once.
4. Keep your Account SID from the Twilio Console dashboard.
5. Find your SMS-capable sender number in **Phone Numbers → Manage → Active numbers**. Copy it in E.164 format, such as `+1...` or `+91...`. If using a Messaging Service, copy its Messaging Service SID instead.

Do not put credentials in source files, client-side variables, GitHub, screenshots or chat.

## 2. Add Vercel environment variables

Add these as server-only variables to the `eggsclusive-preview` Vercel project. Set the required scope to **Production** and **Preview** (and Development if you test a local deployment):

| Variable | Value |
| --- | --- |
| `SMS_PROVIDER` | `twilio` |
| `TWILIO_ACCOUNT_SID` | Account SID from the Twilio dashboard |
| `TWILIO_API_KEY_SID` | Standard API key SID |
| `TWILIO_API_KEY_SECRET` | Standard API key Secret (**Sensitive**) |
| `TWILIO_FROM_NUMBER` | Twilio SMS-capable sender number in E.164 format |

Use either `TWILIO_FROM_NUMBER` **or** `TWILIO_MESSAGING_SERVICE_SID`. If both are set, the Messaging Service SID takes precedence. Keep `NATIVE_AUTH_SECRET` and `DATABASE_URL` configured; they are required by customer sessions and OTP storage.

After adding or changing environment variables, trigger a new deployment.

## 3. Trial account limitations

A Twilio trial can send only to verified recipient phone numbers (up to five per account), and trial message content is restricted to Twilio-provided templates. The trial is time-limited. Therefore a successful Console "Try it out" SMS is not sufficient to prove that the app's dynamic OTP body will be accepted.

For a genuine end-to-end app OTP test, use a verified recipient and check whether Twilio's current trial restrictions accept the app's custom OTP content. If the API rejects the content, upgrade the Twilio account before production testing. Do not try to evade trial restrictions.

## 4. India delivery routes

Twilio documents two India routes:

- **International route:** no DLT registration is required; the mobile network may replace the sender with a random ILDO-approved short code.
- **Domestic route:** company/entity and alphanumeric Sender ID registration in a telecom DLT portal are required before registering with Twilio. DLT-approved templates must be allowlisted.

Ask Twilio which route is provisioned for the account and the target Indian operator before launch. Do not assume a trial test message proves that all Indian carriers will deliver OTPs consistently.

## 5. Test checklist

1. Confirm the latest Vercel deployment is READY.
2. Open the customer app in a private/incognito browser.
3. Use a phone number verified in Twilio while the account is still on trial.
4. Request one OTP. Do not repeatedly resend; the app enforces a 60-second cooldown and a per-phone hourly cap.
5. Confirm the SMS arrives, enter the code, and verify that the customer session survives a page refresh.
6. Inspect **Twilio Console → Monitor → Logs → Messaging** for message status and any error code if delivery fails.
7. Test with other Indian carriers before launch; one successful recipient is not a deliverability guarantee.

## Provider switch / rollback

- Twilio: `SMS_PROVIDER=twilio`
- Existing 2Factor adapter: `SMS_PROVIDER=2factor` (also the code default if the variable is absent)

Switching provider changes only how the OTP is delivered. The app still verifies the generated OTP itself; it does not use Twilio Verify.
