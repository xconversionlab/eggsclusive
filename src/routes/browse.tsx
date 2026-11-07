import { createFileRoute } from "@tanstack/react-router";
import { BrowseBody } from "@/components/eggs/customer";

export const Route = createFileRoute("/browse")({
  component: BrowseBody,
});
