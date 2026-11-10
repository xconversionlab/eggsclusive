import { createFileRoute } from "@tanstack/react-router";
import { PlansBody } from "@/components/eggs/customer";

export const Route = createFileRoute("/plans")({
  component: PlansBody,
});
