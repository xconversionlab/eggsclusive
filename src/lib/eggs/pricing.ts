import type { AccountType, CartLine, Coupon, Slot, VendorProduct } from "./types";

export type Quote = {
  subtotal: number;
  trade: number;
  couponOff: number;
  total: number;
  eggs: number;
  missing: boolean;
};

export function eggsIn(lines: { pack: number; qtyPacks: number }[]) {
  return lines.reduce((sum, line) => sum + line.pack * line.qtyPacks, 0);
}

export function quoteCart(input: {
  lines: CartLine[];
  vendorId: string | null;
  vendorProducts: VendorProduct[];
  accountType: AccountType;
  tradeBps: number;
  coupon: Coupon | null;
  slot?: Slot;
  priorOrders: number;
}): Quote {
  let subtotal = 0;
  let missing = !input.vendorId || input.lines.length === 0;
  for (const line of input.lines) {
    const row = input.vendorProducts.find(
      (p) => p.vendorId === input.vendorId && p.productId === line.productId && p.active,
    );
    if (!row) {
      missing = true;
      continue;
    }
    subtotal += row.pricePerEggPaise * line.pack * line.qtyPacks;
  }
  const trade =
    input.accountType === "home" ? 0 : Math.round((subtotal * input.tradeBps) / 10000);
  const afterTrade = Math.max(0, subtotal - trade);
  let couponOff = 0;
  const coupon = input.coupon;
  if (coupon?.active) {
    const ok =
      (coupon.rule === "first" && input.priorOrders === 0) ||
      (coupon.rule === "early" && !!input.slot?.early) ||
      (coupon.rule === "tray" && input.lines.some((l) => l.pack >= 30));
    if (ok) {
      couponOff =
        coupon.kind === "flat"
          ? coupon.value
          : Math.round((afterTrade * coupon.value) / 100);
      if (coupon.capPaise) couponOff = Math.min(couponOff, coupon.capPaise);
      couponOff = Math.min(couponOff, afterTrade);
    }
  }
  return {
    subtotal,
    trade,
    couponOff,
    total: Math.max(0, afterTrade - couponOff),
    eggs: eggsIn(input.lines),
    missing,
  };
}

export const PACKS = [1, 6, 12, 15, 30, 210] as const;

export function packLabel(pack: number, lang: "en" | "ta") {
  if (pack === 210) return lang === "ta" ? "மொத்த தட்டு · 210" : "Bulk tray · 210";
  if (pack === 30) return lang === "ta" ? "தட்டு · 30" : "Tray · 30";
  if (pack === 1) return lang === "ta" ? "1 முட்டை" : "1 egg";
  return lang === "ta" ? `${pack} முட்டை` : `${pack} eggs`;
}
