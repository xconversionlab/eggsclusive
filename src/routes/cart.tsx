import { createFileRoute } from "@tanstack/react-router";
import { CartBody } from "@/components/eggs/customer";

export const Route = createFileRoute("/cart")({
  component: CartBody,
});
