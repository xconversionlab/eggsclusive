import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Droplets,
  Egg,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageSquareText,
  Milk,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Soup,
  Truck,
  Wallet,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";

type NativeComplaint = {
  id: string;
  customer_name: string;
  customer_phone: string;
  message: string;
  status: string;
  created_at: string;
};

type NativeOrder = {
  id: string;
  customerName: string;
  phone: string;
  quantity: number;
  eggQuantity?: number;
  eggUnitPricePaise?: number;
  waterCanQuantity?: number;
  waterCanUnitPricePaise?: number;
  milkQuantity?: number;
  curdQuantity?: number;
  milkUnitPricePaise?: number;
  curdUnitPricePaise?: number;
  floorDeliveryChargePaise?: number;
  bottleDepositPaise?: number;
  emptyBottlesToReturn?: boolean;
  totalPaise: number;
  payment: string;
  paymentStatus?: string;
  productType?: string;
  status: string;
  partnerShop: string;
  partnerName: string;
  partnerPhone: string;
  addressLabel: string;
  deliveryAddress: string;
  createdAt: number;
  statusChangedAt: number;
};

type CatalogProduct = {
  unitPricePaise: number;
  packLabel: string;
  enabled: boolean;
};

type NativeCatalog = {
  egg: CatalogProduct;
  water: CatalogProduct;
  milk: CatalogProduct;
  curd: CatalogProduct;
};

type CatalogDraft = { price: string; packLabel: string; enabled: boolean };
type CatalogKey = "milk" | "curd";
type AdminView = "overview" | "orders" | "products" | "support";
type OrderFilter = "all" | "placed" | "active" | "delivered" | "cancelled";

const NAV_ITEMS: Array<{ id: AdminView; label: string; hint: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", hint: "Daily operations", icon: LayoutDashboard },
  { id: "orders", label: "Orders", hint: "Review and update", icon: ShoppingBag },
  { id: "products", label: "Products", hint: "Prices and availability", icon: Package },
  { id: "support", label: "Customer support", hint: "Customer complaints", icon: MessageSquareText },
];

const ORDER_FLOW = [
  { value: "placed", label: "Order received" },
  { value: "accepted", label: "Partner allocated" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
] as const;

const formatMoney = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((Number.isFinite(paise) ? paise : 0) / 100);

const formatDate = (timestamp: number | string) => {
  const value = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
  if (!Number.isFinite(value) || value <= 0) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
};

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    placed: "New order",
    accepted: "Partner allocated",
    preparing: "Preparing",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] || status.replaceAll("_", " ");
};

const statusTone = (status: string) => {
  if (status === "delivered") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "cancelled") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (status === "placed") return "bg-sky-50 text-sky-700 ring-sky-200";
  return "bg-amber-50 text-amber-800 ring-amber-200";
};

const stageIndex = (status: string) => {
  const index = ORDER_FLOW.findIndex((step) => step.value === status);
  return index;
};

const orderItems = (order: NativeOrder) => {
  const items: Array<{ name: string; quantity: number; unitPricePaise: number; suffix: string }> = [];
  const waterQuantity = Number(order.waterCanQuantity || 0);
  const milkQuantity = Number(order.milkQuantity || 0);
  const curdQuantity = Number(order.curdQuantity || 0);
  const eggQuantity = Number(order.eggQuantity ?? order.quantity ?? 0);

  if (waterQuantity > 0) items.push({
    name: "Water Can",
    quantity: waterQuantity,
    unitPricePaise: Number(order.waterCanUnitPricePaise ?? 3000),
    suffix: "20L can",
  });
  if (milkQuantity > 0) items.push({
    name: "Milk",
    quantity: milkQuantity,
    unitPricePaise: Number(order.milkUnitPricePaise || 0),
    suffix: "pack",
  });
  if (curdQuantity > 0) items.push({
    name: "Curd",
    quantity: curdQuantity,
    unitPricePaise: Number(order.curdUnitPricePaise || 0),
    suffix: "pack",
  });
  if (eggQuantity > 0) items.push({
    name: "Fresh Egg",
    quantity: eggQuantity,
    unitPricePaise: Number(order.eggUnitPricePaise ?? 700),
    suffix: "egg",
  });
  return items;
};

async function requestJson(url: string, key: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "x-native-ops-key": key,
      ...(init?.body ? { "content-type": "application/json" } : {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "The operations request could not be completed.");
  }
  return data;
}

export const Route = createFileRoute("/admin/native-orders")({
  component: NativeOperationsDashboard,
});

