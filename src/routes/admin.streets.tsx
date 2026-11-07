import { createFileRoute } from "@tanstack/react-router";
import { AdminStreets } from "@/components/eggs/admin";

export const Route = createFileRoute("/admin/streets")({
  component: AdminStreets,
});
