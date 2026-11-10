import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis } from "recharts";
import { formatDay, readChennai } from "@/lib/eggs/clock";
import {
  ACCOUNT_LABEL,
  bi,
  inr,
  ISSUE_KIND,
  ISSUE_STATUS,
  ROLE_LABEL,
  STATUS_LABEL,
  STREET_STATUS,
  tx,
  VENDOR_STATUS,
} from "@/lib/eggs/labels";
import { PACKS, packLabel } from "@/lib/eggs/pricing";
import { reassignBlock } from "@/lib/eggs/routing";
import { DEMAND } from "@/lib/eggs/seed";
import { useEggs } from "@/lib/eggs/store";
import type { ActingRole } from "@/lib/eggs/types";
import { CityDots } from "./catalog";
import { Button, Chip, Field, Panel, TextArea } from "./ui";

function useT() {
  const lang = useEggs((s) => s.lang);
  return { lang, t: (text: { en: string; ta: string }) => tx(lang, text) };
}

function RoleBar() {
  const { t } = useT();
  const role = useEggs((s) => s.actingRole);
  const setRole = useEggs((s) => s.setActingRole);
  const roles: ActingRole[] = ["owner", "ops", "support", "finance"];
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {roles.map((id) => (
        <Chip key={id} active={role === id} onClick={() => setRole(id)}>
          {t(ROLE_LABEL[id])}
        </Chip>
      ))}
    </div>
  );
}

export function AdminHome() {
  const { t, lang } = useT();
  const orders = useEggs((s) => s.orders);
  const vendors = useEggs((s) => s.vendors);
  const streets = useEggs((s) => s.streets);
  const live = orders.filter((o) => !["delivered", "cancelled", "rejected"].includes(o.status));
  const gross = orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.totalPaise, 0);
  const served = streets.filter((s) => s.status === "active").length;
  const series = DEMAND.map((row, i) => ({ ...row, d: String(i + 1) }));
  return (
    <div className="flex flex-col gap-4">
      <RoleBar />
      <div>
        <p className="text-sm text-muted">{t(bi("Chennai command", "சென்னை நிர்வாகம்"))}</p>
        <h1 className="font-display text-4xl">{t(bi("The city, live.", "நகரம், நேரலையில்."))}</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat k={t(bi("Open orders", "திறந்த ஆர்டர்"))} v={String(live.length)} />
        <Stat k={t(bi("Delivered value", "வழங்கிய மதிப்பு"))} v={inr(gross, lang)} />
        <Stat k={t(bi("Streets in service", "சேவைத் தெருக்கள்"))} v={String(served)} />
        <Stat k={t(bi("Approved shops", "அனுமதி கடைகள்"))} v={String(vendors.filter((v) => v.status === "approved").length)} />
      </div>
      <Panel className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series}>
            <XAxis dataKey="d" tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Bar dataKey="orders" fill="var(--color-ink)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <CityDots />
      <h2 className="font-medium">{t(bi("Open orders", "திறந்த ஆர்டர்கள்"))}</h2>
      {live.map((order) => {
        const vendor = vendors.find((v) => v.id === order.vendorId);
        return (
          <Panel key={order.id} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{order.id} · {t(STATUS_LABEL[order.status])}</p>
              <p className="font-medium">{order.businessName || order.customerName}</p>
              <p className="text-sm text-muted">{vendor ? t(vendor.name) : ""} · {t(ACCOUNT_LABEL[order.accountType])}</p>
            </div>
            <p className="tabular-nums">{inr(order.totalPaise, lang)}</p>
          </Panel>
        );
      })}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <Panel>
      <p className="text-sm text-muted">{k}</p>
      <p className="text-2xl tabular-nums">{v}</p>
    </Panel>
  );
}

