import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { addDays, formatDay, formatWhen } from "@/lib/eggs/clock";
import { ACCOUNT_LABEL, bi, EXCEPTION_LABEL, inr, ISSUE_KIND, PAY_LABEL, STATUS_LABEL, tx } from "@/lib/eggs/labels";
import { packLabel, quoteCart } from "@/lib/eggs/pricing";
import { rankVendors, seatsLeft } from "@/lib/eggs/routing";
import { useEggs } from "@/lib/eggs/store";
import type { AccountType, PayMethod } from "@/lib/eggs/types";
import { priceOf, ProductCard, StreetLine, useShop } from "./catalog";
import { Gate } from "./frame";
import { Button, Chip, cn, Field, Panel, TextArea } from "./ui";

function useT() {
  const lang = useEggs((s) => s.lang);
  return (text: { en: string; ta: string }) => tx(lang, text);
}

export function HomeBody() {
  const t = useT();
  const shop = useShop();
  const orders = useEggs((s) => s.orders);
  const wallet = useEggs((s) => s.walletPaise);
  const hour = shop.clock.hour;
  const greet = hour < 12
    ? bi("Good morning.", "காலை வணக்கம்.")
    : hour < 17
      ? bi("Good afternoon.", "மதிய வணக்கம்.")
      : bi("Good evening.", "மாலை வணக்கம்.");
  const active = orders.find((order) => order.customerKey === "self" && !["delivered", "cancelled", "rejected"].includes(order.status));
  const egg = shop.products.find((product) => product.id === "egg" && product.active);
  const eggRow = egg ? priceOf(shop.vendorProducts, shop.vendorId, egg.id) : null;
  return (
    <Gate>
      <div className="flex flex-col gap-5">
        <section className="relative overflow-hidden rounded-[1.8rem] bg-[#07172e] px-5 py-6 text-white shadow-[0_20px_54px_rgba(7,23,46,.18)] sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-1 top-8 h-32 w-32 rounded-full border border-white/10" />
          <div className="relative z-10">
            <p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-[#72c6ff]">{t(bi("Spencers Enterprices · Chennai", "Spencers Enterprices · சென்னை"))}</p>
            <h1 className="mt-3 max-w-sm text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-4xl">{t(bi("Fresh eggs. On your time.", "புதிய முட்டைகள். உங்கள் நேரத்தில்."))}</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">{t(greet)} {t(bi("Order by the egg. We’ll match your address with an available local delivery partner.", "ஒவ்வொரு முட்டையாக ஆர்டர் செய்யுங்கள். உங்கள் முகவரிக்கு கிடைக்கும் உள்ளூர் டெலிவரி கடையை இணைக்கிறோம்."))}</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#56d69a] shadow-[0_0_12px_rgba(86,214,154,.8)]" />
              {shop.vendor ? t(bi("Delivery partner available", "டெலிவரி கடை கிடைக்கிறது")) : t(bi("Checking your delivery area", "உங்கள் விநியோக பகுதியைச் சரிபார்க்கிறது"))}
            </div>
          </div>
        </section>
        <StreetLine street={shop.street} locality={shop.locality} />
        {shop.vendor && shop.street ? (
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-mark">{t(bi("Your local partner", "உங்கள் உள்ளூர் கடை"))}</p>
              <p className="mt-1 truncate text-sm font-bold">{t(shop.vendor.name)}</p>
              <p className="mt-0.5 text-xs text-muted">{t(bi("Up to", "அதிகபட்சம்"))} {shop.vendor.deliveryRadiusKm} km {t(bi("service radius", "விநியோக எல்லை"))}</p>
            </div>
            <div className="rounded-2xl border border-line bg-white px-3 py-2 text-right">
              <p className="text-[10px] font-semibold text-muted">{t(bi("Wallet", "பணப்பை"))}</p>
              <p className="text-sm font-extrabold tabular-nums">{inr(wallet, shop.lang)}</p>
            </div>
          </div>
        ) : (
          <Panel className="border-[#f1d6b4] bg-[#fffaf3]">
            <p className="text-sm font-bold">{t(EXCEPTION_LABEL[shop.decision?.exception ?? "NO_VENDOR"])}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{t(bi("You can request service for your street. The delivery team can configure a suitable radius as vendors become available.", "உங்கள் தெருவுக்கு சேவையை கோரலாம். கடைகள் கிடைக்கும் போது டெலிவரி குழு பொருத்தமான எல்லையை அமைக்கலாம்."))}</p>
          </Panel>
        )}
        {active ? (
          <Link to="/track/$orderId" params={{ orderId: active.id }} className="press flex items-center justify-between rounded-2xl border border-[#cfe6fb] bg-[#eef7ff] p-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-mark">{t(bi("Order in progress", "நடப்பில் உள்ள ஆர்டர்"))}</p>
              <p className="mt-1 text-sm font-bold">{active.id}</p>
              <p className="mt-1 text-xs text-muted">{t(STATUS_LABEL[active.status])}</p>
            </div>
            <span className="text-2xl text-mark">↗</span>
          </Link>
        ) : null}
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-mark">{t(bi("Simple, everyday", "எளிமையான தினசரி"))}</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight">{t(bi("Your eggs", "உங்கள் முட்டைகள்"))}</h2>
          </div>
          <span className="text-xs font-semibold text-muted">{eggRow ? t(bi("In stock", "இருப்பில் உள்ளது")) : t(bi("Check area", "பகுதியைச் சரிபார்க்கவும்"))}</span>
        </div>
        {egg ? <ProductCard product={egg} /> : null}
        <Link to="/browse" className="press flex min-h-12 items-center justify-center rounded-xl border border-line bg-white text-sm font-bold">{t(bi("Choose quantity and order", "எண்ணிக்கையைத் தேர்வு செய்து ஆர்டர் செய்யுங்கள்"))} <span className="ml-2 text-mark">→</span></Link>
      </div>
    </Gate>
  );
}

export function BrowseBody() {
  const t = useT();
  const shop = useShop();
  const egg = shop.products.find((product) => product.id === "egg" && product.active);
  const row = egg ? priceOf(shop.vendorProducts, shop.vendorId, egg.id) : null;
  return (
    <Gate>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-mark">{t(bi("Spencers Enterprices", "Spencers Enterprices"))}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t(bi("Order fresh eggs", "புதிய முட்டைகளை ஆர்டர் செய்யுங்கள்"))}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{t(bi("One fresh egg. Any quantity. Add or reduce one at a time, just like your favourite food-delivery app.", "ஒரே ஒரு வகை புதிய முட்டை. வேண்டிய எண்ணிக்கை. உணவு டெலிவரி செயலியைப் போல ஒவ்வொன்றாக கூட்டவும் குறைக்கவும்."))}</p>
        </div>
        {egg && row && row.stockEggs > 0 ? <ProductCard product={egg} /> : (
          <Panel className="border-[#f1d6b4] bg-[#fffaf3]">
            <p className="font-bold">{t(bi("Delivery is not available yet", "டெலிவரி இன்னும் கிடைக்கவில்லை"))}</p>
            <p className="mt-1 text-sm text-muted">{t(bi("Your address may be outside the current delivery radius, or the local partner may be temporarily unavailable.", "உங்கள் முகவரி தற்போதைய டெலிவரி எல்லைக்கு வெளியே இருக்கலாம் அல்லது உள்ளூர் கடை தற்காலிகமாக கிடைக்காமல் இருக்கலாம்."))}</p>
          </Panel>
        )}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf3fc] text-mark">✓</span>
          <div>
            <p className="text-sm font-bold">{t(bi("One product. Clear pricing.", "ஒரே பொருள். தெளிவான விலை."))}</p>
            <p className="text-xs text-muted">{t(bi("Price is set by the partner serving your delivery area.", "உங்கள் விநியோகப் பகுதியைச் சேவை செய்யும் கடை விலையை நிர்ணயிக்கும்."))}</p>
          </div>
        </div>
      </div>
    </Gate>
  );
}

