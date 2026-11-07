import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readChennai, type ChennaiClock } from "@/lib/eggs/clock";
import { inr, tx } from "@/lib/eggs/labels";
import { packLabel } from "@/lib/eggs/pricing";
import { rankVendors, type RouteDecision } from "@/lib/eggs/routing";
import { useEggs } from "@/lib/eggs/store";
import type { Locality, Product, Street, Vendor, VendorProduct } from "@/lib/eggs/types";
import { Button, cn, EggMark, Panel } from "./ui";

export function useShop() {
  const address = useEggs((s) => s.address);
  const streets = useEggs((s) => s.streets);
  const localities = useEggs((s) => s.localities);
  const vendors = useEggs((s) => s.vendors);
  const assignments = useEggs((s) => s.assignments);
  const vendorProducts = useEggs((s) => s.vendorProducts);
  const capacities = useEggs((s) => s.capacities);
  const slots = useEggs((s) => s.slots);
  const products = useEggs((s) => s.products);
  const cartVendorId = useEggs((s) => s.cartVendorId);
  const lang = useEggs((s) => s.lang);
  const [clock, setClock] = useState<ChennaiClock>(() => readChennai());
  useEffect(() => {
    const t = setInterval(() => setClock(readChennai()), 30000);
    return () => clearInterval(t);
  }, []);
  const decision: RouteDecision | null = address
    ? rankVendors({
        streetId: address.streetId,
        streets,
        vendors,
        assignments,
        vendorProducts,
        capacities,
        slots,
        clock,
      })
    : null;
  const vendorId =
    cartVendorId && decision?.ranked.some((r) => r.vendorId === cartVendorId && r.eligible)
      ? cartVendorId
      : (decision?.recommendedId ?? null);
  const vendor = vendors.find((v) => v.id === vendorId) ?? null;
  const street = streets.find((s) => s.id === address?.streetId) ?? null;
  const locality = localities.find((l) => l.id === address?.localityId) ?? null;
  return { clock, decision, vendorId, vendor, street, locality, products, vendorProducts, slots, capacities, lang, address };
}

export function priceOf(rows: VendorProduct[], vendorId: string | null, productId: string) {
  return rows.find((r) => r.vendorId === vendorId && r.productId === productId && r.active) ?? null;
}

export function ProductCard({ product }: { product: Product }) {
  const { vendorId, vendorProducts, lang } = useShop();
  const fav = useEggs((s) => s.favourites.includes(product.id));
  const toggle = useEggs((s) => s.toggleFav);
  const t = (text: { en: string; ta: string }) => tx(lang, text);
  const row = priceOf(vendorProducts, vendorId, product.id);
  return (
    <article className="flex gap-3 rounded-card border border-line bg-shell p-3">
      <EggMark id={product.id} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium">{t(product.name)}</h3>
          <button className="min-h-11 px-2 text-sm text-muted" onClick={() => toggle(product.id)} aria-pressed={fav}>
            {fav ? t({ en: "Saved", ta: "சேமிப்பு" }) : t({ en: "Save", ta: "சேமி" })}
          </button>
        </div>
        <p className="text-sm text-muted">{t(product.blurb)}</p>
        {row ? (
          <p className="mt-2 text-sm tabular-nums">
            {inr(row.pricePerEggPaise, lang)}
            <span className="text-muted"> {t({ en: " / egg", ta: " / முட்டை" })}</span>
            <span className="text-muted"> · {row.stockEggs} {t({ en: "in stock", ta: "இருப்பில்" })}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">{t({ en: "Not carried on this street’s shop.", ta: "இந்தத் தெருக் கடையில் இல்லை." })}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {product.packs.slice(0, 4).map((pack) => (
            <Link
              key={pack}
              to="/product/$sku"
              params={{ sku: product.id }}
              className="press inline-flex min-h-11 items-center rounded-control border border-line px-3 text-sm"
            >
              {packLabel(pack, lang)}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

export function CityDots({ activeId }: { activeId?: string }) {
  const localities = useEggs((s) => s.localities);
  const streets = useEggs((s) => s.streets);
  const assignments = useEggs((s) => s.assignments);
  const lang = useEggs((s) => s.lang);
  const lats = localities.map((l) => l.lat);
  const lngs = localities.map((l) => l.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return (
    <div className="relative h-64 overflow-hidden rounded-card border border-line bg-foam">
      {localities.map((loc) => {
        const x = ((loc.lng - minLng) / (maxLng - minLng || 1)) * 78 + 11;
        const y = ((maxLat - loc.lat) / (maxLat - minLat || 1)) * 70 + 14;
        const served = streets.some(
          (s) => s.localityId === loc.id && s.status === "active" && assignments.some((a) => a.streetId === s.id),
        );
        return (
          <div key={loc.id} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
            <div className="-translate-x-1/2 text-center">
              <div className={cn("mx-auto h-2.5 w-2.5 rounded-full", served ? "bg-ink" : "bg-line", loc.id === activeId && "ring-2 ring-mark ring-offset-2 ring-offset-foam")} />
              <div className={cn("mt-1 text-xs", loc.id === activeId ? "text-ink" : "text-muted")}>{tx(lang, loc.name).split(" ")[0]}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StreetLine({ street, locality }: { street: Street | null; locality: Locality | null }) {
  const lang = useEggs((s) => s.lang);
  const address = useEggs((s) => s.address);
  const edit = useEggs((s) => s.setEditingStreet);
  if (!street || !locality || !address) return null;
  return (
    <Panel className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-muted">{tx(lang, locality.name)} · {address.pin}</p>
        <h2 className="font-display text-3xl tracking-tight">{address.door}, {tx(lang, street.name)}</h2>
        {address.landmark ? <p className="mt-1 text-sm text-muted">{address.landmark}</p> : null}
      </div>
      <Button variant="line" onClick={() => edit(true)}>
        {tx(lang, { en: "Change", ta: "மாற்று" })}
      </Button>
    </Panel>
  );
}
