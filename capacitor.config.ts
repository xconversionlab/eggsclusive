import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.xconversionlab.eggsclusive",
  appName: "Eggsclusive",
  webDir: "dist",
  server: {
    // The APK is a lightweight Android shell for the hosted customer app.
    // Checkout and demo data remain connected to the live web deployment.
    url: "https://eggsclusive-preview-d5b35sp19-xconversionlabs-projects.vercel.app",
    cleartext: false,
    allowNavigation: ["eggsclusive-preview-d5b35sp19-xconversionlabs-projects.vercel.app"],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
