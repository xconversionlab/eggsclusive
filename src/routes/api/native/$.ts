import { createFileRoute } from "@tanstack/react-router";
import {
  apiJson,
  createNativeComplaint,
  createNativeOrder,
  getNativeCatalog,
  getOperationsNativeCatalog,
  updateOperationsNativeCatalog,
  getNativeWallet,
  listNativeCustomerAddresses,
  listNativeOrders,
  listOperationsNativeComplaints,
  listOperationsNativeOrders,
  saveNativeCustomerAddresses,
  requestPhoneOtp,
  updateNativeOrderStatus,
  verifyPhoneOtp,
} from "@/lib/native-api.server";
import {
  requestVendorOtp, verifyVendorOtp, getVendorSession, listVendorOrders, getVendorStock,
  updateVendorOrderStatus, updateVendorStock, updateVendorProfile, logoutVendor,
  listSuperAdminVendors, createSuperAdminVendor, setSuperAdminVendorStatus, assignSuperAdminOrder,
} from "@/lib/vendor-api.server";
import { dbSource } from "@/lib/db";
import { isCustomerAuthConfigured } from "@/lib/customer-otp.server";

export const Route = createFileRoute("/api/native/$")({
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
          if (pathname === "/api/superadmin/vendors") {
            const result = await listSuperAdminVendors(request);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/health") {
            return apiJson({
              ok: true,
              persistentDatabaseReady: dbSource === "neon",
              otpConfigured: isCustomerAuthConfigured(),
            });
          }
          if (pathname === "/api/native/catalog") return apiJson(await getNativeCatalog());
          if (pathname === "/api/native/ops/catalog") {
            const result = await getOperationsNativeCatalog(request);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/orders") {
            const result = await listNativeOrders(request);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/addresses") {
            const result = await listNativeCustomerAddresses(request);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/wallet") {
            const result = await getNativeWallet(request);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/ops/complaints") {
            const result = await listOperationsNativeComplaints(request);
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
          if (pathname === "/api/vendor/auth/request-otp") {
            const requester = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "vendor-android";
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
            const result = await logoutVendor(request);
            return apiJson(result);
          }
          if (pathname === "/api/vendor/stock") {
            const result = await updateVendorStock(request, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/vendor/profile") {
            const result = await updateVendorProfile(request, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/superadmin/vendors") {
            const result = await createSuperAdminVendor(request, body);
            return result.ok ? apiJson(result, 201) : apiJson({ ok: false, error: result.error }, result.status);
          }
          const vendorStatusPrefix = "/api/superadmin/vendors/";
          if (pathname.startsWith(vendorStatusPrefix) && pathname.endsWith("/status")) {
            const vendorId = decodeURIComponent(pathname.slice(vendorStatusPrefix.length, -"/status".length));
            const result = await setSuperAdminVendorStatus(request, vendorId, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          const assignPrefix = "/api/superadmin/orders/";
          if (pathname.startsWith(assignPrefix) && pathname.endsWith("/assign")) {
            const orderId = decodeURIComponent(pathname.slice(assignPrefix.length, -"/assign".length));
            const result = await assignSuperAdminOrder(request, orderId, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          const vendorOrderPrefix = "/api/vendor/orders/";
          if (pathname.startsWith(vendorOrderPrefix) && pathname.endsWith("/status")) {
            const orderId = decodeURIComponent(pathname.slice(vendorOrderPrefix.length, -"/status".length));
            const result = await updateVendorOrderStatus(orderId, request, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/auth/request-otp") {
            const requester = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "native-android";
            const result = await requestPhoneOtp((body as Record<string, unknown>)?.phone, requester);
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

          if (pathname === "/api/native/complaints") {
            const result = await createNativeComplaint(request, body);
            return result.ok
              ? apiJson(result, 201)
              : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/addresses") {
            const result = await saveNativeCustomerAddresses(request, body);
            return result.ok
              ? apiJson(result)
              : apiJson({ ok: false, error: result.error }, result.status);
          }
          if (pathname === "/api/native/ops/catalog") {
            const result = await updateOperationsNativeCatalog(request, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
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
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Native-Ops-Key, X-Native-Superadmin-Key",
          "Access-Control-Max-Age": "86400",
        },
      }),
    },
  },
});
