import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addDays, readChennai } from "./clock";
import { bi, nid } from "./labels";
import { quoteCart } from "./pricing";
import { rankVendors, reassignBlock } from "./routing";
import { createCatalogue, DEFAULT_PRICE, type Catalogue } from "./seed";
import type {
  AccountType,
  ActingRole,
  Address,
  CartLine,
  Flash,
  Lang,
  Order,
  OrderStatus,
  PayMethod,
  Profile,
  RolePerm,
  SupportNote,
  Vendor,
  WalletEntry,
} from "./types";

export type Session = {
  lang: Lang;
  profile: Profile;
  address: Address | null;
  editingStreet: boolean;
  cart: CartLine[];
  cartVendorId: string | null;
  couponCode: string | null;
  walletPaise: number;
  walletBalances: Record<string, number>;
  walletEntries: WalletEntry[];
  favourites: string[];
  activeVendorId: string;
  actingRole: ActingRole;
  support: SupportNote[];
  flash: Flash | null;
};

export type EggsState = Catalogue &
  Session & {
    setLang: (lang: Lang) => void;
    clearFlash: () => void;
    verifyPhone: (phone: string, name: string) => void;
    setAccount: (accountType: AccountType, businessName: string, name: string) => void;
    confirmAddress: (address: Address) => void;
    setEditingStreet: (on: boolean) => void;
    setActiveVendor: (id: string) => void;
    setCartVendor: (id: string) => void;
    addToCart: (productId: string, pack: number) => void;
    setLineQty: (productId: string, pack: number, qtyPacks: number) => void;
    clearCart: () => void;
    setCoupon: (code: string) => void;
    placeOrder: (input: { slotId: string; date: string; method: PayMethod; useWallet: boolean }) => string | null;
    cancelOrder: (orderId: string) => void;
    confirmCancel: (orderId: string) => void;
    vendorAdvance: (orderId: string, status: OrderStatus, cashCollected?: boolean) => void;
    vendorReject: (orderId: string, reason: string) => void;
    vendorSetStock: (productId: string, stockEggs: number) => void;
    vendorSetPrice: (productId: string, pricePerEggPaise: number) => void;
    vendorSetHours: (open: string, close: string) => void;
    vendorSetAccepting: (on: boolean) => void;
    vendorToggleOffer: (offerId: string) => void;
    vendorProfile: (patch: Partial<Pick<Vendor, "phone">> & { nameEn?: string; nameTa?: string }) => void;
    registerVendor: (input: { nameEn: string; nameTa: string; phone: string; localityId: string }) => void;
    toggleFav: (productId: string) => void;
    topUp: (paise: number) => void;
    createSub: (input: { productId: string; pack: number; qtyPacks: number; cadence: "daily" | "weekly"; slotId: string }) => void;
    setSubStatus: (id: string, status: "active" | "paused") => void;
    skipSub: (id: string) => void;
    releaseDueSubs: () => void;
    reportIssue: (orderId: string, kind: "broken" | "refund" | "replacement", note: string) => void;
    resolveIssue: (id: string, status: "replacement" | "refunded" | "closed") => void;
    sendSupport: (text: string) => void;
    requestStreet: (query: string, localityId: string) => void;
    markNotices: () => void;
    rateOrder: (orderId: string, stars: number) => void;
    reorder: (orderId: string) => void;
    adminSetStreetStatus: (streetId: string, status: "active" | "suspended" | "inactive") => void;
    adminAddStreet: (input: { localityId: string; en: string; ta: string; aliases: string; pin: string }) => void;
    adminSetAssignment: (streetId: string, vendorId: string, role: "primary" | "backup") => void;
    adminClearAssignment: (streetId: string, vendorId: string) => void;
    adminSetVendorStatus: (vendorId: string, status: Vendor["status"]) => void;
    adminSetCommission: (vendorId: string, bps: number) => void;
    adminReassign: (orderId: string, vendorId: string) => void;
    adminTogglePack: (productId: string, pack: number) => void;
    adminToggleProduct: (productId: string) => void;
    adminSetVendorPrice: (vendorId: string, productId: string, price: number) => void;
    markSettled: (vendorId: string) => void;
    setActingRole: (role: ActingRole) => void;
    setRolePerm: (id: RolePerm["id"], key: keyof Omit<RolePerm, "id">, value: boolean) => void;
    setConfig: (patch: Partial<Catalogue["config"]>) => void;
    setCampaign: (patch: Partial<Catalogue["campaign"]> & { titleEn?: string; bodyEn?: string }) => void;
    broadcast: (en: string, ta: string) => void;
    closeRequest: (id: string) => void;
    resetDemo: () => void;
  };

function session(): Session {
  return {
    lang: "en",
    profile: { name: "", phone: "", phoneVerified: false, accountType: "home", businessName: "" },
    address: null,
    editingStreet: false,
    cart: [],
    cartVendorId: null,
    couponCode: null,
    walletPaise: 0,
    walletBalances: {},
    walletEntries: [],
    favourites: ["egg"],
    activeVendorId: "v-murugan",
    actingRole: "owner",
    support: [
      {
        from: "desk",
        text: "Spencers Enterprices customer care · Chennai. Write in English or Tamil. We are here to help with your order.",
        at: new Date().toISOString(),
      },
    ],
    flash: null,
  };
}

