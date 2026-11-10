import { createFileRoute } from "@tanstack/react-router";
import { AdminVendors } from "@/components/eggs/admin";

export const Route = createFileRoute("/admin/vendors")({
  component: AdminVendors,
});