export function ProductBody({ sku }: { sku: string }) {
  const t = useT();
  const shop = useShop();
  const product = shop.products.find((item) => item.id === sku);
  const add = useEggs((state) => state.addToCart);
  const setQty = useEggs((state) => state.setLineQty);
  const createSub = useEggs((state) => state.createSub);
  const quantity = useEggs((state) => state.cart.find((line) => line.productId === sku && line.pack === 1)?.qtyPacks ?? 0);
  const [cadence, setCadence] = useState<"daily" | "weekly">("daily");
  if (!product) {
    return <Gate><p>{t(bi("This product is not available.", "இந்தப் பொருள் கிடைக்கவில்லை."))}</p></Gate>;
  }
  const row = priceOf(shop.vendorProducts, shop.vendorId, product.id);
  const available = row?.stockEggs ?? 0;
  return (
    <Gate>
      <div className="flex flex-col gap-5">
        <div className="relative overflow-hidden rounded-[1.8rem] border border-line bg-white p-5 shadow-panel sm:p-7">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#eaf3fc] blur-2xl" />
          <div className="relative flex min-h-52 flex-col items-center justify-center text-center">
            <div className="float-gentle"><EggRow id="egg" /></div>
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[.2em] text-mark">{t(bi("One simple choice", "ஒரே ஒரு எளிய தேர்வு"))}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{t(product.name)}</h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{t(product.blurb)}</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 rounded-2xl border border-line bg-white p-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-muted">{t(bi("Price per egg", "ஒரு முட்டையின் விலை"))}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{row ? inr(row.pricePerEggPaise, shop.lang) : "—"}</p>
            <p className="mt-1 text-xs text-muted">{t(bi("Available", "இருப்பில்"))}: {available} {t(bi("eggs", "முட்டைகள்"))}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#c9e4fb] bg-[#eef7ff] p-1.5">
            <button type="button" aria-label={t(bi("Reduce quantity", "எண்ணிக்கையை குறை"))} className="quantity-button grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-bold" disabled={quantity === 0} onClick={() => setQty(product.id, 1, quantity - 1)}>−</button>
            <span className="min-w-7 text-center text-lg font-extrabold tabular-nums">{quantity}</span>
            <button type="button" aria-label={t(bi("Add one egg", "ஒரு முட்டை சேர்"))} className="quantity-button grid h-10 w-10 place-items-center rounded-full bg-mark text-xl font-bold text-white" disabled={!row || quantity >= available} onClick={() => add(product.id, 1)}>+</button>
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-semibold text-muted">{t(bi("Current total", "தற்போதைய மொத்தம்"))}</span>
          <span className="text-xl font-extrabold tabular-nums">{inr((row?.pricePerEggPaise ?? 0) * quantity, shop.lang)}</span>
        </div>
        <Link to="/cart" className="press blue-glow flex min-h-14 items-center justify-center rounded-2xl bg-ink px-5 text-sm font-extrabold text-white">
          {t(bi("Continue to basket", "கூடைக்குச் செல்லுங்கள்"))} <span className="ml-2 text-[#69c2ff]">→</span>
        </Link>
        <Panel className="flex flex-col gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-mark">{t(bi("Regular delivery", "தொடர்ச்சியான விநியோகம்"))}</p>
            <h2 className="mt-1 text-lg font-extrabold">{t(bi("Make eggs a daily essential", "தினசரி தேவையாக முட்டைகளைப் பெறுங்கள்"))}</h2>
            <p className="mt-1 text-xs leading-5 text-muted">{t(bi("A subscription uses the same local partner and delivery address. It will pause rather than silently switch shops if availability changes.", "சந்தா அதே உள்ளூர் கடை மற்றும் முகவரியைப் பயன்படுத்தும். கிடைப்பில் மாற்றம் ஏற்பட்டால் வேறு கடைக்கு தானாக மாறாது; இடைநிறுத்தப்படும்."))}</p>
          </div>
          <div className="flex gap-2">
            <Chip active={cadence === "daily"} onClick={() => setCadence("daily")}>{t(bi("Daily", "தினமும்"))}</Chip>
            <Chip active={cadence === "weekly"} onClick={() => setCadence("weekly")}>{t(bi("Weekly", "வாரம்"))}</Chip>
          </div>
          <Button variant="line" disabled={!row || quantity < 1} onClick={() => createSub({ productId: product.id, pack: 1, qtyPacks: quantity, cadence, slotId: "dawn" })}>
            {t(bi("Start with current quantity", "தற்போதைய எண்ணிக்கையுடன் தொடங்கு"))}
          </Button>
        </Panel>
      </div>
    </Gate>
  );
}


