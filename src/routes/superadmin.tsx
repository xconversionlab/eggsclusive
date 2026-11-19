import { createFileRoute } from "@tanstack/react-router";
import { SuperAdminApp } from "@/components/eggs/superadmin";

export const Route = createFileRoute("/superadmin")({
  component: SuperAdminApp,
});
