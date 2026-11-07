import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalogue } from "@/components/eggs/admin";

export const Route = createFileRoute("/admin/catalogue")({
  component: AdminCatalogue,
});
