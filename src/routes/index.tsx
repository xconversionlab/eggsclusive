import { createFileRoute } from "@tanstack/react-router";
import { SpencersCustomerApp } from "@/components/eggs/spencers-customer";

function CustomerEntry() {
  return (
    <div className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-customer">
      <SpencersCustomerApp />
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: CustomerEntry,
});
