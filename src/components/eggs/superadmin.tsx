import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, AlertCircle, Boxes, Check, CircleDollarSign, ClipboardList, Egg, KeyRound,
  LayoutDashboard, LockKeyhole, LogOut, Package, RefreshCw, Search, ShieldCheck,
  Store, Ticket, Truck, Users,
} from "lucide-react";

type Stats = {
  orders: { total: number; open: number; delivered: number; deliveredValuePaise: number; today: number };
  vendors: { total: number; pending: number; approved: number; suspended: number };
  customers: number;
  openComplaints: number;
};
type Vendor = {
  id: string; name: string; phone: string; status: "pending" | "approved" | "suspended";
  servicePincodes: string[]; acceptingOrders: boolean; opensAt: string; closesAt: string; createdAt: number;
};
type SuperOrder = {
  id: string; customerName: string; phone: string; eggQuantity: number; waterCanQuantity: number;
  milkQuantity: number; curdQuantity: number; totalPaise: number; paymentMethod: string;
  paymentStatus: string; status: string; partnerName: string; partnerPhone: string;
  deliveryAddress: string; createdAt: number; vendorId: string | null; vendorName: string;
};
type Complaint = {
  id: string; customerName: string; phone: string; message: string; status: string; createdAt: number;
};
type InventoryRow = {
  vendorId: string; vendorName: string; vendorStatus: string; productKey: string;
  stockUnits: number; lowStockAt: number; available: boolean; updatedAt: number;
};
type CatalogProduct = {
  productKey: "milk" | "curd"; unitPricePaise: number; packLabel: string; enabled: boolean; updatedAt: number;
};
type DashboardData = {
  stats: Stats; vendors: Vendor[]; orders: SuperOrder[]; complaints: Complaint[];
  inventory: InventoryRow[]; catalog: CatalogProduct[];
};
type Tab = "overview" | "orders" | "vendors" | "support" | "inventory" | "catalog";

const API = "/api/superadmin";
const money = (paise: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(paise / 100);
const dateTime = (timestamp: number) => new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(timestamp));
const EMPTY_STATS: Stats = {
  orders: { total: 0, open: 0, delivered: 0, deliveredValuePaise: 0, today: 0 },
  vendors: { total: 0, pending: 0, approved: 0, suspended: 0 },
  customers: 0, openComplaints: 0,
};

async function api<T>(key: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(API + path, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "x-native-superadmin-key": key,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const data = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };
  if (!response.ok || !data.ok) throw new Error(data.error || "The request could not be completed.");
  return data as T;
}

