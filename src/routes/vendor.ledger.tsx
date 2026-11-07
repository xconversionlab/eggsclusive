import { createFileRoute } from "@tanstack/react-router";
import { VendorLedger } from "@/components/eggs/vendor";

export const Route = createFileRoute("/vendor/ledger")({
  component: VendorLedger,
});
