# Spencers Enterprices — Native Android app

This is a native Android application built with Kotlin and Jetpack Compose. It does not embed, load, or display the website.

## Three bottom tabs

1. **Order** — choose egg quantity, delivery window and payment, then place an order.
2. **Activity** — switch between order history and wallet transactions.
3. **Profile** — verify the mobile number using the demo code, edit contact details, and choose a delivery location on the native map.

## Brand and map

- The supplied Spencers Enterprices artwork has been cleanly extracted into vector assets: the complete logo/wordmark, transparent in-app emblem, and matching dark launcher icon. The emblem geometry is shared by the in-app mark and launcher icon.
- The original logo lock-up appears on the animated startup screen. The symbol is used in the app headers.
- The map is an interactive native screen using OpenStreetMap tiles. Drag the map to position the fixed doorstep pin, or use the device location permission. The selected pin is reverse-geocoded into address fields when available.
- Map tiles require an internet connection and include visible OpenStreetMap attribution.

## Demo behavior

- Mobile verification uses demo code `482913`; no SMS is sent.
- The native demo stores profile, orders and wallet activity locally on the device.
- The nearest seeded Chennai delivery partner is selected from the saved map pin, with partner-specific demo pricing and stock checks.
- UPI is a test-only option and does not transfer money. Wallet top-ups are labelled demo funds.
- The current partner directory is a Chennai pilot dataset. Locations outside the seeded service areas will show delivery unavailable.
- No live payment gateway or shared order backend is connected in this native build yet.

## Build the APK

The GitHub Actions workflow builds from `native-android/`:

1. Open the repository's **Actions** tab.
2. Select **Build Spencers Enterprices Native Android APK**.
3. Open the latest successful run.
4. Download **Spencers-Enterprices-Native-APK** under Artifacts.
5. Extract the ZIP and install `app-debug.apk` on an Android device.

This is a debug APK, not a Play Store-signed release.