function NativeOperationsDashboard() {
  const [opsKey, setOpsKey] = useState("");
  const [orders, setOrders] = useState<NativeOrder[]>([]);
  const [complaints, setComplaints] = useState<NativeComplaint[]>([]);
  const [catalog, setCatalog] = useState<NativeCatalog | null>(null);
  const [nextStatus, setNextStatus] = useState<Record<string, string>>({});
  const [view, setView] = useState<AdminView>("overview");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [supportFilter, setSupportFilter] = useState<"all" | "open">("open");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(0);
  const [catalogDraft, setCatalogDraft] = useState<Record<CatalogKey, CatalogDraft>>({
    milk: { price: "", packLabel: "", enabled: false },
    curd: { price: "", packLabel: "", enabled: false },
  });

  const activeOrders = useMemo(
    () => orders.filter((order) => ["placed", "accepted", "preparing", "out_for_delivery"].includes(order.status)),
    [orders],
  );
  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.status === "delivered"),
    [orders],
  );
  const cancelledOrders = useMemo(
    () => orders.filter((order) => order.status === "cancelled"),
    [orders],
  );
  const openComplaints = useMemo(
    () => complaints.filter((ticket) => !["resolved", "closed", "done"].includes(ticket.status.toLowerCase())),
    [complaints],
  );
  const deliveredValue = useMemo(
    () => deliveredOrders.reduce((sum, order) => sum + Number(order.totalPaise || 0), 0),
    [deliveredOrders],
  );

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter =
        orderFilter === "all" ||
        (orderFilter === "placed" && order.status === "placed") ||
        (orderFilter === "active" && ["accepted", "preparing", "out_for_delivery"].includes(order.status)) ||
        (orderFilter === "delivered" && order.status === "delivered") ||
        (orderFilter === "cancelled" && order.status === "cancelled");
      if (!matchesFilter) return false;
      if (!query) return true;
      const haystack = [
        order.id,
        order.customerName,
        order.phone,
        order.addressLabel,
        order.deliveryAddress,
        order.partnerName,
        order.partnerPhone,
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, orderFilter, search]);

  const visibleComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();
    return complaints.filter((ticket) => {
      const isOpen = !["resolved", "closed", "done"].includes(ticket.status.toLowerCase());
      if (supportFilter === "open" && !isOpen) return false;
      if (!query) return true;
      return [ticket.id, ticket.customer_name, ticket.customer_phone, ticket.message]
        .join(" ").toLowerCase().includes(query);
    });
  }, [complaints, search, supportFilter]);

  async function loadDashboard() {
    const key = opsKey.trim();
    if (!key) {
      setError("Enter the operations access key to connect the dashboard.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const [orderData, supportData, catalogData] = await Promise.all([
        requestJson("/api/native/ops/orders", key),
        requestJson("/api/native/ops/complaints", key),
        requestJson("/api/native/ops/catalog", key),
      ]);
      const loadedOrders = (orderData.orders || []) as NativeOrder[];
      const loadedComplaints = (supportData.complaints || []) as NativeComplaint[];
      const loadedCatalog = catalogData.catalog as NativeCatalog;
      setOrders(loadedOrders);
      setComplaints(loadedComplaints);
      setCatalog(loadedCatalog);
      setNextStatus({});
      setCatalogDraft({
        milk: {
          price: loadedCatalog?.milk?.unitPricePaise ? String(loadedCatalog.milk.unitPricePaise / 100) : "",
          packLabel: loadedCatalog?.milk?.packLabel || "",
          enabled: Boolean(loadedCatalog?.milk?.enabled),
        },
        curd: {
          price: loadedCatalog?.curd?.unitPricePaise ? String(loadedCatalog.curd.unitPricePaise / 100) : "",
          packLabel: loadedCatalog?.curd?.packLabel || "",
          enabled: Boolean(loadedCatalog?.curd?.enabled),
        },
      });
      setLoaded(true);
      setRefreshedAt(Date.now());
      setNotice("Operations data refreshed. The dashboard is connected to the live customer-app records.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to the operations services.");
      setLoaded(false);
    } finally {
      setLoading(false);
    }
  }

  function disconnect() {
    setOpsKey("");
    setOrders([]);
    setComplaints([]);
    setCatalog(null);
    setLoaded(false);
    setRefreshedAt(0);
    setNextStatus({});
    setNotice("");
    setError("");
    setView("overview");
  }

  async function saveCatalog() {
    if (!opsKey.trim()) return;
    setSavingCatalog(true);
    setError("");
    setNotice("");
    try {
      const payload = Object.fromEntries((["milk", "curd"] as const).map((key) => {
        const item = catalogDraft[key];
        const price = Number(item.price);
        if (!Number.isFinite(price) || price < 0 || price > 1000000) {
          throw new Error("Enter a valid " + key + " price in rupees.");
        }
        if (item.enabled && (price <= 0 || !item.packLabel.trim())) {
          throw new Error("Enter the " + key + " price and pack size before making it available.");
        }
        return [key, {
          unitPricePaise: Math.round(price * 100),
          packLabel: item.packLabel.trim(),
          enabled: item.enabled,
        }];
      }));
      const data = await requestJson("/api/native/ops/catalog", opsKey.trim(), {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCatalog(data.catalog as NativeCatalog);
      setNotice("Milk and Curd catalogue saved. The customer app refreshes the catalogue automatically.");
      setRefreshedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save product pricing.");
    } finally {
      setSavingCatalog(false);
    }
  }

  async function updateStatus(order: NativeOrder) {
    const status = nextStatus[order.id];
    if (!status || !opsKey.trim()) return;
    if (status === "cancelled") {
      const confirmed = window.confirm(
        "Cancel order " + order.id + "? The customer will see the cancellation in Status. Any eligible captured payment is handled by the existing wallet-refund rule.",
      );
      if (!confirmed) return;
    }
    setUpdatingId(order.id);
    setError("");
    setNotice("");
    try {
      const data = await requestJson(
        "/api/native/ops/orders/" + encodeURIComponent(order.id) + "/status",
        opsKey.trim(),
        {
          method: "POST",
          body: JSON.stringify({ status, note: "Updated by Spencer's Enterprises operations dashboard" }),
        },
      );
      setOrders((previous) => previous.map((item) =>
        item.id === order.id ? { ...item, status: data.status, statusChangedAt: Date.now() } : item,
      ));
      setNextStatus((previous) => {
        const copy = { ...previous };
        delete copy[order.id];
        return copy;
      });
      setRefreshedAt(Date.now());
      setNotice(
        data.refundApplied
          ? "Order cancelled. The paid amount was credited to the customer's Eggsclusive wallet."
          : data.status === "cancelled"
            ? "Order cancelled. No captured payment was found, so no wallet refund was created."
            : data.notification === "submitted"
              ? "Status updated. The SMS provider accepted the customer alert."
              : data.notification === "not_configured"
                ? "Status updated. The transactional SMS template or provider API is not configured."
                : "Status updated, but the SMS provider did not confirm the customer alert.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the order.");
    } finally {
      setUpdatingId("");
    }
  }

  const orderCounts: Array<{ id: OrderFilter; label: string; count: number }> = [
    { id: "all", label: "All orders", count: orders.length },
    { id: "placed", label: "New", count: orders.filter((order) => order.status === "placed").length },
    { id: "active", label: "In progress", count: activeOrders.filter((order) => order.status !== "placed").length },
    { id: "delivered", label: "Delivered", count: deliveredOrders.length },
    { id: "cancelled", label: "Cancelled", count: cancelledOrders.length },
  ];

  const currentPage = NAV_ITEMS.find((item) => item.id === view) || NAV_ITEMS[0];

  return (
    <main className="min-h-screen bg-customer text-customer-ink">
      <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden min-h-screen flex-col bg-brand-dark px-5 py-6 text-white lg:flex">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <img src="/spencers-mark.jpg" alt="Spencer's Enterprises" className="h-11 w-11 rounded-xl object-contain" />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-wide">SPENCERS</p>
              <p className="text-xs text-white/60">ENTERPRISES</p>
            </div>
          </div>
          <div className="pt-7">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Operations</p>
            <nav className="mt-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setView(item.id); setSearch(""); }}
                    className={[
                      "flex min-h-12 items-center gap-3 rounded-xl px-3 text-left transition-colors",
                      active ? "bg-white text-brand-dark shadow-sm" : "text-white/75 hover:bg-white/8 hover:text-white",
                    ].join(" ")}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className={active ? "block text-[11px] text-brand-dark/60" : "block text-[11px] text-white/45"}>{item.hint}</span>
                    </span>
                    {item.id === "orders" && activeOrders.length > 0 ? (
                      <span className={active ? "rounded-full bg-brand-pale px-2 py-0.5 text-[10px] font-bold text-brand-dark" : "rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white"}>
                        {activeOrders.length}
                      </span>
                    ) : null}
                    {item.id === "support" && openComplaints.length > 0 ? (
                      <span className={active ? "rounded-full bg-brand-pale px-2 py-0.5 text-[10px] font-bold text-brand-dark" : "rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white"}>
                        {openComplaints.length}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/85">
              <ShieldCheck size={15} />
              Operations access
            </div>
            <p className="mt-2 text-xs leading-5 text-white/50">
              Protected by the server-side operations key. The key is held only in this page's memory.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-white/65">
              <span className={loaded ? "h-2 w-2 rounded-full bg-emerald-400" : "h-2 w-2 rounded-full bg-white/25"} />
              {loaded ? "Connected" : "Not connected"}
            </div>
          </div>
          <p className="mt-4 text-[10px] text-white/35">CUSTOMER OPERATIONS · CHENNAI</p>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-customer-line bg-white">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <img src="/spencers-mark.jpg" alt="" className="h-10 w-10 rounded-xl object-contain lg:hidden" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Spencer's Enterprises</p>
                    <h1 className="truncate text-lg font-bold sm:text-xl">Operations dashboard</h1>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {loaded ? (
                    <>
                      <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:inline-flex">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live data
                      </span>
                      <button
                        type="button"
                        onClick={loadDashboard}
                        disabled={loading}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-customer-line bg-white px-3 text-sm font-semibold text-customer-ink transition-colors hover:bg-customer disabled:opacity-50"
                      >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                    </>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Access required</span>
                  )}
                </div>
              </div>
              <nav className="flex gap-2 overflow-x-auto pb-0.5 lg:hidden" aria-label="Operations sections">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => { setView(item.id); setSearch(""); }}
                      className={[
                        "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors",
                        active ? "border-brand-dark bg-brand-dark text-white" : "border-customer-line bg-white text-customer-muted",
                      ].join(" ")}
                    >
                      <Icon size={14} />
                      {item.label}
                      {item.id === "orders" && activeOrders.length > 0 ? <span className="rounded-full bg-white/15 px-1.5">{activeOrders.length}</span> : null}
                      {item.id === "support" && openComplaints.length > 0 ? <span className="rounded-full bg-white/15 px-1.5">{openComplaints.length}</span> : null}
                    </button>
                  );
                })}
              </nav>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <section className="rounded-2xl border border-customer-line bg-white p-4 shadow-card sm:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-pale text-brand">
                    <LockKeyhole size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold">Operations access key</h2>
                      {loaded ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Verified for this session</span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">Not connected</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-customer-muted">
                      Connect using the existing NATIVE_OPS_API_KEY. It is not saved in browser storage.
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row md:w-[min(100%,520px)]">
                  <input
                    id="ops-key"
                    type="password"
                    autoComplete="off"
                    value={opsKey}
                    onChange={(event) => setOpsKey(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") loadDashboard(); }}
                    placeholder="Enter operations key"
                    aria-label="Operations access key"
                    className="min-h-11 min-w-0 flex-1 rounded-xl border border-customer-line bg-customer px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  />
                  <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={loading || !opsKey.trim()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 text-sm font-semibold text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {loading ? <RefreshCw size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                    {loaded ? "Reconnect / refresh" : "Connect dashboard"}
                  </button>
                  {loaded ? (
                    <button
                      type="button"
                      onClick={disconnect}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-customer-line bg-white px-3 text-sm font-semibold text-customer-muted transition hover:bg-customer hover:text-customer-ink"
                    >
                      <LogOut size={15} />
                      Disconnect
                    </button>
                  ) : null}
                </div>
              </div>
              {error ? (
                <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
                  <CircleAlert size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}
              {notice ? (
                <div role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-brand/15 bg-brand-pale px-3 py-2.5 text-sm text-brand-dark">
                  <Check size={17} className="mt-0.5 shrink-0" />
                  <span>{notice}</span>
                </div>
              ) : null}
            </section>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{currentPage.label}</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {view === "overview" ? "Your business, at a glance." :
                    view === "orders" ? "Customer orders" :
                    view === "products" ? "Customer app catalogue" : "Customer support"}
                </h2>
                <p className="mt-1 text-sm text-customer-muted">
                  {view === "overview" ? "Monitor orders, product availability and customer requests." :
                    view === "orders" ? "Review order details and move each order through its delivery stages." :
                    view === "products" ? "Manage the same four products shown in the customer ordering experience." :
                    "Review customer complaints submitted through the customer app."}
                </p>
              </div>
              {loaded ? (
                <p className="text-xs text-customer-muted">
                  Last refreshed {refreshedAt ? formatDate(refreshedAt) : "just now"}
                </p>
              ) : null}
            </div>

            {!loaded ? (
              <section className="rounded-2xl border border-dashed border-customer-line bg-white px-5 py-14 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-pale text-brand">
                  <ShieldCheck size={25} />
                </div>
                <h3 className="mt-4 text-lg font-bold">Connect to the customer operations data</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-customer-muted">
                  Enter the existing operations key above to load real orders, product prices and customer support tickets. No sample records are shown as live data.
                </p>
              </section>
            ) : (
              <>
                {view === "overview" ? (
                  <div className="flex flex-col gap-6">
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricCard label="Total orders" value={String(orders.length)} note="Latest orders returned by the service" icon={ShoppingBag} tone="blue" />
                      <MetricCard label="Active orders" value={String(activeOrders.length)} note="Awaiting delivery completion" icon={Truck} tone="navy" />
                      <MetricCard label="Delivered orders" value={String(deliveredOrders.length)} note="Customer delivery completed" icon={BadgeCheck} tone="green" />
                      <MetricCard label="Open support tickets" value={String(openComplaints.length)} note="Customer requests needing attention" icon={MessageSquareText} tone="amber" />
                    </section>

                    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.85fr)]">
                      <div className="rounded-2xl border border-customer-line bg-white p-5 shadow-card">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold">Order activity</h3>
                            <p className="mt-1 text-xs text-customer-muted">Current order distribution by delivery stage.</p>
                          </div>
                          <button type="button" onClick={() => setView("orders")} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-brand hover:bg-brand-pale">
                            View orders <ChevronRight size={14} />
                          </button>
                        </div>
                        <div className="mt-5 flex flex-col gap-4">
                          {[
                            { label: "New orders", count: orders.filter((order) => order.status === "placed").length, color: "bg-brand" },
                            { label: "Partner allocated", count: orders.filter((order) => order.status === "accepted").length, color: "bg-sky-400" },
                            { label: "Preparing", count: orders.filter((order) => order.status === "preparing").length, color: "bg-amber-400" },
                            { label: "Out for delivery", count: orders.filter((order) => order.status === "out_for_delivery").length, color: "bg-indigo-400" },
                            { label: "Delivered", count: deliveredOrders.length, color: "bg-emerald-500" },
                            { label: "Cancelled", count: cancelledOrders.length, color: "bg-rose-400" },
                          ].map((row) => {
                            const percentage = orders.length ? Math.max(row.count > 0 ? 3 : 0, (row.count / orders.length) * 100) : 0;
                            return (
                              <div key={row.label}>
                                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                                  <span className="font-medium text-customer-ink">{row.label}</span>
                                  <span className="tabular-nums text-customer-muted">{row.count}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-customer">
                                  <div className={"h-full rounded-full transition-[width] duration-300 " + row.color} style={{ width: percentage + "%" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-customer-line bg-white p-5 shadow-card">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold">Product availability</h3>
                            <p className="mt-1 text-xs text-customer-muted">Customer app catalogue status</p>
                          </div>
                          <button type="button" onClick={() => setView("products")} className="rounded-lg p-2 text-customer-muted hover:bg-customer hover:text-brand" aria-label="Manage products">
                            <ChevronRight size={17} />
                          </button>
                        </div>
                        <div className="mt-4 flex flex-col divide-y divide-customer-line">
                          {catalog ? (
                            [
                              { name: "Water Can", pack: catalog.water.packLabel, price: catalog.water.unitPricePaise, enabled: catalog.water.enabled },
                              { name: "Milk", pack: catalog.milk.packLabel, price: catalog.milk.unitPricePaise, enabled: catalog.milk.enabled },
                              { name: "Curd", pack: catalog.curd.packLabel, price: catalog.curd.unitPricePaise, enabled: catalog.curd.enabled },
                              { name: "Fresh Egg", pack: catalog.egg.packLabel, price: catalog.egg.unitPricePaise, enabled: catalog.egg.enabled },
                            ].map((item) => (
                              <div key={item.name} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold">{item.name}</p>
                                  <p className="mt-0.5 truncate text-xs text-customer-muted">{item.pack || "Unit not specified"}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-bold tabular-nums">{formatMoney(item.price)}</p>
                                  <p className={item.enabled ? "text-[10px] font-semibold text-emerald-700" : "text-[10px] font-semibold text-amber-700"}>
                                    {item.enabled ? "Available" : "Unavailable"}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : null}
                        </div>
                      </div>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.85fr)]">
                      <div className="rounded-2xl border border-customer-line bg-white p-5 shadow-card">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold">Recent orders</h3>
                            <p className="mt-1 text-xs text-customer-muted">Newest customer orders, up to the latest 250.</p>
                          </div>
                          <button type="button" onClick={() => setView("orders")} className="text-xs font-bold text-brand hover:underline">Open order desk</button>
                        </div>
                        {orders.length ? (
                          <div className="mt-4 divide-y divide-customer-line">
                            {orders.slice(0, 5).map((order) => (
                              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold">{order.customerName || "Customer"} <span className="font-normal text-customer-muted">· {order.id}</span></p>
                                  <p className="mt-1 text-xs text-customer-muted">{formatDate(order.createdAt)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={order.status} />
                                  <span className="min-w-[76px] text-right text-sm font-bold tabular-nums">{formatMoney(order.totalPaise)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <EmptyPanel title="No orders yet" body="New customer orders will appear here after they are placed." />}
                      </div>

                      <div className="rounded-2xl border border-customer-line bg-white p-5 shadow-card">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold">Customer support</h3>
                            <p className="mt-1 text-xs text-customer-muted">Incoming complaint tickets</p>
                          </div>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">{openComplaints.length} open</span>
                        </div>
                        {openComplaints.length ? (
                          <div className="mt-4 flex flex-col gap-3">
                            {openComplaints.slice(0, 3).map((ticket) => (
                              <div key={ticket.id} className="rounded-xl bg-customer p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold">{ticket.customer_name || "Customer"}</p>
                                  <span className="text-[10px] text-customer-muted">{formatDate(ticket.created_at)}</span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-customer-muted">{ticket.message}</p>
                              </div>
                            ))}
                            <button type="button" onClick={() => setView("support")} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-customer-line text-xs font-bold text-brand hover:bg-brand-pale">
                              Review all tickets <ChevronRight size={14} />
                            </button>
                          </div>
                        ) : <EmptyPanel title="No open tickets" body="There are no unresolved customer requests in the support queue." />}
                      </div>
                    </section>
                  </div>
                ) : null}

                {view === "orders" ? (
                  <section className="flex flex-col gap-4">
                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
                      {orderCounts.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setOrderFilter(item.id)}
                          className={[
                            "rounded-xl border p-3 text-left transition",
                            orderFilter === item.id ? "border-brand bg-brand-pale shadow-sm" : "border-customer-line bg-white hover:border-brand/40",
                          ].join(" ")}
                        >
                          <p className="text-xs font-medium text-customer-muted">{item.label}</p>
                          <p className="mt-1 text-xl font-bold tabular-nums">{item.count}</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative min-w-0 flex-1 sm:max-w-md">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-customer-muted" />
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search order, customer, phone or address"
                          className="min-h-11 w-full rounded-xl border border-customer-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                        />
                      </div>
                      <p className="text-xs text-customer-muted">{visibleOrders.length} matching order(s)</p>
                    </div>
                    {visibleOrders.length ? (
                      <div className="flex flex-col gap-3">
                        {visibleOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            selectedStatus={nextStatus[order.id] || ""}
                            updating={updatingId === order.id}
                            expanded={expandedOrder === order.id}
                            onExpand={() => setExpandedOrder((current) => current === order.id ? "" : order.id)}
                            onStatusChange={(value) => setNextStatus((previous) => ({ ...previous, [order.id]: value }))}
                            onSave={() => updateStatus(order)}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyPanel title="No matching orders" body="Try another order filter or search by order number, customer name or phone." />
                    )}
                  </section>
                ) : null}

                {view === "products" ? (
                  <section className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold">Customer-facing product order</h3>
                        <p className="mt-1 text-xs text-customer-muted">Water Can → Milk → Curd → Fresh Egg.</p>
                      </div>
                      <span className="rounded-full bg-brand-pale px-3 py-1.5 text-xs font-semibold text-brand-dark">4 customer products</span>
                    </div>

                    {catalog ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <FixedProductCard
                            title="Water Can"
                            subtitle={catalog.water.packLabel || "20-litre can"}
                            price={catalog.water.unitPricePaise}
                            enabled={catalog.water.enabled}
                            icon={Waves}
                            image="/water-can.jpg"
                            note="Fixed in the current catalogue service"
                          />
                          <EditableProductCard
                            title="Milk"
                            subtitle="Customer app product"
                            draft={catalogDraft.milk}
                            icon={Milk}
                            placeholder="e.g. 500 ml pouch"
                            onChange={(patch) => setCatalogDraft((previous) => ({
                              ...previous,
                              milk: { ...previous.milk, ...patch },
                            }))}
                          />
                          <EditableProductCard
                            title="Curd"
                            subtitle="Customer app product"
                            draft={catalogDraft.curd}
                            icon={Soup}
                            placeholder="e.g. 400 g cup"
                            onChange={(patch) => setCatalogDraft((previous) => ({
                              ...previous,
                              curd: { ...previous.curd, ...patch },
                            }))}
                          />
                          <FixedProductCard
                            title="Fresh Egg"
                            subtitle={catalog.egg.packLabel || "per egg"}
                            price={catalog.egg.unitPricePaise}
                            enabled={catalog.egg.enabled}
                            icon={Egg}
                            note="Fixed in the current catalogue service"
                          />
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.7fr)]">
                          <div className="rounded-2xl border border-customer-line bg-white p-5 shadow-card">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h3 className="text-base font-bold">Save customer catalogue</h3>
                                <p className="mt-1 max-w-xl text-xs leading-5 text-customer-muted">
                                  Milk and Curd prices and pack labels are editable here. Enabling a product makes it orderable in the customer app after its next catalogue refresh.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={saveCatalog}
                                disabled={savingCatalog || !opsKey.trim()}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 text-sm font-semibold text-white transition hover:bg-brand disabled:opacity-45"
                              >
                                {savingCatalog ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
                                {savingCatalog ? "Saving catalogue…" : "Save catalogue"}
                              </button>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl bg-customer p-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-customer-ink">
                                  <Wallet size={15} />
                                  Bottle deposit
                                </div>
                                <p className="mt-2 text-2xl font-bold tabular-nums">{formatMoney(15000)}</p>
                                <p className="mt-1 text-xs leading-5 text-customer-muted">
                                  Applied by the existing order rule when the customer does not return an empty bottle.
                                </p>
                              </div>
                              <div className="rounded-xl bg-customer p-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-customer-ink">
                                  <ShieldCheck size={15} />
                                  Price protection
                                </div>
                                <p className="mt-2 text-sm font-bold">Server-calculated totals</p>
                                <p className="mt-1 text-xs leading-5 text-customer-muted">
                                  The customer app cannot override the catalogue prices sent by the server.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-customer-line bg-white p-5 shadow-card">
                            <h3 className="text-base font-bold">Catalogue guidance</h3>
                            <ul className="mt-3 flex flex-col gap-3 text-xs leading-5 text-customer-muted">
                              <li className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />Enter a selling price and pack size before enabling Milk or Curd.</li>
                              <li className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />Disabled products remain visible as unavailable in the customer catalogue.</li>
                              <li className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />Existing order price snapshots are not changed when catalogue prices are updated.</li>
                            </ul>
                          </div>
                        </div>
                      </>
                    ) : <EmptyPanel title="Catalogue not loaded" body="Reconnect the operations dashboard to retrieve the current server-side prices and availability." />}
                  </section>
                ) : null}

                {view === "support" ? (
                  <section className="flex flex-col gap-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MetricCard label="All tickets" value={String(complaints.length)} note="Latest tickets returned by the service" icon={MessageSquareText} tone="blue" />
                      <MetricCard label="Open tickets" value={String(openComplaints.length)} note="Not marked resolved or closed" icon={CircleAlert} tone="amber" />
                      <MetricCard label="Customer contacts" value={String(new Set(complaints.map((ticket) => ticket.customer_phone)).size)} note="Unique phone numbers in this list" icon={Phone} tone="navy" />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setSupportFilter("open")} className={supportFilter === "open" ? "min-h-10 rounded-full bg-brand-dark px-4 text-xs font-semibold text-white" : "min-h-10 rounded-full border border-customer-line bg-white px-4 text-xs font-semibold text-customer-muted"}>Open tickets</button>
                        <button type="button" onClick={() => setSupportFilter("all")} className={supportFilter === "all" ? "min-h-10 rounded-full bg-brand-dark px-4 text-xs font-semibold text-white" : "min-h-10 rounded-full border border-customer-line bg-white px-4 text-xs font-semibold text-customer-muted"}>All tickets</button>
                      </div>
                      <div className="relative min-w-0 sm:w-80">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-customer-muted" />
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search ticket or customer"
                          className="min-h-11 w-full rounded-xl border border-customer-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                        />
                      </div>
                    </div>
                    {visibleComplaints.length ? (
                      <div className="grid gap-3 xl:grid-cols-2">
                        {visibleComplaints.map((ticket) => (
                          <article key={ticket.id} className="rounded-2xl border border-customer-line bg-white p-5 shadow-card">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">{ticket.id}</p>
                                <h3 className="mt-1 truncate text-base font-bold">{ticket.customer_name || "Customer"}</h3>
                                <p className="mt-1 text-xs text-customer-muted">{ticket.customer_phone}</p>
                              </div>
                              <span className={"rounded-full px-3 py-1 text-[10px] font-bold capitalize ring-1 " + (["resolved", "closed", "done"].includes(ticket.status.toLowerCase()) ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-200")}>
                                {ticket.status.replaceAll("_", " ")}
                              </span>
                            </div>
                            <p className="mt-4 whitespace-pre-wrap rounded-xl bg-customer p-4 text-sm leading-6 text-customer-ink">{ticket.message}</p>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-customer-line pt-3">
                              <span className="inline-flex items-center gap-1.5 text-xs text-customer-muted"><Clock3 size={13} />{formatDate(ticket.created_at)}</span>
                              <div className="flex gap-2">
                                <a
                                  href={"tel:" + ticket.customer_phone}
                                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-customer-line px-3 text-xs font-semibold text-customer-ink hover:bg-customer"
                                >
                                  <Phone size={14} /> Call
                                </a>
                                <a
                                  href={"https://wa.me/" + ticket.customer_phone.replace(/\D/g, "") + "?text=" + encodeURIComponent("Hello " + (ticket.customer_name || "there") + ", we are following up on your Spencer's Enterprises support request " + ticket.id + ".")}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-pale px-3 text-xs font-semibold text-brand-dark hover:bg-brand/10"
                                >
                                  <MessageSquareText size={14} /> WhatsApp
                                </a>
                              </div>
                            </div>
                            <p className="mt-3 text-[10px] leading-4 text-customer-muted">
                              Ticket status is read-only here; this dashboard currently has no complaint-resolution endpoint.
                            </p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <EmptyPanel title={supportFilter === "open" ? "No open support tickets" : "No support tickets found"} body="New complaints submitted from the customer app will appear here." />
                    )}
                  </section>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: "blue" | "navy" | "green" | "amber";
}) {
  const toneClass = {
    blue: "bg-brand-pale text-brand",
    navy: "bg-customer-ink/5 text-customer-ink",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
  }[tone];
  return (
    <article className="rounded-2xl border border-customer-line bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-customer-muted">{label}</p>
        <span className={"grid h-9 w-9 place-items-center rounded-xl " + toneClass}><Icon size={17} /></span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-customer-muted">{note}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={"inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 " + statusTone(status)}>
      {statusLabel(status)}
    </span>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-customer-line bg-customer/60 px-5 py-9 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-customer-muted">
        <Boxes size={18} />
      </div>
      <h3 className="mt-3 text-sm font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-customer-muted">{body}</p>
    </div>
  );
}

function FixedProductCard({
  title,
  subtitle,
  price,
  enabled,
  icon: Icon,
  image,
  note,
}: {
  title: string;
  subtitle: string;
  price: number;
  enabled: boolean;
  icon: LucideIcon;
  image?: string;
  note: string;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-customer-line bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        {image ? (
          <img src={image} alt="" className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-pale text-brand"><Icon size={22} /></span>
        )}
        <span className="rounded-full bg-customer px-2.5 py-1 text-[10px] font-semibold text-customer-muted">Fixed</span>
      </div>
      <h3 className="mt-4 text-base font-bold">{title}</h3>
      <p className="mt-0.5 text-xs text-customer-muted">{subtitle}</p>
      <p className="mt-4 text-2xl font-bold tabular-nums">{formatMoney(price)}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-customer-muted">{note}</span>
        <span className={enabled ? "rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700" : "rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800"}>
          {enabled ? "Available" : "Unavailable"}
        </span>
      </div>
    </article>
  );
}

function EditableProductCard({
  title,
  subtitle,
  draft,
  icon: Icon,
  placeholder,
  onChange,
}: {
  title: string;
  subtitle: string;
  draft: CatalogDraft;
  icon: LucideIcon;
  placeholder: string;
  onChange: (patch: Partial<CatalogDraft>) => void;
}) {
  return (
    <article className="rounded-2xl border border-customer-line bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-pale text-brand"><Icon size={22} /></span>
          <div>
            <h3 className="text-base font-bold">{title}</h3>
            <p className="mt-0.5 text-xs text-customer-muted">{subtitle}</p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[10px] font-semibold text-customer-muted">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(event) => onChange({ enabled: event.target.checked })}
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
          Live
        </label>
      </div>
      <label className="mt-4 block text-[11px] font-semibold text-customer-muted">Pack size / unit</label>
      <input
        value={draft.packLabel}
        onChange={(event) => onChange({ packLabel: event.target.value })}
        placeholder={placeholder}
        maxLength={60}
        className="mt-1 min-h-10 w-full rounded-lg border border-customer-line bg-customer px-3 text-sm outline-none focus:border-brand"
      />
      <label className="mt-3 block text-[11px] font-semibold text-customer-muted">Selling price (₹)</label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={draft.price}
        onChange={(event) => onChange({ price: event.target.value })}
        placeholder="Enter price"
        className="mt-1 min-h-10 w-full rounded-lg border border-customer-line bg-customer px-3 text-sm outline-none focus:border-brand"
      />
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={draft.enabled ? "text-[11px] font-semibold text-emerald-700" : "text-[11px] text-customer-muted"}>
          {draft.enabled ? "Shown and orderable in customer app" : "Hidden from customer checkout"}
        </span>
        {draft.enabled ? <BadgeCheck size={16} className="shrink-0 text-emerald-600" /> : <X size={16} className="shrink-0 text-customer-muted" />}
      </div>
    </article>
  );
}

function OrderCard({
  order,
  selectedStatus,
  updating,
  expanded,
  onExpand,
  onStatusChange,
  onSave,
}: {
  order: NativeOrder;
  selectedStatus: string;
  updating: boolean;
  expanded: boolean;
  onExpand: () => void;
  onStatusChange: (value: string) => void;
  onSave: () => void;
}) {
  const items = orderItems(order);
  const currentStage = stageIndex(order.status);
  const isTerminal = order.status === "delivered" || order.status === "cancelled";
  const nextStep = currentStage >= 0 && currentStage < ORDER_FLOW.length - 1 ? ORDER_FLOW[currentStage + 1] : null;
  const phone = order.phone.replace(/\D/g, "");
  const allowedOptions = [
    ...(nextStep ? [{ value: nextStep.value, label: nextStep.label }] : []),
    ...(!isTerminal ? [{ value: "cancelled", label: "Cancel order" }] : []),
  ];

  return (
    <article className="overflow-hidden rounded-2xl border border-customer-line bg-white shadow-card">
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-xs font-bold tracking-wide text-brand">{order.id}</p>
              <StatusBadge status={order.status} />
            </div>
            <h3 className="mt-2 text-base font-bold">{order.customerName || "Customer"}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-customer-muted">
              <a href={"tel:" + order.phone} className="inline-flex items-center gap-1 hover:text-brand"><Phone size={12} />{order.phone}</a>
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-customer-muted">Order total</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{formatMoney(order.totalPaise)}</p>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl bg-customer p-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-customer-muted">Items</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {items.length ? items.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium">{item.name} <span className="text-customer-muted">× {item.quantity}</span></span>
                  <span className="font-semibold tabular-nums">{formatMoney(item.unitPricePaise * item.quantity)}</span>
                </div>
              )) : <p className="text-xs text-customer-muted">No product quantities found.</p>}
              {Number(order.bottleDepositPaise || 0) > 0 ? (
                <div className="flex items-center justify-between gap-2 border-t border-customer-line pt-1.5 text-xs">
                  <span className="text-customer-muted">Bottle deposit</span>
                  <span className="font-semibold tabular-nums">{formatMoney(order.bottleDepositPaise || 0)}</span>
                </div>
              ) : null}
              {Number(order.floorDeliveryChargePaise || 0) > 0 ? (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-customer-muted">Delivery charge</span>
                  <span className="font-semibold tabular-nums">{formatMoney(order.floorDeliveryChargePaise || 0)}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-customer-muted">Delivery details</p>
            <p className="mt-2 flex items-start gap-1.5 text-xs leading-5">
              <MapPin size={13} className="mt-0.5 shrink-0 text-brand" />
              <span><strong>{order.addressLabel || "Address"}</strong><br />{order.deliveryAddress || "No address supplied"}</span>
            </p>
            <p className="mt-2 text-xs text-customer-muted">
              {order.payment === "cash_on_delivery" ? "Cash on delivery" : order.payment || "Payment method not provided"}
              {order.paymentStatus ? " · " + order.paymentStatus.replaceAll("_", " ") : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-customer-line pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-customer-muted">Delivery partner</p>
            {order.partnerName || order.partnerPhone ? (
              <p className="mt-1 truncate text-xs font-semibold">
                {order.partnerName || "Partner details recorded"} {order.partnerPhone ? "· " + order.partnerPhone : ""}
              </p>
            ) : (
              <p className="mt-1 text-xs text-customer-muted">No partner details recorded on this order.</p>
            )}
          </div>
          <button
            type="button"
            onClick={onExpand}
            className="inline-flex min-h-9 shrink-0 items-center gap-1 self-start rounded-lg px-2 text-xs font-semibold text-brand hover:bg-brand-pale sm:self-center"
          >
            {expanded ? "Hide progress" : "View progress"}
            <ChevronDown size={14} className={expanded ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
        </div>

        {expanded ? (
          <div className="rounded-xl border border-customer-line p-3">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-customer-muted">Customer status timeline</p>
            <div className="grid gap-2 sm:grid-cols-5">
              {ORDER_FLOW.map((step, index) => {
                const done = currentStage >= index && order.status !== "cancelled";
                const current = currentStage === index && order.status !== "cancelled";
                return (
                  <div key={step.value} className="flex items-center gap-2 sm:flex-col sm:items-start">
                    <span className={done ? "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white" : "grid h-6 w-6 shrink-0 place-items-center rounded-full border border-customer-line bg-white text-customer-muted"}>
                      {done ? <Check size={13} /> : <span className="text-[10px]">{index + 1}</span>}
                    </span>
                    <span className={current ? "text-xs font-bold text-brand-dark" : done ? "text-xs font-medium text-customer-ink" : "text-xs text-customer-muted"}>{step.label}</span>
                  </div>
                );
              })}
            </div>
            {order.status === "cancelled" ? <p className="mt-3 text-xs font-semibold text-rose-700">This order has been cancelled by operations.</p> : null}
            <p className="mt-3 text-[11px] text-customer-muted">Last status update: {formatDate(order.statusChangedAt)}</p>
          </div>
        ) : null}

        {!isTerminal ? (
          <div className="flex flex-col gap-2 border-t border-customer-line pt-3 sm:flex-row">
            <select
              value={selectedStatus}
              onChange={(event) => onStatusChange(event.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-customer-line bg-white px-3 text-sm outline-none focus:border-brand"
            >
              <option value="">Choose next status…</option>
              {allowedOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={onSave}
              disabled={!selectedStatus || updating}
              className={selectedStatus === "cancelled"
                ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white disabled:opacity-45"
                : "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-45"}
            >
              {updating ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {updating ? "Updating…" : selectedStatus === "cancelled" ? "Cancel order" : "Save status"}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
