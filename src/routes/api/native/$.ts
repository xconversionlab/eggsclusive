import { createFileRoute } from "@tanstack/react-router";
import {
  apiJson,
  createNativeOrder,
  listNativeOrders,
  listOperationsNativeOrders,
  requestPhoneOtp,
  updateNativeOrderStatus,
  verifyPhoneOtp,
} from "@/lib/native-api.server";
import { dbSource } from "@/lib/db";

export const Route = createFileRoute("/api/native/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const pathname = new URL(request.url).pathname;
        try {
          if (pathname === "/api/native/health") {
            return apiJson({
              ok: true,
              persistentDatabaseReady: dbSource === "neon",
              otpConfigured: Boolean(process.env.TWOFACTOR_API_KEY && process.env.TWOFACTOR_OTP_TEMPLATE_NAME),
            });
          }
          if (pathname === "/api/native/orders") {
            const result = await listNativeOrders(request);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/ops/orders") {
            const result = await listOperationsNativeOrders(request);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          return apiJson({ ok: false, error: "Not found." }, 404);
        } catch (error) {
          const message = error instanceof Error ? error.message : "request_failed";
          const status = message === "persistent_database_not_configured" ? 503 : 500;
          return apiJson({
            ok: false,
            error: status === 503
              ? "The shared database is not connected yet. Install the database integration and redeploy."
              : "The request could not be completed.",
          }, status);
        }
      },
      POST: async ({ request }) => {
        const pathname = new URL(request.url).pathname;
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return apiJson({ ok: false, error: "Invalid JSON request." }, 400);
        }
        try {
          if (pathname === "/api/native/auth/request-otp") {
            const result = await requestPhoneOtp((body as Record<string, unknown>)?.phone);
            return result.ok
              ? apiJson(result)
              : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/auth/verify-otp") {
            const value = body as Record<string, unknown>;
            const result = await verifyPhoneOtp(value?.phone, value?.code, value?.name);
            return result.ok
              ? apiJson(result)
              : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/orders") {
            const result = await createNativeOrder(request, body);
            return result.ok
              ? apiJson(result, 201)
              : apiJson({ ok: false, error: result.error }, result.status);
          }
          const statusMatch = /^\/api\/native\/ops\/orders\/([A-Za-z0-9_-]+)\/status$/.exec(pathname);
          if (statusMatch) {
            const result = await updateNativeOrderStatus(decodeURIComponent(statusMatch[1]), request, body);
            return result.ok
              ? apiJson(result)
              : apiJson({ ok: false, error: result.error }, result.status);
          }
          return apiJson({ ok: false, error: "Not found." }, 404);
        } catch (error) {
          const message = error instanceof Error ? error.message : "request_failed";
          const status = message === "persistent_database_not_configured" ? 503 : 500;
          return apiJson({
            ok: false,
            error: status === 503
              ? "The shared database is not connected yet. Install the database integration and redeploy."
              : "The request could not be completed.",
          }, status);
        }
      },
      OPTIONS: async () => new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Native-Ops-Key",
          "Access-Control-Max-Age": "86400",
        },
      }),
    },
  },
});
