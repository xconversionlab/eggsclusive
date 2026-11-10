import { createFileRoute } from "@tanstack/react-router";
import { VendorStock } from "@/components/eggs/vendor";

export const Route = createFileRoute("/vendor/stock")({
  component: VendorStock,
});
