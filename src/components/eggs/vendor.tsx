import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis } from "recharts";
import { formatDay } from "@/lib/eggs/clock";
import { bi, inr, STATUS_LABEL, tx, VENDOR_STATUS } from "@/lib/eggs/labels";
import { DEMAND } from "@/lib/eggs/seed";
import { useEggs } from "@/lib/eggs/store";
import type { OrderStatus } from "@/lib/eggs/types";
import { Button, Field, Panel } from "./ui";

function useT() {
  const lang = useEggs((s) => s.lang);
  return { lang, t: (text: { en: string; ta: string }) => tx(lang, text) };
}

function ShopPicker() {
  const { t } = useT();
  const vendors = useEggs((s) => s.vendors);
  const active = useEggs((s) => s.activeVendorId);
  const setActive = useEggs((s) => s.setActiveVendor);
  const vendor = vendors.find((v) => v.id === active);
  return (
    <div className="mb-4 flex flex-col gap-2">
      <label className="text-sm text-muted" htmlFor="shop">
        {t(bi("You are in", "நீங்கள் உள்ள கடை"))}
      </label>
      <select
        id="shop"
        className="min-h-12 rounded-control border border-line bg-shell px-3 text-base"
        value={active}
        onChange={(e) => setActive(e.target.value)}
      >
        {vendors.map((v) => (
          <option key={v.id} value={v.id}>
            {t(v.name)} · {t(VENDOR_STATUS[v.status])}
          </option>
        ))}
      </select>
      {vendor ? (
        <p className="text-sm text-muted">
          {t(bi("Only this shop’s orders, stock and money are on screen.", "இந்தக் கடையின் ஆர்டர், இருப்பு, பணம் மட்டும் திரையில்."))}
        </p>
      ) : null}
    </div>
  );
}

