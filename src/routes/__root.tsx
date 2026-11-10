import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Frame } from "@/components/eggs/frame";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Spencers Enterprices — Fresh eggs, delivered" },
      {
        name: "description",
        content:
          "Fresh eggs delivered to your door, matched to your address and local delivery availability.",
      },
      { name: "theme-color", content: "#07172e" },
    ],
    links: [
      { rel: "icon", type: "image/jpeg", href: "/spencers-mark.jpg" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/spencers-mark.jpg" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Frame>
            <Outlet />
          </Frame>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
