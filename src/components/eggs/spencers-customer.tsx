import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight, Check, ClipboardList, Egg, Handshake,
  House, LogOut, MapPin, Milk, Minus, Package, Plus, RefreshCw, ShieldCheck,
  Soup, UserRound, Wallet, X, MessageCircle,
} from "lucide-react";

type Tab = "home" | "activity" | "wallet" | "profile";
type ProductKey = "egg" | "water" | "milk" | "curd";
type OrderStatus = "placed" | "accepted" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
type Address = {
  id: string; label: string; recipient: string; line1: string; line2: string;
  city: string; pincode: string; landmark: string;
};
type OrderLine = { product: ProductKey; name: string; quantity: number };
type CatalogItem = { unitPricePaise: number; packLabel: string; enabled: boolean };
type NativeCatalog = Record<ProductKey, CatalogItem>;
type RemoteOrder = {
  id: string; createdAt: number; quantity: number; totalPaise: number; status: string;
  eggQuantity?: number; waterCanQuantity?: number; milkQuantity?: number; curdQuantity?: number;
  partnerName?: string; partnerPhone?: string; deliveryOtp?: string;
  addressLabel?: string; deliveryAddress?: string;
  address?: { label?: string; line1?: string; city?: string; pincode?: string };
};
type CustomerOrder = {
  id: string; createdAt: string; status: OrderStatus; lines: OrderLine[];
  totalPaise: number; deliveryOtp: string; address: Address; awaitingQuote: boolean;
  partnerName?: string; partnerPhone?: string; refundPaise?: number;
};
type Complaint = { id: string; message: string; createdAt: string };
type AppData = {
  profile: { name: string; phone: string; verified: boolean };
  addresses: Address[]; activeAddressId: string | null;
  quantities: Record<ProductKey, number>; noEmptyBottles: boolean;
  orders: CustomerOrder[]; walletPaise: number; walletNotes: string[];
  complaints: Complaint[];
  partnerRequests: { name: string; phone: string; area: string; note: string }[];
};
const STORAGE_KEY = "spencers-enterprises-customer-v1";
const MIN_EGG_QUANTITY = 10;
const EMPTY: AppData = {
  profile: { name: "", phone: "", verified: false },
  addresses: [], activeAddressId: null,
  quantities: { egg: MIN_EGG_QUANTITY, water: 0, milk: 0, curd: 0 },
  noEmptyBottles: false, orders: [], walletPaise: 0, walletNotes: [],
  complaints: [], partnerRequests: [],
};
const PRICE = { egg: 700, water: 3000, bottle: 15000 };
const PRODUCT_NAMES: Record<ProductKey, string> = {
  egg: "Fresh Egg", water: "Water Can", milk: "Milk", curd: "Curd",
};
const DEFAULT_CATALOG: NativeCatalog = {
  egg: { unitPricePaise: PRICE.egg, packLabel: "per egg", enabled: true },
  water: { unitPricePaise: PRICE.water, packLabel: "20-litre can", enabled: true },
  milk: { unitPricePaise: 0, packLabel: "", enabled: false },
  curd: { unitPricePaise: 0, packLabel: "", enabled: false },
};

function fromRemoteOrder(order: RemoteOrder, customerName: string): CustomerOrder {
  const quantities: Record<ProductKey, number> = {
    egg: Number(order.eggQuantity ?? order.quantity ?? 0),
    water: Number(order.waterCanQuantity ?? 0),
    milk: Number(order.milkQuantity ?? 0),
    curd: Number(order.curdQuantity ?? 0),
  };
  const lines = (Object.keys(quantities) as ProductKey[])
    .filter((key) => quantities[key] > 0)
    .map((key) => ({ product: key, name: PRODUCT_NAMES[key], quantity: quantities[key] }));
  return {
    id: order.id,
    createdAt: new Date(order.createdAt).toISOString(),
    status: order.status as OrderStatus,
    lines,
    totalPaise: Number(order.totalPaise ?? 0),
    deliveryOtp: order.deliveryOtp ?? "",
    address: {
      id: "REMOTE-" + order.id,
      label: order.address?.label ?? order.addressLabel ?? "Home",
      recipient: customerName,
      line1: order.address?.line1 ?? order.deliveryAddress ?? "",
      line2: "",
      city: order.address?.city ?? "Chennai",
      pincode: order.address?.pincode ?? "",
      landmark: "",
    },
    awaitingQuote: false,
    partnerName: order.partnerName ?? "",
    partnerPhone: order.partnerPhone ?? "",
  };
}
const STATUS: Record<OrderStatus, string> = {
  placed: "Order placed", accepted: "Order accepted", preparing: "Preparing your order",
  out_for_delivery: "Out for delivery", delivered: "Order delivered", cancelled: "Order cancelled",
};
const STATUS_STEPS: OrderStatus[] = ["placed", "accepted", "preparing", "out_for_delivery", "delivered"];
const money = (paise: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
}).format(paise / 100);
const newId = (prefix: string) => prefix + "-" + Date.now().toString().slice(-7);
const dateLabel = (value: string) => new Date(value).toLocaleString("en-IN", {
  day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
});

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-dark" : "grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-dark"}>
      <img src="/spencers-mark.jpg" alt="Spencers Enterprises" className={small ? "h-10 w-10 object-cover" : "h-14 w-14 object-cover"} />
    </div>
  );
}

