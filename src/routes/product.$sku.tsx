import { createFileRoute } from "@tanstack/react-router";
import { ProductBody } from "@/components/eggs/customer";

export const Route = createFileRoute("/product/$sku")({
  component: ProductPage,
});

function ProductPage() {
  const { sku } = Route.useParams();
  return <ProductBody sku={sku} />;
}
