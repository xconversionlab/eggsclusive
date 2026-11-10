import { createFileRoute } from "@tanstack/react-router";
import { WalletBody } from "@/components/eggs/customer";

export const Route = createFileRoute("/wallet")({
  component: WalletBody,
});