function QuantityControl({ value, onChange, unit, min = 0, disabled = false }: { value: number; onChange: (n: number) => void; unit: string; min?: number; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label={"Decrease " + unit} onClick={() => onChange(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-customer-line bg-white text-brand-dark disabled:opacity-35" disabled={disabled || value <= min}>
        <Minus size={14} />
      </button>
      <div className="min-w-8 text-center">
        <div className="text-base font-semibold tabular-nums text-customer-ink">{value}</div>
        <div className="text-[10px] text-customer-muted">{unit}</div>
      </div>
      <button type="button" aria-label={"Increase " + unit} onClick={() => onChange(value + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-brand-dark text-white disabled:opacity-35" disabled={disabled}>
        <Plus size={14} />
      </button>
    </div>
  );
}

function ProductIcon({ product }: { product: ProductKey }) {
  const shared = "h-8 w-8";
  if (product === "egg") return <Egg className={shared + " text-stone-500"} strokeWidth={1.5} />;
  if (product === "water") return <img src="/water-can.jpg" alt="Water can" className="h-10 w-10 rounded-full object-contain" />;
  if (product === "milk") return <Milk className={shared + " text-sky-700"} strokeWidth={1.5} />;
  return <Soup className={shared + " text-rose-700"} strokeWidth={1.5} />;
}

function ProductCard({
  product, quantity, setQuantity, noEmptyBottles, setNoEmptyBottles, catalog,
}: {
  product: ProductKey; quantity: number; setQuantity: (n: number) => void;
  noEmptyBottles: boolean; setNoEmptyBottles: (v: boolean) => void; catalog: CatalogItem;
}) {
  const unavailable = (product === "milk" || product === "curd") && !catalog.enabled;
  const total = catalog.unitPricePaise * quantity +
    (product === "water" && noEmptyBottles ? PRICE.bottle * quantity : 0);
  return (
    <article className="rounded-2xl border border-customer-line bg-white p-4 shadow-card">
      <div className="grid grid-cols-[112px_minmax(0,1fr)_66px] items-center gap-3">
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-pale">
            <ProductIcon product={product} />
          </div>
          <QuantityControl
            value={quantity}
            onChange={setQuantity}
            min={product === "egg" ? MIN_EGG_QUANTITY : 0}
            disabled={unavailable}
            unit={product === "egg" ? "eggs" : product === "water" ? "cans" : "units"}
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-customer-ink">{PRODUCT_NAMES[product]}</h3>
          {product === "water" ? <p className="mt-1 text-xs text-customer-muted">20-litre water can</p> : null}
          {(product === "milk" || product === "curd") ? (
            <p className="mt-1 text-xs text-customer-muted">{catalog.enabled ? catalog.packLabel : "Currently unavailable"}</p>
          ) : null}
          {product === "egg" ? (
            <>
              <p className="mt-1 text-sm font-semibold text-brand">{money(catalog.unitPricePaise)} per egg</p>
              <p className="mt-1 text-xs text-customer-muted">Minimum order: 10 eggs</p>
            </>
          ) : null}
          {product === "water" ? <p className="mt-1 text-sm font-semibold text-brand">{money(catalog.unitPricePaise)} per can · ₹150 refundable bottle deposit</p> : null}
          {(product === "milk" || product === "curd") && catalog.enabled ? <p className="mt-1 text-sm font-semibold text-brand">{money(catalog.unitPricePaise)} per unit</p> : null}
        </div>
        <div className="pt-2 text-right">
          <p className="text-base font-semibold tabular-nums text-customer-ink">
            {unavailable ? "Unavailable" : quantity > 0 ? money(total) : "—"}
          </p>
          <p className="mt-1 text-[10px] leading-tight text-customer-muted">Line total</p>
        </div>
      </div>
      {product === "egg" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-customer-line pt-3">
          <span className="mr-1 text-xs text-customer-muted">Quick quantity</span>
          {[10, 12, 30, 60, 120].map((n) => (
            <button type="button" key={n} onClick={() => setQuantity(n)} className={"rounded-lg border px-3 py-2 text-xs font-medium " + (quantity === n ? "border-brand bg-brand-pale text-brand-dark" : "border-customer-line text-customer-muted")}>{n}</button>
          ))}
        </div>
      ) : null}
      {product === "water" ? (
        <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl bg-brand-pale px-3 py-2 text-sm text-brand-dark">
          <input type="checkbox" checked={noEmptyBottles} onChange={(e) => setNoEmptyBottles(e.target.checked)} className="h-4 w-4 accent-sky-700" />
          <RefreshCw size={17} />
          <span>I don't have empty bottles to return</span>
        </label>
      ) : null}
      {product === "water" && quantity > 0 ? (
        <div className="mt-3 space-y-2 border-t border-customer-line pt-3 text-sm">
          <PriceRow label="Water price" detail={money(catalog.unitPricePaise) + " × " + quantity + " cans"} value={catalog.unitPricePaise * quantity} />
          <PriceRow label="Bottle price" detail={money(PRICE.bottle) + " × " + (noEmptyBottles ? quantity : 0) + " bottles"} value={PRICE.bottle * (noEmptyBottles ? quantity : 0)} />
          <p className="text-[11px] leading-relaxed text-customer-muted">Bottle deposit is charged only when you cannot return an empty bottle.</p>
        </div>
      ) : null}
    </article>
  );
}
function PriceRow({ label, detail, value }: { label: string; detail: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div><p className="font-medium text-customer-ink">{label}</p><p className="text-xs text-customer-muted">{detail}</p></div>
      <strong className="tabular-nums text-brand-dark">{money(value)}</strong>
    </div>
  );
}

function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const items: { id: Tab; label: string; icon: typeof House }[] = [
    { id: "home", label: "Order", icon: House },
    { id: "activity", label: "Status", icon: ClipboardList },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "profile", label: "Profile", icon: UserRound },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-customer-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Customer navigation">
      <div className="mx-auto grid max-w-xl grid-cols-4 px-2 py-2">
        {items.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => onChange(id)} className={"flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium " + (active === id ? "bg-brand-pale text-brand-dark" : "text-customer-muted")}>
            <Icon size={20} strokeWidth={active === id ? 2.2 : 1.7} />{label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-customer-muted">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} maxLength={maxLength} placeholder={placeholder} className="min-h-12 w-full rounded-xl border border-customer-line bg-white px-3 text-sm text-customer-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" />
    </label>
  );
}

export function SpencersCustomerApp() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [catalog, setCatalog] = useState<NativeCatalog>(DEFAULT_CATALOG);
  const [resendIn, setResendIn] = useState(0);
  const [tab, setTab] = useState<Tab>("home");
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");
  const [addressForm, setAddressForm] = useState({
    label: "Home", recipient: "", line1: "", line2: "", city: "Chennai", pincode: "", landmark: "",
  });
  const [addressEditorOpen, setAddressEditorOpen] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", phone: "", area: "", note: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppData>;
        const savedEggQuantity = Number(saved.quantities?.egg ?? MIN_EGG_QUANTITY);
        const eggQuantity = Number.isFinite(savedEggQuantity)
          ? Math.max(MIN_EGG_QUANTITY, Math.min(999, Math.floor(savedEggQuantity)))
          : MIN_EGG_QUANTITY;
        setData({
          ...EMPTY,
          ...saved,
          profile: { ...EMPTY.profile, ...saved.profile, verified: false },
          quantities: { ...EMPTY.quantities, ...saved.quantities, egg: eggQuantity },
        });
        setNameInput(saved.profile?.name ?? "");
        setPhoneInput(saved.profile?.phone ?? "");
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  async function syncAddresses(addresses: Address[], activeAddressId: string | null) {
    const payload = addresses.map((address) => ({
      id: address.id,
      label: address.label,
      door: address.line1,
      street: address.line2 || address.line1,
      area: address.line2 || address.line1,
      landmark: address.landmark,
      city: address.city,
      pincode: address.pincode,
      isDefault: address.id === activeAddressId,
    }));
    const response = await fetch("/api/native/addresses", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses: payload }),
    });
    const result = await response.json() as { ok?: boolean; error?: string };
    if (!response.ok || !result.ok) throw new Error(result.error || "Could not sync saved addresses.");
  }

  async function refreshCustomerData() {
    const [ordersResponse, walletResponse, addressesResponse, catalogResponse] = await Promise.all([
      fetch("/api/native/orders", { credentials: "same-origin", cache: "no-store" }),
      fetch("/api/native/wallet", { credentials: "same-origin", cache: "no-store" }),
      fetch("/api/native/addresses", { credentials: "same-origin", cache: "no-store" }),
      fetch("/api/native/catalog", { credentials: "same-origin", cache: "no-store" }),
    ]);
    const [ordersResult, walletResult, addressesResult, catalogResult] = await Promise.all([
      ordersResponse.json(),
      walletResponse.json(),
      addressesResponse.json(),
      catalogResponse.json(),
    ]) as [
      { ok?: boolean; error?: string; orders?: RemoteOrder[] },
      { ok?: boolean; error?: string; balancePaise?: number; transactions?: Array<{ id: string; description: string; amountPaise: number; createdAt: number }> },
      { ok?: boolean; error?: string; addresses?: Array<Record<string, unknown>> },
      { ok?: boolean; error?: string; catalog?: NativeCatalog }
    ];
    const failed = [
      [ordersResponse, ordersResult],
      [walletResponse, walletResult],
      [addressesResponse, addressesResult],
      [catalogResponse, catalogResult],
    ].find(([response, result]) => !(response as Response).ok || !(result as { ok?: boolean }).ok);
    if (failed) {
      const result = failed[1] as { error?: string };
      throw new Error(result.error || "Could not refresh your account from the shared platform.");
    }

    let remoteAddresses = addressesResult.addresses ?? [];
    // Migrate addresses saved by the older browser-only version on first sync.
    if (remoteAddresses.length === 0 && data.addresses.length > 0) {
      await syncAddresses(data.addresses, data.activeAddressId);
      const refreshed = await fetch("/api/native/addresses", { credentials: "same-origin", cache: "no-store" });
      const refreshedData = await refreshed.json() as { ok?: boolean; addresses?: Array<Record<string, unknown>>; error?: string };
      if (!refreshed.ok || !refreshedData.ok) throw new Error(refreshedData.error || "Could not load synced addresses.");
      remoteAddresses = refreshedData.addresses ?? [];
    }

    const addresses: Address[] = remoteAddresses.map((item) => ({
      id: String(item.id),
      label: String(item.label ?? "Home"),
      recipient: data.profile.name,
      line1: [item.door, item.street].filter((part) => typeof part === "string" && part.trim()).join(", "),
      line2: String(item.area ?? ""),
      city: String(item.city ?? ""),
      pincode: String(item.pincode ?? ""),
      landmark: String(item.landmark ?? ""),
    }));
    const defaultRemote = remoteAddresses.find((item) => item.is_default === true);
    const activeAddressId = addresses.some((address) => address.id === data.activeAddressId)
      ? data.activeAddressId
      : defaultRemote ? String(defaultRemote.id) : addresses[0]?.id ?? null;
    const walletNotes = (walletResult.transactions ?? []).map((item) =>
      dateLabel(new Date(item.createdAt).toISOString()) + " · " + item.description + " · " + money(item.amountPaise),
    );
    setData((current) => ({
      ...current,
      orders: (ordersResult.orders ?? []).map((order) => fromRemoteOrder(order, current.profile.name)),
      addresses: addresses.length > 0 ? addresses : current.addresses,
      activeAddressId: addresses.length > 0 ? activeAddressId : current.activeAddressId,
      walletPaise: Number(walletResult.balancePaise ?? 0),
      walletNotes,
    }));
    if (catalogResult.catalog) setCatalog(catalogResult.catalog);
  }

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    const restoreSession = async () => {
      try {
        const response = await fetch("/api/customer-auth", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const result = await response.json() as {
          ok?: boolean;
          authenticated?: boolean;
          customer?: { id: string; name: string; phone: string };
        };
        if (!active) return;
        if (response.ok && result.ok && result.authenticated && result.customer) {
          const nationalPhone = result.customer.phone.replace(/^\+91/, "");
          setData((current) => ({
            ...current,
            profile: { name: result.customer!.name, phone: nationalPhone, verified: true },
          }));
          setNameInput(result.customer.name);
          setPhoneInput(nationalPhone);
          void refreshCustomerData().catch((error) => {
            setNotice(error instanceof Error ? error.message : "Could not sync your account.");
          });
        } else {
          setData((current) => ({
            ...current,
            profile: { ...current.profile, verified: false },
          }));
        }
      } catch {
        if (active) {
          setData((current) => ({
            ...current,
            profile: { ...current.profile, verified: false },
          }));
          setLoginError("We couldn't check your sign-in. Please refresh and try again.");
        }
      } finally {
        if (active) setSessionChecked(true);
      }
    };
    void restoreSession();
    return () => { active = false; };
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && sessionChecked) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated, sessionChecked]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const activeAddress = data.addresses.find((a) => a.id === data.activeAddressId) ?? data.addresses[0] ?? null;
  const waterDeposit = data.noEmptyBottles ? data.quantities.water * PRICE.bottle : 0;
  const knownTotal = (Object.keys(data.quantities) as ProductKey[]).reduce(
    (sum, key) => sum + data.quantities[key] * catalog[key].unitPricePaise, 0,
  ) + waterDeposit;
  const hasUnpriced = (data.quantities.milk > 0 && !catalog.milk.enabled) || (data.quantities.curd > 0 && !catalog.curd.enabled);
  const selectedCount = Object.values(data.quantities).reduce((sum, n) => sum + n, 0);
  const latestOrder = data.orders[0] ?? null;
  const refundTotal = useMemo(() => data.walletPaise, [data.walletPaise]);

  const setQuantity = (product: ProductKey, quantity: number) => {
    const minimum = product === "egg" ? MIN_EGG_QUANTITY : 0;
    const normalized = Number.isFinite(quantity) ? Math.floor(quantity) : minimum;
    setData((current) => ({
      ...current,
      quantities: { ...current.quantities, [product]: Math.max(minimum, Math.min(999, normalized)) },
    }));
  };
  const sendOtp = async () => {
    const digits = phoneInput.replace(/\D/g, "");
    if (digits.length !== 10) { setLoginError("Enter a valid 10-digit Indian mobile number."); return; }
    if (nameInput.trim().length < 2) { setLoginError("Enter your name to continue."); return; }
    setPhoneInput(digits);
    setLoginError("");
    setAuthBusy(true);
    try {
      const response = await fetch("/api/customer-auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request-otp", phone: digits }),
      });
      const result = await response.json() as { ok?: boolean; error?: string; resendAfterSeconds?: number };
      if (!response.ok || !result.ok) throw new Error(result.error || "We couldn't send the OTP. Please try again.");
      setOtpInput("");
      setOtpSent(true);
      setResendIn(result.resendAfterSeconds ?? 60);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "We couldn't send the OTP. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (otpInput.trim().length !== 6) { setLoginError("Enter the 6-digit OTP sent to your mobile."); return; }
    if (nameInput.trim().length < 2) { setLoginError("Enter your name to continue."); return; }
    setLoginError("");
    setAuthBusy(true);
    try {
      const response = await fetch("/api/customer-auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-otp", phone: phoneInput, code: otpInput.trim(), name: nameInput.trim() }),
      });
      const result = await response.json() as {
        ok?: boolean; error?: string;
        customer?: { id: string; name: string; phone: string };
      };
      if (!response.ok || !result.ok || !result.customer) {
        throw new Error(result.error || "We couldn't verify that code. Please try again.");
      }
      const nationalPhone = result.customer.phone.replace(/^\+91/, "");
      setData((current) => ({
        ...current,
        profile: { name: result.customer!.name, phone: nationalPhone, verified: true },
      }));
      setNameInput(result.customer.name);
      setPhoneInput(nationalPhone);
      setOtpSent(false);
      setOtpInput("");
      setLoginError("");
      void refreshCustomerData().catch((error) => {
        setNotice(error instanceof Error ? error.message : "Could not sync your account.");
      });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "We couldn't verify that code. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    setAuthBusy(true);
    try {
      await fetch("/api/customer-auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } finally {
      setData((current) => ({
        ...current,
        profile: { ...current.profile, verified: false },
      }));
      setOtpSent(false);
      setOtpInput("");
      setResendIn(0);
      setLoginError("");
      setTab("home");
      setAuthBusy(false);
    }
  };

  const saveAddress = async () => {
    if (data.addresses.length >= 4) { setNotice("You can save up to 4 addresses."); return; }
    if (!addressForm.label.trim() || !addressForm.recipient.trim() || !addressForm.line1.trim() || !addressForm.city.trim() || !/^\\d{6}$/.test(addressForm.pincode)) {
      setNotice("Enter the address name, recipient, address, city and valid 6-digit pincode."); return;
    }
    const address: Address = { ...addressForm, id: newId("ADDR") };
    const nextAddresses = [...data.addresses, address];
    setData((current) => ({ ...current, addresses: nextAddresses, activeAddressId: address.id }));
    try {
      await syncAddresses(nextAddresses, address.id);
      setNotice("Delivery address saved and synced to your account.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Address saved on this device but server sync failed.");
    }
    setAddressForm({ label: "", recipient: data.profile.name, line1: "", line2: "", city: "Chennai", pincode: "", landmark: "" });
    setAddressEditorOpen(false);
  };

  const selectAddress = async (addressId: string) => {
    setData((current) => ({ ...current, activeAddressId: addressId }));
    try {
      await syncAddresses(data.addresses, addressId);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not sync the selected address.");
    }
  };

  const removeAddress = async (addressId: string) => {
    const nextAddresses = data.addresses.filter((address) => address.id !== addressId);
    const nextActive = data.activeAddressId === addressId ? (nextAddresses[0]?.id ?? null) : data.activeAddressId;
    setData((current) => ({ ...current, addresses: nextAddresses, activeAddressId: nextActive }));
    try {
      await syncAddresses(nextAddresses, nextActive);
      setNotice("Address removed from your account.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not sync the address change.");
    }
  };

  const placeOrder = async () => {
    if (!activeAddress) { setTab("profile"); setAddressEditorOpen(true); setNotice("Add a delivery address before placing an order."); return; }
    if (data.quantities.egg < MIN_EGG_QUANTITY) {
      setNotice("Fresh Egg orders require a minimum quantity of 10 eggs.");
      return;
    }
    if (selectedCount === 0) { setNotice("Choose a quantity for at least one product."); return; }
    if (hasUnpriced) { setNotice("Milk or curd is not enabled yet. Remove it until its catalogue price is configured."); return; }

    setPlacingOrder(true);
    setNotice("");
    try {
      const response = await fetch("/api/native/orders", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eggQuantity: data.quantities.egg,
          waterCanQuantity: data.quantities.water,
          milkQuantity: data.quantities.milk,
          curdQuantity: data.quantities.curd,
          emptyBottlesToReturn: !data.noEmptyBottles,
          floorCount: 0,
          address: {
            label: activeAddress.label,
            door: activeAddress.line1,
            street: activeAddress.line2 || activeAddress.line1,
            area: activeAddress.line2 || activeAddress.line1,
            landmark: activeAddress.landmark,
            city: activeAddress.city,
            pincode: activeAddress.pincode,
          },
        }),
      });
      const result = await response.json() as {
        ok?: boolean; error?: string;
        order?: { id: string; totalPaise: number; status: string };
      };
      if (!response.ok || !result.ok || !result.order) throw new Error(result.error || "The order could not be placed.");
      setData((current) => ({
        ...current,
        quantities: { egg: MIN_EGG_QUANTITY, water: 0, milk: 0, curd: 0 },
        noEmptyBottles: false,
      }));
      setTab("activity");
      setNotice("Order " + result.order.id + " placed. It will now appear in the Vendor App and Super Admin.");
      try {
        await refreshCustomerData();
      } catch {
        setNotice("Order " + result.order.id + " was placed. Refresh Status to load the latest order details.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The order could not be placed. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const submitComplaint = async () => {
    const note = complaintText.trim();
    if (note.length < 8) { setNotice("Please describe the issue in a little more detail."); return; }
    try {
      const response = await fetch("/api/native/complaints", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: note }),
      });
      const result = await response.json() as { ok?: boolean; error?: string; ticketId?: string };
      if (!response.ok || !result.ok || !result.ticketId) throw new Error(result.error || "Your support ticket could not be submitted.");
      const item: Complaint = { id: result.ticketId, message: note, createdAt: new Date().toISOString() };
      setData((current) => ({ ...current, complaints: [item, ...current.complaints] }));
      setComplaintText("");
      setNotice("Support ticket " + item.id + " was sent to the Spencer's support desk.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your support ticket could not be submitted.");
    }
  };
  const submitPartner = () => {
    if (!partnerForm.name.trim() || partnerForm.phone.replace(/\D/g, "").length !== 10 || !partnerForm.area.trim()) {
      setNotice("Enter your name, 10-digit phone number and area."); return;
    }
    setData((current) => ({ ...current, partnerRequests: [partnerForm, ...current.partnerRequests] }));
    const message = [
      "Spencer's Enterprises — Partnership enquiry",
      "Name: " + partnerForm.name.trim(),
      "Phone: " + partnerForm.phone.replace(/\D/g, ""),
      "Area: " + partnerForm.area.trim(),
      partnerForm.note.trim() ? "Note: " + partnerForm.note.trim() : "",
    ].filter(Boolean).join("\n");
    window.open("https://wa.me/?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
    setPartnerOpen(false);
    setPartnerForm({ name: "", phone: "", area: "", note: "" });
    setNotice("Your enquiry is saved here. WhatsApp opened with the details ready to share with Spencer's team.");
  };

  if (!hydrated || !sessionChecked) {
    return <div className="grid min-h-screen place-items-center bg-customer"><div className="animate-pulse text-sm font-medium text-brand-dark">Spencer's Enterprises</div></div>;
  }
  if (!data.profile.verified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-customer px-5 py-10">
        <section className="w-full max-w-sm rounded-3xl border border-customer-line bg-white p-6 shadow-card">
          <div className="mb-6 flex items-center gap-3">
            <BrandMark /><div><p className="text-xs font-bold tracking-[0.16em] text-brand">SPENCERS</p><h1 className="text-lg font-bold text-customer-ink">ENTERPRISES</h1><p className="text-xs text-customer-muted">Deliver your Home Needs</p></div>
          </div>
          <div className="mb-5 rounded-2xl bg-brand-dark p-5 text-white">
            <p className="text-xs font-semibold tracking-[0.16em] text-sky-200">CUSTOMER ACCESS</p>
            <h2 className="mt-2 text-2xl font-semibold">Welcome home.</h2>
            <p className="mt-1 text-sm text-sky-100">Sign in with your mobile number to order everyday essentials.</p>
          </div>
          {!otpSent ? (
            <div className="space-y-4">
              <Field label="Your name" value={nameInput} onChange={setNameInput} placeholder="Enter your name" />
              <Field label="Mobile number" value={phoneInput} onChange={(value) => setPhoneInput(value.replace(/\D/g, "").slice(0, 10))} type="tel" maxLength={10} placeholder="10-digit mobile number" />
              <button type="button" disabled={authBusy || phoneInput.replace(/\D/g, "").length !== 10 || nameInput.trim().length < 2} onClick={() => void sendOtp()} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
                {authBusy ? "Sending OTP..." : "Send OTP"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-customer-muted">Enter the 6-digit code sent to <strong className="text-customer-ink">+91 {phoneInput}</strong>. It expires in 5 minutes.</p>
              <Field label="One-time password" value={otpInput} onChange={(value) => setOtpInput(value.replace(/\D/g, "").slice(0, 6))} type="text" maxLength={6} placeholder="6-digit OTP" />
              <button type="button" disabled={authBusy || otpInput.length !== 6} onClick={() => void verifyOtp()} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
                {authBusy ? "Verifying..." : "Verify and continue"}
              </button>
              <div className="flex items-center justify-between gap-3 text-sm">
                <button type="button" onClick={() => { setOtpSent(false); setOtpInput(""); setResendIn(0); }} className="py-2 font-medium text-brand">Change mobile number</button>
                <button type="button" disabled={authBusy || resendIn > 0} onClick={() => void sendOtp()} className="py-2 font-medium text-brand disabled:text-customer-muted">
                  {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}
          {loginError ? <p role="alert" className="mt-3 text-sm text-red-700">{loginError}</p> : null}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-customer-muted"><ShieldCheck size={14} />Your mobile number is used for order updates.</div>
        </section>
      </main>
    );
  }

  if (data.addresses.length === 0) {
    return (
      <main className="min-h-screen bg-customer px-4 py-8">
        <div className="mx-auto max-w-md">
          <BrandMark />
          <h1 className="mt-4 text-2xl font-bold text-customer-ink">Add your delivery address</h1>
          <p className="mt-1 text-sm text-customer-muted">Save your first address to start ordering.</p>
          <AddressForm form={addressForm} setForm={setAddressForm} onSave={saveAddress} />
          {notice ? <p className="mt-3 text-sm text-brand-dark">{notice}</p> : null}
        </div>
      </main>
    );
  }

  if (!activeAddress) return null;

  return (
    <div className="min-h-screen bg-customer pb-24 text-customer-ink">
      <header className="mx-auto flex max-w-xl items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <BrandMark small />
          <div><p className="text-[10px] font-bold tracking-[0.18em] text-brand">SPENCERS</p><h1 className="text-sm font-bold leading-tight tracking-wide">ENTERPRISES</h1></div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-brand-pale px-3 py-2 text-xs font-semibold text-brand-dark"><ShieldCheck size={14} />Verified</div>
      </header>
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 pb-5">
        {tab === "home" ? (
          <>
            <section className="overflow-hidden rounded-3xl bg-brand-dark p-5 text-white shadow-card">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-sky-200">SPENCERS ENTERPRISES</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div><h2 className="text-2xl font-semibold leading-tight">Deliver your Home Needs</h2><p className="mt-2 text-sm text-sky-100">Good essentials. Simple ordering.</p></div>
                <BrandMark />
              </div>
            </section>
            <button type="button" onClick={() => setTab("profile")} className="flex min-h-14 items-center gap-3 rounded-2xl border border-customer-line bg-white px-4 text-left">
              <MapPin className="shrink-0 text-brand" size={20} />
              <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-wider text-customer-muted">Deliver to · {activeAddress.label}</span><span className="block truncate text-sm font-medium">{activeAddress.line1}, {activeAddress.city} – {activeAddress.pincode}</span></span>
              <ArrowRight size={17} className="text-customer-muted" />
            </button>
            {latestOrder && !["delivered", "cancelled"].includes(latestOrder.status) ? (
              <button type="button" onClick={() => setTab("activity")} className="flex items-center justify-between rounded-2xl border border-brand/20 bg-brand-pale p-4 text-left">
                <span><span className="block text-xs text-brand-dark">Latest order · {latestOrder.id}</span><strong className="mt-1 block text-sm text-brand-dark">{STATUS[latestOrder.status]}</strong></span><ArrowRight size={18} className="text-brand" />
              </button>
            ) : null}
            <section>
              <div className="mb-3"><h2 className="text-xl font-bold">Products Available</h2><p className="mt-1 text-sm text-customer-muted">Choose what you need</p></div>
              <div className="space-y-3">
                <ProductCard product="egg" quantity={data.quantities.egg} setQuantity={(n) => setQuantity("egg", n)} noEmptyBottles={data.noEmptyBottles} setNoEmptyBottles={(v) => setData((s) => ({ ...s, noEmptyBottles: v }))} catalog={catalog.egg} />
                <ProductCard product="water" quantity={data.quantities.water} setQuantity={(n) => setQuantity("water", n)} noEmptyBottles={data.noEmptyBottles} setNoEmptyBottles={(v) => setData((s) => ({ ...s, noEmptyBottles: v }))} catalog={catalog.water} />
                <ProductCard product="milk" quantity={data.quantities.milk} setQuantity={(n) => setQuantity("milk", n)} noEmptyBottles={data.noEmptyBottles} setNoEmptyBottles={() => undefined} catalog={catalog.milk} />
                <ProductCard product="curd" quantity={data.quantities.curd} setQuantity={(n) => setQuantity("curd", n)} noEmptyBottles={data.noEmptyBottles} setNoEmptyBottles={() => undefined} catalog={catalog.curd} />
              </div>
            </section>
            <button type="button" onClick={() => setPartnerOpen(true)} className="flex min-h-16 items-center gap-3 rounded-2xl border border-customer-line bg-white p-4 text-left">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-pale text-brand"><Handshake size={23} /></div>
              <span className="min-w-0 flex-1"><strong className="block text-sm">Partner with us</strong><span className="text-xs text-customer-muted">Interested in working with Spencer's Enterprises?</span></span><ArrowRight size={18} className="text-brand" />
            </button>
            <section className="rounded-2xl border border-customer-line bg-white p-4">
              <h3 className="font-semibold">Order summary</h3>
              <div className="mt-3 space-y-3 text-sm">
                {data.quantities.egg > 0 ? <PriceRow label="Fresh Egg" detail={money(catalog.egg.unitPricePaise) + " × " + data.quantities.egg + " eggs"} value={data.quantities.egg * catalog.egg.unitPricePaise} /> : null}
                {data.quantities.water > 0 ? <PriceRow label="Water Can" detail={money(catalog.water.unitPricePaise) + " × " + data.quantities.water + " cans"} value={data.quantities.water * catalog.water.unitPricePaise} /> : null}
                {waterDeposit > 0 ? <PriceRow label="Bottle deposit" detail={"₹150 × " + data.quantities.water + " bottles"} value={waterDeposit} /> : null}
                {data.quantities.milk > 0 ? <PriceRow label="Milk" detail={catalog.milk.enabled ? data.quantities.milk + " × " + catalog.milk.packLabel : "Currently unavailable"} value={data.quantities.milk * catalog.milk.unitPricePaise} /> : null}
                {data.quantities.curd > 0 ? <PriceRow label="Curd" detail={catalog.curd.enabled ? data.quantities.curd + " × " + catalog.curd.packLabel : "Currently unavailable"} value={data.quantities.curd * catalog.curd.unitPricePaise} /> : null}
                {selectedCount === 0 ? <p className="text-xs text-customer-muted">Your selected products and total will appear here.</p> : null}
                <div className="border-t border-customer-line pt-3"><PriceRow label="Total" detail={hasUnpriced ? "Excludes items awaiting price confirmation" : "Order total"} value={knownTotal} /></div>
              </div>
              <button type="button" onClick={() => void placeOrder()} disabled={selectedCount === 0 || placingOrder || hasUnpriced} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                {placingOrder ? "Placing order…" : "Place order"} <ArrowRight size={17} />
              </button>
              {hasUnpriced ? <p className="mt-2 text-center text-[11px] text-customer-muted">Milk / curd are unavailable until their prices are configured by Spencer's team.</p> : null}
            </section>
            <p className="px-2 text-center text-[11px] text-customer-muted">No delivery slot, nearest-partner or cash-on-delivery selection is required in this customer flow.</p>
          </>
        ) : null}
        {tab === "activity" ? (
          <section className="space-y-3">
            <div><h2 className="text-2xl font-bold">Status</h2><p className="mt-1 text-sm text-customer-muted">Track your orders and delivery updates</p></div>
            {data.orders.length === 0 ? <EmptyState icon={<ClipboardList size={25} />} title="No orders yet" detail="Your placed orders and their status will appear here." /> : null}
            {data.orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-customer-line bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-customer-muted">{order.id} · {dateLabel(order.createdAt)}</p><h3 className="mt-1 font-bold">{STATUS[order.status]}</h3></div><span className="rounded-full bg-brand-pale px-3 py-1 text-xs font-semibold text-brand-dark">{order.status === "delivered" ? "Completed" : order.status === "cancelled" ? "Cancelled" : "In progress"}</span></div>
                <p className="mt-3 text-sm text-customer-muted">{order.lines.map((line) => line.name + " × " + line.quantity).join(" · ")}</p>
                <div className="mt-3 rounded-xl bg-customer p-3">
                  {order.status === "cancelled" || order.status === "rejected" ? (
                    <p className="flex items-center gap-2 text-sm font-semibold text-red-700"><X size={17} />{STATUS[order.status]}</p>
                  ) : (
                    <ol className="space-y-3">
                      {STATUS_STEPS.map((step, index) => {
                        const current = STATUS_STEPS.indexOf(order.status);
                        const complete = index <= current;
                        return (
                          <li key={step} className="flex items-center gap-3 text-sm">
                            <span className={"grid h-6 w-6 shrink-0 place-items-center rounded-full " + (complete ? "bg-brand text-white" : "border border-customer-line bg-white text-customer-muted")}>
                              {complete ? <Check size={13} /> : index + 1}
                            </span>
                            <span className={complete ? "font-semibold text-brand-dark" : "text-customer-muted"}>{STATUS[step]}</span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  <div className="mt-3 border-t border-customer-line pt-3 text-sm">
                    <p className="text-customer-muted">Delivery partner: {order.partnerName ? order.partnerName + (order.partnerPhone ? " · " + order.partnerPhone : "") : "Awaiting allocation by Spencer's team"}</p>
                    <p className="mt-2 text-customer-muted">Delivery OTP: {order.status === "out_for_delivery" || order.status === "delivered" ? order.deliveryOtp : "Shown when the order is out for delivery"}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-customer-line pt-3"><span className="text-sm text-customer-muted">{order.awaitingQuote ? "Known total · milk / curd price pending" : "Order total"}</span><strong className="text-brand-dark">{money(order.totalPaise)}</strong></div>
                {order.status === "cancelled" ? <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">Cancelled by Spencer's team. {money(order.refundPaise ?? order.totalPaise)} credited to your wallet.</p> : order.status === "rejected" ? <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">The order was declined by Spencer's team. Contact support about the refund.</p> : <p className="mt-2 text-[11px] text-customer-muted">Only Spencer's team can cancel an order. Any eligible cancellation refund is credited to your wallet.</p>}
                <p className="mt-2 text-xs text-customer-muted">Deliver to: {order.address.label} · {order.address.line1}, {order.address.city} – {order.address.pincode}</p>
              </article>
            ))}
          </section>
        ) : null}
        {tab === "wallet" ? (
          <section className="space-y-4">
            <div><h2 className="text-2xl font-bold">Wallet</h2><p className="mt-1 text-sm text-customer-muted">Refunds from Spencer's Enterprises appear here.</p></div>
            <div className="rounded-3xl bg-brand-dark p-5 text-white"><div className="flex items-center gap-2 text-sm text-sky-100"><Wallet size={18} />Available balance</div><p className="mt-3 text-3xl font-bold tabular-nums">{money(refundTotal)}</p><p className="mt-1 text-xs text-sky-100">Order cancellation refunds are credited here.</p></div>
            {data.walletNotes.length === 0 ? <EmptyState icon={<Wallet size={25} />} title="No wallet transactions" detail="Refund credits and wallet activity will be listed here." /> : data.walletNotes.map((note, i) => <p key={i} className="rounded-xl border border-customer-line bg-white p-3 text-sm">{note}</p>)}
          </section>
        ) : null}
        {tab === "profile" ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">Profile</h2><p className="mt-1 text-sm text-customer-muted">Your account and saved details</p></div><button type="button" onClick={() => void logout()} disabled={authBusy} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-customer-muted disabled:opacity-50"><LogOut size={15} />Log out</button></div>
            <div className="rounded-2xl border border-customer-line bg-white p-4"><p className="font-semibold">{data.profile.name}</p><p className="mt-1 text-sm text-customer-muted">+91 {data.profile.phone}</p><p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check size={14} />Mobile verified</p></div>
            <div className="rounded-2xl border border-customer-line bg-white p-4">
              <div className="flex items-center justify-between"><div><h3 className="font-semibold">Saved addresses</h3><p className="mt-1 text-xs text-customer-muted">Save up to 4 places</p></div><span className="text-xs text-customer-muted">{data.addresses.length}/4</span></div>
              <div className="mt-3 space-y-2">
                {data.addresses.map((address) => <div key={address.id} className={"rounded-xl border p-3 " + (activeAddress.id === address.id ? "border-brand bg-brand-pale" : "border-customer-line")}>
                  <button type="button" onClick={() => void selectAddress(address.id)} className="flex w-full items-start gap-2 text-left"><MapPin size={17} className="mt-0.5 shrink-0 text-brand" /><span className="min-w-0 flex-1"><strong className="block text-sm">{address.label}</strong><span className="text-xs text-customer-muted">{address.recipient} · {address.line1}, {address.city} – {address.pincode}</span></span>{activeAddress.id === address.id ? <Check size={17} className="text-brand" /> : null}</button>
                  <button type="button" onClick={() => void removeAddress(address.id)} className="ml-6 mt-2 text-xs font-medium text-red-700">Remove address</button>
                </div>)}
              </div>
              {data.addresses.length < 4 ? <button type="button" onClick={() => { setAddressForm({ label: "", recipient: data.profile.name, line1: "", line2: "", city: "Chennai", pincode: "", landmark: "" }); setAddressEditorOpen(true); }} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand text-sm font-semibold text-brand"><Plus size={16} />Add another address</button> : null}
            </div>
            {addressEditorOpen ? <AddressForm form={addressForm} setForm={setAddressForm} onSave={saveAddress} onCancel={() => setAddressEditorOpen(false)} /> : null}
            <div className="rounded-2xl border border-customer-line bg-white p-4">
              <h3 className="font-semibold">Complaint / Support</h3><p className="mt-1 text-xs text-customer-muted">Describe your issue. Tickets are sent directly to the shared Super Admin support queue.</p>
              <textarea value={complaintText} onChange={(e) => setComplaintText(e.target.value)} rows={4} placeholder="Write your complaint here..." className="mt-3 w-full rounded-xl border border-customer-line p-3 text-sm outline-none focus:border-brand" />
              <button type="button" onClick={submitComplaint} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white"><MessageCircle size={16} />Submit complaint</button>
              {data.complaints.map((item) => <div key={item.id} className="mt-3 rounded-xl bg-customer p-3"><p className="text-xs font-semibold text-brand-dark">{item.id} · {dateLabel(item.createdAt)}</p><p className="mt-1 text-sm">{item.message}</p><a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand underline" target="_blank" rel="noreferrer" href={"https://wa.me/?text=" + encodeURIComponent("Spencer's Enterprises support request " + item.id + ": " + item.message)}>Share via WhatsApp <ArrowRight size={13} /></a></div>)}
            </div>
          </section>
        ) : null}
        {notice ? <div role="status" className="rounded-xl border border-brand/20 bg-brand-pale px-3 py-2 text-sm text-brand-dark">{notice}<button type="button" className="ml-2 font-bold" onClick={() => setNotice("")} aria-label="Dismiss">×</button></div> : null}
      </main>
      <BottomNav active={tab} onChange={setTab} />
      {partnerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-3 sm:items-center">
          <section className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold tracking-wider text-brand">SPENCERS ENTERPRISES</p><h2 className="mt-1 text-xl font-bold">Partner with us?</h2><p className="mt-1 text-sm text-customer-muted">Would you like to partner with Spencer's Enterprises? Share your details and our team will contact you.</p></div><button type="button" onClick={() => setPartnerOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-customer"><X size={18} /></button></div>
            <div className="mt-4 space-y-3">
              <Field label="Your name" value={partnerForm.name} onChange={(v) => setPartnerForm((s) => ({ ...s, name: v }))} placeholder="Name" />
              <Field label="Mobile number" value={partnerForm.phone} onChange={(v) => setPartnerForm((s) => ({ ...s, phone: v }))} placeholder="10-digit number" type="tel" maxLength={10} />
              <Field label="Area / locality" value={partnerForm.area} onChange={(v) => setPartnerForm((s) => ({ ...s, area: v }))} placeholder="Your area" />
              <Field label="Anything else? (optional)" value={partnerForm.note} onChange={(v) => setPartnerForm((s) => ({ ...s, note: v }))} placeholder="Tell us more" />
              <button type="button" onClick={submitPartner} className="min-h-12 w-full rounded-xl bg-brand font-semibold text-white">Yes, contact me</button>
              <button type="button" onClick={() => setPartnerOpen(false)} className="min-h-10 w-full text-sm font-medium text-customer-muted">No, maybe later</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return <div className="rounded-2xl border border-dashed border-customer-line bg-white px-5 py-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-pale text-brand">{icon}</div><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm text-customer-muted">{detail}</p></div>;
}

function AddressForm({
  form, setForm, onSave, onCancel,
}: {
  form: Omit<Address, "id">; setForm: (v: Omit<Address, "id">) => void; onSave: () => void; onCancel?: () => void;
}) {
  const update = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });
  return (
    <section className="mt-4 space-y-3 rounded-2xl border border-customer-line bg-white p-4 shadow-card">
      <div><h2 className="font-semibold">Delivery details</h2><p className="mt-1 text-xs text-customer-muted">Give this address a name so you can select it later.</p></div>
      <Field label="Address name (Home / Work / etc.)" value={form.label} onChange={(v) => update("label", v)} placeholder="Home" />
      <Field label="Recipient name" value={form.recipient} onChange={(v) => update("recipient", v)} placeholder="Who will receive the order?" />
      <Field label="Flat / house / building and street" value={form.line1} onChange={(v) => update("line1", v)} placeholder="Door no., street, building" />
      <Field label="Area / locality (optional)" value={form.line2} onChange={(v) => update("line2", v)} placeholder="Area or locality" />
      <div className="grid grid-cols-2 gap-3"><Field label="City" value={form.city} onChange={(v) => update("city", v)} placeholder="City" /><Field label="Pincode" value={form.pincode} onChange={(v) => update("pincode", v.replace(/\D/g, ""))} placeholder="6-digit pincode" maxLength={6} /></div>
      <Field label="Landmark (optional)" value={form.landmark} onChange={(v) => update("landmark", v)} placeholder="Nearby landmark" />
      <button type="button" onClick={onSave} className="min-h-12 w-full rounded-xl bg-brand font-semibold text-white">Save address</button>
      {onCancel ? <button type="button" onClick={onCancel} className="min-h-10 w-full text-sm text-customer-muted">Cancel</button> : null}
    </section>
  );
}
