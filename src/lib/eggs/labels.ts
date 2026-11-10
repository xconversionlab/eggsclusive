import type {
  AccountType,
  Bi,
  IssueKind,
  IssueStatus,
  Lang,
  OrderStatus,
  PayMethod,
  StreetStatus,
  VendorStatus,
} from "./types";
import type { RouteException } from "./routing";

export function tx(lang: Lang, text: Bi) {
  return text[lang];
}

export const bi = (en: string, ta: string): Bi => ({ en, ta });

export const STATUS_LABEL: Record<OrderStatus, Bi> = {
  placed: bi("Placed", "பெறப்பட்டது"),
  accepted: bi("Accepted", "ஏற்கப்பட்டது"),
  preparing: bi("Packing", "பொதியாகிறது"),
  out_for_delivery: bi("On the way", "வழியில்"),
  delivered: bi("Delivered", "வழங்கப்பட்டது"),
  rejected: bi("Declined", "நிராகரிப்பு"),
  cancelled: bi("Cancelled", "ரத்து"),
};

export const EXCEPTION_LABEL: Record<RouteException, Bi> = {
  STREET_UNKNOWN: bi(
    "That street is not in the Chennai directory yet.",
    "அந்தத் தெரு இன்னும் சென்னைப் பட்டியலில் இல்லை.",
  ),
  STREET_SUSPENDED: bi(
    "This street is paused. Command can reopen it without an app update.",
    "இந்தத் தெரு தற்காலிகமாக நிறுத்தப்பட்டுள்ளது.",
  ),
  STREET_INACTIVE: bi("This street is not in service.", "இந்தத் தெரு சேவையில் இல்லை."),
  NO_VENDOR: bi(
    "No shop is assigned to this street.",
    "இந்தத் தெருவுக்கு கடை ஒதுக்கப்படவில்லை.",
  ),
  OUTSIDE_HOURS: bi(
    "That slot sits outside the shop’s hours.",
    "அந்த நேரம் கடையின் நேரத்துக்கு வெளியே.",
  ),
  NO_STOCK: bi("The shop does not have this stock.", "கடையில் இந்த இருப்பு இல்லை."),
  CAPACITY_FULL: bi("That delivery slot is full.", "அந்த டெலிவரி நேரம் நிரம்பியது."),
  VENDOR_UNAVAILABLE: bi(
    "The assigned shop is not taking orders.",
    "ஒதுக்கப்பட்ட கடை ஆர்டர் எடுக்கவில்லை.",
  ),
};

export const ACCOUNT_LABEL: Record<AccountType, Bi> = {
  home: bi("Home", "வீடு"),
  restaurant: bi("Restaurant", "உணவகம்"),
  bakery: bi("Bakery", "பேக்கரி"),
  hotel: bi("Hotel", "ஹோட்டல்"),
  tea: bi("Tea shop", "டீ கடை"),
};

export const VENDOR_STATUS: Record<VendorStatus, Bi> = {
  pending: bi("Awaiting approval", "அனுமதி நிலுவை"),
  approved: bi("Approved", "அனுமதி"),
  suspended: bi("Suspended", "இடைநிறுத்தம்"),
};

export const STREET_STATUS: Record<StreetStatus, Bi> = {
  active: bi("In service", "சேவையில்"),
  suspended: bi("Paused", "நிறுத்தம்"),
  inactive: bi("Closed", "மூடல்"),
};

export const PAY_LABEL: Record<PayMethod, Bi> = {
  upi: bi("UPI", "UPI"),
  cod: bi("Cash on delivery", "டெலிவரியில் பணம்"),
  wallet: bi("Wallet", "பணப்பை"),
};

export const ISSUE_KIND: Record<IssueKind, Bi> = {
  broken: bi("Broken eggs", "உடைந்த முட்டை"),
  refund: bi("Refund", "பணம் திரும்ப"),
  replacement: bi("Replacement", "மாற்று"),
  support: bi("Support", "உதவி"),
};

export const ISSUE_STATUS: Record<IssueStatus, Bi> = {
  open: bi("Open", "திறந்து"),
  replacement: bi("Replacement sent", "மாற்று அனுப்பப்பட்டது"),
  refunded: bi("Refunded", "திருப்பப்பட்டது"),
  closed: bi("Closed", "மூடப்பட்டது"),
};

export const ROLE_LABEL: Record<"owner" | "ops" | "support" | "finance", Bi> = {
  owner: bi("Owner", "உரிமையாளர்"),
  ops: bi("Operations", "செயல்பாடு"),
  support: bi("Support", "உதவி"),
  finance: bi("Finance", "நிதி"),
};

export function inr(paise: number, lang: Lang = "en") {
  const rupees = paise / 100;
  return new Intl.NumberFormat(lang === "ta" ? "ta-IN" : "en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function nid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
