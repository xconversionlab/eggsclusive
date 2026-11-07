import { createFileRoute } from "@tanstack/react-router";
import { HomeBody } from "@/components/eggs/customer";

export const Route = createFileRoute("/")({
  component: HomeBody,
});
