import { createFileRoute } from "@tanstack/react-router";
import { SpencersCustomerApp } from "@/components/eggs/spencers-customer";

export const Route = createFileRoute("/")({
  component: SpencersCustomerApp,
});