function phoneWalletKey(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

function walletPatch(
  state: Pick<EggsState, "profile" | "walletBalances" | "walletEntries">,
  nextBalance: number,
  entry?: { direction: "credit" | "debit"; reason: string; amountPaise: number; reference?: string },
): Pick<EggsState, "walletPaise" | "walletBalances" | "walletEntries"> {
  const key = phoneWalletKey(state.profile.phone);
  if (!key || key.length !== 10) {
    return { walletPaise: nextBalance, walletBalances: state.walletBalances, walletEntries: state.walletEntries };
  }
  const walletEntries: WalletEntry[] = entry && entry.amountPaise > 0
    ? [{
        id: nid("wal"),
        phone: key,
        direction: entry.direction,
        reason: entry.reason,
        amountPaise: entry.amountPaise,
        balanceAfterPaise: nextBalance,
        at: new Date().toISOString(),
        reference: entry.reference,
      }, ...state.walletEntries]
    : state.walletEntries;
  return {
    walletPaise: nextBalance,
    walletBalances: { ...state.walletBalances, [key]: nextBalance },
    walletEntries,
  };
}

function say(text: { en: string; ta: string }): Flash {
  return { id: Date.now() + Math.floor(Math.random() * 1000), text };
}

function audit(actor: string, action: string, detail: string) {
  return { id: nid("aud"), at: new Date().toISOString(), actor, action, detail };
}

function allowed(state: EggsState, key: keyof Omit<RolePerm, "id">) {
  if (state.actingRole === "owner") return true;
  const role = state.roles.find((r) => r.id === state.actingRole);
  return !!role?.[key];
}

function restoreStock(state: Pick<EggsState, "vendorProducts">, order: Order) {
  return state.vendorProducts.map((row) => {
    if (row.vendorId !== order.vendorId) return row;
    const eggs = order.lines
      .filter((l) => l.productId === row.productId)
      .reduce((sum, l) => sum + l.pack * l.qtyPacks, 0);
    return eggs ? { ...row, stockEggs: row.stockEggs + eggs } : row;
  });
}

function releaseSeat(caps: EggsState["capacities"], order: Order) {
  return caps.map((cap) =>
    cap.vendorId === order.vendorId && cap.slotId === order.slotId && cap.date === order.date
      ? { ...cap, booked: Math.max(0, cap.booked - 1) }
      : cap,
  );
}

function takeSeat(caps: EggsState["capacities"], vendorId: string, slotId: string, date: string) {
  const idx = caps.findIndex((c) => c.vendorId === vendorId && c.slotId === slotId && c.date === date);
  if (idx < 0) return [...caps, { vendorId, slotId, date, capacity: 25, booked: 1 }];
  return caps.map((cap, i) => (i === idx ? { ...cap, booked: cap.booked + 1 } : cap));
}

export const useEggs = create<EggsState>()(
  persist(
    (set, get) => ({
      ...createCatalogue(),
      ...session(),
      setLang: (lang) => set({ lang }),
      clearFlash: () => set({ flash: null }),
      verifyPhone: (phone, name) => {
        const s = get();
        const key = phoneWalletKey(phone);
        set({
          profile: { ...s.profile, phone, name: name.trim() || "Customer", phoneVerified: true },
          walletPaise: s.walletBalances[key] ?? 0,
          flash: say(bi("Number confirmed.", "எண் உறுதி.")),
        });
      },
      setAccount: (accountType, businessName, name) =>
        set({ profile: { ...get().profile, accountType, businessName, name: name.trim() || get().profile.name } }),
      confirmAddress: (address) => {
        const decision = rankVendors({
          streetId: address.streetId,
          streets: get().streets,
          vendors: get().vendors,
          assignments: get().assignments,
          vendorProducts: get().vendorProducts,
          capacities: get().capacities,
          slots: get().slots,
          clock: readChennai(),
        });
        set({
          address,
          editingStreet: false,
          cart: [],
          cartVendorId: decision.recommendedId ?? null,
          flash: decision.ok
            ? say(bi("Street saved. Prices are from the shop on this street.", "தெரு சேமிக்கப்பட்டது. விலை இந்தத் தெருக் கடையிலிருந்து."))
            : say(bi("Street saved. It is not in service yet.", "தெரு சேமிக்கப்பட்டது. இன்னும் சேவையில் இல்லை.")),
        });
      },
      setEditingStreet: (editingStreet) => set({ editingStreet }),
      setActiveVendor: (activeVendorId) => set({ activeVendorId }),
      setCartVendor: (id) => set({ cartVendorId: id, cart: [], couponCode: null, flash: say(bi("Cart moved to the other shop on your street.", "கூடை இந்தத் தெருவின் மற்ற கடைக்கு மாற்றப்பட்டது.")) }),
      addToCart: (productId, pack) => {
        const s = get();
        if (!s.address) return;
        const decision = rankVendors({
          streetId: s.address.streetId,
          streets: s.streets,
          vendors: s.vendors,
          assignments: s.assignments,
          vendorProducts: s.vendorProducts,
          capacities: s.capacities,
          slots: s.slots,
          clock: readChennai(),
        });
        const vendorId =
          s.cartVendorId && decision.ranked.some((r) => r.vendorId === s.cartVendorId && r.eligible)
            ? s.cartVendorId
            : decision.recommendedId;
        if (!vendorId) {
          set({ flash: say(bi("No shop can sell on this street right now.", "இப்போது இந்தத் தெருவில் விற்க கடை இல்லை.")) });
          return;
        }
        const row = s.vendorProducts.find((p) => p.vendorId === vendorId && p.productId === productId && p.active);
        if (!row || row.stockEggs < pack) {
          set({ flash: say(bi("Not enough eggs at this shop.", "இந்தக் கடையில் போதிய முட்டை இல்லை.")) });
          return;
        }
        const cart = [...s.cart];
        const idx = cart.findIndex((l) => l.productId === productId && l.pack === pack);
        const nextQty = (idx >= 0 ? cart[idx].qtyPacks : 0) + 1;
        if (pack * nextQty > row.stockEggs) {
          set({ flash: say(bi("That is the last of this pack.", "இந்தப் பொதியின் கடைசி அளவு இது.")) });
          return;
        }
        if (idx >= 0) cart[idx] = { ...cart[idx], qtyPacks: nextQty };
        else cart.push({ productId, pack, qtyPacks: 1 });
        set({ cart, cartVendorId: vendorId, flash: say(bi("Added to the basket.", "கூடையில் சேர்க்கப்பட்டது.")) });
      },
      setLineQty: (productId, pack, qtyPacks) => {
        const s = get();
        if (qtyPacks <= 0) {
          set({ cart: s.cart.filter((l) => !(l.productId === productId && l.pack === pack)) });
          return;
        }
        const row = s.vendorProducts.find((p) => p.vendorId === s.cartVendorId && p.productId === productId);
        if (row && pack * qtyPacks > row.stockEggs) {
          set({ flash: say(bi("Stock stops here.", "இருப்பு இங்கே நிற்கிறது.")) });
          return;
        }
        set({
          cart: s.cart.map((l) => (l.productId === productId && l.pack === pack ? { ...l, qtyPacks } : l)),
        });
      },
      clearCart: () => set({ cart: [], couponCode: null }),
      setCoupon: (code) => {
        const s = get();
        const found = s.coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase() && c.active);
        if (!found) {
          set({ couponCode: null, flash: say(bi("That code is not active.", "அந்தக் குறியீடு செயலில் இல்லை.")) });
          return;
        }
        set({ couponCode: found.code, flash: say(bi("Code applied if the basket qualifies.", "கூடை பொருந்தினால் குறியீடு பொருந்தும்.")) });
      },
      placeOrder: ({ slotId, date, method, useWallet }) => {
        const s = get();
        if (!s.address || !s.cartVendorId || s.cart.length === 0) return null;
        const demand = s.cart.map((l) => ({ productId: l.productId, eggs: l.pack * l.qtyPacks }));
        const decision = rankVendors({
          streetId: s.address.streetId,
          streets: s.streets,
          vendors: s.vendors,
          assignments: s.assignments,
          vendorProducts: s.vendorProducts,
          capacities: s.capacities,
          slots: s.slots,
          clock: readChennai(),
          demand,
          slotId,
          date,
        });
        const mine = decision.ranked.find((r) => r.vendorId === s.cartVendorId);
        if (!mine?.eligible) {
          set({
            flash: say(
              bi(
                "This shop cannot take the slot. Nothing was moved to another shop.",
                "இந்தக் கடை இந்த நேரத்தை எடுக்க முடியாது. வேறு கடைக்கு மாற்றப்படவில்லை.",
              ),
            ),
          });
          return null;
        }
        const prior = s.orders.filter((o) => o.customerKey === "self" && o.status !== "cancelled" && o.status !== "rejected").length;
        const coupon = s.coupons.find((c) => c.code === s.couponCode) ?? null;
        const slot = s.slots.find((sl) => sl.id === slotId);
        const quote = quoteCart({
          lines: s.cart,
          vendorId: s.cartVendorId,
          vendorProducts: s.vendorProducts,
          accountType: s.profile.accountType,
          tradeBps: s.config.tradeBps,
          coupon,
          slot,
          priorOrders: prior,
        });
        if (quote.missing || quote.total < 0) return null;
        let walletOff = 0;
        if (useWallet && s.config.walletEnabled) walletOff = Math.min(s.walletPaise, quote.total);
        const due = quote.total - walletOff;
        if (method === "upi" && !s.config.upiEnabled) return null;
        if (method === "cod" && due > 0 && !s.config.codEnabled) return null;
        const captured = method === "upi" ? quote.total : walletOff;
        const payMethod: PayMethod = due === 0 ? "wallet" : method;
        const lines = s.cart.map((line) => {
          const row = s.vendorProducts.find((p) => p.vendorId === s.cartVendorId && p.productId === line.productId);
          return { ...line, pricePerEggPaise: row?.pricePerEggPaise ?? 0 };
        });
        const id = `EGX-${Math.floor(1000 + Math.random() * 9000)}`;
        const vendor = s.vendors.find((v) => v.id === s.cartVendorId);
        const created: Order = {
          id,
          customerKey: "self",
          customerName: s.profile.businessName || s.profile.name,
          phone: s.profile.phone,
          accountType: s.profile.accountType,
          businessName: s.profile.businessName,
          address: s.address,
          vendorId: s.cartVendorId,
          lines,
          slotId,
          date,
          method: payMethod,
          capturedPaise: captured,
          totalPaise: quote.total,
          discountPaise: quote.trade + quote.couponOff,
          status: "placed",
          coupon: coupon && quote.couponOff > 0 ? coupon.code : null,
          createdAt: new Date().toISOString(),
          settled: false,
          events: [
            {
              at: new Date().toISOString(),
              text: bi(
                `Placed with ${vendor?.name.en ?? "the shop"}. Paid orders stay with this shop.`,
                `${vendor?.name.ta ?? "கடை"} உடன் வைக்கப்பட்டது. செலுத்திய ஆர்டர் இந்தக் கடையிலேயே இருக்கும்.`,
              ),
            },
          ],
        };
        set({
          orders: [created, ...s.orders],
          vendorProducts: s.vendorProducts.map((row) => {
            if (row.vendorId !== s.cartVendorId) return row;
            const eggs = demand.find((d) => d.productId === row.productId)?.eggs ?? 0;
            return eggs ? { ...row, stockEggs: row.stockEggs - eggs } : row;
          }),
          capacities: takeSeat(s.capacities, s.cartVendorId, slotId, date),
          ...walletPatch(s, s.walletPaise - walletOff, walletOff > 0 ? { direction: "debit", reason: `Order ${id}`, amountPaise: walletOff, reference: id } : undefined),
          cart: [],
          couponCode: null,
          notices: [
            {
              id: nid("nt"),
              at: new Date().toISOString(),
              title: bi(`Order ${id}`, `ஆர்டர் ${id}`),
              body: bi("The shop has to accept it. We will not pass it on quietly.", "கடை ஏற்க வேண்டும். அமைதியாக வேறு கடைக்கு போகாது."),
              read: false,
            },
            ...s.notices,
          ],
          flash: say(bi(`Order ${id} is with the shop.`, `ஆர்டர் ${id} கடையிடம் உள்ளது.`)),
        });
        return id;
      },
      cancelOrder: (orderId) => {
        const s = get();
        const order = s.orders.find((o) => o.id === orderId && o.customerKey === "self");
        if (!order) return;
        if (order.status === "placed") {
          const refund = order.capturedPaise;
          set({
            orders: s.orders.map((o) =>
              o.id === orderId
                ? { ...o, status: "cancelled", events: [...o.events, { at: new Date().toISOString(), text: bi("You cancelled before the shop accepted.", "கடை ஏற்கும் முன் நீங்கள் ரத்து செய்தீர்கள்.") }] }
                : o,
            ),
            vendorProducts: restoreStock(s, order),
            capacities: releaseSeat(s.capacities, order),
            ...walletPatch(s, s.walletPaise + refund, refund > 0 ? { direction: "credit", reason: `Refund ${orderId}`, amountPaise: refund, reference: orderId } : undefined),
            flash: say(refund ? bi("Cancelled. Captured money is back in the wallet.", "ரத்து. பிடித்த பணம் பணப்பையில்.") : bi("Cancelled.", "ரத்து செய்யப்பட்டது.")),
          });
          return;
        }
        if (order.status === "accepted" || order.status === "preparing") {
          set({
            orders: s.orders.map((o) => (o.id === orderId ? { ...o, cancelRequested: true } : o)),
            flash: say(bi("Cancellation asked. The shop still has to confirm.", "ரத்து கோரப்பட்டது. கடை உறுதி செய்ய வேண்டும்.")),
          });
        }
      },
      confirmCancel: (orderId) => {
        const s = get();
        const order = s.orders.find((o) => o.id === orderId && o.vendorId === s.activeVendorId);
        if (!order || !order.cancelRequested) return;
        const refund = order.customerKey === "self" ? order.capturedPaise : 0;
        set({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: "cancelled", cancelRequested: false, events: [...o.events, { at: new Date().toISOString(), text: bi("Shop confirmed the cancellation.", "கடை ரத்தை உறுதி செய்தது.") }] }
              : o,
          ),
          vendorProducts: restoreStock(s, order),
          capacities: releaseSeat(s.capacities, order),
          ...walletPatch(s, s.walletPaise + refund, refund > 0 ? { direction: "credit", reason: `Refund ${orderId}`, amountPaise: refund, reference: orderId } : undefined),
          audits: [audit("Vendor", "order.cancel", `${orderId} cancelled by the shop.`), ...s.audits],
        });
      },
      vendorAdvance: (orderId, status, cashCollected) => {
        const s = get();
        const order = s.orders.find((o) => o.id === orderId && o.vendorId === s.activeVendorId);
        if (!order) return;
        const flow: OrderStatus[] = ["placed", "accepted", "preparing", "out_for_delivery", "delivered"];
        if (flow.indexOf(status) !== flow.indexOf(order.status) + 1) return;
        const vendor = s.vendors.find((v) => v.id === s.activeVendorId);
        const labels: Record<string, { en: string; ta: string }> = {
          accepted: bi("Shop accepted.", "கடை ஏற்றது."),
          preparing: bi("Eggs are being packed.", "முட்டை பொதியாகிறது."),
          out_for_delivery: bi(`${vendor?.rider.en ?? "Rider"} is out with the order.`, `${vendor?.rider.ta ?? "டெலிவரி"} ஆர்டருடன் புறப்பட்டார்.`),
          delivered: bi("Delivered.", "வழங்கப்பட்டது."),
        };
        let captured = order.capturedPaise;
        let cashPending = order.cashPending;
        if (status === "delivered" && order.method === "cod") {
          const due = order.totalPaise - order.capturedPaise;
          if (cashCollected) captured = order.totalPaise;
          else cashPending = due > 0;
        }
        set({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, status, capturedPaise: captured, cashPending, events: [...o.events, { at: new Date().toISOString(), text: labels[status] ?? bi(status, status) }] }
              : o,
          ),
          flash: say(labels[status] ?? bi("Updated.", "புதுப்பிக்கப்பட்டது.")),
        });
      },
      vendorReject: (orderId, reason) => {
        const s = get();
        const order = s.orders.find((o) => o.id === orderId && o.vendorId === s.activeVendorId);
        if (!order || order.status !== "placed") return;
        const refund = order.customerKey === "self" ? order.capturedPaise : 0;
        set({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "rejected",
                  events: [...o.events, { at: new Date().toISOString(), text: bi(`Shop declined: ${reason}. Not passed to a backup.`, `கடை மறுத்தது: ${reason}. மாற்றுக் கடைக்கு அனுப்பப்படவில்லை.`) }],
                }
              : o,
          ),
          vendorProducts: restoreStock(s, order),
          capacities: releaseSeat(s.capacities, order),
          ...walletPatch(s, s.walletPaise + refund, refund > 0 ? { direction: "credit", reason: `Refund ${orderId}`, amountPaise: refund, reference: orderId } : undefined),
          audits: [audit(s.vendors.find((v) => v.id === s.activeVendorId)?.name.en ?? "Vendor", "order.reject", `${orderId}: ${reason}`), ...s.audits],
          flash: say(bi("Declined. Stock released. Customer was not moved.", "நிராகரிப்பு. இருப்பு விடுவிக்கப்பட்டது. வாடிக்கையாளர் மாற்றப்படவில்லை.")),
        });
      },
      vendorSetStock: (productId, stockEggs) => {
        const s = get();
        const next = Math.max(0, Math.round(stockEggs));
        const row = s.vendorProducts.find((p) => p.vendorId === s.activeVendorId && p.productId === productId);
        const notices = [...s.notices];
        if (row && next <= row.lowStockAt) {
          const product = s.products.find((p) => p.id === productId);
          notices.unshift({
            id: nid("nt"),
            at: new Date().toISOString(),
            title: bi("Low stock", "குறைந்த இருப்பு"),
            body: bi(`${product?.name.en ?? "Eggs"} is down to ${next}.`, `${product?.name.ta ?? "முட்டை"} ${next} ஆகக் குறைந்தது.`),
            read: false,
          });
        }
        set({
          vendorProducts: s.vendorProducts.map((p) =>
            p.vendorId === s.activeVendorId && p.productId === productId ? { ...p, stockEggs: next } : p,
          ),
          notices,
        });
      },
      vendorSetPrice: (productId, pricePerEggPaise) => {
        const s = get();
        const price = Math.max(100, Math.round(pricePerEggPaise));
        set({
          vendorProducts: s.vendorProducts.map((p) =>
            p.vendorId === s.activeVendorId && p.productId === productId ? { ...p, pricePerEggPaise: price } : p,
          ),
        });
      },
      vendorSetHours: (open, close) => {
        const s = get();
        set({ vendors: s.vendors.map((v) => (v.id === s.activeVendorId ? { ...v, hours: { open, close } } : v)) });
      },
      vendorSetAccepting: (acceptingOrders) => {
        const s = get();
        set({
          vendors: s.vendors.map((v) => (v.id === s.activeVendorId ? { ...v, acceptingOrders } : v)),
          audits: [audit("Vendor", "vendor.accepting", `${s.activeVendorId} accepting=${acceptingOrders}. Open orders stay put.`), ...s.audits],
        });
      },
      vendorToggleOffer: (offerId) => {
        const s = get();
        set({ offers: s.offers.map((o) => (o.id === offerId && o.vendorId === s.activeVendorId ? { ...o, active: !o.active } : o)) });
      },
      vendorProfile: (patch) => {
        const s = get();
        set({
          vendors: s.vendors.map((v) =>
            v.id === s.activeVendorId
              ? {
                  ...v,
                  phone: patch.phone ?? v.phone,
                  name: {
                    en: patch.nameEn?.trim() || v.name.en,
                    ta: patch.nameTa?.trim() || v.name.ta,
                  },
                }
              : v,
          ),
        });
      },
      registerVendor: ({ nameEn, nameTa, phone, localityId }) => {
        const s = get();
        const loc = s.localities.find((l) => l.id === localityId) ?? s.localities[0];
        const id = nid("v");
        const created: Vendor = {
          id,
          name: bi(nameEn.trim() || "New shop", nameTa.trim() || nameEn.trim() || "புதிய கடை"),
          phone,
          status: "pending",
          localityId: loc.id,
          lat: loc.lat,
          lng: loc.lng,
          hours: { open: "05:30", close: "13:00" },
          rating: 0,
          reviewCount: 0,
          commissionBps: 800,
          acceptingOrders: false,
          rider: bi("Rider", "டெலிவரி"),
          pin: "0000",
          deliveryRadiusKm: 5,
        };
        const rows = s.products.map((p) => ({
          vendorId: id,
          productId: p.id,
          pricePerEggPaise: DEFAULT_PRICE[p.id] ?? 800,
          stockEggs: 0,
          lowStockAt: 20,
          active: true,
        }));
        set({
          vendors: [...s.vendors, created],
          vendorProducts: [...s.vendorProducts, ...rows],
          activeVendorId: id,
          audits: [audit("Vendor", "vendor.apply", `${created.name.en} applied. No streets until command approves.`), ...s.audits],
          flash: say(bi("Application sent. You can set stock, not streets.", "விண்ணப்பம் சென்றது. இருப்பு வைக்கலாம், தெரு இல்லை.")),
        });
      },
      toggleFav: (productId) => {
        const s = get();
        set({
          favourites: s.favourites.includes(productId)
            ? s.favourites.filter((id) => id !== productId)
            : [...s.favourites, productId],
        });
      },
      topUp: (paise) => {
        const s = get();
        set({
          ...walletPatch(s, s.walletPaise + paise, { direction: "credit", reason: "Preview wallet credit", amountPaise: paise }),
          flash: say(bi("Preview wallet credited on this device.", "இந்தச் சாதனத்தின் முன்னோட்டப் பணப்பையில் தொகை சேர்க்கப்பட்டது.")),
        });
      },
      createSub: ({ productId, pack, qtyPacks, cadence, slotId }) => {
        const s = get();
        if (!s.address || !s.cartVendorId) return;
        const row = s.vendorProducts.find((p) => p.vendorId === s.cartVendorId && p.productId === productId && p.active);
        if (!row) return;
        const sub = {
          id: nid("sub"),
          productId,
          pack,
          qtyPacks,
          cadence,
          slotId,
          status: "active" as const,
          skipDates: [],
          vendorId: s.cartVendorId,
          address: s.address,
          nextDate: addDays(readChennai().isoDate, 1),
          pricePerEggPaise: row.pricePerEggPaise,
        };
        set({ subscriptions: [sub, ...s.subscriptions], flash: say(bi("Subscription stays with this shop.", "சந்தா இந்தக் கடையுடன் இருக்கும்.")) });
      },
      setSubStatus: (id, status) => set({ subscriptions: get().subscriptions.map((sub) => (sub.id === id ? { ...sub, status } : sub)) }),
      skipSub: (id) => {
        const s = get();
        set({
          subscriptions: s.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, skipDates: [...sub.skipDates, sub.nextDate], nextDate: addDays(sub.nextDate, sub.cadence === "daily" ? 1 : 7) } : sub,
          ),
          flash: say(bi("Next drop skipped. The shop was not changed.", "அடுத்த விநியோகம் தவிர்க்கப்பட்டது. கடை மாறவில்லை.")),
        });
      },
      releaseDueSubs: () => {
        const s = get();
        if (!allowed(s, "vendors") && s.actingRole !== "owner") {
          set({ flash: say(bi("This seat cannot release subscriptions.", "இந்த இருக்கை சந்தாவை விடுவிக்க முடியாது.")) });
          return;
        }
        const clock = readChennai();
        let orders = [...s.orders];
        let vendorProducts = [...s.vendorProducts];
        let capacities = [...s.capacities];
        let audits = [...s.audits];
        const subscriptions = s.subscriptions.map((sub) => {
          if (sub.status !== "active" || sub.nextDate > clock.isoDate || sub.skipDates.includes(sub.nextDate)) return sub;
          const eggs = sub.pack * sub.qtyPacks;
          const decision = rankVendors({
            streetId: sub.address.streetId,
            streets: s.streets,
            vendors: s.vendors,
            assignments: s.assignments,
            vendorProducts,
            capacities,
            slots: s.slots,
            clock,
            demand: [{ productId: sub.productId, eggs }],
            slotId: sub.slotId,
            date: sub.nextDate,
          });
          const still = decision.ranked.find((r) => r.vendorId === sub.vendorId && r.eligible);
          if (!still) {
            audits = [audit("Command", "sub.hold", `${sub.id} held. Not moved to a backup shop.`), ...audits];
            return sub;
          }
          const total = sub.pricePerEggPaise * eggs;
          orders = [
            {
              id: `EGX-${Math.floor(1000 + Math.random() * 9000)}`,
              customerKey: "self" as const,
              customerName: s.profile.name,
              phone: s.profile.phone || "9840011220",
              accountType: s.profile.accountType,
              businessName: s.profile.businessName,
              address: sub.address,
              vendorId: sub.vendorId,
              lines: [{ productId: sub.productId, pack: sub.pack, qtyPacks: sub.qtyPacks, pricePerEggPaise: sub.pricePerEggPaise }],
              slotId: sub.slotId,
              date: sub.nextDate,
              method: "cod" as const,
              capturedPaise: 0,
              totalPaise: total,
              discountPaise: 0,
              status: "placed" as const,
              coupon: null,
              createdAt: new Date().toISOString(),
              subscriptionId: sub.id,
              settled: false,
              events: [{ at: new Date().toISOString(), text: bi("Subscription drop placed with the same shop.", "சந்தா அதே கடையில் வைக்கப்பட்டது.") }],
            },
            ...orders,
          ];
          vendorProducts = vendorProducts.map((row) =>
            row.vendorId === sub.vendorId && row.productId === sub.productId ? { ...row, stockEggs: row.stockEggs - eggs } : row,
          );
          capacities = takeSeat(capacities, sub.vendorId, sub.slotId, sub.nextDate);
          return { ...sub, nextDate: addDays(sub.nextDate, sub.cadence === "daily" ? 1 : 7) };
        });
        set({
          orders,
          vendorProducts,
          capacities,
          subscriptions,
          audits,
          flash: say(bi("Due subscriptions released. Held ones were not reassigned.", "நிலுவை சந்தாக்கள் விடுவிக்கப்பட்டன. நிறுத்தப்பட்டவை மாற்றப்படவில்லை.")),
        });
      },
      reportIssue: (orderId, kind, note) => {
        const s = get();
        const order = s.orders.find((o) => o.id === orderId && o.customerKey === "self");
        if (!order) return;
        set({
          complaints: [
            { id: nid("iss"), orderId, kind, note, status: "open", createdAt: new Date().toISOString(), customerKey: "self" },
            ...s.complaints,
          ],
          flash: say(bi("Report is with the desk and the shop. The order was not moved.", "அறிக்கை மேசைக்கும் கடைக்கும் சென்றது. ஆர்டர் மாறவில்லை.")),
        });
      },
      resolveIssue: (id, status) => {
        const s = get();
        if ((status === "refunded" || status === "replacement") && !allowed(s, "refunds")) {
          set({ flash: say(bi("This seat cannot refund or replace.", "இந்த இருக்கை பணம் திருப்பவோ மாற்றவோ முடியாது.")) });
          return;
        }
        const issue = s.complaints.find((c) => c.id === id);
        if (!issue) return;
        const order = s.orders.find((o) => o.id === issue.orderId);
        let wallet = s.walletPaise;
        let orders = s.orders;
        if (status === "refunded" && order && issue.customerKey === "self") {
          wallet += order.totalPaise;
        }
        if (status === "replacement" && order) {
          orders = [
            {
              ...order,
              id: `EGX-${Math.floor(1000 + Math.random() * 9000)}`,
              status: "placed",
              method: "wallet",
              capturedPaise: 0,
              totalPaise: 0,
              discountPaise: 0,
              settled: false,
              cashPending: false,
              createdAt: new Date().toISOString(),
              events: [{ at: new Date().toISOString(), text: bi("Replacement with the same shop. No new charge.", "அதே கடையில் மாற்று. புதிய கட்டணம் இல்லை.") }],
            },
            ...orders,
          ];
        }
        set({
          ...walletPatch(s, wallet, status === "refunded" && order && issue.customerKey === "self" ? { direction: "credit", reason: `Issue refund ${order.id}`, amountPaise: order.totalPaise, reference: order.id } : undefined),
          orders,
          complaints: s.complaints.map((c) => (c.id === id ? { ...c, status } : c)),
          audits: [audit("Command", "issue.resolve", `${id} → ${status}`), ...s.audits],
          flash: say(bi("Issue updated.", "புகார் புதுப்பிக்கப்பட்டது.")),
        });
      },
      sendSupport: (text) => {
        const s = get();
        const at = new Date().toISOString();
        set({
          support: [
            ...s.support,
            { from: "you", text, at },
            {
              from: "desk",
              text: s.lang === "ta"
                ? "பெற்றோம். உடைந்த முட்டையை ஆர்டர் திரையில் தெரிவியுங்கள். தெரு மாற்றம் கட்டளையில் செய்யப்படும்."
                : "Received. Report cracked eggs from the order. Street changes are made in Command, not by moving a paid order.",
              at,
            },
          ],
        });
      },
      requestStreet: (query, localityId) => {
        const s = get();
        set({
          streetRequests: [{ id: nid("req"), query, localityId, at: new Date().toISOString(), status: "open" }, ...s.streetRequests],
          flash: say(bi("Street request is on the command desk.", "தெரு கோரிக்கை கட்டளை மேசையில்.")),
        });
      },
      markNotices: () => set({ notices: get().notices.map((n) => ({ ...n, read: true })) }),
      rateOrder: (orderId, stars) => {
        const s = get();
        const order = s.orders.find((o) => o.id === orderId && o.customerKey === "self" && o.status === "delivered");
        if (!order || order.rating) return;
        set({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, rating: stars } : o)),
          vendors: s.vendors.map((v) => {
            if (v.id !== order.vendorId) return v;
            const reviewCount = v.reviewCount + 1;
            const rating = Math.round(((v.rating * v.reviewCount + stars) / reviewCount) * 10) / 10;
            return { ...v, reviewCount, rating };
          }),
          flash: say(bi("Rating saved on this shop.", "மதிப்பெண் இந்தக் கடையில் சேமிக்கப்பட்டது.")),
        });
      },
      reorder: (orderId) => {
        const s = get();
        const order = s.orders.find((o) => o.id === orderId && o.customerKey === "self");
        if (!order || !s.address) return;
        const decision = rankVendors({
          streetId: s.address.streetId,
          streets: s.streets,
          vendors: s.vendors,
          assignments: s.assignments,
          vendorProducts: s.vendorProducts,
          capacities: s.capacities,
          slots: s.slots,
          clock: readChennai(),
        });
        const vendorId = decision.recommendedId;
        if (!vendorId) {
          set({ flash: say(bi("This street has no shop to reorder from.", "மறுபதிவுக்கு இந்தத் தெருவில் கடை இல்லை.")) });
          return;
        }
        const cart = order.lines
          .filter((line) => {
            const row = s.vendorProducts.find((p) => p.vendorId === vendorId && p.productId === line.productId && p.active);
            return !!row && row.stockEggs >= line.pack * line.qtyPacks;
          })
          .map(({ productId, pack, qtyPacks }) => ({ productId, pack, qtyPacks }));
        set({
          cart,
          cartVendorId: vendorId,
          flash: say(
            cart.length
              ? bi("Last order is in the basket, priced by today’s shop.", "கடந்த ஆர்டர் கூடையில். இன்றைய கடை விலை.")
              : bi("Those eggs are not in stock on your street today.", "அந்த முட்டை இன்று உங்கள் தெருவில் இல்லை."),
          ),
        });
      },
      adminSetStreetStatus: (streetId, status) => {
        const s = get();
        if (!allowed(s, "streets")) {
          set({ flash: say(bi("This seat cannot edit streets.", "இந்த இருக்கை தெருவைத் திருத்த முடியாது.")) });
          return;
        }
        const street = s.streets.find((st) => st.id === streetId);
        set({
          streets: s.streets.map((st) => (st.id === streetId ? { ...st, status } : st)),
          audits: [audit("Command", "street.status", `${street?.name.en ?? streetId} → ${status}. Open orders were not moved.`), ...s.audits],
        });
      },
      adminAddStreet: ({ localityId, en, ta, aliases, pin }) => {
        const s = get();
        if (!allowed(s, "streets")) return;
        const loc = s.localities.find((l) => l.id === localityId);
        if (!loc || !en.trim()) return;
        const id = nid("st");
        set({
          streets: [
            ...s.streets,
            {
              id,
              localityId,
              name: bi(en.trim(), ta.trim() || en.trim()),
              aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
              pin: pin.trim() || loc.pin,
              lat: loc.lat + 0.002,
              lng: loc.lng + 0.002,
              status: "active",
            },
          ],
          audits: [audit("Command", "street.add", en.trim()), ...s.audits],
          flash: say(bi("Street added to the directory.", "தெரு பட்டியலில் சேர்க்கப்பட்டது.")),
        });
      },
      adminSetAssignment: (streetId, vendorId, role) => {
        const s = get();
        if (!allowed(s, "streets")) return;
        const rest =
          role === "primary"
            ? s.assignments.filter((a) => !(a.streetId === streetId && a.role === "primary"))
            : s.assignments.filter((a) => !(a.streetId === streetId && a.vendorId === vendorId));
        const withoutDup = rest.filter((a) => !(a.streetId === streetId && a.vendorId === vendorId));
        set({
          assignments: [...withoutDup, { streetId, vendorId, role, priority: role === "primary" ? 1 : 2 }],
          audits: [audit("Command", "street.assign", `${streetId} ${role} → ${vendorId}. Paid orders stay where they were paid.`), ...s.audits],
        });
      },
      adminClearAssignment: (streetId, vendorId) => {
        const s = get();
        if (!allowed(s, "streets")) return;
        set({
          assignments: s.assignments.filter((a) => !(a.streetId === streetId && a.vendorId === vendorId)),
          audits: [audit("Command", "street.unassign", `${vendorId} off ${streetId}`), ...s.audits],
        });
      },
      adminSetVendorStatus: (vendorId, status) => {
        const s = get();
        if (!allowed(s, "vendors")) {
          set({ flash: say(bi("This seat cannot change shop status.", "இந்த இருக்கை கடை நிலையை மாற்ற முடியாது.")) });
          return;
        }
        set({
          vendors: s.vendors.map((v) =>
            v.id === vendorId ? { ...v, status, acceptingOrders: status === "approved" } : v,
          ),
          audits: [audit("Command", "vendor.status", `${vendorId} → ${status}`), ...s.audits],
        });
      },
      adminSetCommission: (vendorId, bps) => {
        const s = get();
        if (!allowed(s, "settle")) return;
        set({ vendors: s.vendors.map((v) => (v.id === vendorId ? { ...v, commissionBps: bps } : v)) });
      },
      adminReassign: (orderId, vendorId) => {
        const s = get();
        if (!allowed(s, "reassign")) {
          set({ flash: say(bi("This seat cannot move orders.", "இந்த இருக்கை ஆர்டரை நகர்த்த முடியாது.")) });
          return;
        }
        const order = s.orders.find((o) => o.id === orderId);
        if (!order) return;
        const block = reassignBlock(order);
        if (block === "PAID_LOCK") {
          set({
            flash: say(bi("Paid orders are never transferred. Refund, then the customer places again.", "செலுத்திய ஆர்டர் மாற்றப்படாது. பணம் திருப்பி, வாடிக்கையாளர் மீண்டும் வைக்கட்டும்.")),
            audits: [audit("Command", "order.reassign.blocked", `${orderId} blocked: money already captured.`), ...s.audits],
          });
          return;
        }
        if (block) {
          set({ flash: say(bi("This order can no longer be moved.", "இந்த ஆர்டரை இனி நகர்த்த முடியாது.")) });
          return;
        }
        const vendor = s.vendors.find((v) => v.id === vendorId);
        set({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  vendorId,
                  events: [...o.events, { at: new Date().toISOString(), text: bi(`Command moved this unpaid order to ${vendor?.name.en ?? "another shop"}.`, `கட்டளை இந்த செலுத்தாத ஆர்டரை ${vendor?.name.ta ?? "மற்ற கடை"}க்கு மாற்றியது.`) }],
                }
              : o,
          ),
          audits: [audit("Command", "order.reassign", `${orderId} → ${vendorId}. Customer can see the move.`), ...s.audits],
          flash: say(bi("Unpaid order moved. The customer can see who has it.", "செலுத்தாத ஆர்டர் மாற்றப்பட்டது. வாடிக்கையாளர் பார்க்கலாம்.")),
        });
      },
      adminTogglePack: (productId, pack) => {
        const s = get();
        set({
          products: s.products.map((p) => {
            if (p.id !== productId) return p;
            const packs = p.packs.includes(pack) ? p.packs.filter((n) => n !== pack) : [...p.packs, pack].sort((a, b) => a - b);
            return { ...p, packs };
          }),
        });
      },
      adminToggleProduct: (productId) => {
        const s = get();
        set({ products: s.products.map((p) => (p.id === productId ? { ...p, active: !p.active } : p)) });
      },
      adminSetVendorPrice: (vendorId, productId, price) => {
        const s = get();
        set({
          vendorProducts: s.vendorProducts.map((p) =>
            p.vendorId === vendorId && p.productId === productId ? { ...p, pricePerEggPaise: Math.max(100, price) } : p,
          ),
        });
      },
      markSettled: (vendorId) => {
        const s = get();
        if (!allowed(s, "settle")) {
          set({ flash: say(bi("Finance settles shops.", "நிதி பிரிவு கடைகளைத் தீர்க்கும்.")) });
          return;
        }
        const open = s.orders.filter((o) => o.vendorId === vendorId && o.status === "delivered" && !o.settled && !o.cashPending);
        if (open.length === 0) {
          set({ flash: say(bi("Nothing ready to settle.", "தீர்க்க ஏதுமில்லை.")) });
          return;
        }
        const vendor = s.vendors.find((v) => v.id === vendorId);
        const gross = open.reduce((sum, o) => sum + o.totalPaise, 0);
        const commission = Math.round((gross * (vendor?.commissionBps ?? 800)) / 10000);
        set({
          orders: s.orders.map((o) => (open.some((x) => x.id === o.id) ? { ...o, settled: true } : o)),
          settlements: [
            {
              id: nid("set"),
              vendorId,
              label: "Manual batch",
              grossPaise: gross,
              commissionPaise: commission,
              netPaise: gross - commission,
              status: "paid",
              at: new Date().toISOString(),
            },
            ...s.settlements,
          ],
          audits: [audit("Finance", "settlement.paid", `${vendor?.name.en ?? vendorId} net ${gross - commission}`), ...s.audits],
          flash: say(bi("Settlement marked paid.", "தீர்வு செலுத்தப்பட்டதாகக் குறிக்கப்பட்டது.")),
        });
      },
      setActingRole: (actingRole) => set({ actingRole }),
      setRolePerm: (id, key, value) => {
        if (get().actingRole !== "owner") return;
        set({ roles: get().roles.map((r) => (r.id === id ? { ...r, [key]: value } : r)) });
      },
      setConfig: (patch) => set({ config: { ...get().config, ...patch } }),
      setCampaign: (patch) => {
        const s = get();
        set({
          campaign: {
            ...s.campaign,
            active: patch.active ?? s.campaign.active,
            title: { en: patch.titleEn ?? s.campaign.title.en, ta: s.campaign.title.ta },
            body: { en: patch.bodyEn ?? s.campaign.body.en, ta: s.campaign.body.ta },
          },
        });
      },
      broadcast: (en, ta) => {
        const s = get();
        if (!allowed(s, "broadcast")) return;
        set({
          notices: [{ id: nid("nt"), at: new Date().toISOString(), title: bi("From command", "கட்டளையிலிருந்து"), body: bi(en, ta || en), read: false }, ...s.notices],
          audits: [audit("Command", "notice.broadcast", en), ...s.audits],
        });
      },
      closeRequest: (id) => {
        const s = get();
        set({ streetRequests: s.streetRequests.map((r) => (r.id === id ? { ...r, status: "added" } : r)) });
      },
      resetDemo: () => set({ ...createCatalogue(), ...session(), flash: say(bi("Preview data reset.", "முன்னோட்டத் தரவு மீட்டமைக்கப்பட்டது.")) }),
    }),
    {
      name: "spencers-enterprices-customer-v1",
      version: 1,
      partialize: (state) => ({ ...state, flash: null }),
    },
  ),
);

