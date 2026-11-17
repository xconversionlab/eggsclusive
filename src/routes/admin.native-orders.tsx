import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

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
  totalPaise: number;
  payment: string;
  paymentStatus?: string;
  productType?: string;
  bottleDepositPaise?: number;
  waterCanQuantity?: number;
  milkQuantity?: number;
  curdQuantity?: number;
  milkUnitPricePaise?: number;
  curdUnitPricePaise?: number;
  status: string;
  partnerShop: string;
  partnerName: string;
  partnerPhone: string;
  addressLabel: string;
  deliveryAddress: string;
  createdAt: number;
  statusChangedAt: number;
};

const STATUS_OPTIONS = [
  { value: "accepted", label: "Partner allocated" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

type CatalogDraft = { price: string; packLabel: string; enabled: boolean };
type CatalogKey = "milk" | "curd";

const formatMoney = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));

export const Route = createFileRoute("/admin/native-orders")({
  component: NativeOrdersOperations,
});

function NativeOrdersOperations() {
  const [opsKey, setOpsKey] = useState("");
  const [orders, setOrders] = useState<NativeOrder[]>([]);
  const [complaints, setComplaints] = useState<NativeComplaint[]>([]);
  const [nextStatus, setNextStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [catalogDraft, setCatalogDraft] = useState<Record<CatalogKey, CatalogDraft>>({
    milk: { price: "", packLabel: "", enabled: false },
    curd: { price: "", packLabel: "", enabled: false },
  });
  const [savingCatalog, setSavingCatalog] = useState(false);

  async function loadOrders() {
    if (!opsKey.trim()) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/native/ops/orders", {
        headers: { "x-native-ops-key": opsKey.trim() },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not load orders.");
      setOrders(data.orders || []);
      setNextStatus({});
      const supportResponse = await fetch("/api/native/ops/complaints", {
        headers: { "x-native-ops-key": opsKey.trim() },
        cache: "no-store",
      });
      const supportData = await supportResponse.json();
      if (!supportResponse.ok || !supportData.ok) throw new Error(supportData.error || "Orders loaded, but support tickets could not be loaded.");
      setComplaints(supportData.complaints || []);
      const catalogResponse = await fetch("/api/native/ops/catalog", {
        headers: { "x-native-ops-key": opsKey.trim() },
        cache: "no-store",
      });
      const catalogData = await catalogResponse.json();
      if (!catalogResponse.ok || !catalogData.ok) throw new Error(catalogData.error || "Orders loaded, but product pricing could not be loaded.");
      setCatalogDraft({
        milk: {
          price: catalogData.catalog?.milk?.unitPricePaise ? String(catalogData.catalog.milk.unitPricePaise / 100) : "",
          packLabel: catalogData.catalog?.milk?.packLabel || "",
          enabled: Boolean(catalogData.catalog?.milk?.enabled),
        },
        curd: {
          price: catalogData.catalog?.curd?.unitPricePaise ? String(catalogData.catalog.curd.unitPricePaise / 100) : "",
          packLabel: catalogData.catalog?.curd?.packLabel || "",
          enabled: Boolean(catalogData.catalog?.curd?.enabled),
        },
      });
      setNotice("Orders and product pricing refreshed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCatalog() {
    setSavingCatalog(true);
    setError("");
    setNotice("");
    try {
      const payload = Object.fromEntries((["milk", "curd"] as const).map((key) => {
        const item = catalogDraft[key];
        const price = Number(item.price);
        if (!Number.isFinite(price) || price < 0 || price > 1000000) {
          throw new Error(`Enter a valid ${key} price in rupees.`);
        }
        if (item.enabled && (price <= 0 || !item.packLabel.trim())) {
          throw new Error(`Enter the ${key} price and pack size before making it available.`);
        }
        return [key, {
          unitPricePaise: Math.round(price * 100),
          packLabel: item.packLabel.trim(),
          enabled: item.enabled,
        }];
      }));
      const response = await fetch("/api/native/ops/catalog", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-native-ops-key": opsKey.trim(),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not save product pricing.");
      setNotice("Milk and curd prices saved. Customer apps will refresh the catalogue automatically.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save product pricing.");
    } finally {
      setSavingCatalog(false);
    }
  }

  async function updateStatus(order: NativeOrder) {
    const status = nextStatus[order.id];
    if (!status) return;
    setUpdatingId(order.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/native/ops/orders/${encodeURIComponent(order.id)}/status`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-native-ops-key": opsKey.trim(),
        },
        body: JSON.stringify({ status, note: "Updated by operations dashboard" }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not update order.");
      setOrders((previous) => previous.map((item) =>
        item.id === order.id ? { ...item, status: data.status, statusChangedAt: Date.now() } : item,
      ));
      setNextStatus((previous) => {
        const copy = { ...previous };
        delete copy[order.id];
        return copy;
      });
      setNotice(
        data.refundApplied
          ? "Order cancelled. The paid amount was credited to the customer's Eggsclusive wallet."
          : data.status === "cancelled"
            ? "Order cancelled. No captured payment was found, so no wallet refund was created."
            : data.notification === "submitted"
          ? `Status updated. SMS accepted by provider for ${order.phone}.`
          : data.notification === "not_configured"
            ? "Status updated. Transactional SMS template/API is not configured yet."
            : "Status updated. SMS provider did not accept the alert; check provider setup and outbox.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update order.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-6 text-[#14243a] md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="rounded-3xl bg-[#07172e] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Eggsclusive · Spencer's Enterprises Operations</p>
          <h1 className="mt-2 text-3xl font-extrabold">Order status desk</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Review native-app orders, update delivery progress and trigger the configured customer status message.
          </p>
        </header>

        <section className="rounded-2xl border border-[#dce5f0] bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-bold" htmlFor="ops-key">Operations access key</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="ops-key"
              type="password"
              autoComplete="off"
              value={opsKey}
              onChange={(event) => setOpsKey(event.target.value)}
              placeholder="Enter operations key"
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#dce5f0] bg-white px-3 outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={loadOrders}
              disabled={loading || !opsKey.trim()}
              className="min-h-12 rounded-xl bg-[#07172e] px-5 font-bold text-white disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load orders"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[#6b7a90]">
            The key stays in this page's memory and is not saved to browser storage.
          </p>
          {error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {notice ? <p role="status" className="mt-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-800">{notice}</p> : null}
        </section>

        <section className="rounded-2xl border border-[#dce5f0] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold">Product pricing</h2>
              <p className="mt-1 text-sm text-[#6b7a90]">Set the pack size and live selling price for Milk and Curd. Checkout totals are calculated from these saved prices.</p>
            </div>
            <button
              type="button"
              onClick={saveCatalog}
              disabled={!opsKey.trim() || savingCatalog}
              className="min-h-11 rounded-xl bg-[#07172e] px-5 font-bold text-white disabled:opacity-50"
            >
              {savingCatalog ? "Saving prices…" : "Save product prices"}
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(["milk", "curd"] as const).map((key) => (
              <div key={key} className="rounded-xl border border-[#dce5f0] bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-extrabold capitalize">{key}</h3>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={catalogDraft[key].enabled}
                      onChange={(event) => setCatalogDraft((previous) => ({
                        ...previous,
                        [key]: { ...previous[key], enabled: event.target.checked },
                      }))}
                    />
                    Available in app
                  </label>
                </div>
                <label className="mt-3 block text-xs font-bold text-[#6b7a90]" htmlFor={key + "-pack"}>Pack size / unit</label>
                <input
                  id={key + "-pack"}
                  value={catalogDraft[key].packLabel}
                  onChange={(event) => setCatalogDraft((previous) => ({
                    ...previous,
                    [key]: { ...previous[key], packLabel: event.target.value },
                  }))}
                  placeholder={key === "milk" ? "e.g. 500 ml pouch" : "e.g. 400 g cup"}
                  maxLength={60}
                  className="mt-1 min-h-11 w-full rounded-xl border border-[#dce5f0] bg-white px-3"
                />
                <label className="mt-3 block text-xs font-bold text-[#6b7a90]" htmlFor={key + "-price"}>Selling price (₹)</label>
                <input
                  id={key + "-price"}
                  type="number"
                  min="0"
                  step="0.01"
                  value={catalogDraft[key].price}
                  onChange={(event) => setCatalogDraft((previous) => ({
                    ...previous,
                    [key]: { ...previous[key], price: event.target.value },
                  }))}
                  placeholder="Enter price"
                  className="mt-1 min-h-11 w-full rounded-xl border border-[#dce5f0] bg-white px-3"
                />
                <p className="mt-2 text-xs text-[#6b7a90]">
                  {catalogDraft[key].enabled ? "Customers can order this product." : "Hidden from checkout until you enable it."}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">Orders</h2>
            <p className="text-sm text-[#6b7a90]">{orders.length} order(s) loaded</p>
          </div>
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading || !opsKey.trim()}
            className="rounded-xl border border-[#dce5f0] bg-white px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            Refresh
          </button>
        </section>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbd6e4] bg-white p-10 text-center text-sm text-[#6b7a90]">
            Enter the operations key and load orders to begin.
          </div>
        ) : null}

        <section className="mt-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">Customer support</h2>
            <p className="text-sm text-[#6b7a90]">{complaints.length} ticket(s) loaded</p>
          </div>
        </section>
        {complaints.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbd6e4] bg-white p-6 text-sm text-[#6b7a90]">
            No customer complaints have been submitted.
          </div>
        ) : complaints.map((ticket) => (
          <article key={ticket.id} className="rounded-2xl border border-[#dce5f0] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700">{ticket.id}</p>
                <h3 className="mt-1 font-extrabold">{ticket.customer_name}</h3>
                <p className="text-sm text-[#6b7a90]">{ticket.customer_phone} · {formatDate(new Date(ticket.created_at).getTime())}</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-800">{ticket.status.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#f4f7fb] p-3 text-sm">{ticket.message}</p>
          </article>
        ))}
        
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-[#dce5f0] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700">{order.id}</p>
                <h3 className="mt-1 text-lg font-extrabold">{order.customerName}</h3>
                <p className="text-sm text-[#6b7a90]">{order.phone} · {formatDate(order.createdAt)}</p>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold capitalize text-sky-800">
                {order.status.replaceAll("_", " ")}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6b7a90]">Order</p>
                <p className="mt-1">{[
                  ...(order.quantity > 0 ? [`Fresh Egg × ${order.quantity}`] : []),
                  ...(order.waterCanQuantity ? [`Water Can × ${order.waterCanQuantity}`] : []),
                  ...(order.milkQuantity ? [`Milk × ${order.milkQuantity}`] : []),
                  ...(order.curdQuantity ? [`Curd × ${order.curdQuantity}`] : []),
                ].join(" · ") || "No item details"} · {formatMoney(order.totalPaise)}</p>
                {order.bottleDepositPaise ? <p className="text-[#6b7a90]">Bottle deposit: {formatMoney(order.bottleDepositPaise)}</p> : null}
                <p className="text-[#6b7a90]">{order.payment} · {order.paymentStatus || "pending"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6b7a90]">Delivery partner</p>
                <p className="mt-1">{order.partnerName} · {order.partnerPhone}</p>
                <p className="text-[#6b7a90]">{order.partnerShop}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6b7a90]">Delivery address</p>
                <p className="mt-1">{order.addressLabel} · {order.deliveryAddress}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-[#edf1f6] pt-4 sm:flex-row">
              <select
                value={nextStatus[order.id] || ""}
                onChange={(event) => setNextStatus((previous) => ({ ...previous, [order.id]: event.target.value }))}
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#dce5f0] bg-white px-3"
              >
                <option value="">Update delivery status…</option>
                {STATUS_OPTIONS.filter((option) => option.value !== order.status && order.status !== "cancelled" && order.status !== "delivered").map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => updateStatus(order)}
                disabled={!nextStatus[order.id] || updatingId === order.id}
                className="min-h-12 rounded-xl bg-[#168de5] px-5 font-bold text-white disabled:opacity-50"
              >
                {updatingId === order.id ? "Updating…" : "Save status"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
