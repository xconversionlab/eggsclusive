import { createFileRoute } from "@tanstack/react-router";
import {
  apiJson,
} from "@/lib/native-api.server";
import {
  requestVendorOtp, verifyVendorOtp, getVendorSession, listVendorOrders, getVendorStock,
  updateVendorOrderStatus, updateVendorStock, updateVendorProfile, logoutVendor,
} from "@/lib/vendor-api.server";

export const Route = createFileRoute("/api/vendor/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const pathname = new URL(request.url).pathname;
        try {
          if (pathname === "/api/vendor/session") {
            const result = await getVendorSession(request);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/vendor/orders") {
            const result = await listVendorOrders(request);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/vendor/stock") {
            const result = await getVendorStock(request);
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
          if (pathname === "/api/vendor/auth/request-otp") {
            const requester = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
              ?? request.headers.get("x-real-ip") ?? "vendor-android";
            const value = body as Record<string, unknown>;
            const result = await requestVendorOtp(value?.phone, requester);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/vendor/auth/verify-otp") {
            const value = body as Record<string, unknown>;
            const result = await verifyVendorOtp(value?.phone, value?.code, value?.name);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/vendor/logout") {
            return apiJson(await logoutVendor(request));
          }
          if (pathname === "/api/vendor/stock") {
            const result = await updateVendorStock(request, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/vendor/profile") {
            const result = await updateVendorProfile(request, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          const orderPrefix = "/api/vendor/orders/";
          if (pathname.startsWith(orderPrefix) && pathname.endsWith("/status")) {
            const orderId = decodeURIComponent(pathname.slice(orderPrefix.length, -"/status".length));
            const result = await updateVendorOrderStatus(orderId, request, body);
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
      OPTIONS: async () => new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      }),
    },
  },
});