export function CartBody() {
  const t = useT();
  const navigate = useNavigate();
  const shop = useShop();
  const cart = useEggs((s) => s.cart);
  const setQty = useEggs((s) => s.setLineQty);
  const setCoupon = useEggs((s) => s.setCoupon);
  const couponCode = useEggs((s) => s.couponCode);
  const coupons = useEggs((s) => s.coupons);
  const place = useEggs((s) => s.placeOrder);
  const profile = useEggs((s) => s.profile);
  const orders = useEggs((s) => s.orders);
  const wallet = useEggs((s) => s.walletPaise);
  const config = useEggs((s) => s.config);
  const setCartVendor = useEggs((s) => s.setCartVendor);
  const cartVendorId = useEggs((s) => s.cartVendorId);
  const streets = useEggs((s) => s.streets);
  const vendors = useEggs((s) => s.vendors);
  const assignments = useEggs((s) => s.assignments);
  const [datePick, setDatePick] = useState<"today" | "tomorrow">("today");
  const [slotId, setSlotId] = useState("late");
  const [method, setMethod] = useState<PayMethod>("cod");
  const [useWallet, setUseWallet] = useState(false);
  const [code, setCode] = useState("");
  const [upiOpen, setUpiOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const date = datePick === "today" ? shop.clock.isoDate : addDays(shop.clock.isoDate, 1);
  const prior = orders.filter((o) => o.customerKey === "self" && o.status !== "cancelled" && o.status !== "rejected").length;
  const coupon = coupons.find((c) => c.code === couponCode) ?? null;
  const slot = shop.slots.find((s) => s.id === slotId);
  const quote = quoteCart({
    lines: cart,
    vendorId: cartVendorId,
    vendorProducts: shop.vendorProducts,
    accountType: profile.accountType,
    tradeBps: config.tradeBps,
    coupon,
    slot,
    priorOrders: prior,
  });
  const walletOff = useWallet ? Math.min(wallet, quote.total) : 0;
  const due = Math.max(0, quote.total - walletOff);
  const demand = cart.map((l) => ({ productId: l.productId, eggs: l.pack * l.qtyPacks }));
  const decision = shop.address
    ? rankVendors({
        streetId: shop.address.streetId,
        streets,
        vendors,
        assignments,
        vendorProducts: shop.vendorProducts,
        capacities: shop.capacities,
        slots: shop.slots,
        clock: shop.clock,
        demand,
        slotId,
        date,
        point: shop.address.latitude !== undefined && shop.address.longitude !== undefined ? { lat: shop.address.latitude, lng: shop.address.longitude } : undefined,
      })
    : null;
  const mine = decision?.ranked.find((r) => r.vendorId === cartVendorId);
  const alternatives = decision?.ranked.filter((r) => r.eligible && r.vendorId !== cartVendorId) ?? [];
  return (
    <Gate>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-mark">{t(bi("Checkout", "செலுத்துதல்"))} · DEMO</p>
          <h1 className="mt-1 font-display text-4xl">{t(bi("Your basket", "உங்கள் கூடை"))}</h1>
          <p className="mt-2 text-sm leading-5 text-muted">{t(bi("Review your eggs, delivery slot and payment before confirming.", "உறுதி செய்வதற்கு முன் முட்டைகள், விநியோக நேரம் மற்றும் கட்டணத்தைச் சரிபார்க்கவும்."))}</p>
        </div>
        {shop.address ? (
          <Panel className="flex items-start justify-between gap-3 border-[#cfe6fb] bg-[#f5faff]">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-mark">{t(bi("Delivering to", "விநியோக முகவரி"))}</p>
              <p className="mt-1 text-sm font-bold">{[shop.address.door, shop.address.apartment, shop.address.addressLine, shop.address.landmark].filter(Boolean).join(", ")}</p>
              <p className="mt-1 text-[10px] text-muted">{shop.address.latitude?.toFixed(5)}, {shop.address.longitude?.toFixed(5)}</p>
            </div>
            <button type="button" className="press shrink-0 text-xs font-bold text-mark" onClick={() => useEggs.getState().setEditingStreet(true)}>{t(bi("Change", "மாற்று"))}</button>
          </Panel>
        ) : null}
        {cart.length === 0 ? <p className="text-sm text-muted">{t(bi("The basket is empty.", "கூடை காலி."))}</p> : null}
        {cart.map((line) => {
          const product = shop.products.find((p) => p.id === line.productId);
          const row = priceOf(shop.vendorProducts, cartVendorId, line.productId);
          return (
            <Panel key={`${line.productId}-${line.pack}`} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{product ? t(product.name) : line.productId}</p>
                <p className="text-sm text-muted">{t(bi("Quantity", "எண்ணிக்கை"))}: {line.qtyPacks} · {row ? inr(row.pricePerEggPaise, shop.lang) : ""} {t(bi("per egg", "ஒரு முட்டை"))}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#c9e4fb] bg-[#eef7ff] p-1">
                <button type="button" className="quantity-button grid h-9 w-9 place-items-center rounded-full bg-white text-xl font-bold" aria-label="Reduce eggs" onClick={() => setQty(line.productId, 1, line.qtyPacks - 1)}>−</button>
                <span className="min-w-6 text-center text-sm font-extrabold tabular-nums">{line.qtyPacks}</span>
                <button type="button" className="quantity-button grid h-9 w-9 place-items-center rounded-full bg-mark text-xl font-bold text-white" aria-label="Add one egg" onClick={() => setQty(line.productId, 1, line.qtyPacks + 1)}>+</button>
              </div>
            </Panel>
          );
        })}
        <div className="flex gap-2">
          <Chip active={datePick === "today"} onClick={() => setDatePick("today")}>{t(bi("Today", "இன்று"))}</Chip>
          <Chip active={datePick === "tomorrow"} onClick={() => setDatePick("tomorrow")}>{t(bi("Tomorrow", "நாளை"))}</Chip>
        </div>
        <div className="flex flex-col gap-2">
          {shop.slots.map((s) => {
            const left = cartVendorId ? seatsLeft(shop.capacities, cartVendorId, s.id, date).left : 0;
            return (
              <Chip key={s.id} active={slotId === s.id} onClick={() => setSlotId(s.id)}>
                {t(s.label)} · {s.start}–{s.end} · {left === 0 ? t(bi("Full", "நிரம்பியது")) : `${left} ${t(bi("left", "மீதம்"))}`}
              </Chip>
            );
          })}
        </div>
        {mine && !mine.eligible ? (
          <Panel>
            <p className="text-sm">{t(EXCEPTION_LABEL[mine.reason ?? decision?.exception ?? "NO_VENDOR"])}</p>
            <p className="mt-2 text-sm text-muted">{t(bi("A paid or in-progress order is never moved for you. You can switch the basket yourself.", "செலுத்திய அல்லது நடப்பில் உள்ள ஆர்டர் தானாக மாறாது. கூடையை நீங்களே மாற்றலாம்."))}</p>
            <div className="mt-3 flex flex-col gap-2">
              {alternatives.map((alt) => {
                const vendor = vendors.find((v) => v.id === alt.vendorId);
                return (
                  <Button key={alt.vendorId} variant="line" onClick={() => setCartVendor(alt.vendorId)}>
                    {t(bi(`Use ${vendor?.name.en ?? "backup"}`, `${vendor?.name.ta ?? "மாற்று"} கடையைப் பயன்படுத்து`))}
                  </Button>
                );
              })}
            </div>
          </Panel>
        ) : null}
        <div className="flex gap-2">
          {config.upiEnabled ? <Chip active={method === "upi"} onClick={() => setMethod("upi")}>{t(PAY_LABEL.upi)}</Chip> : null}
          {config.codEnabled ? <Chip active={method === "cod"} onClick={() => setMethod("cod")}>{t(PAY_LABEL.cod)}</Chip> : null}
        </div>
        {config.walletEnabled ? (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} />
            {t(bi("Use wallet", "பணப்பையைப் பயன்படுத்து"))} · {inr(wallet, shop.lang)}
          </label>
        ) : null}
        <div className="flex gap-2">
          <Field value={code} onChange={(e) => setCode(e.target.value)} placeholder="DAWN15" />
          <Button variant="line" onClick={() => setCoupon(code)}>{t(bi("Apply", "பொருத்து"))}</Button>
        </div>
        <ul className="text-sm text-muted">
          {coupons.filter((c) => c.active).map((c) => (
            <li key={c.code}>{c.code} — {t(c.label)}</li>
          ))}
        </ul>
        <Panel>
          <Row k={t(bi("Eggs", "முட்டை"))} v={String(quote.eggs)} />
          <Row k={t(bi("Subtotal", "கூட்டுத்தொகை"))} v={inr(quote.subtotal, shop.lang)} />
          {quote.trade > 0 ? <Row k={t(bi("Trade price", "வணிக விலை"))} v={`−${inr(quote.trade, shop.lang)}`} /> : null}
          {quote.couponOff > 0 ? <Row k={couponCode ?? ""} v={`−${inr(quote.couponOff, shop.lang)}`} /> : null}
          {walletOff > 0 ? <Row k={t(bi("Wallet", "பணப்பை"))} v={`−${inr(walletOff, shop.lang)}`} /> : null}
          <Row k={t(bi("Due", "செலுத்த"))} v={inr(due, shop.lang)} />
        </Panel>
        {method === "upi" && due > 0 ? (
          upiOpen ? (
            <Panel className="flex flex-col gap-3 border-[#cfe6fb] bg-[#f5faff]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold">{t(bi("Demo UPI payment", "டெமோ UPI கட்டணம்"))}</p>
                <span className="rounded-full bg-[#dff7eb] px-2 py-1 text-[9px] font-extrabold text-[#087747]">TEST MODE</span>
              </div>
              <div className="rounded-xl border border-dashed border-[#b8d8f2] bg-white p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">{t(bi("Amount to simulate", "டெமோ தொகை"))}</p>
                <p className="mt-1 text-3xl font-extrabold tabular-nums">{inr(due, shop.lang)}</p>
                <p className="mt-2 text-xs text-muted">eggsclusive@okaxis</p>
              </div>
              <p className="text-xs leading-5 text-muted">{t(bi("No UPI app opens and no money moves. Confirm below to simulate a successful payment for this demo order.", "UPI செயலி திறக்கப்படாது; பணம் பரிமாறப்படாது. டெமோ ஆர்டருக்கான வெற்றிகரமான கட்டணத்தை உருவகப்படுத்த கீழே உறுதி செய்யுங்கள்."))}</p>
              <Button className="w-full" data-testid="place-order" disabled={!mine?.eligible || cart.length === 0 || placing} onClick={() => {
                setPlacing(true);
                window.setTimeout(() => {
                  const id = place({ slotId, date, method: "upi", useWallet });
                  if (id) void navigate({ to: "/track/$orderId", params: { orderId: id } });
                  setPlacing(false);
                }, 650);
              }}>
                {placing ? t(bi("Confirming payment…", "கட்டணத்தை உறுதி செய்கிறது…")) : t(bi("Simulate successful payment", "டெமோ கட்டணத்தை வெற்றிகரமாக்கு"))}
              </Button>
              <Button variant="line" className="w-full" disabled={placing} onClick={() => setUpiOpen(false)}>{t(bi("Back to payment options", "கட்டண முறைகளுக்குத் திரும்பு"))}</Button>
            </Panel>
          ) : (
            <Button className="w-full" disabled={!mine?.eligible || cart.length === 0} onClick={() => setUpiOpen(true)}>
              {t(bi("Continue to demo UPI", "டெமோ UPI-க்கு தொடரவும்"))} · {inr(due, shop.lang)}
            </Button>
          )
        ) : (
          <Button className="w-full" data-testid="place-order" disabled={!mine?.eligible || cart.length === 0 || placing} onClick={() => {
            setPlacing(true);
            const id = place({ slotId, date, method: due === 0 ? "wallet" : method, useWallet });
            if (id) void navigate({ to: "/track/$orderId", params: { orderId: id } });
            setPlacing(false);
          }}>
            {placing ? t(bi("Placing your order…", "ஆர்டர் செய்கிறது…")) : due === 0 ? t(bi("Confirm wallet order", "பணப்பை ஆர்டரை உறுதி செய்")) : t(bi("Place cash on delivery order", "பணம் கொடுத்து ஆர்டர் செய்"))}
          </Button>
        )}
      </div>
    </Gate>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex justify-between gap-3 text-sm">
      <span className="text-muted">{k}</span>
      <span className="tabular-nums">{v}</span>
    </p>
  );
}

