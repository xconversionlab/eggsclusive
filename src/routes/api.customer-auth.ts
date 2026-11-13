import { createFileRoute } from "@tanstack/react-router";
import {
  clearCustomerSessionCookie,
  customerAuthJson,
  customerSessionCookie,
  getCustomerSession,
  isCustomerAuthConfigured,
  requestCustomerOtp,
  revokeCustomerSession,
  verifyCustomerOtp,
} from "@/lib/customer-otp.server";

export const Route = createFileRoute("/api/customer-auth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const customer = await getCustomerSession(request);
          return customer
            ? customerAuthJson({ ok: true, customer })
            : customerAuthJson({ ok: false, error: "Please verify your mobile number." }, 401);
        } catch {
          return customerAuthJson({ ok: false, error: "Customer authentication is temporarily unavailable." }, 503);
        }
      },
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          const parsed = await request.json();
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return customerAuthJson({ ok: false, error: "Invalid request." }, 400);
          }
          body = parsed as Record<string, unknown>;
          const origin = request.headers.get("origin");
          if (origin && new URL(origin).origin !== new URL(request.url).origin) {
            return customerAuthJson({ ok: false, error: "Request origin could not be verified." }, 403);
          }
        } catch {
          return customerAuthJson({ ok: false, error: "Invalid request." }, 400);
        }

        try {
          if (body.action === "request-otp") {
            const result = await requestCustomerOtp(body.phone);
            return result.ok
              ? customerAuthJson(result)
              : customerAuthJson({ ok: false, error: result.error }, result.status);
          }
          if (body.action === "verify-otp") {
            const result = await verifyCustomerOtp(body.phone, body.code, body.name);
            if (!result.ok) return customerAuthJson({ ok: false, error: result.error }, result.status);
            return customerAuthJson(
              { ok: true, customer: result.customer, expiresInSeconds: result.expiresInSeconds },
              200,
              { "Set-Cookie": customerSessionCookie(result.token) },
            );
          }
          if (body.action === "logout") {
            await revokeCustomerSession(request);
            return customerAuthJson({ ok: true }, 200, { "Set-Cookie": clearCustomerSessionCookie() });
          }
          return customerAuthJson({ ok: false, error: "Unknown action." }, 400);
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          const status = message === "persistent_database_not_configured" || message === "native_auth_not_configured" ? 503 : 500;
          return customerAuthJson(
            { ok: false, error: status === 503 ? "OTP service is not configured. Complete the server setup before accepting logins." : "Could not complete the OTP request. Please try again." },
            status,
          );
        }
      },
    },
  },
});
