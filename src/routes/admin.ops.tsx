import { createFileRoute } from "@tanstack/react-router";
import { AdminOps } from "@/components/eggs/admin";

export const Route = createFileRoute("/admin/ops")({
  component: AdminOps,
});
