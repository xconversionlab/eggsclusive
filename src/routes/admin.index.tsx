import { createFileRoute } from "@tanstack/react-router";
import { AdminHome } from "@/components/eggs/admin";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});