export function AdminStreets() {
  const { t } = useT();
  const streets = useEggs((s) => s.streets);
  const localities = useEggs((s) => s.localities);
  const vendors = useEggs((s) => s.vendors);
  const assignments = useEggs((s) => s.assignments);
  const setStatus = useEggs((s) => s.adminSetStreetStatus);
  const assign = useEggs((s) => s.adminSetAssignment);
  const clear = useEggs((s) => s.adminClearAssignment);
  const add = useEggs((s) => s.adminAddStreet);
  const requests = useEggs((s) => s.streetRequests);
  const closeReq = useEggs((s) => s.closeRequest);
  const [loc, setLoc] = useState("all");
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ localityId: "adyar", en: "", ta: "", aliases: "", pin: "" });
  const rows = streets.filter((s) => {
    if (loc !== "all" && s.localityId !== loc) return false;
    const hay = `${s.name.en} ${s.name.ta} ${s.aliases.join(" ")}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
  return (
    <div className="flex flex-col gap-4">
      <RoleBar />
      <h1 className="font-display text-4xl">{t(bi("Street directory", "தெருப் பட்டியல்"))}</h1>
      <p className="text-sm text-muted">{t(bi("Assign shops here. The apps do not need a new release.", "கடைகளை இங்கே ஒதுக்குங்கள். செயலிக்கு புதிய வெளியீடு தேவையில்லை."))}</p>
      <CityDots activeId={loc === "all" ? undefined : loc} />
      <div className="flex gap-2 overflow-x-auto">
        <Chip active={loc === "all"} onClick={() => setLoc("all")}>{t(bi("All", "அனைத்தும்"))}</Chip>
        {localities.map((l) => (
          <Chip key={l.id} active={loc === l.id} onClick={() => setLoc(l.id)}>{t(l.name)}</Chip>
        ))}
      </div>
      <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(bi("Search English, Tamil, or a short form", "ஆங்கிலம், தமிழ் அல்லது சுருக்கம்"))} />
      {rows.map((street) => {
        const links = assignments.filter((a) => a.streetId === street.id);
        const primary = links.find((a) => a.role === "primary");
        const locality = localities.find((l) => l.id === street.localityId);
        return (
          <Panel key={street.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{locality ? t(locality.name) : ""} · {street.pin}</p>
                <h2 className="text-lg font-medium">{t(street.name)}</h2>
                <p className="text-sm text-muted">{street.aliases.join(" · ")}</p>
              </div>
              <p className="text-sm">{t(STREET_STATUS[street.status])}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["active", "suspended", "inactive"] as const).map((status) => (
                <Chip key={status} active={street.status === status} onClick={() => setStatus(street.id, status)}>
                  {t(STREET_STATUS[status])}
                </Chip>
              ))}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <select
                className="min-h-12 rounded-control border border-line bg-shell px-3"
                value={primary?.vendorId ?? ""}
                onChange={(e) => e.target.value && assign(street.id, e.target.value, "primary")}
              >
                <option value="">{t(bi("Primary shop", "முதன்மைக் கடை"))}</option>
                {vendors.filter((v) => v.status === "approved").map((v) => (
                  <option key={v.id} value={v.id}>{t(v.name)}</option>
                ))}
              </select>
              <select
                className="min-h-12 rounded-control border border-line bg-shell px-3"
                value=""
                onChange={(e) => e.target.value && assign(street.id, e.target.value, "backup")}
              >
                <option value="">{t(bi("Add backup", "மாற்று சேர்"))}</option>
                {vendors.filter((v) => v.status === "approved").map((v) => (
                  <option key={v.id} value={v.id}>{t(v.name)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {links.map((link) => {
                const vendor = vendors.find((v) => v.id === link.vendorId);
                return (
                  <Button key={link.vendorId + link.role} variant="line" onClick={() => clear(street.id, link.vendorId)}>
                    {link.role === "primary" ? t(bi("Primary", "முதன்மை")) : t(bi("Backup", "மாற்று"))}: {vendor ? t(vendor.name) : link.vendorId} ×
                  </Button>
                );
              })}
            </div>
          </Panel>
        );
      })}
      <Panel className="flex flex-col gap-3">
        <h2 className="font-medium">{t(bi("Add a street", "தெரு சேர்"))}</h2>
        <select className="min-h-12 rounded-control border border-line bg-shell px-3" value={form.localityId} onChange={(e) => setForm({ ...form, localityId: e.target.value })}>
          {localities.map((l) => (
            <option key={l.id} value={l.id}>{t(l.name)}</option>
          ))}
        </select>
        <Field placeholder={t(bi("English name", "ஆங்கிலப் பெயர்"))} value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} />
        <Field placeholder={t(bi("Tamil name", "தமிழ் பெயர்"))} value={form.ta} onChange={(e) => setForm({ ...form, ta: e.target.value })} />
        <Field placeholder={t(bi("Other spellings, comma separated", "மற்ற எழுத்துகள், காற்புள்ளி"))} value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} />
        <Field placeholder={t(bi("PIN", "அஞ்சல்"))} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} />
        <Button onClick={() => add(form)}>{t(bi("Add to directory", "பட்டியலில் சேர்"))}</Button>
      </Panel>
      <h2 className="font-medium">{t(bi("Requested streets", "கோரப்பட்ட தெருக்கள்"))}</h2>
      {requests.map((req) => (
        <Panel key={req.id} className="flex items-center justify-between gap-3">
          <div>
            <p>{req.query}</p>
            <p className="text-sm text-muted">{req.status}</p>
          </div>
          {req.status === "open" ? <Button variant="line" onClick={() => closeReq(req.id)}>{t(bi("Mark added", "சேர்த்ததாகக் குறி"))}</Button> : null}
        </Panel>
      ))}
    </div>
  );
}

export function AdminVendors() {
  const { t, lang } = useT();
  const vendors = useEggs((s) => s.vendors);
  const setStatus = useEggs((s) => s.adminSetVendorStatus);
  const setBps = useEggs((s) => s.adminSetCommission);
  const rows = useEggs((s) => s.vendorProducts);
  return (
    <div className="flex flex-col gap-4">
      <RoleBar />
      <h1 className="font-display text-4xl">{t(bi("Shops", "கடைகள்"))}</h1>
      {vendors.map((vendor) => {
        const low = rows.filter((r) => r.vendorId === vendor.id && r.stockEggs <= r.lowStockAt).length;
        return (
          <Panel key={vendor.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl">{t(vendor.name)}</h2>
                <p className="text-sm text-muted">{vendor.phone} · {vendor.hours.open}–{vendor.hours.close} · {vendor.rating.toFixed(1)}</p>
              </div>
              <p className="text-sm">{t(VENDOR_STATUS[vendor.status])}</p>
            </div>
            <p className="text-sm text-muted">{t(bi("Low lines", "குறைந்த வரிசை"))}: {low} · {t(bi("Commission", "கமிஷன்"))} {vendor.commissionBps / 100}%</p>
            <div className="flex flex-wrap gap-2">
              {(["approved", "pending", "suspended"] as const).map((status) => (
                <Chip key={status} active={vendor.status === status} onClick={() => setStatus(vendor.id, status)}>{t(VENDOR_STATUS[status])}</Chip>
              ))}
            </div>
            <label className="text-sm text-muted">{t(bi("Commission, percent", "கமிஷன், சதவீதம்"))}</label>
            <Field
              key={vendor.commissionBps}
              defaultValue={String(vendor.commissionBps / 100)}
              onBlur={(e) => setBps(vendor.id, Math.round(Number(e.target.value) * 100))}
            />
          </Panel>
        );
      })}
      <p className="text-xs text-muted">{lang === "ta" ? "ஒவ்வொரு கடையின் தரவும் தனி." : "Each shop’s stock and money stay separate."}</p>
    </div>
  );
}

export function AdminOrders() {
  const { t, lang } = useT();
  const orders = useEggs((s) => s.orders);
  const vendors = useEggs((s) => s.vendors);
  const reassign = useEggs((s) => s.adminReassign);
  const [pick, setPick] = useState<Record<string, string>>({});
  return (
    <div className="flex flex-col gap-4">
      <RoleBar />
      <h1 className="font-display text-4xl">{t(bi("Orders", "ஆர்டர்கள்"))}</h1>
      <p className="text-sm text-muted">{t(bi("Paid orders stay with the shop that was paid. The move is written on the order, never silent.", "செலுத்திய ஆர்டர் பணம் சென்ற கடையிலேயே இருக்கும். நகர்த்தல் ஆர்டரில் எழுதப்படும்."))}</p>
      {orders.map((order) => {
        const block = reassignBlock(order);
        const vendor = vendors.find((v) => v.id === order.vendorId);
        return (
          <Panel key={order.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{order.id} · {formatDay(order.date, lang)} · {t(STATUS_LABEL[order.status])}</p>
                <p className="font-medium">{order.businessName || order.customerName}</p>
                <p className="text-sm text-muted">{vendor ? t(vendor.name) : ""} · {order.method} · {t(bi("captured", "பிடித்தது"))} {inr(order.capturedPaise, lang)}</p>
              </div>
              <p className="tabular-nums">{inr(order.totalPaise, lang)}</p>
            </div>
            {block === "PAID_LOCK" ? (
              <p className="text-sm">{t(bi("Blocked. Refund from the desk, then the customer orders again.", "தடை. மேசையில் பணம் திருப்புங்கள், பின் வாடிக்கையாளர் மீண்டும் ஆர்டர் செய்யட்டும்."))}</p>
            ) : null}
            {block === null ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  className="min-h-12 flex-1 rounded-control border border-line bg-shell px-3"
                  value={pick[order.id] ?? ""}
                  onChange={(e) => setPick({ ...pick, [order.id]: e.target.value })}
                >
                  <option value="">{t(bi("Move unpaid order", "செலுத்தாத ஆர்டரை நகர்த்து"))}</option>
                  {vendors.filter((v) => v.status === "approved" && v.id !== order.vendorId).map((v) => (
                    <option key={v.id} value={v.id}>{t(v.name)}</option>
                  ))}
                </select>
                <Button disabled={!pick[order.id]} onClick={() => reassign(order.id, pick[order.id])}>{t(bi("Move", "நகர்த்து"))}</Button>
              </div>
            ) : null}
          </Panel>
        );
      })}
    </div>
  );
}

export function AdminCatalogue() {
  const { t, lang } = useT();
  const products = useEggs((s) => s.products);
  const rows = useEggs((s) => s.vendorProducts);
  const vendors = useEggs((s) => s.vendors);
  const togglePack = useEggs((s) => s.adminTogglePack);
  const toggleProduct = useEggs((s) => s.adminToggleProduct);
  const setPrice = useEggs((s) => s.adminSetVendorPrice);
  return (
    <div className="flex flex-col gap-4">
      <RoleBar />
      <h1 className="font-display text-4xl">{t(bi("Catalogue", "பட்டியல்"))}</h1>
      {products.map((product) => (
        <Panel key={product.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl">{t(product.name)}</h2>
            <Button variant="line" onClick={() => toggleProduct(product.id)}>{product.active ? t(bi("Live", "நேரலை")) : t(bi("Hidden", "மறைவு"))}</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PACKS.map((pack) => (
              <Chip key={pack} active={product.packs.includes(pack)} onClick={() => togglePack(product.id, pack)}>
                {packLabel(pack, lang)}
              </Chip>
            ))}
          </div>
          {rows.filter((r) => r.productId === product.id).map((row) => {
            const vendor = vendors.find((v) => v.id === row.vendorId);
            return (
              <div key={row.vendorId} className="grid items-center gap-2 sm:grid-cols-[1fr_8rem_6rem]">
                <p className="text-sm">{vendor ? t(vendor.name) : row.vendorId}</p>
                <p className="text-sm tabular-nums text-muted">{row.stockEggs} {t(bi("eggs", "முட்டை"))}</p>
                <Field
                  key={`${row.vendorId}-${row.pricePerEggPaise}`}
                  defaultValue={String(row.pricePerEggPaise / 100)}
                  onBlur={(e) => setPrice(row.vendorId, product.id, Math.round(Number(e.target.value) * 100))}
                />
              </div>
            );
          })}
        </Panel>
      ))}
    </div>
  );
}

export function AdminOps() {
  const { t, lang } = useT();
  const orders = useEggs((s) => s.orders);
  const complaints = useEggs((s) => s.complaints);
  const resolve = useEggs((s) => s.resolveIssue);
  const coupons = useEggs((s) => s.coupons);
  const subs = useEggs((s) => s.subscriptions);
  const release = useEggs((s) => s.releaseDueSubs);
  const audits = useEggs((s) => s.audits);
  const roles = useEggs((s) => s.roles);
  const setPerm = useEggs((s) => s.setRolePerm);
  const config = useEggs((s) => s.config);
  const setConfig = useEggs((s) => s.setConfig);
  const campaign = useEggs((s) => s.campaign);
  const setCampaign = useEggs((s) => s.setCampaign);
  const broadcast = useEggs((s) => s.broadcast);
  const settlements = useEggs((s) => s.settlements);
  const markSettled = useEggs((s) => s.markSettled);
  const vendors = useEggs((s) => s.vendors);
  const support = useEggs((s) => s.support);
  const [note, setNote] = useState("");
  const [title, setTitle] = useState(campaign.title.en);
  const [body, setBody] = useState(campaign.body.en);
  const customers = useMemo(() => {
    const map = new Map<string, { name: string; type: string; n: number }>();
    for (const order of orders) {
      const key = order.customerName;
      const prev = map.get(key);
      map.set(key, { name: key, type: order.accountType, n: (prev?.n ?? 0) + 1 });
    }
    return [...map.values()];
  }, [orders]);
  const paid = orders.filter((o) => o.capturedPaise > 0).reduce((sum, o) => sum + o.capturedPaise, 0);
  const keys = ["streets", "vendors", "reassign", "refunds", "settle", "broadcast"] as const;
  return (
    <div className="flex flex-col gap-4">
      <RoleBar />
      <h1 className="font-display text-4xl">{t(bi("Desk", "மேசை"))}</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat k={t(bi("Captured", "பிடித்தது"))} v={inr(paid, lang)} />
        <Stat k={t(bi("Open issues", "திறந்த புகார்"))} v={String(complaints.filter((c) => c.status === "open").length)} />
        <Stat k={t(bi("Plans", "சந்தா"))} v={String(subs.filter((s) => s.status === "active").length)} />
      </div>
      <Panel className="flex flex-col gap-3">
        <h2 className="font-medium">{t(bi("City", "நகரம்"))}</h2>
        <p className="text-sm">Chennai · {config.cityActive ? t(bi("open", "திறந்து")) : t(bi("closed", "மூடல்"))}</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={config.cityActive} onClick={() => setConfig({ cityActive: !config.cityActive })}>{t(bi("City active", "நகரம் செயலில்"))}</Chip>
          <Chip active={config.upiEnabled} onClick={() => setConfig({ upiEnabled: !config.upiEnabled })}>UPI</Chip>
          <Chip active={config.codEnabled} onClick={() => setConfig({ codEnabled: !config.codEnabled })}>{t(bi("Cash", "பணம்"))}</Chip>
          <Chip active={config.walletEnabled} onClick={() => setConfig({ walletEnabled: !config.walletEnabled })}>{t(bi("Wallet", "பணப்பை"))}</Chip>
        </div>
        <p className="text-sm text-muted">{t(bi("Early slots open at", "அதிகாலை தொடக்கம்"))} {config.earlyOpen}. {t(bi("Trade discount", "வணிகத் தள்ளுபடி"))} {config.tradeBps / 100}%.</p>
      </Panel>
      <Panel className="flex flex-col gap-3">
        <h2 className="font-medium">{t(bi("Campaign", "பிரச்சாரம்"))}</h2>
        <Field value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextArea value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex gap-2">
          <Button onClick={() => setCampaign({ titleEn: title, bodyEn: body, active: true })}>{t(bi("Publish", "வெளியிடு"))}</Button>
          <Button variant="line" onClick={() => setCampaign({ active: !campaign.active })}>{campaign.active ? t(bi("Hide", "மறை")) : t(bi("Show", "காட்டு"))}</Button>
        </div>
      </Panel>
      <Panel className="flex flex-col gap-2">
        <h2 className="font-medium">{t(bi("Coupons", "கூப்பன்கள்"))}</h2>
        {coupons.map((c) => (
          <p key={c.code} className="text-sm">{c.code} · {t(c.label)} · {c.active ? t(bi("on", "ஆன்")) : t(bi("off", "ஆஃப்"))}</p>
        ))}
      </Panel>
      <Panel className="flex flex-col gap-3">
        <h2 className="font-medium">{t(bi("Subscriptions", "சந்தாக்கள்"))}</h2>
        <p className="text-sm text-muted">{t(bi("Release creates orders only for the original shop. If that shop cannot fulfil, the drop is held.", "விடுவிப்பு அசல் கடைக்கு மட்டும் ஆர்டர் உருவாக்கும். அந்தக் கடை செய்ய முடியாவிட்டால் நிறுத்தப்படும்."))}</p>
        {subs.map((sub) => (
          <p key={sub.id} className="text-sm">{sub.id} · {sub.status} · {formatDay(sub.nextDate, lang)}</p>
        ))}
        <Button onClick={() => release()}>{t(bi("Release due drops", "நிலுவை விநியோகத்தை விடு"))}</Button>
      </Panel>
      <h2 className="font-medium">{t(bi("Issues", "புகார்கள்"))}</h2>
      {complaints.map((issue) => (
        <Panel key={issue.id} className="flex flex-col gap-2">
          <p className="font-medium">{issue.orderId} · {t(ISSUE_KIND[issue.kind])}</p>
          <p className="text-sm">{issue.note}</p>
          <p className="text-sm text-muted">{t(ISSUE_STATUS[issue.status])}</p>
          {issue.status === "open" ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="line" onClick={() => resolve(issue.id, "replacement")}>{t(bi("Replace, same shop", "அதே கடையில் மாற்று"))}</Button>
              <Button variant="line" onClick={() => resolve(issue.id, "refunded")}>{t(bi("Refund wallet", "பணப்பைக்குத் திருப்பு"))}</Button>
              <Button variant="line" onClick={() => resolve(issue.id, "closed")}>{t(bi("Close", "மூடு"))}</Button>
            </div>
          ) : null}
        </Panel>
      ))}
      <h2 className="font-medium">{t(bi("Settlements", "தீர்வுகள்"))}</h2>
      <div className="flex flex-wrap gap-2">
        {vendors.filter((v) => v.status === "approved").map((v) => (
          <Button key={v.id} variant="line" onClick={() => markSettled(v.id)}>{t(bi(`Settle ${v.name.en}`, `${t(v.name)} தீர்`))}</Button>
        ))}
      </div>
      {settlements.map((row) => (
        <p key={row.id} className="text-sm">{row.label} · {row.vendorId} · {inr(row.netPaise, lang)} · {row.status}</p>
      ))}
      <Panel className="flex flex-col gap-3">
        <h2 className="font-medium">{t(bi("Broadcast", "ஒலிபரப்பு"))}</h2>
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} />
        <Button disabled={!note.trim()} onClick={() => { broadcast(note.trim(), note.trim()); setNote(""); }}>{t(bi("Send notice", "அறிவிப்பு அனுப்பு"))}</Button>
      </Panel>
      <h2 className="font-medium">{t(bi("Customers", "வாடிக்கையாளர்கள்"))}</h2>
      {customers.map((c) => (
        <p key={c.name} className="text-sm">{c.name} · {c.type} · {c.n}</p>
      ))}
      <h2 className="font-medium">{t(bi("Roles", "பாத்திரங்கள்"))}</h2>
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="p-3 font-medium">{t(bi("Seat", "இருக்கை"))}</th>
              {keys.map((k) => (
                <th key={k} className="p-3 font-medium">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-b border-line">
                <td className="p-3">{t(ROLE_LABEL[role.id])}</td>
                {keys.map((k) => (
                  <td key={k} className="p-3">
                    <input type="checkbox" checked={role[k]} onChange={(e) => setPerm(role.id, k, e.target.checked)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="font-medium">{t(bi("Desk thread", "மேசை உரையாடல்"))}</h2>
      {support.slice(-4).map((msg, i) => (
        <p key={i} className="text-sm">{msg.from}: {msg.text}</p>
      ))}
      <h2 className="font-medium">{t(bi("Audit", "தணிக்கை"))}</h2>
      {audits.slice(0, 12).map((row) => (
        <p key={row.id} className="text-sm"><span className="text-muted">{row.actor} · {row.action} · </span>{row.detail}</p>
      ))}
      <Panel>
        <h2 className="font-medium">{t(bi("How this holds together", "இது எப்படி இணைகிறது"))}</h2>
        <p className="mt-2 text-sm text-muted">
          {t(bi(
            "Customer, vendor and command share one street engine. Shops only see their own orders. A captured payment is never moved to another shop. Pin codes and the map are recorded; the directory decides service.",
            "வாடிக்கையாளர், கடை, நிர்வாகம் ஒரே தெரு இயந்திரத்தைப் பகிர்கின்றன. கடை தன் ஆர்டரை மட்டும் பார்க்கும். பிடித்த பணம் வேறு கடைக்குப் போகாது. அஞ்சல் குறியீடும் வரைபடமும் பதிவு; சேவையைப் பட்டியல் முடிக்கும்.",
          ))}
        </p>
        <p className="mt-2 text-sm text-muted">{readChennai().label}</p>
      </Panel>
    </div>
  );
}
