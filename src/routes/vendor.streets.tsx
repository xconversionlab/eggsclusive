import { createFileRoute } from "@tanstack/react-router";
import { VendorStreets } from "@/components/eggs/vendor";

export const Route = createFileRoute("/vendor/streets")({
  component: VendorStreets,
});
