import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readChennai, type ChennaiClock } from "@/lib/eggs/clock";
import { inr, tx } from "@/lib/eggs/labels";
import { packLabel } from "@/lib/eggs/pricing";
import { rankVendors, type RouteDecision } from "@/lib/eggs/routing";
import { useEggs } from "@/lib/eggs/store";
import type { Locality, Product, Street, VendorProduct } from "@/lib/eggs/types";
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
        point: address.latitude !== undefined && address.longitude !== undefined ? { lat: address.latitude, lng: address.longitude } : undefined,
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
  const row = priceOf(vendorProducts, vendorId, product.id);
  const quantity = useEggs((state) => state.cart.find((line) => line.productId === product.id && line.pack === 1)?.qtyPacks ?? 0);
  const add = useEggs((state) => state.addToCart);
  const setQty = useEggs((state) => state.setLineQty);
  const t = (text: { en: string; ta: string }) => tx(lang, text);
  const available = row?.stockEggs ?? 0;
  return (
    <article className="group relative overflow-hidden rounded-[1.65rem] border border-line bg-white p-4 shadow-[0_12px_38px_rgba(7,23,46,.055)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_46px_rgba(7,23,46,.1)] sm:p-5">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#eaf4ff] blur-2xl transition-transform duration-700 group-hover:scale-125" />
      <div className="relative flex items-center gap-4">
        <div className="float-gentle">
          <EggMark id="egg" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-emerald-700">{t({ en: "Fresh daily", ta: "தினசரி புதியது" })}</p>
          </div>
          <h3 className="mt-1 text-lg font-extrabold tracking-tight text-ink">{t(product.name)}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{t(product.blurb)}</p>
          {row ? (
            <p className="mt-2 text-sm font-bold tabular-nums text-ink">
              {inr(row.pricePerEggPaise, lang)} <span className="text-[10px] font-medium text-muted">/ {t({ en: "egg", ta: "முட்டை" })}</span>
            </p>
          ) : (
            <p className="mt-2 text-xs font-semibold text-muted">{t({ en: "Not available on this delivery route", ta: "இந்த விநியோக வழியில் கிடைக்கவில்லை" })}</p>
          )}
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
        <div>
          <p className="text-[10px] font-semibold text-muted">{available > 0 ? t({ en: "Available now", ta: "இப்போது கிடைக்கும்" }) : t({ en: "Currently unavailable", ta: "தற்போது கிடைக்கவில்லை" })}</p>
          <p className="mt-0.5 text-xs font-bold tabular-nums text-ink">{available > 0 ? t({ en: `${available} eggs`, ta: `${available} முட்டைகள்` }) : "—"}</p>
        </div>
        {quantity > 0 ? (
          <div className="flex items-center gap-3 rounded-full border border-[#c9e4fb] bg-[#eef7ff] p-1">
            <button type="button" className="quantity-button grid h-9 w-9 place-items-center rounded-full bg-white text-ink" aria-label={t({ en: "Reduce quantity", ta: "எண்ணிக்கையை குறை" })} onClick={() => setQty(product.id, 1, quantity - 1)}>−</button>
            <span className="min-w-5 text-center text-sm font-extrabold tabular-nums text-ink">{quantity}</span>
            <button type="button" className="quantity-button grid h-9 w-9 place-items-center rounded-full bg-mark text-white" aria-label={t({ en: "Add one egg", ta: "ஒரு முட்டை சேர்" })} disabled={quantity >= available} onClick={() => add(product.id, 1)}>+</button>
          </div>
        ) : (
          <button type="button" className="press blue-glow inline-flex min-h-10 items-center gap-3 rounded-full bg-ink px-5 text-xs font-extrabold uppercase tracking-[.13em] text-white disabled:opacity-40" disabled={!row || available < 1} onClick={() => add(product.id, 1)}>
            {t({ en: "Add", ta: "சேர்" })}<span className="text-base leading-none text-[#69c2ff]">+</span>
          </button>
        )}
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
