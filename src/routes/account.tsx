import { createFileRoute } from "@tanstack/react-router";
import { AccountBody } from "@/components/eggs/customer";

export const Route = createFileRoute("/account")({
  component: AccountBody,
});
