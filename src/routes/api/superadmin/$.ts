import { createFileRoute } from "@tanstack/react-router";
import { apiJson } from "@/lib/native-api.server";
import {
  getSuperAdminDashboard,
  listSuperAdminVendors,
  createSuperAdminVendor,
  setSuperAdminVendorStatus,
  assignSuperAdminOrder,
  listSuperAdminOrders,
  listSuperAdminComplaints,
  updateSuperAdminComplaintStatus,
  listSuperAdminInventory,
  updateSuperAdminInventory,
  getSuperAdminCatalog,
  updateSuperAdminCatalog,
} from "@/lib/vendor-api.server";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "request_failed";
  const status = message === "persistent_database_not_configured" ? 503 : 500;
  return apiJson({
    ok: false,
    error: status === 503
      ? "The shared database is not connected yet. Install the database integration and redeploy."
      : "The request could not be completed.",
  }, status);
}

export const Route = createFileRoute("/api/superadmin/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const pathname = new URL(request.url).pathname;
        try {
          const handlers: Record<string, (request: Request) => Promise<any>> = {
            "/api/superadmin/dashboard": getSuperAdminDashboard,
            "/api/superadmin/vendors": listSuperAdminVendors,
            "/api/superadmin/orders": listSuperAdminOrders,
            "/api/superadmin/complaints": listSuperAdminComplaints,
            "/api/superadmin/inventory": listSuperAdminInventory,
            "/api/superadmin/catalog": getSuperAdminCatalog,
          };
          const handler = handlers[pathname];
          if (!handler) return apiJson({ ok: false, error: "Not found." }, 404);
          const result = await handler(request);
          return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
        } catch (error) {
          return failure(error);
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
          if (pathname === "/api/superadmin/vendors") {
            const result = await createSuperAdminVendor(request, body);
            return result.ok ? apiJson(result, 201) : apiJson({ ok: false, error: result.error }, result.status);
          }

          const vendorPrefix = "/api/superadmin/vendors/";
          if (pathname.startsWith(vendorPrefix) && pathname.endsWith("/status")) {
            const vendorId = decodeURIComponent(pathname.slice(vendorPrefix.length, -"/status".length));
            const result = await setSuperAdminVendorStatus(request, vendorId, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }

          const orderPrefix = "/api/superadmin/orders/";
          if (pathname.startsWith(orderPrefix) && pathname.endsWith("/assign")) {
            const orderId = decodeURIComponent(pathname.slice(orderPrefix.length, -"/assign".length));
            const result = await assignSuperAdminOrder(request, orderId, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }

          const complaintPrefix = "/api/superadmin/complaints/";
          if (pathname.startsWith(complaintPrefix) && pathname.endsWith("/status")) {
            const complaintId = decodeURIComponent(pathname.slice(complaintPrefix.length, -"/status".length));
            const result = await updateSuperAdminComplaintStatus(request, complaintId, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }

          const inventoryPrefix = "/api/superadmin/inventory/";
          if (pathname.startsWith(inventoryPrefix)) {
            const parts = pathname.slice(inventoryPrefix.length).split("/");
            if (parts.length !== 2 || !parts[0] || !parts[1]) {
              return apiJson({ ok: false, error: "Invalid inventory path." }, 400);
            }
            const result = await updateSuperAdminInventory(
              request, decodeURIComponent(parts[0]), decodeURIComponent(parts[1]), body,
            );
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }

          if (pathname === "/api/superadmin/catalog") {
            const result = await updateSuperAdminCatalog(request, body);
            return result.ok ? apiJson(result) : apiJson({ ok: false, error: result.error }, result.status);
          }

          return apiJson({ ok: false, error: "Not found." }, 404);
        } catch (error) {
          return failure(error);
        }
      },
      OPTIONS: async () => new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Native-Superadmin-Key",
          "Access-Control-Max-Age": "86400",
        },
      }),
    },
  },
});
