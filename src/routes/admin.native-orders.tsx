import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

type NativeOrder = {
  id: string;
  customerName: string;
  phone: string;
  quantity: number;
  totalPaise: number;
  payment: string;
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
  const [nextStatus, setNextStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
      setNotice("Orders refreshed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders.");
    } finally {
      setLoading(false);
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
        data.notification === "submitted"
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
          <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Spencers Enterprices · Operations</p>
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
                <p className="mt-1">{order.quantity} eggs · {formatMoney(order.totalPaise)}</p>
                <p className="text-[#6b7a90]">{order.payment}</p>
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
                {STATUS_OPTIONS.filter((option) => option.value !== order.status).map((option) => (
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
