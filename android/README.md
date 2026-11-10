# Spencers Enterprices — Native Android app

This is a native Android application built with Kotlin and Jetpack Compose. It does not embed, load, or display the website.

## Three bottom tabs

1. **Order** — choose quantity, delivery window, payment method and place an order.
2. **History & Wallet** — switch between order history and wallet transactions.
3. **Profile** — save contact and Chennai delivery address details.

## Build the APK

The GitHub Actions workflow builds a debug APK from `native-android/`:

1. Open the repository's **Actions** tab.
2. Select **Build Spencers Enterprices Native Android APK**.
3. Open the latest successful run.
4. Download **Spencers-Enterprices-Native-APK** under Artifacts.
5. Extract the ZIP and install `app-debug.apk` on an Android device.

## Demo behavior

The native demo stores the profile, orders and wallet ledger locally on the device. UPI is a test-only checkout choice and does not transfer money. Wallet top-ups are labelled demo funds. No live payment gateway or shared order backend is connected in this native build yet.

This is a debug APK, not a Play Store-signed release.