export function OrdersBody() {
  const t = useT();
  const lang = useEggs((s) => s.lang);
  const orders = useEggs(useShallow((s) => s.orders.filter((o) => o.customerKey === "self")));
  const reorder = useEggs((s) => s.reorder);
  const products = useEggs((s) => s.products);
  return (
    <Gate>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-4xl">{t(bi("Orders", "ஆர்டர்கள்"))}</h1>
        {orders.length === 0 ? <p className="text-sm text-muted">{t(bi("No orders yet.", "இன்னும் ஆர்டர் இல்லை."))}</p> : null}
        {orders.map((order) => (
          <Panel key={order.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{order.id} · {formatDay(order.date, lang)}</p>
                <p className="font-medium">{t(STATUS_LABEL[order.status])}</p>
                <p className="text-sm text-muted">
                  {order.lines.map((l) => `${products.find((p) => p.id === l.productId)?.name[lang] ?? l.productId} · ${packLabel(l.pack, lang)} × ${l.qtyPacks}`).join(", ")}
                </p>
              </div>
              <p className="tabular-nums">{inr(order.totalPaise, lang)}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Link to="/track/$orderId" params={{ orderId: order.id }} className="press inline-flex min-h-11 items-center rounded-control border border-line px-3 text-sm">
                {t(bi("Track", "தடம்"))}
              </Link>
              <Button variant="line" onClick={() => reorder(order.id)}>{t(bi("Reorder", "மீண்டும்"))}</Button>
            </div>
          </Panel>
        ))}
        <Link to="/cart" className="text-sm font-medium underline">{t(bi("Open basket", "கூடையைத் திற"))}</Link>
      </div>
    </Gate>
  );
}

export function TrackBody({ orderId }: { orderId: string }) {
  const t = useT();
  const lang = useEggs((s) => s.lang);
  const order = useEggs((s) => s.orders.find((o) => o.id === orderId && o.customerKey === "self"));
  const vendors = useEggs((s) => s.vendors);
  const streets = useEggs((s) => s.streets);
  const slots = useEggs((s) => s.slots);
  const cancel = useEggs((s) => s.cancelOrder);
  const rate = useEggs((s) => s.rateOrder);
  const report = useEggs((s) => s.reportIssue);
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<"broken" | "replacement" | "refund">("broken");
  if (!order) {
    return (
      <Gate>
        <p>{t(bi("Order not on this account.", "இந்தக் கணக்கில் ஆர்டர் இல்லை."))}</p>
      </Gate>
    );
  }
  const vendor = vendors.find((v) => v.id === order.vendorId);
  const street = streets.find((s) => s.id === order.address.streetId);
  const slot = slots.find((s) => s.id === order.slotId);
  const steps = ["placed", "accepted", "preparing", "out_for_delivery", "delivered"] as const;
  return (
    <Gate>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted">{order.id}</p>
          <h1 className="font-display text-4xl">{t(STATUS_LABEL[order.status])}</h1>
        </div>
        <Panel>
          <p className="font-medium">{vendor ? t(vendor.name) : order.vendorId}</p>
          <p className="text-sm text-muted">
            {street ? t(street.name) : ""} · {slot ? `${t(slot.label)} ${slot.start}–${slot.end}` : ""} · {formatDay(order.date, lang)}
          </p>
          <p className="mt-2 text-sm">{t(PAY_LABEL[order.method])} · {inr(order.totalPaise, lang)}</p>
          {order.capturedPaise > 0 ? <p className="mt-1 text-sm text-muted">{t(bi("Money is captured, so this order cannot be moved to another shop.", "பணம் பிடிக்கப்பட்டதால் இந்த ஆர்டர் வேறு கடைக்குப் போகாது."))}</p> : null}
        </Panel>
        <ol className="flex flex-col gap-2">
          {order.events.map((ev, i) => (
            <li key={i} className="text-sm">
              <span className="text-muted">{formatWhen(ev.at, lang)} · </span>
              {t(ev.text)}
            </li>
          ))}
        </ol>
        {order.status !== "cancelled" && order.status !== "rejected" && order.status !== "delivered" ? (
          <div className="flex gap-1">
            {steps.map((step) => (
              <span key={step} className={`h-1 flex-1 rounded-full ${steps.indexOf(step) <= steps.indexOf(order.status as (typeof steps)[number]) ? "bg-ink" : "bg-line"}`} />
            ))}
          </div>
        ) : null}
        {order.status === "placed" || order.status === "accepted" || order.status === "preparing" ? (
          <Button variant="line" onClick={() => cancel(order.id)}>
            {order.status === "placed" ? t(bi("Cancel", "ரத்து")) : t(bi("Ask to cancel", "ரத்து கோரு"))}
          </Button>
        ) : null}
        {order.status === "delivered" && !order.rating ? (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button key={n} variant="line" onClick={() => rate(order.id, n)}>{n}</Button>
            ))}
          </div>
        ) : null}
        {order.status === "delivered" ? (
          <Panel className="flex flex-col gap-3">
            <h2 className="font-medium">{t(bi("Something wrong with the eggs?", "முட்டையில் பிரச்சனையா?"))}</h2>
            <div className="flex flex-wrap gap-2">
              {(["broken", "replacement", "refund"] as const).map((k) => (
                <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{t(ISSUE_KIND[k])}</Chip>
              ))}
            </div>
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t(bi("How many, and which pack?", "எத்தனை, எந்தப் பொதி?"))} />
            <Button disabled={!note.trim()} onClick={() => report(order.id, kind, note.trim())}>{t(bi("Send to the shop", "கடைக்கு அனுப்பு"))}</Button>
          </Panel>
        ) : null}
      </div>
    </Gate>
  );
}

