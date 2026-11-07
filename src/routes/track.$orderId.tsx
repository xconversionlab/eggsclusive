import { createFileRoute } from "@tanstack/react-router";
import { TrackBody } from "@/components/eggs/customer";

export const Route = createFileRoute("/track/$orderId")({
  component: TrackPage,
});

function TrackPage() {
  const { orderId } = Route.useParams();
  return <TrackBody orderId={orderId} />;
}
