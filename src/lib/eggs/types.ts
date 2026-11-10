export type Lang = "en" | "ta";
export type Bi = { en: string; ta: string };

export type AccountType = "home" | "restaurant" | "bakery" | "hotel" | "tea";
export type StreetStatus = "active" | "suspended" | "inactive";
export type VendorStatus = "pending" | "approved" | "suspended";
export type VendorRole = "primary" | "backup";
export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "rejected"
  | "cancelled";
export type PayMethod = "upi" | "cod" | "wallet";
export type Cadence = "daily" | "weekly";
export type IssueKind = "broken" | "refund" | "replacement" | "support";
export type IssueStatus = "open" | "replacement" | "refunded" | "closed";
export type ActingRole = "owner" | "ops" | "support" | "finance";

export type Locality = {
  id: string;
  name: Bi;
  pin: string;
  lat: number;
  lng: number;
};

export type Street = {
  id: string;
  localityId: string;
  name: Bi;
  aliases: string[];
  pin: string;
  lat: number;
  lng: number;
  status: StreetStatus;
};

export type Vendor = {
  id: string;
  name: Bi;
  phone: string;
  status: VendorStatus;
  localityId: string;
  lat: number;
  lng: number;
  hours: { open: string; close: string };
  rating: number;
  reviewCount: number;
  commissionBps: number;
  acceptingOrders: boolean;
  rider: Bi;
  pin: string;
  deliveryRadiusKm: number;
};

export type Assignment = {
  vendorId: string;
  streetId: string;
  role: VendorRole;
  priority: number;
};

export type Product = {
  id: string;
  name: Bi;
  blurb: Bi;
  packs: number[];
  active: boolean;
};

export type VendorProduct = {
  vendorId: string;
  productId: string;
  pricePerEggPaise: number;
  stockEggs: number;
  lowStockAt: number;
  active: boolean;
  batch?: Bi;
};

export type Slot = {
  id: string;
  label: Bi;
  start: string;
  end: string;
  early: boolean;
};

export type Capacity = {
  vendorId: string;
  slotId: string;
  date: string;
  capacity: number;
  booked: number;
};

export type Coupon = {
  code: string;
  kind: "percent" | "flat";
  value: number;
  capPaise?: number;
  rule: "first" | "early" | "tray";
  label: Bi;
  active: boolean;
};

export type Offer = {
  id: string;
  vendorId: string;
  title: Bi;
  detail: Bi;
  active: boolean;
};

export type Address = {
  city: "chennai";
  localityId: string;
  streetId: string;
  door: string;
  apartment: string;
  landmark: string;
  addressLine?: string;
  latitude?: number;
  longitude?: number;
  pin: string;
  confirmed: boolean;
};

export type WalletEntry = {
  id: string;
  phone: string;
  direction: "credit" | "debit";
  reason: string;
  amountPaise: number;
  balanceAfterPaise: number;
  at: string;
  reference?: string;
};

export type Profile = {
  name: string;
  phone: string;
  phoneVerified: boolean;
  accountType: AccountType;
  businessName: string;
};

export type CartLine = {
  productId: string;
  pack: number;
  qtyPacks: number;
};

export type OrderLine = CartLine & { pricePerEggPaise: number };

export type OrderEvent = { at: string; text: Bi };

export type Order = {
  id: string;
  customerKey: "self" | "other";
  customerName: string;
  phone: string;
  accountType: AccountType;
  businessName: string;
  address: Address;
  vendorId: string;
  lines: OrderLine[];
  slotId: string;
  date: string;
  method: PayMethod;
  capturedPaise: number;
  totalPaise: number;
  discountPaise: number;
  status: OrderStatus;
  coupon: string | null;
  createdAt: string;
  subscriptionId?: string;
  rating?: number;
  settled: boolean;
  cashPending?: boolean;
  cancelRequested?: boolean;
  events: OrderEvent[];
};

export type Subscription = {
  id: string;
  productId: string;
  pack: number;
  qtyPacks: number;
  cadence: Cadence;
  slotId: string;
  status: "active" | "paused";
  skipDates: string[];
  vendorId: string;
  address: Address;
  nextDate: string;
  pricePerEggPaise: number;
};

export type Complaint = {
  id: string;
  orderId: string;
  kind: IssueKind;
  note: string;
  status: IssueStatus;
  createdAt: string;
  customerKey: "self" | "other";
};

export type Audit = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

export type Settlement = {
  id: string;
  vendorId: string;
  label: string;
  grossPaise: number;
  commissionPaise: number;
  netPaise: number;
  status: "paid" | "pending";
  at: string;
};

export type Notice = {
  id: string;
  at: string;
  title: Bi;
  body: Bi;
  read: boolean;
};

export type StreetRequest = {
  id: string;
  query: string;
  localityId: string;
  at: string;
  status: "open" | "added";
};

export type Campaign = {
  active: boolean;
  title: Bi;
  body: Bi;
};

export type RolePerm = {
  id: Exclude<ActingRole, "owner">;
  streets: boolean;
  vendors: boolean;
  reassign: boolean;
  refunds: boolean;
  settle: boolean;
  broadcast: boolean;
};

export type PlatformConfig = {
  cityActive: boolean;
  codEnabled: boolean;
  upiEnabled: boolean;
  walletEnabled: boolean;
  tradeBps: number;
  earlyOpen: string;
};

export type SupportNote = {
  from: "you" | "desk";
  text: string;
  at: string;
};

export type Flash = { id: number; text: Bi };
