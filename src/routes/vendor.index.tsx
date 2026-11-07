import { createFileRoute } from "@tanstack/react-router";
import { VendorHome } from "@/components/eggs/vendor";

export const Route = createFileRoute("/vendor/")({
  component: VendorHome,
});
