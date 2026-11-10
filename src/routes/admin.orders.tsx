import { createFileRoute } from "@tanstack/react-router";
import { AdminOrders } from "@/components/eggs/admin";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});
