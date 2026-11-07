import { createFileRoute } from "@tanstack/react-router";
import { OrdersBody } from "@/components/eggs/customer";

export const Route = createFileRoute("/orders")({
  component: OrdersBody,
});