export function PlansBody() {
  const t = useT();
  const lang = useEggs((s) => s.lang);
  const subs = useEggs((s) => s.subscriptions);
  const products = useEggs((s) => s.products);
  const setStatus = useEggs((s) => s.setSubStatus);
  const skip = useEggs((s) => s.skipSub);
  const slots = useEggs((s) => s.slots);
  return (
    <Gate>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-4xl">{t(bi("Subscriptions", "சந்தாக்கள்"))}</h1>
        <p className="text-sm text-muted">{t(bi("Each plan is locked to the shop that started it.", "ஒவ்வொரு திட்டமும் தொடங்கிய கடையுடன் பூட்டப்பட்டுள்ளது."))}</p>
        {subs.length === 0 ? <p className="text-sm text-muted">{t(bi("No plan yet. Open an egg and start one.", "இன்னும் திட்டம் இல்லை. ஒரு முட்டையைத் திறந்து தொடங்குங்கள்."))}</p> : null}
        {subs.map((sub) => {
          const product = products.find((p) => p.id === sub.productId);
          const slot = slots.find((s) => s.id === sub.slotId);
          return (
            <Panel key={sub.id}>
              <p className="font-medium">{product ? t(product.name) : sub.productId}</p>
              <p className="text-sm text-muted">
                {packLabel(sub.pack, lang)} · {sub.cadence === "daily" ? t(bi("Daily", "தினமும்")) : t(bi("Weekly", "வாரம்"))} · {slot ? t(slot.label) : ""} · {formatDay(sub.nextDate, lang)}
              </p>
              <p className="mt-1 text-sm">{sub.status === "active" ? t(bi("Running", "நடக்கிறது")) : t(bi("Paused", "இடைநிறுத்தம்"))}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sub.status === "active" ? (
                  <Button variant="line" onClick={() => setStatus(sub.id, "paused")}>{t(bi("Pause", "நிறுத்து"))}</Button>
                ) : (
                  <Button variant="line" onClick={() => setStatus(sub.id, "active")}>{t(bi("Resume", "தொடர்"))}</Button>
                )}
                <Button variant="line" onClick={() => skip(sub.id)}>{t(bi("Skip next", "அடுத்ததைத் தவிர்"))}</Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </Gate>
  );
}

export function WalletBody() {
  const t = useT();
  const lang = useEggs((state) => state.lang);
  const phone = useEggs((state) => state.profile.phone.replace(/\D/g, "").slice(-10));
  const wallet = useEggs((state) => state.walletPaise);
  const entries = useEggs(useShallow((state) => state.walletEntries.filter((entry) => entry.phone === phone)));
  const topUp = useEggs((state) => state.topUp);
  return (
    <Gate>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-mark">{t(bi("Spencers Enterprices", "Spencers Enterprices"))}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t(bi("Your wallet", "உங்கள் பணப்பை"))}</h1>
          <p className="mt-2 text-sm text-muted">{t(bi("A separate wallet preview for", "தனிப்பட்ட பணப்பை முன்னோட்டம்"))} +91 {phone}</p>
        </div>
        <section className="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#07172e] via-[#0b2b50] to-[#126db5] p-5 text-white shadow-[0_20px_50px_rgba(7,23,46,.2)]">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border border-white/15" />
          <div className="absolute -right-1 top-12 h-24 w-24 rounded-full border border-white/10" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/65">{t(bi("Available balance", "கிடைக்கும் இருப்பு"))}</p>
            <p className="mt-3 text-4xl font-extrabold tabular-nums tracking-tight">{inr(wallet, lang)}</p>
            <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-white/70">
              <span>SPENCERS ENTERPRICES</span>
              <span>INR · ₹</span>
            </div>
          </div>
        </section>
        <Panel className="flex flex-col gap-3">
          <div>
            <h2 className="font-extrabold">{t(bi("Add money", "பணம் சேர்க்கவும்"))}</h2>
            <p className="mt-1 text-xs leading-5 text-muted">{t(bi("Demo credits only. Live wallet top-ups will be connected to a verified payment provider before launch.", "டெமோ தொகை மட்டும். வெளியீட்டிற்கு முன் நேரடி பணப்பை நிரப்புதல் உறுதிப்படுத்தப்பட்ட கட்டண சேவையுடன் இணைக்கப்படும்."))}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="line" onClick={() => topUp(20000)}>{t(bi("Add ₹200 demo", "₹200 டெமோ சேர்"))}</Button>
            <Button variant="line" onClick={() => topUp(50000)}>{t(bi("Add ₹500 demo", "₹500 டெமோ சேர்"))}</Button>
          </div>
        </Panel>
        <div>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-extrabold">{t(bi("Wallet activity", "பணப்பை செயல்பாடுகள்"))}</h2>
            <span className="text-xs font-semibold text-muted">{entries.length} {t(bi("entries", "பதிவுகள்"))}</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {entries.length === 0 ? (
              <Panel><p className="text-sm text-muted">{t(bi("Your wallet activity will appear here.", "உங்கள் பணப்பை செயல்பாடுகள் இங்கே தோன்றும்."))}</p></Panel>
            ) : entries.map((entry) => (
              <Panel key={entry.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{entry.reason}</p>
                  <p className="mt-1 text-[10px] text-muted">{new Date(entry.at).toLocaleString(lang === "ta" ? "ta-IN" : "en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-extrabold tabular-nums", entry.direction === "credit" ? "text-emerald-700" : "text-ink")}>{entry.direction === "credit" ? "+" : "−"}{inr(entry.amountPaise, lang)}</p>
                  <p className="mt-1 text-[10px] text-muted">{t(bi("Balance", "இருப்பு"))} {inr(entry.balanceAfterPaise, lang)}</p>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </div>
    </Gate>
  );
}

export function AccountBody() {
  const t = useT();
  const lang = useEggs((s) => s.lang);
  const profile = useEggs((s) => s.profile);
  const setAccount = useEggs((s) => s.setAccount);
  const wallet = useEggs((s) => s.walletPaise);
  const support = useEggs((s) => s.support);
  const send = useEggs((s) => s.sendSupport);
  const reset = useEggs((s) => s.resetDemo);
  const favs = useEggs((s) => s.favourites);
  const products = useEggs((s) => s.products);
  const [name, setName] = useState(profile.name);
  const [business, setBusiness] = useState(profile.businessName);
  const [note, setNote] = useState("");
  const types: AccountType[] = ["home", "restaurant", "bakery", "hotel", "tea"];
  const saved = useMemo(() => products.filter((p) => favs.includes(p.id)), [products, favs]);
  return (
    <Gate>
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-4xl">{profile.name}</h1>
        <p className="text-sm text-muted">{profile.phone}</p>
        <Panel className="flex flex-col gap-3">
          <h2 className="font-medium">{t(bi("Account", "கணக்கு"))}</h2>
          <Field value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <Chip key={type} active={profile.accountType === type} onClick={() => setAccount(type, business, name)}>
                {t(ACCOUNT_LABEL[type])}
              </Chip>
            ))}
          </div>
          {profile.accountType !== "home" ? (
            <Field value={business} placeholder={t(bi("Kitchen or shop name", "சமையலறை அல்லது கடைப் பெயர்"))} onChange={(e) => setBusiness(e.target.value)} />
          ) : null}
          <Button variant="line" onClick={() => setAccount(profile.accountType, business, name)}>{t(bi("Save profile", "சுயவிவரத்தைச் சேமி"))}</Button>
          {profile.accountType !== "home" ? <p className="text-sm text-muted">{t(bi("Business accounts can use the same fresh-egg ordering experience with their delivery address.", "வணிகக் கணக்குகளும் தங்கள் விநியோக முகவரியுடன் இதே புதிய முட்டை ஆர்டர் அனுபவத்தைப் பயன்படுத்தலாம்."))}</p> : null}
        </Panel>
        <Link to="/wallet" className="press rounded-2xl border border-[#cde6fb] bg-[#edf7ff] p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-mark">{t(bi("Customer wallet", "வாடிக்கையாளர் பணப்பை"))}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="text-2xl font-extrabold tabular-nums">{inr(wallet, lang)}</span>
            <span className="text-xl font-bold text-mark">→</span>
          </div>
          <p className="mt-1 text-xs text-muted">{t(bi("View balance and transaction history", "இருப்பு மற்றும் பரிவர்த்தனை வரலாற்றைப் பார்க்கவும்"))}</p>
        </Link>
        <Panel>
          <h2 className="font-medium">{t(bi("Saved item", "சேமித்த பொருள்"))}</h2>
          <div className="mt-2 flex flex-col gap-2">
            {saved.map((p) => (
              <Link key={p.id} to="/product/$sku" params={{ sku: p.id }} className="text-sm underline">{t(p.name)}</Link>
            ))}
            {saved.length === 0 ? <p className="text-sm text-muted">{t(bi("None saved.", "சேமிப்பு இல்லை."))}</p> : null}
          </div>
        </Panel>
        <Panel className="flex flex-col gap-3">
          <h2 className="font-medium">{t(bi("Desk", "உதவி"))}</h2>
          {support.map((msg, i) => (
            <p key={i} className="text-sm">
              <span className="text-muted">{msg.from === "you" ? t(bi("You", "நீங்கள்")) : t(bi("Desk", "மேசை"))} · </span>
              {msg.text}
            </p>
          ))}
          <TextArea value={note} onChange={(e) => setNote(e.target.value)} />
          <Button disabled={!note.trim()} onClick={() => { send(note.trim()); setNote(""); }}>{t(bi("Send", "அனுப்பு"))}</Button>
        </Panel>
        <Button variant="ghost" onClick={() => reset()}>{t(bi("Reset preview", "முன்னோட்டத்தை மீட்டமை"))}</Button>
      </div>
    </Gate>
  );
}
