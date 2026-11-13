import { createFileRoute } from "@tanstack/react-router";
import {
  apiJson,
  readCustomerSession,
  requestPhoneOtp,
  revokeCustomerSession,
  verifyPhoneOtp,
} from "@/lib/customer-auth.server";
import { dbSource } from "@/lib/db";

export const Route = createFileRoute("/api/customer-auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const pathname = new URL(request.url).pathname;
        try {
          if (pathname === "/api/customer-auth/session") {
            const result = await readCustomerSession(request);
            return apiJson(result);
          }
          if (pathname === "/api/customer-auth/health") {
            return apiJson({
              ok: true,
              databaseReady: dbSource === "neon",
              smsConfigured: Boolean(
                process.env.TWOFACTOR_API_KEY &&
                process.env.TWOFACTOR_OTP_TEMPLATE_NAME &&
                process.env.NATIVE_AUTH_SECRET,
              ),
            });
          }
          return apiJson({ ok: false, error: "Not found." }, 404);
        } catch (error) {
          const message = error instanceof Error ? error.message : "request_failed";
          const status = message === "persistent_database_not_configured" ? 503 : 500;
          return apiJson({
            ok: false,
            error: status === 503
              ? "Customer sign-in is not ready yet. The shared database must finish provisioning."
              : "Your session could not be checked. Please refresh and try again.",
          }, status);
        }
      },
      POST: async ({ request }) => {
        const pathname = new URL(request.url).pathname;
        if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
          return apiJson({ ok: false, error: "Expected a JSON request." }, 415);
        }

        let body: Record<string, unknown>;
        try {
          const value: unknown = await request.json();
          if (!value || typeof value !== "object" || Array.isArray(value)) {
            return apiJson({ ok: false, error: "Invalid request." }, 400);
          }
          body = value as Record<string, unknown>;
        } catch {
          return apiJson({ ok: false, error: "Invalid JSON request." }, 400);
        }

        try {
          if (pathname === "/api/customer-auth/request-otp") {
            const result = await requestPhoneOtp(request, body.phone);
            return result.ok
              ? apiJson(result)
              : apiJson({ ok: false, error: result.error }, result.status);
          }

          if (pathname === "/api/customer-auth/verify-otp") {
            const result = await verifyPhoneOtp(body.phone, body.code, body.name);
            return result.ok
              ? apiJson({ ok: true, customer: result.customer }, 200, { "Set-Cookie": result.cookie })
              : apiJson({ ok: false, error: result.error }, result.status);
          }

          if (pathname === "/api/customer-auth/logout") {
            const result = await revokeCustomerSession(request);
            return result.ok
              ? apiJson({ ok: true }, 200, { "Set-Cookie": result.clearCookie })
              : apiJson({ ok: false, error: result.error }, result.status);
          }

          return apiJson({ ok: false, error: "Not found." }, 404);
        } catch (error) {
          const message = error instanceof Error ? error.message : "request_failed";
          const status = message === "persistent_database_not_configured" ? 503
            : message === "native_auth_not_configured" ? 503
            : 500;
          return apiJson({
            ok: false,
            error: status === 503
              ? message === "native_auth_not_configured"
                ? "The customer authentication security secret is not configured."
                : "Customer sign-in is not ready yet. The shared database must finish provisioning."
              : "The request could not be completed. Please try again.",
          }, status);
        }
      },
    },
  },
});