function statusStyle(status: string) {
  if (["approved", "delivered", "resolved", "paid"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["pending", "placed", "open", "in_progress", "accepted", "preparing"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-800";
  if (["suspended", "cancelled", "closed", "rejected"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function Status({ value }: { value: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusStyle(value)}`}>{value.replaceAll("_", " ")}</span>;
}

function Metric({ label, value, hint, icon: Icon }: {
  label: string; value: string; hint: string; icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><Icon size={17} /></span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
    </div>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 ${className}`}>{children}</section>;
}

function ActionButton({ children, onClick, disabled, tone = "dark", type = "button" }: {
  children: ReactNode; onClick: () => void; disabled?: boolean; tone?: "dark" | "blue" | "line" | "danger"; type?: "button" | "submit";
}) {
  const tones = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    blue: "bg-sky-600 text-white hover:bg-sky-500",
    line: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]}`}>{children}</button>;
}

export function SuperAdminApp() {
  const [secretInput, setSecretInput] = useState("");
  const [secret, setSecret] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<SuperOrder[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignment, setAssignment] = useState<Record<string, string>>({});
  const [ticketStatus, setTicketStatus] = useState<Record<string, string>>({});
  const [inventoryDraft, setInventoryDraft] = useState<Record<string, { stockUnits: string; lowStockAt: string; available: boolean }>>({});
  const [vendorForm, setVendorForm] = useState({ name: "", phone: "", pincodes: "" });
  const [catalogDraft, setCatalogDraft] = useState<Record<"milk" | "curd", { price: string; packLabel: string; enabled: boolean }>>({
    milk: { price: "", packLabel: "", enabled: false },
    curd: { price: "", packLabel: "", enabled: false },
  });

  async function loadAll(key: string) {
    setBusy(true);
    setError("");
    try {
      const [dashboard, vendorData, orderData, supportData, inventoryData, catalogData] = await Promise.all([
        api<{ stats: Stats }>(key, "/dashboard"),
        api<{ vendors: Vendor[] }>(key, "/vendors"),
        api<{ orders: SuperOrder[] }>(key, "/orders"),
        api<{ complaints: Complaint[] }>(key, "/complaints"),
        api<{ inventory: InventoryRow[] }>(key, "/inventory"),
        api<{ catalog: CatalogProduct[] }>(key, "/catalog"),
      ]);
      setStats(dashboard.stats);
      setVendors(vendorData.vendors);
      setOrders(orderData.orders);
      setComplaints(supportData.complaints);
      setInventory(inventoryData.inventory);

      setAssignment(Object.fromEntries(orderData.orders.map((order) => [order.id, order.vendorId ?? ""])));
      setTicketStatus(Object.fromEntries(supportData.complaints.map((ticket) => [ticket.id, ticket.status])));
      setInventoryDraft(Object.fromEntries(inventoryData.inventory.map((item) => [
        item.vendorId + ":" + item.productKey,
        { stockUnits: String(item.stockUnits), lowStockAt: String(item.lowStockAt), available: item.available },
      ])));
      setCatalogDraft({
        milk: {
          price: catalogData.catalog.find((item) => item.productKey === "milk")?.unitPricePaise
            ? String((catalogData.catalog.find((item) => item.productKey === "milk")!.unitPricePaise) / 100) : "",
          packLabel: catalogData.catalog.find((item) => item.productKey === "milk")?.packLabel ?? "",
          enabled: catalogData.catalog.find((item) => item.productKey === "milk")?.enabled ?? false,
        },
        curd: {
          price: catalogData.catalog.find((item) => item.productKey === "curd")?.unitPricePaise
            ? String((catalogData.catalog.find((item) => item.productKey === "curd")!.unitPricePaise) / 100) : "",
          packLabel: catalogData.catalog.find((item) => item.productKey === "curd")?.packLabel ?? "",
          enabled: catalogData.catalog.find((item) => item.productKey === "curd")?.enabled ?? false,
        },
      });
      setSecret(key);
      setConnected(true);
      setNotice("Platform data refreshed.");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not connect to Super Admin.");
      setConnected(false);
    } finally {
      setBusy(false);
    }
  }

  async function connect(event: FormEvent) {
    event.preventDefault();
    const key = secretInput.trim();
    if (!key) { setError("Enter the Super Admin access key."); return; }
    await loadAll(key);
  }

  async function refresh() {
    if (secret) await loadAll(secret);
  }

  async function mutate(id: string, path: string, body: unknown, done: (value: any) => void, message: string) {
    setBusyId(id); setError(""); setNotice("");
    try {
      const result = await api<any>(secret, path, { method: "POST", body: JSON.stringify(body) });
      done(result);
      setNotice(message);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not save the change.");
    } finally {
      setBusyId("");
    }
  }

  async function setVendorStatus(vendor: Vendor, status: Vendor["status"]) {
    await mutate(vendor.id, `/vendors/${encodeURIComponent(vendor.id)}/status`, { status }, (result) => {
      setVendors((items) => items.map((item) => item.id === vendor.id ? result.vendor : item));
      setStats((previous) => {
        const next = { ...previous.vendors };
        next[vendor.status] = Math.max(0, next[vendor.status] - 1);
        next[status] += 1;
        return { ...previous, vendors: next };
      });
    }, `${vendor.name} is now ${status}.`);
  }

  async function createVendor(event: FormEvent) {
    event.preventDefault();
    const pins = [...new Set(vendorForm.pincodes.split(/[\s,;]+/).map((v) => v.trim()).filter(Boolean))];
    await mutate("new-vendor", "/vendors", { name: vendorForm.name, phone: vendorForm.phone, servicePincodes: pins }, (result) => {
      setVendors((items) => [result.vendor, ...items.filter((item) => item.id !== result.vendor.id)]);
      setStats((previous) => ({ ...previous, vendors: { ...previous.vendors, total: previous.vendors.total + 1, pending: previous.vendors.pending + 1 } }));
      setVendorForm({ name: "", phone: "", pincodes: "" });
    }, "Vendor application saved as pending approval.");
  }

  async function assignOrder(order: SuperOrder) {
    const vendorId = assignment[order.id];
    if (!vendorId) { setError("Choose an approved vendor before assigning the order."); return; }
    await mutate(order.id, `/orders/${encodeURIComponent(order.id)}/assign`, { vendorId }, (result) => {
      const vendor = vendors.find((item) => item.id === vendorId);
      setOrders((items) => items.map((item) => item.id === order.id
        ? { ...item, vendorId, vendorName: result.vendorName ?? vendor?.name ?? "" } : item));
    }, "Order assigned successfully.");
  }

  async function saveTicket(ticket: Complaint) {
    const status = ticketStatus[ticket.id] ?? ticket.status;
    await mutate(ticket.id, `/complaints/${encodeURIComponent(ticket.id)}/status`, { status }, (result) => {
      setComplaints((items) => items.map((item) => item.id === ticket.id ? result.complaint : item));
    }, "Support ticket updated.");
  }

  async function saveInventory(item: InventoryRow) {
    const id = item.vendorId + ":" + item.productKey;
    const draft = inventoryDraft[id];
    await mutate(id, `/inventory/${encodeURIComponent(item.vendorId)}/${encodeURIComponent(item.productKey)}`, {
      stockUnits: Number(draft.stockUnits), lowStockAt: Number(draft.lowStockAt), available: draft.available,
    }, (result) => {
      setInventory((items) => items.map((current) => current.vendorId === item.vendorId && current.productKey === item.productKey
        ? { ...current, stockUnits: result.stockUnits, lowStockAt: result.lowStockAt, available: result.available, updatedAt: Date.now() }
        : current));
    }, `${item.vendorName} · ${item.productKey} stock saved.`);
  }

  async function saveCatalog(event: FormEvent) {
    event.preventDefault();
    const payload = Object.fromEntries((["milk", "curd"] as const).map((key) => {
      const price = Number(catalogDraft[key].price || 0);
      return [key, { unitPricePaise: Math.round(price * 100), packLabel: catalogDraft[key].packLabel.trim(), enabled: catalogDraft[key].enabled }];
    }));
    await mutate("catalog", "/catalog", payload, (result) => {

    }, "Customer catalogue updated.");
  }

  const visibleOrders = useMemo(() => orders.filter((order) => {
    const matchesQuery = [order.id, order.customerName, order.phone, order.vendorName, order.deliveryAddress]
      .join(" ").toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (statusFilter === "all" || order.status === statusFilter);
  }), [orders, query, statusFilter]);

  const visibleVendors = useMemo(() => vendors.filter((vendor) =>
    [vendor.name, vendor.phone, vendor.id, ...vendor.servicePincodes].join(" ").toLowerCase().includes(query.trim().toLowerCase())
  ), [vendors, query]);

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ClipboardList, count: stats.orders.open },
    { id: "vendors", label: "Vendors", icon: Store, count: stats.vendors.pending },
    { id: "support", label: "Support", icon: Ticket, count: stats.openComplaints },
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "catalog", label: "Catalogue", icon: Package },
  ];

  if (!connected) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#071426] px-4 py-10 text-white">
        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-400 text-[#071426]"><Egg size={25} /></div>
            <div><p className="text-[10px] font-extrabold tracking-[.22em] text-sky-300">EGGSCLUSIVE</p><p className="text-lg font-bold">Platform Control</p></div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.06] p-6 shadow-2xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sky-300"><LockKeyhole size={22} /></div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-sky-300">Restricted access</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Super Admin</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Connect with the server-side Super Admin access key. The key stays in memory only and is not written to browser storage.</p>
            <form className="mt-6 space-y-3" onSubmit={connect}>
              <label htmlFor="superadmin-key" className="block text-xs font-bold text-slate-300">Access key</label>
              <input id="superadmin-key" type="password" autoComplete="off" value={secretInput}
                onChange={(event) => setSecretInput(event.target.value)} placeholder="Enter Super Admin key"
                className="min-h-12 w-full rounded-xl border border-white/15 bg-[#0b1d33] px-4 text-sm text-white outline-none focus:border-sky-400" />
              {error ? <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}
              <button type="submit" disabled={busy || !secretInput.trim()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-extrabold text-[#071426] disabled:opacity-50">
                {busy ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={17} />}
                {busy ? "Verifying access…" : "Unlock control centre"}
              </button>
            </form>
            <p className="mt-5 flex items-center gap-2 text-[11px] text-slate-500"><KeyRound size={13} /> Access is verified by the server on every request.</p>
          </div>
          <p className="mt-5 text-center text-[10px] text-slate-600">Eggsclusive · Private platform administration</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fa] text-[#14243a]">
      <header className="bg-[#071426] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-5 pt-5 md:px-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-400 text-[#071426]"><Egg size={23} /></div>
              <div>
                <p className="text-[10px] font-extrabold tracking-[.2em] text-sky-300">EGGSCLUSIVE · PLATFORM</p>
                <h1 className="text-xl font-extrabold">Super Admin</h1>
              </div>
              <span className="ml-1 hidden rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 sm:inline-flex"><span className="mr-1.5 mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" /> Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <ActionButton tone="line" onClick={refresh} disabled={busy}><RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Refresh</ActionButton>
              <ActionButton tone="line" onClick={() => { setConnected(false); setSecret(""); setSecretInput(""); setNotice(""); setError(""); }}><LogOut size={14} /> Lock</ActionButton>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Total orders" value={String(stats.orders.total)} hint={`${stats.orders.today} received today`} icon={ClipboardList} />
            <Metric label="Open orders" value={String(stats.orders.open)} hint={`${stats.orders.delivered} delivered`} icon={Truck} />
            <Metric label="Delivered value" value={money(stats.orders.deliveredValuePaise)} hint="Value of delivered orders" icon={CircleDollarSign} />
            <Metric label="Customers" value={String(stats.customers)} hint={`${stats.openComplaints} open support tickets`} icon={Users} />
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2 md:px-7" aria-label="Super Admin sections">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button key={id} type="button" onClick={() => { setTab(id); setQuery(""); }}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${tab === id ? "bg-[#071426] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              <Icon size={15} /> {label}
              {count ? <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === id ? "bg-white/15 text-white" : "bg-sky-100 text-sky-800"}`}>{count}</span> : null}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:px-7 md:py-7">
        {error ? <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div> : null}
        {notice ? <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><Check size={16} />{notice}</div> : null}

        {tab === "overview" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Approved vendors" value={String(stats.vendors.approved)} hint={`${stats.vendors.total} registered vendors`} icon={Store} />
              <Metric label="Pending approval" value={String(stats.vendors.pending)} hint="Vendor applications waiting" icon={Activity} />
              <Metric label="Suspended vendors" value={String(stats.vendors.suspended)} hint="Access disabled" icon={AlertCircle} />
              <Metric label="Support queue" value={String(stats.openComplaints)} hint="Open and in progress" icon={Ticket} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <Panel>
                <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Latest orders</h2><p className="text-xs text-slate-500">Most recent customer activity</p></div><button onClick={() => setTab("orders")} className="text-xs font-bold text-sky-700">View all</button></div>
                <div className="space-y-3">
                  {orders.slice(0, 6).map((order) => (
                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0"><p className="text-sm font-bold">{order.id} · {order.customerName}</p><p className="mt-0.5 truncate text-xs text-slate-500">{order.eggQuantity} eggs · {order.vendorName || "Awaiting vendor"} · {dateTime(order.createdAt)}</p></div>
                      <div className="flex items-center gap-2"><Status value={order.status} /><strong className="text-sm tabular-nums">{money(order.totalPaise)}</strong></div>
                    </div>
                  ))}
                  {orders.length === 0 ? <p className="py-5 text-center text-sm text-slate-500">No orders in the database yet.</p> : null}
                </div>
              </Panel>
              <Panel>
                <h2 className="text-lg font-extrabold">Platform pulse</h2>
                <p className="mt-1 text-xs text-slate-500">Current operating snapshot</p>
                <div className="mt-4 space-y-4">
                  {[
                    ["Order fulfilment", stats.orders.total ? Math.round(stats.orders.delivered / stats.orders.total * 100) : 0, "of all orders delivered"],
                    ["Vendor approval", stats.vendors.total ? Math.round(stats.vendors.approved / stats.vendors.total * 100) : 0, "vendors approved"],
                  ].map(([label, value, helper]) => (
                    <div key={String(label)}><div className="mb-1.5 flex justify-between text-xs"><strong>{label}</strong><span className="tabular-nums text-slate-500">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: `${value}%` }} /></div><p className="mt-1 text-[10px] text-slate-500">{helper}</p></div>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button onClick={() => setTab("vendors")} className="rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"><Store size={17} className="text-sky-700" /><strong className="mt-2 block text-sm">Manage vendors</strong><span className="text-[10px] text-slate-500">Approvals and service areas</span></button>
                  <button onClick={() => setTab("support")} className="rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"><Ticket size={17} className="text-sky-700" /><strong className="mt-2 block text-sm">Support desk</strong><span className="text-[10px] text-slate-500">Resolve customer issues</span></button>
                </div>
              </Panel>
            </div>
          </>
        ) : null}

        {tab === "orders" ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="text-2xl font-extrabold">Order control</h2><p className="mt-1 text-sm text-slate-500">Review every order and allocate an approved shop.</p></div>
              <p className="text-xs font-semibold text-slate-500">{visibleOrders.length} order(s)</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_190px]">
              <div className="relative"><Search size={16} className="absolute left-3 top-3.5 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search order, customer, phone, address…" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-sky-500" /></div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="all">All statuses</option>{["placed","accepted","preparing","out_for_delivery","delivered","cancelled"].map((value) => <option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}</select>
            </div>
            {visibleOrders.map((order) => (
              <Panel key={order.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-xs font-bold text-sky-700">{order.id} · {dateTime(order.createdAt)}</p><h3 className="mt-1 text-base font-extrabold">{order.customerName}</h3><p className="text-xs text-slate-500">{order.phone} · {order.deliveryAddress}</p></div>
                  <div className="flex items-center gap-2"><Status value={order.status} /><strong className="text-base tabular-nums">{money(order.totalPaise)}</strong></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  {order.eggQuantity > 0 ? <span className="rounded-lg bg-slate-100 px-2 py-1">{order.eggQuantity} eggs</span> : null}
                  {order.waterCanQuantity > 0 ? <span className="rounded-lg bg-slate-100 px-2 py-1">{order.waterCanQuantity} water cans</span> : null}
                  {order.milkQuantity > 0 ? <span className="rounded-lg bg-slate-100 px-2 py-1">{order.milkQuantity} milk</span> : null}
                  {order.curdQuantity > 0 ? <span className="rounded-lg bg-slate-100 px-2 py-1">{order.curdQuantity} curd</span> : null}
                  <span className="rounded-lg bg-slate-100 px-2 py-1">{order.paymentStatus}</span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <select value={assignment[order.id] ?? ""} onChange={(e) => setAssignment((items) => ({ ...items, [order.id]: e.target.value }))} disabled={["delivered","cancelled"].includes(order.status)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-100">
                    <option value="">Select approved vendor…</option>
                    {vendors.filter((vendor) => vendor.status === "approved").map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name} · {vendor.servicePincodes.join(", ")}</option>)}
                  </select>
                  <ActionButton tone="blue" disabled={busyId === order.id || !assignment[order.id] || ["delivered","cancelled"].includes(order.status)} onClick={() => assignOrder(order)}>{busyId === order.id ? "Saving…" : order.vendorId ? "Reassign vendor" : "Assign vendor"}</ActionButton>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Assigned shop: <strong className="text-slate-700">{order.vendorName || "Not assigned"}</strong> · {order.partnerPhone || "No partner phone"}</p>
              </Panel>
            ))}
            {visibleOrders.length === 0 ? <Panel><p className="py-6 text-center text-sm text-slate-500">No orders match this filter.</p></Panel> : null}
          </>
        ) : null}

        {tab === "vendors" ? (
          <>
            <div><h2 className="text-2xl font-extrabold">Vendor network</h2><p className="mt-1 text-sm text-slate-500">Register partner shops, approve access and manage service coverage.</p></div>
            <Panel>
              <h3 className="text-base font-extrabold">Add a vendor</h3>
              <form onSubmit={createVendor} className="mt-3 grid gap-3 md:grid-cols-4">
                <input required value={vendorForm.name} onChange={(e) => setVendorForm((v) => ({ ...v, name: e.target.value }))} placeholder="Shop name" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" />
                <input required inputMode="tel" value={vendorForm.phone} onChange={(e) => setVendorForm((v) => ({ ...v, phone: e.target.value }))} placeholder="10-digit mobile" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" />
                <input required value={vendorForm.pincodes} onChange={(e) => setVendorForm((v) => ({ ...v, pincodes: e.target.value }))} placeholder="6-digit pincodes, comma separated" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" />
                <ActionButton type="submit" tone="blue" onClick={() => undefined} disabled={busyId === "new-vendor"}>{busyId === "new-vendor" ? "Saving…" : "Create vendor"}</ActionButton>
              </form>
              <p className="mt-2 text-[10px] text-slate-500">New vendors are created as Pending and cannot accept customer orders until approved.</p>
            </Panel>
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleVendors.map((vendor) => (
                <Panel key={vendor.id}>
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold">{vendor.name}</h3><p className="mt-0.5 text-xs text-slate-500">{vendor.phone} · {vendor.id}</p></div><Status value={vendor.status} /></div>
                  <p className="mt-3 text-xs text-slate-600">Service pincodes: <strong>{vendor.servicePincodes.join(", ") || "Not set"}</strong></p>
                  <p className="mt-1 text-xs text-slate-600">Orders: <strong>{vendor.acceptingOrders ? "Accepting" : "Not accepting"}</strong> · {vendor.opensAt}–{vendor.closesAt}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {vendor.status !== "approved" ? <ActionButton tone="blue" onClick={() => setVendorStatus(vendor, "approved")} disabled={busyId === vendor.id}><Check size={13} /> Approve</ActionButton> : null}
                    {vendor.status !== "suspended" ? <ActionButton tone="danger" onClick={() => setVendorStatus(vendor, "suspended")} disabled={busyId === vendor.id}>Suspend</ActionButton> : null}
                    {vendor.status === "suspended" ? <ActionButton tone="line" onClick={() => setVendorStatus(vendor, "pending")} disabled={busyId === vendor.id}>Return to pending</ActionButton> : null}
                  </div>
                </Panel>
              ))}
            </div>
            {vendors.length === 0 ? <Panel><p className="py-5 text-center text-sm text-slate-500">No vendors registered yet.</p></Panel> : null}
          </>
        ) : null}

        {tab === "support" ? (
          <>
            <div><h2 className="text-2xl font-extrabold">Customer support</h2><p className="mt-1 text-sm text-slate-500">Review issues and move tickets through resolution.</p></div>
            {complaints.map((ticket) => (
              <Panel key={ticket.id}>
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold text-sky-700">{ticket.id} · {dateTime(ticket.createdAt)}</p><h3 className="mt-1 font-extrabold">{ticket.customerName}</h3><p className="text-xs text-slate-500">{ticket.phone}</p></div><Status value={ticket.status} /></div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.message}</p>
                <div className="mt-3 flex flex-wrap gap-2"><select value={ticketStatus[ticket.id] ?? ticket.status} onChange={(e) => setTicketStatus((items) => ({ ...items, [ticket.id]: e.target.value }))} className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs"><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><ActionButton tone="blue" onClick={() => saveTicket(ticket)} disabled={busyId === ticket.id}>{busyId === ticket.id ? "Saving…" : "Update ticket"}</ActionButton></div>
              </Panel>
            ))}
            {complaints.length === 0 ? <Panel><p className="py-6 text-center text-sm text-slate-500">No customer support tickets yet.</p></Panel> : null}
          </>
        ) : null}

        {tab === "inventory" ? (
          <>
            <div><h2 className="text-2xl font-extrabold">Vendor inventory</h2><p className="mt-1 text-sm text-slate-500">Update stock and product availability for every partner shop.</p></div>
            <div className="grid gap-3 md:grid-cols-2">
              {inventory.map((item) => {
                const id = item.vendorId + ":" + item.productKey;
                const draft = inventoryDraft[id] ?? { stockUnits: String(item.stockUnits), lowStockAt: String(item.lowStockAt), available: item.available };
                return (
                  <Panel key={id}>
                    <div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold capitalize">{item.productKey} · {item.vendorName}</h3><p className="text-[11px] text-slate-500">{item.vendorId} · {item.vendorStatus}</p></div><Status value={item.available ? "available" : "unavailable"} /></div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <label className="text-[11px] font-bold text-slate-500">Stock units<input type="number" min="0" max="100000" value={draft.stockUnits} onChange={(e) => setInventoryDraft((all) => ({ ...all, [id]: { ...draft, stockUnits: e.target.value } }))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900" /></label>
                      <label className="text-[11px] font-bold text-slate-500">Low stock alert<input type="number" min="0" max="100000" value={draft.lowStockAt} onChange={(e) => setInventoryDraft((all) => ({ ...all, [id]: { ...draft, lowStockAt: e.target.value } }))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900" /></label>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={draft.available} onChange={(e) => setInventoryDraft((all) => ({ ...all, [id]: { ...draft, available: e.target.checked } }))} /> Available to customers</label><ActionButton tone="blue" onClick={() => saveInventory(item)} disabled={busyId === id}>{busyId === id ? "Saving…" : "Save stock"}</ActionButton></div>
                  </Panel>
                );
              })}
            </div>
            {inventory.length === 0 ? <Panel><p className="py-5 text-center text-sm text-slate-500">No vendor inventory records yet.</p></Panel> : null}
          </>
        ) : null}

        {tab === "catalog" ? (
          <>
            <div><h2 className="text-2xl font-extrabold">Customer catalogue</h2><p className="mt-1 text-sm text-slate-500">Manage the shared Milk and Curd prices and availability.</p></div>
            <Panel>
              <form onSubmit={saveCatalog} className="space-y-4">
                {(["milk", "curd"] as const).map((key) => (
                  <div key={key} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[100px_1fr_1fr_auto] md:items-end">
                    <h3 className="text-lg font-extrabold capitalize">{key}</h3>
                    <label className="text-[11px] font-bold text-slate-500">Pack size / unit<input value={catalogDraft[key].packLabel} onChange={(e) => setCatalogDraft((all) => ({ ...all, [key]: { ...all[key], packLabel: e.target.value } }))} placeholder={key === "milk" ? "500 ml pouch" : "400 g cup"} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900" /></label>
                    <label className="text-[11px] font-bold text-slate-500">Price (₹)<input type="number" min="0" step="0.01" value={catalogDraft[key].price} onChange={(e) => setCatalogDraft((all) => ({ ...all, [key]: { ...all[key], price: e.target.value } }))} placeholder="0.00" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900" /></label>
                    <label className="flex min-h-11 items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={catalogDraft[key].enabled} onChange={(e) => setCatalogDraft((all) => ({ ...all, [key]: { ...all[key], enabled: e.target.checked } }))} /> Enabled</label>
                  </div>
                ))}
                <div className="flex justify-end"><ActionButton type="submit" tone="blue" onClick={() => undefined} disabled={busyId === "catalog"}>{busyId === "catalog" ? "Saving…" : "Save catalogue"}</ActionButton></div>
              </form>
            </Panel>
          </>
        ) : null}
        <footer className="flex flex-wrap items-center justify-between gap-2 pt-3 text-[10px] text-slate-400"><span>Eggsclusive Super Admin · Protected server API</span><span>Showing up to 300 recent orders</span></footer>
      </div>
    </main>
  );
}