export function VendorHome() {
  const { t, lang } = useT();
  const vendor = useEggs((s) => s.vendors.find((v) => v.id === s.activeVendorId));
  const orders = useEggs((s) => s.orders.filter((o) => o.vendorId === s.activeVendorId));
  const advance = useEggs((s) => s.vendorAdvance);
  const reject = useEggs((s) => s.vendorReject);
  const confirmCancel = useEggs((s) => s.confirmCancel);
  const streets = useEggs((s) => s.streets);
  const products = useEggs((s) => s.products);
  const [reason, setReason] = useState("Out of stock");
  const [rider, setRider] = useState(false);
  const live = orders.filter((o) => !["delivered", "cancelled", "rejected"].includes(o.status));
  const focus = live[0];
  if (!vendor) return null;
  if (vendor.status !== "approved") {
    return (
      <div>
        <ShopPicker />
        <Panel>
          <h1 className="font-display text-3xl">{t(vendor.name)}</h1>
          <p className="mt-2">{t(VENDOR_STATUS[vendor.status])}</p>
          <p className="mt-2 text-sm text-muted">{t(bi("Command has to approve the shop before orders arrive. Stock can still be prepared.", "ஆர்டர் வரும் முன் நிர்வாகம் அனுமதிக்க வேண்டும். இருப்பைத் தயார் செய்யலாம்."))}</p>
        </Panel>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <ShopPicker />
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl">{t(bi("Today", "இன்று"))}</h1>
        <Button variant="line" onClick={() => setRider((v) => !v)}>
          {rider ? t(bi("Shop view", "கடை பார்வை")) : t(bi("Rider view", "டெலிவரி பார்வை"))}
        </Button>
      </div>
      {rider && focus ? <RiderCard /> : null}
      {!rider
        ? live.map((order) => {
            const street = streets.find((s) => s.id === order.address.streetId);
            const next = nextStatus(order.status);
            return (
              <Panel key={order.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">{order.id}</p>
                    <h2 className="text-2xl font-medium">{order.businessName || order.customerName}</h2>
                    <p className="text-sm">{order.accountType !== "home" ? order.accountType : t(bi("Home", "வீடு"))}</p>
                  </div>
                  <p className="text-lg tabular-nums">{inr(order.totalPaise, lang)}</p>
                </div>
                <p className="text-base">
                  {order.address.door}
                  {order.address.apartment ? `, ${order.address.apartment}` : ""} · {street ? t(street.name) : ""}
                </p>
                <p className="text-sm text-muted">{order.address.landmark || t(bi("No landmark", "அடையாளம் இல்லை"))} · {order.phone}</p>
                <p className="text-sm">
                  {order.lines.map((l) => `${products.find((p) => p.id === l.productId)?.name[lang] ?? l.productId} × ${l.pack * l.qtyPacks}`).join(" · ")}
                </p>
                <p className="text-sm font-medium">{t(STATUS_LABEL[order.status])}</p>
                {order.cancelRequested ? (
                  <Button className="min-h-14 text-base" onClick={() => confirmCancel(order.id)}>
                    {t(bi("Confirm cancellation", "ரத்தை உறுதி செய்"))}
                  </Button>
                ) : null}
                {order.status === "placed" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button className="min-h-14 text-base" onClick={() => advance(order.id, "accepted")}>
                      {t(bi("Accept", "ஏற்கவும்"))}
                    </Button>
                    <Button className="min-h-14 text-base" variant="line" onClick={() => reject(order.id, reason)}>
                      {t(bi("Decline", "நிராகரி"))}
                    </Button>
                    <Field value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>
                ) : null}
                {next && order.status !== "placed" ? (
                  <Button className="min-h-14 text-base" onClick={() => advance(order.id, next, true)}>
                    {next === "preparing"
                      ? t(bi("Start packing", "பொதி தொடங்கு"))
                      : next === "out_for_delivery"
                        ? t(bi(`Hand to ${vendor.rider.en}`, `${t(vendor.rider)} இடம் கொடு`))
                        : t(bi("Mark delivered", "வழங்கப்பட்டது"))}
                  </Button>
                ) : null}
                {order.status === "out_for_delivery" && order.method === "cod" ? (
                  <Button variant="line" className="min-h-14" onClick={() => advance(order.id, "delivered", false)}>
                    {t(bi("Delivered, cash not collected", "வழங்கப்பட்டது, பணம் வரவில்லை"))}
                  </Button>
                ) : null}
              </Panel>
            );
          })
        : null}
      {!rider && live.length === 0 ? <p className="text-sm text-muted">{t(bi("No open orders.", "திறந்த ஆர்டர் இல்லை."))}</p> : null}
    </div>
  );

  function RiderCard() {
    if (!focus || !vendor) return null;
    const street = streets.find((s) => s.id === focus.address.streetId);
    return (
      <Panel className="flex flex-col gap-4 bg-ink text-shell">
        <p className="text-sm text-shell/80">{t(bi("Rider", "டெலிவரி"))} · {t(vendor.rider)}</p>
        <h2 className="font-display text-4xl">{focus.businessName || focus.customerName}</h2>
        <p className="text-2xl">
          {focus.address.door} · {street ? t(street.name) : ""}
        </p>
        <p>{focus.address.landmark}</p>
        <p className="text-xl tabular-nums">{focus.phone}</p>
        {focus.status === "out_for_delivery" ? (
          <Button variant="line" className="min-h-14 bg-shell text-base text-ink" onClick={() => advance(focus.id, "delivered", true)}>
            {t(bi("Delivered", "வழங்கப்பட்டது"))}
          </Button>
        ) : (
          <p className="text-sm">{t(bi("Pack it in the shop view, then hand it over.", "கடை பார்வையில் பொதி செய்து, பின் கொடுங்கள்."))}</p>
        )}
      </Panel>
    );
  }
}

function nextStatus(status: OrderStatus): OrderStatus | null {
  if (status === "accepted") return "preparing";
  if (status === "preparing") return "out_for_delivery";
  if (status === "out_for_delivery") return "delivered";
  return null;
}

export function VendorStock() {
  const { t, lang } = useT();
  const vendorId = useEggs((s) => s.activeVendorId);
  const rows = useEggs((s) => s.vendorProducts.filter((p) => p.vendorId === vendorId));
  const products = useEggs((s) => s.products);
  const setStock = useEggs((s) => s.vendorSetStock);
  const setPrice = useEggs((s) => s.vendorSetPrice);
  const low = rows.filter((r) => r.stockEggs <= r.lowStockAt);
  return (
    <div className="flex flex-col gap-4">
      <ShopPicker />
      <h1 className="font-display text-4xl">{t(bi("Stock", "இருப்பு"))}</h1>
      {low.length > 0 ? (
        <Panel>
          <p className="font-medium">{t(bi("Running low", "குறைகிறது"))}</p>
          <p className="text-sm text-muted">{low.map((r) => products.find((p) => p.id === r.productId)?.name[lang]).join(", ")}</p>
        </Panel>
      ) : null}
      {rows.map((row) => {
        const product = products.find((p) => p.id === row.productId);
        return (
          <Panel key={row.productId} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">{product ? t(product.name) : row.productId}</h2>
              <p className="text-2xl tabular-nums">{row.stockEggs}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button className="min-h-14" variant="line" onClick={() => setStock(row.productId, row.stockEggs - 6)}>-6</Button>
              <Button className="min-h-14" variant="line" onClick={() => setStock(row.productId, row.stockEggs + 6)}>+6</Button>
              <Button className="min-h-14" variant="line" onClick={() => setStock(row.productId, row.stockEggs + 30)}>+30</Button>
            </div>
            <label className="text-sm text-muted">{t(bi("Price per egg, rupees", "ஒரு முட்டை விலை, ரூபாய்"))}</label>
            <Field
              inputMode="decimal"
              defaultValue={String(row.pricePerEggPaise / 100)}
              key={`${row.productId}-${row.pricePerEggPaise}`}
              onBlur={(e) => setPrice(row.productId, Math.round(Number(e.target.value) * 100))}
            />
          </Panel>
        );
      })}
    </div>
  );
}

export function VendorStreets() {
  const { t } = useT();
  const vendor = useEggs((s) => s.vendors.find((v) => v.id === s.activeVendorId));
  const assignments = useEggs((s) => s.assignments.filter((a) => a.vendorId === s.activeVendorId));
  const streets = useEggs((s) => s.streets);
  const localities = useEggs((s) => s.localities);
  const setHours = useEggs((s) => s.vendorSetHours);
  const setAccepting = useEggs((s) => s.vendorSetAccepting);
  const setProfile = useEggs((s) => s.vendorProfile);
  const register = useEggs((s) => s.registerVendor);
  const [open, setOpen] = useState(vendor?.hours.open ?? "05:00");
  const [close, setClose] = useState(vendor?.hours.close ?? "13:00");
  const [form, setForm] = useState({ nameEn: "", nameTa: "", phone: "", localityId: "velachery" });
  if (!vendor) return null;
  return (
    <div className="flex flex-col gap-4">
      <ShopPicker />
      <h1 className="font-display text-4xl">{t(bi("Streets", "தெருக்கள்"))}</h1>
      <Panel className="flex flex-col gap-3">
        <h2 className="font-medium">{t(vendor.name)}</h2>
        <Field defaultValue={vendor.name.en} onBlur={(e) => setProfile({ nameEn: e.target.value })} />
        <Field defaultValue={vendor.name.ta} onBlur={(e) => setProfile({ nameTa: e.target.value })} />
        <Field defaultValue={vendor.phone} onBlur={(e) => setProfile({ phone: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Field value={open} onChange={(e) => setOpen(e.target.value)} />
          <Field value={close} onChange={(e) => setClose(e.target.value)} />
        </div>
        <Button className="min-h-14" onClick={() => setHours(open, close)}>{t(bi("Save hours", "நேரத்தைச் சேமி"))}</Button>
        <Button className="min-h-14" variant="line" onClick={() => setAccepting(!vendor.acceptingOrders)}>
          {vendor.acceptingOrders ? t(bi("Pause new orders", "புதிய ஆர்டரை நிறுத்து")) : t(bi("Take orders", "ஆர்டர் எடு"))}
        </Button>
      </Panel>
      {assignments.length === 0 ? <p className="text-sm text-muted">{t(bi("No streets yet. Command assigns them.", "இன்னும் தெரு இல்லை. நிர்வாகம் ஒதுக்கும்."))}</p> : null}
      {assignments.map((a) => {
        const street = streets.find((s) => s.id === a.streetId);
        const loc = localities.find((l) => l.id === street?.localityId);
        if (!street) return null;
        return (
          <Panel key={a.streetId + a.role}>
            <p className="text-sm text-muted">{loc ? t(loc.name) : ""} · {a.role === "primary" ? t(bi("Primary", "முதன்மை")) : t(bi("Backup", "மாற்று"))}</p>
            <p className="text-lg">{t(street.name)}</p>
            <p className="text-sm text-muted">{street.status === "active" ? t(bi("In service", "சேவையில்")) : t(bi("Paused by command", "நிர்வாகம் நிறுத்தியது"))}</p>
          </Panel>
        );
      })}
      <Panel className="flex flex-col gap-3">
        <h2 className="font-medium">{t(bi("Apply as a new shop", "புதிய கடையாக விண்ணப்பி"))}</h2>
        <Field placeholder={t(bi("Shop name", "கடைப் பெயர்"))} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
        <Field placeholder={t(bi("Tamil name", "தமிழ் பெயர்"))} value={form.nameTa} onChange={(e) => setForm({ ...form, nameTa: e.target.value })} />
        <Field placeholder={t(bi("Phone", "தொலைபேசி"))} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select className="min-h-12 rounded-control border border-line bg-shell px-3" value={form.localityId} onChange={(e) => setForm({ ...form, localityId: e.target.value })}>
          {localities.map((l) => (
            <option key={l.id} value={l.id}>{t(l.name)}</option>
          ))}
        </select>
        <Button disabled={!form.nameEn.trim()} onClick={() => register(form)}>{t(bi("Submit for approval", "அனுமதிக்கு அனுப்பு"))}</Button>
      </Panel>
    </div>
  );
}

export function VendorLedger() {
  const { t, lang } = useT();
  const vendor = useEggs((s) => s.vendors.find((v) => v.id === s.activeVendorId));
  const orders = useEggs((s) => s.orders.filter((o) => o.vendorId === s.activeVendorId && o.status === "delivered"));
  const settlements = useEggs((s) => s.settlements.filter((s) => s.vendorId === vendor?.id));
  const offers = useEggs((s) => s.offers.filter((o) => o.vendorId === vendor?.id));
  const toggle = useEggs((s) => s.vendorToggleOffer);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  if (!vendor) return null;
  const unsettled = orders.filter((o) => !o.settled && !o.cashPending);
  const gross = unsettled.reduce((sum, o) => sum + o.totalPaise, 0);
  const commission = Math.round((gross * vendor.commissionBps) / 10000);
  const todayGross = orders.filter((o) => o.date === today).reduce((sum, o) => sum + o.totalPaise, 0);
  return (
    <div className="flex flex-col gap-4">
      <ShopPicker />
      <h1 className="font-display text-4xl">{t(bi("Money", "பணம்"))}</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel>
          <p className="text-sm text-muted">{t(bi("Delivered today", "இன்று வழங்கியது"))}</p>
          <p className="text-2xl tabular-nums">{inr(todayGross, lang)}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-muted">{t(bi("Unsettled", "தீர்க்கப்படாதது"))}</p>
          <p className="text-2xl tabular-nums">{inr(gross - commission, lang)}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-muted">{t(bi("Commission", "கமிஷன்"))}</p>
          <p className="text-2xl tabular-nums">{vendor.commissionBps / 100}%</p>
        </Panel>
      </div>
      <Panel className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={DEMAND}>
            <XAxis dataKey="orders" hide />
            <Bar dataKey="revenue" fill="var(--color-ink)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel>
        <p className="font-medium">{vendor.rating.toFixed(1)} · {vendor.reviewCount} {t(bi("ratings", "மதிப்பெண்"))}</p>
      </Panel>
      {offers.map((offer) => (
        <Panel key={offer.id} className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{t(offer.title)}</p>
            <p className="text-sm text-muted">{t(offer.detail)}</p>
          </div>
          <Button variant="line" onClick={() => toggle(offer.id)}>{offer.active ? t(bi("On", "ஆன்")) : t(bi("Off", "ஆஃப்"))}</Button>
        </Panel>
      ))}
      {settlements.map((row) => (
        <Panel key={row.id}>
          <p className="text-sm text-muted">{row.label}</p>
          <p className="tabular-nums">{t(bi("Net", "நிகரம்"))} {inr(row.netPaise, lang)} · {row.status}</p>
        </Panel>
      ))}
      <p className="text-sm text-muted">{t(bi("A week of sample demand. Today’s number is yours.", "ஒரு வார மாதிரி தேவை. இன்றைய எண் உங்களுடையது."))}</p>
      <p className="text-xs text-muted">{formatDay(today, lang)}</p>
    </div>
  );
}
