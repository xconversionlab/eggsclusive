import { minutesOf, type ChennaiClock } from "./clock";
import type {
  Assignment,
  Capacity,
  OrderStatus,
  Slot,
  Street,
  Vendor,
  VendorProduct,
  VendorRole,
} from "./types";

export type RouteException =
  | "STREET_UNKNOWN"
  | "STREET_SUSPENDED"
  | "STREET_INACTIVE"
  | "NO_VENDOR"
  | "OUTSIDE_HOURS"
  | "NO_STOCK"
  | "CAPACITY_FULL"
  | "VENDOR_UNAVAILABLE";

export type RankedVendor = {
  vendorId: string;
  role: VendorRole;
  priority: number;
  eligible: boolean;
  openNow: boolean;
  etaMin: number;
  distanceKm: number;
  stockOk: boolean;
  capacityOk: boolean;
  hoursOk: boolean;
  reason?: RouteException;
};

export type RouteDecision = {
  ok: boolean;
  street?: Street;
  ranked: RankedVendor[];
  exception?: RouteException;
  recommendedId?: string;
};

export type Demand = { productId: string; eggs: number };

function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 =
    Math.cos((aLat * Math.PI) / 180) *
    Math.cos((bLat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s1 + s2)));
}

export function vendorOpen(vendor: Vendor, clock: ChennaiClock) {
  const now = clock.hour * 60 + clock.minute;
  return now >= minutesOf(vendor.hours.open) && now < minutesOf(vendor.hours.close);
}

export function slotFitsVendor(vendor: Vendor, slot: Slot, date: string, clock: ChennaiClock) {
  const start = minutesOf(slot.start);
  const end = minutesOf(slot.end);
  if (start < minutesOf(vendor.hours.open) || end > minutesOf(vendor.hours.close)) return false;
  if (date < clock.isoDate) return false;
  const [y, m, d] = clock.isoDate.split("-").map(Number);
  const tomorrowDate = new Date(Date.UTC(y, m - 1, d + 1));
  const tomorrow = `${tomorrowDate.getUTCFullYear()}-${String(tomorrowDate.getUTCMonth() + 1).padStart(2, "0")}-${String(tomorrowDate.getUTCDate()).padStart(2, "0")}`;
  if (date > tomorrow) return false;
  if (date === clock.isoDate && end <= clock.hour * 60 + clock.minute) return false;
  return true;
}

export function seatsLeft(caps: Capacity[], vendorId: string, slotId: string, date: string) {
  const cap = caps.find((c) => c.vendorId === vendorId && c.slotId === slotId && c.date === date);
  const capacity = cap?.capacity ?? 25;
  const booked = cap?.booked ?? 0;
  return { capacity, booked, left: Math.max(0, capacity - booked) };
}

export function searchStreets(
  streets: Street[],
  localities: { id: string; name: { en: string; ta: string } }[],
  query: string,
  localityId?: string,
) {
  const q = query.trim().toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return streets.filter((street) => {
    if (localityId && street.localityId !== localityId) return false;
    if (tokens.length === 0) return true;
    const loc = localities.find((l) => l.id === street.localityId);
    const hay = [street.name.en, street.name.ta, street.pin, loc?.name.en ?? "", loc?.name.ta ?? "", ...street.aliases]
      .join(" \n ")
      .toLowerCase();
    return tokens.every((token) => hay.includes(token));
  });
}

export function rankVendors(input: {
  streetId: string;
  streets: Street[];
  vendors: Vendor[];
  assignments: Assignment[];
  vendorProducts: VendorProduct[];
  capacities: Capacity[];
  slots: Slot[];
  clock: ChennaiClock;
  demand?: Demand[];
  slotId?: string;
  date?: string;
}): RouteDecision {
  const street = input.streets.find((s) => s.id === input.streetId);
  if (!street) return { ok: false, ranked: [], exception: "STREET_UNKNOWN" };
  if (street.status === "suspended") {
    return { ok: false, street, ranked: [], exception: "STREET_SUSPENDED" };
  }
  if (street.status === "inactive") {
    return { ok: false, street, ranked: [], exception: "STREET_INACTIVE" };
  }

  const links = input.assignments.filter((a) => a.streetId === street.id);
  if (links.length === 0) return { ok: false, street, ranked: [], exception: "NO_VENDOR" };

  const slot = input.slotId ? input.slots.find((s) => s.id === input.slotId) : undefined;

  const ranked: RankedVendor[] = links.map((link) => {
    const vendor = input.vendors.find((v) => v.id === link.vendorId);
    const distanceKm = vendor ? haversine(street.lat, street.lng, vendor.lat, vendor.lng) : 99;
    const etaMin = Math.max(18, Math.round(14 + distanceKm * 8));
    const shell: RankedVendor = {
      vendorId: link.vendorId,
      role: link.role,
      priority: link.priority,
      eligible: false,
      openNow: false,
      etaMin,
      distanceKm: Math.round(distanceKm * 10) / 10,
      stockOk: true,
      capacityOk: true,
      hoursOk: true,
    };
    if (!vendor || vendor.status !== "approved" || !vendor.acceptingOrders) {
      return { ...shell, reason: "VENDOR_UNAVAILABLE" };
    }
    const openNow = vendorOpen(vendor, input.clock);
    let stockOk = true;
    if (input.demand?.length) {
      stockOk = input.demand.every((d) => {
        const row = input.vendorProducts.find(
          (p) => p.vendorId === vendor.id && p.productId === d.productId && p.active,
        );
        return !!row && row.stockEggs >= d.eggs;
      });
    }
    let capacityOk = true;
    if (input.slotId && input.date) {
      capacityOk = seatsLeft(input.capacities, vendor.id, input.slotId, input.date).left > 0;
    }
    let hoursOk = true;
    if (slot && input.date) {
      hoursOk = slotFitsVendor(vendor, slot, input.date, input.clock);
    }
    let reason: RouteException | undefined;
    if (!stockOk) reason = "NO_STOCK";
    else if (!capacityOk) reason = "CAPACITY_FULL";
    else if (!hoursOk) reason = "OUTSIDE_HOURS";
    const eligible = stockOk && capacityOk && hoursOk;
    return { ...shell, openNow, stockOk, capacityOk, hoursOk, eligible, reason };
  });

  ranked.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    if (a.role !== b.role) return a.role === "primary" ? -1 : 1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.etaMin - b.etaMin;
  });

  const recommended = ranked.find((r) => r.eligible);
  if (!recommended) {
    return {
      ok: false,
      street,
      ranked,
      exception: ranked.find((r) => r.reason)?.reason ?? "NO_VENDOR",
    };
  }
  return { ok: true, street, ranked, recommendedId: recommended.vendorId };
}

export function reassignBlock(order: { capturedPaise: number; status: OrderStatus }) {
  if (order.capturedPaise > 0) return "PAID_LOCK" as const;
  if (
    order.status === "delivered" ||
    order.status === "cancelled" ||
    order.status === "rejected" ||
    order.status === "out_for_delivery"
  ) {
    return "STATUS_LOCK" as const;
  }
  return null;
}

