import { addDays, readChennai } from "./clock";
import { bi, nid } from "./labels";
import type {
  Address,
  Assignment,
  Capacity,
  Complaint,
  Locality,
  Offer,
  Order,
  Product,
  Slot,
  Street,
  Vendor,
  VendorProduct,
} from "./types";

type Catalogue = {
  localities: Locality[];
  streets: Street[];
  vendors: Vendor[];
  assignments: Assignment[];
  products: Product[];
  vendorProducts: VendorProduct[];
  slots: Slot[];
  capacities: Capacity[];
  coupons: import("./types").Coupon[];
  offers: Offer[];
  orders: Order[];
  subscriptions: import("./types").Subscription[];
  complaints: Complaint[];
  audits: import("./types").Audit[];
  settlements: import("./types").Settlement[];
  notices: import("./types").Notice[];
  streetRequests: import("./types").StreetRequest[];
  campaign: import("./types").Campaign;
  roles: import("./types").RolePerm[];
  config: import("./types").PlatformConfig;
};

const L: Locality[] = [
  { id: "adyar", name: bi("Adyar", "அடையாறு"), pin: "600020", lat: 13.0012, lng: 80.2565 },
  { id: "besant", name: bi("Besant Nagar", "பெசன்ட் நகர்"), pin: "600090", lat: 13.0003, lng: 80.2668 },
  { id: "mylapore", name: bi("Mylapore", "மயிலாப்பூர்"), pin: "600004", lat: 13.0368, lng: 80.2676 },
  { id: "tnagar", name: bi("T. Nagar", "தி. நகர்"), pin: "600017", lat: 13.0418, lng: 80.2341 },
  { id: "annanagar", name: bi("Anna Nagar", "அண்ணா நகர்"), pin: "600040", lat: 13.085, lng: 80.2101 },
  { id: "velachery", name: bi("Velachery", "வேளச்சேரி"), pin: "600042", lat: 12.9815, lng: 80.218 },
  { id: "alwarpet", name: bi("Alwarpet", "அல்வார்பேட்டை"), pin: "600018", lat: 13.0336, lng: 80.2498 },
  { id: "tvm", name: bi("Thiruvanmiyur", "திருவான்மியூர்"), pin: "600041", lat: 12.9832, lng: 80.2594 },
  { id: "nungambakkam", name: bi("Nungambakkam", "நுங்கம்பாக்கம்"), pin: "600034", lat: 13.0569, lng: 80.2426 },
  { id: "rapuram", name: bi("R. A. Puram", "ஆர். ஏ. புரம்"), pin: "600028", lat: 13.0272, lng: 80.2562 },
];

function loc(id: string) {
  const row = L.find((l) => l.id === id);
  if (!row) throw new Error(id);
  return row;
}

function street(
  id: string,
  localityId: string,
  en: string,
  ta: string,
  aliases: string[],
  status: Street["status"] = "active",
  jitter = 0,
): Street {
  const base = loc(localityId);
  return {
    id,
    localityId,
    name: bi(en, ta),
    aliases,
    pin: base.pin,
    lat: base.lat + jitter * 0.0035,
    lng: base.lng + ((jitter % 3) - 1) * 0.0032,
    status,
  };
}

const STREETS: Street[] = [
  street("besant-2", "besant", "2nd Avenue", "2ஆவது அவென்யூ", ["second avenue", "2nd av", "2 avenue"], "active", 1),
  street("besant-4", "besant", "4th Cross Street", "4ஆம் கிராஸ் தெரு", ["4th cross", "fourth cross", "naalam cross", "4th street"], "active", 2),
  street("besant-7", "besant", "7th Cross Street", "7ஆம் கிராஸ் தெரு", ["7th cross", "seventh cross"], "active", -1),
  street("besant-3", "besant", "3rd Main Road", "3ஆம் மெயின் ரோடு", ["3rd main", "third main"], "active", 3),
  street("besant-beach", "besant", "Elliot's Beach Road", "எல்லியட்ஸ் பீச் சாலை", ["elliots beach", "beach road", "besant beach"], "active", -2),
  street("adyar-lb", "adyar", "Lattice Bridge Road", "லட்டீஸ் பிரிட்ஜ் ரோடு", ["lb road", "l b road", "lattice bridge"], "active", 1),
  street("adyar-g1", "adyar", "Gandhi Nagar 1st Main Road", "காந்தி நகர் 1ஆம் மெயின்", ["gandhi nagar", "gandhinagar 1st"], "active", 2),
  street("adyar-g4", "adyar", "Gandhi Nagar 4th Main Road", "காந்தி நகர் 4ஆம் மெயின்", ["gandhi nagar 4th", "4th main gandhi"], "active", -1),
  street("adyar-sp", "adyar", "Sardar Patel Road", "சர்தார் படேல் சாலை", ["sardar patel", "sp road"], "active", 3),
  street("adyar-kas", "adyar", "Kasturba Nagar 2nd Street", "கஸ்தூர்பா நகர் 2ஆம் தெரு", ["kasturba nagar", "kasturiba"], "active", -2),
  street("myla-luz", "mylapore", "Luz Church Road", "லூஸ் சர்ச் ரோடு", ["luz", "loose church", "luz church"], "active", 1),
  street("myla-mada", "mylapore", "South Mada Street", "தெற்கு மாட வீதி", ["south mada", "mada street", "therku mada"], "active", 2),
  street("myla-rk", "mylapore", "Ramakrishna Mutt Road", "ராமகிருஷ்ண மடம் சாலை", ["rk mutt", "ramakrishna mutt"], "active", -1),
  street("myla-kut", "mylapore", "Kutcheri Road", "கச்சேரி ரோடு", ["kutcheri", "katcheri road"], "active", 3),
  street("tn-usman", "tnagar", "Usman Road", "உஸ்மான் ரோடு", ["usman", "usman rd"], "active", 1),
  street("tn-gn", "tnagar", "G. N. Chetty Road", "ஜி. என். செட்டி சாலை", ["gn chetty", "g n chetty"], "active", 2),
  street("tn-ven", "tnagar", "Venkatanarayana Road", "வெங்கடநாராயணா சாலை", ["venkatanarayana", "venkatnarayana"], "active", -1),
  street("tn-bur", "tnagar", "Burkit Road", "பர்கிட் ரோடு", ["burkit", "burkitt"], "active", 3),
  street("an-2", "annanagar", "2nd Avenue", "2ஆவது அவென்யூ", ["anna nagar 2nd", "second avenue anna"], "active", 1),
  street("an-sh4", "annanagar", "Shanthi Colony 4th Street", "சாந்தி காலனி 4ஆம் தெரு", ["shanthi colony", "shanti colony"], "active", 2),
  street("an-w3", "annanagar", "W Block 3rd Street", "டபிள்யூ பிளாக் 3ஆம் தெரு", ["w block", "w-block"], "active", -1),
  street("an-6", "annanagar", "6th Main Road", "6ஆம் மெயின் ரோடு", ["6th main anna", "sixth main"], "active", 3),
  street("vel-vij", "velachery", "Vijayanagar 3rd Main Road", "விஜயநகர் 3ஆம் மெயின்", ["vijayanagar", "vijaya nagar 3rd"], "active", 1),
  street("vel-dand", "velachery", "Dhandeeswaram 6th Cross", "தண்டீஸ்வரம் 6ஆம் கிராஸ்", ["dhandeeswaram", "dandeeswaram"], "active", 2),
  street("vel-main", "velachery", "Velachery Main Road", "வேளச்சேரி மெயின் ரோடு", ["velachery main", "100 feet velachery"], "active", -1),
  street("vel-kama", "velachery", "Kamakshi Nagar 8th Street", "காமாட்சி நகர் 8ஆம் தெரு", ["kamakshi nagar", "kamakotinagar"], "active", 4),
  street("alw-cp", "alwarpet", "C. P. Ramaswami Road", "சி. பி. ராமஸ்வாமி சாலை", ["cp ramaswamy", "cpr road", "c p ramaswami"], "active", 1),
  street("alw-ttk", "alwarpet", "TTK Road", "டி. டி. கே. சாலை", ["ttk", "ttk road"], "active", 2),
  street("alw-mary", "alwarpet", "St. Mary's Road", "செயின்ட் மேரிஸ் ரோடு", ["st marys", "st. marys", "saint marys"], "active", -1),
  street("tvm-ecr", "tvm", "East Coast Road", "கிழக்கு கடற்கரை சாலை", ["ecr", "east coast"], "active", 1),
  street("tvm-kala", "tvm", "Kalakshetra Road", "கலாஷேத்ரா சாலை", ["kalakshetra", "kala shetra"], "active", 2),
  street("tvm-val", "tvm", "Valmiki Nagar 2nd Street", "வால்மீகி நகர் 2ஆம் தெரு", ["valmiki", "valmiki nagar"], "active", -1),
  street("tvm-svc", "tvm", "ECR Service Lane", "ஈசிஆர் சர்வீஸ் லேன்", ["service lane", "ecr service"], "suspended", 3),
  street("nun-knk", "nungambakkam", "Khader Nawaz Khan Road", "காதர் நவாஸ் கான் சாலை", ["knk", "khader nawaz", "kader nawaz"], "active", 1),
  street("nun-ster", "nungambakkam", "Sterling Road", "ஸ்டெர்லிங் ரோடு", ["sterling"], "active", 2),
  street("nun-col", "nungambakkam", "College Road", "காலேஜ் ரோடு", ["college road", "college rd"], "active", -1),
  street("ra-3", "rapuram", "3rd Cross Street", "3ஆம் கிராஸ் தெரு", ["ra puram 3rd", "3rd cross ra"], "active", 1),
  street("ra-1", "rapuram", "1st Main Road", "1ஆம் மெயின் ரோடு", ["ra puram 1st", "first main ra"], "active", 2),
  street("ra-cv", "rapuram", "C. V. Raman Road", "சி. வி. ராமன் சாலை", ["cv raman", "c v raman"], "active", -1),
];

export const DEFAULT_PRICE: Record<string, number> = {
  egg: 700,
};

const PRODUCTS: Product[] = [
  {
    id: "egg",
    name: bi("Farm Fresh Egg", "பண்ணை புதிய முட்டை"),
    blurb: bi("One carefully handled, everyday egg. Choose your quantity and we’ll bring it to your door.", "கவனமாக கையாளப்பட்ட தினசரி முட்டை. எண்ணிக்கையைத் தேர்வு செய்யுங்கள்; உங்கள் வாசலுக்கு கொண்டு வருகிறோம்."),
    packs: [1],
    active: true,
  },
];

function vendor(
  id: string,
  en: string,
  ta: string,
  phone: string,
  status: Vendor["status"],
  localityId: string,
  open: string,
  close: string,
  rating: number,
  reviewCount: number,
  bps: number,
  accepting: boolean,
  riderEn: string,
  riderTa: string,
  pin: string,
  jitter: number,
): Vendor {
  const base = loc(localityId);
  return {
    id,
    name: bi(en, ta),
    phone,
    status,
    localityId,
    lat: base.lat + jitter,
    lng: base.lng + jitter / 2,
    hours: { open, close },
    rating,
    reviewCount,
    commissionBps: bps,
    acceptingOrders: accepting,
    rider: bi(riderEn, riderTa),
    pin,
    deliveryRadiusKm: 5,
  };
}

const VENDORS: Vendor[] = [
  vendor("v-murugan", "Murugan Egg Mart", "முருகன் முட்டை மார்ட்", "98410 22001", "approved", "besant", "05:00", "14:00", 4.8, 126, 800, true, "Selvam", "செல்வம்", "1104", 0.004),
  vendor("v-lakshmi", "Lakshmi Naatu Kozhi", "லட்சுமி நாட்டுக்கோழி", "98410 22014", "approved", "mylapore", "05:30", "13:30", 4.9, 88, 800, true, "Kannan", "கண்ணன்", "2218", 0.003),
  vendor("v-anna", "Anna Fresh Trays", "அண்ணா ஃப்ரெஷ் ட்ரே", "98410 22030", "approved", "annanagar", "06:00", "15:00", 4.6, 64, 700, true, "Imran", "இம்ரான்", "3340", 0.002),
  vendor("v-sun", "Velachery Sunrise", "வேளச்சேரி சன்ரைஸ்", "98410 22042", "approved", "velachery", "05:00", "12:30", 4.5, 51, 900, true, "Divya", "திவ்யா", "4412", -0.002),
  vendor("v-pondy", "Pondy Bazaar Bulk", "பாண்டி பஜார் மொத்தம்", "98410 22057", "pending", "tnagar", "06:00", "13:00", 0, 0, 800, false, "Ravi", "ரவி", "5501", 0.001),
  vendor("v-old", "Old Depot Eggs", "பழைய டிப்போ முட்டை", "98410 22060", "suspended", "besant", "05:00", "11:00", 3.4, 12, 800, false, "Kumar", "குமார்", "6602", -0.006),
];

const PRIMARY: Record<string, string[]> = {
  "v-murugan": ["besant-2", "besant-4", "besant-7", "besant-3", "besant-beach", "adyar-lb", "adyar-g1", "adyar-g4", "adyar-sp", "adyar-kas", "tvm-ecr", "tvm-kala", "tvm-val", "tvm-svc"],
  "v-lakshmi": ["myla-luz", "myla-mada", "myla-rk", "myla-kut", "alw-cp", "alw-ttk", "alw-mary", "ra-3", "ra-1", "ra-cv"],
  "v-anna": ["an-2", "an-sh4", "an-w3", "an-6", "nun-knk", "nun-ster", "nun-col"],
  "v-sun": ["vel-vij", "vel-dand", "vel-main", "tn-usman", "tn-gn", "tn-ven", "tn-bur"],
};

const BACKUP: [string, string][] = [
  ["v-lakshmi", "besant-4"],
  ["v-lakshmi", "adyar-lb"],
  ["v-sun", "myla-luz"],
  ["v-anna", "tn-usman"],
  ["v-murugan", "myla-rk"],
  ["v-old", "besant-beach"],
];

function stockRow(
  vendorId: string,
  productId: string,
  price: number,
  stock: number,
  low: number,
  batch?: { en: string; ta: string },
): VendorProduct {
  return {
    vendorId,
    productId,
    pricePerEggPaise: price,
    stockEggs: stock,
    lowStockAt: low,
    active: true,
    batch: batch ? bi(batch.en, batch.ta) : undefined,
  };
}

const VROWS: VendorProduct[] = [
  stockRow("v-murugan", "egg", 700, 420, 40),
  stockRow("v-lakshmi", "egg", 720, 280, 40),
  stockRow("v-anna", "egg", 680, 640, 80),
  stockRow("v-sun", "egg", 740, 180, 40),
  stockRow("v-pondy", "egg", 700, 0, 40),
  stockRow("v-old", "egg", 700, 20, 10),
];

const SLOTS: Slot[] = [
  { id: "dawn", label: bi("Dawn", "அதிகாலை"), start: "05:30", end: "07:30", early: true },
  { id: "morning", label: bi("Morning", "காலை"), start: "07:30", end: "09:30", early: true },
  { id: "late", label: bi("Late morning", "காலை தாமதம்"), start: "09:30", end: "11:30", early: false },
];

function addr(
  localityId: string,
  streetId: string,
  door: string,
  apartment: string,
  landmark: string,
): Address {
  const s = STREETS.find((row) => row.id === streetId);
  return {
    city: "chennai",
    localityId,
    streetId,
    door,
    apartment,
    landmark,
    pin: s?.pin ?? "",
    confirmed: true,
  };
}

function order(partial: Order): Order {
  return partial;
}

export const DEMAND = [
  { orders: 18, revenue: 4200 },
  { orders: 22, revenue: 5100 },
  { orders: 19, revenue: 4600 },
  { orders: 27, revenue: 6400 },
  { orders: 24, revenue: 5900 },
  { orders: 31, revenue: 7200 },
  { orders: 14, revenue: 2800 },
];

export function createCatalogue(): Catalogue {
  const clock = readChennai();
  const today = clock.isoDate;
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  const assignments: Assignment[] = [];
  for (const [vendorId, streets] of Object.entries(PRIMARY)) {
    for (const streetId of streets) assignments.push({ vendorId, streetId, role: "primary", priority: 1 });
  }
  for (const [vendorId, streetId] of BACKUP) {
    assignments.push({ vendorId, streetId, role: "backup", priority: 2 });
  }

  const capacities: Capacity[] = [];
  for (const v of VENDORS) {
    if (v.status !== "approved") continue;
    for (const slot of SLOTS) {
      for (const date of [today, tomorrow]) {
        const full = v.id === "v-murugan" && slot.id === "dawn" && date === today;
        capacities.push({
          vendorId: v.id,
          slotId: slot.id,
          date,
          capacity: v.id === "v-sun" ? 12 : 25,
          booked: full ? 25 : slot.id === "morning" && date === today ? 6 : 2,
        });
      }
    }
  }

  const now = new Date().toISOString();
  const orders: Order[] = [
    order({
      id: "EGX-2218",
      customerKey: "self",
      customerName: "Meenakshi R.",
      phone: "9840011220",
      accountType: "home",
      businessName: "",
      address: addr("besant", "besant-4", "18", "Ground", "Blue gate, near the park"),
      vendorId: "v-murugan",
      lines: [{ productId: "country", pack: 12, qtyPacks: 1, pricePerEggPaise: 1400 }],
      slotId: "dawn",
      date: yesterday,
      method: "upi",
      capturedPaise: 16800,
      totalPaise: 16800,
      discountPaise: 0,
      status: "delivered",
      coupon: null,
      createdAt: now,
      settled: false,
      events: [{ at: now, text: bi("Delivered at the door.", "வாசலில் வழங்கப்பட்டது.") }],
    }),
    order({
      id: "EGX-3104",
      customerKey: "other",
      customerName: "Karthik S.",
      phone: "9840011881",
      accountType: "home",
      businessName: "",
      address: addr("besant", "besant-2", "7", "", "Opposite the bakery"),
      vendorId: "v-murugan",
      lines: [{ productId: "white", pack: 12, qtyPacks: 1, pricePerEggPaise: 700 }],
      slotId: "late",
      date: today,
      method: "cod",
      capturedPaise: 0,
      totalPaise: 8400,
      discountPaise: 0,
      status: "placed",
      coupon: null,
      createdAt: now,
      settled: false,
      events: [{ at: now, text: bi("Order placed. Waiting for the shop.", "ஆர்டர் வந்தது. கடை பதிலுக்காக.") }],
    }),
    order({
      id: "EGX-3108",
      customerKey: "other",
      customerName: "Murugan Tiffin Room",
      phone: "9840011902",
      accountType: "restaurant",
      businessName: "Murugan Tiffin Room",
      address: addr("besant", "besant-beach", "2", "Kitchen", "Service alley"),
      vendorId: "v-murugan",
      lines: [{ productId: "white", pack: 30, qtyPacks: 4, pricePerEggPaise: 700 }],
      slotId: "late",
      date: today,
      method: "cod",
      capturedPaise: 0,
      totalPaise: 79800,
      discountPaise: 4200,
      status: "placed",
      coupon: null,
      createdAt: now,
      settled: false,
      events: [{ at: now, text: bi("Kitchen order placed.", "சமையலறை ஆர்டர் வந்தது.") }],
    }),
    order({
      id: "EGX-3088",
      customerKey: "other",
      customerName: "Anitha P.",
      phone: "9840011334",
      accountType: "home",
      businessName: "",
      address: addr("adyar", "adyar-lb", "44", "Flat 2", "LB Road, yellow compound"),
      vendorId: "v-murugan",
      lines: [{ productId: "country", pack: 6, qtyPacks: 2, pricePerEggPaise: 1400 }],
      slotId: "late",
      date: today,
      method: "upi",
      capturedPaise: 16800,
      totalPaise: 16800,
      discountPaise: 0,
      status: "preparing",
      coupon: null,
      createdAt: now,
      settled: false,
      events: [
        { at: now, text: bi("Paid by UPI. Shop is packing.", "UPI செலுத்தப்பட்டது. கடை பொதியாக்குகிறது.") },
      ],
    }),
    order({
      id: "EGX-3071",
      customerKey: "other",
      customerName: "Rahman K.",
      phone: "9840011445",
      accountType: "home",
      businessName: "",
      address: addr("tvm", "tvm-val", "11", "", "Second right after the temple tank"),
      vendorId: "v-murugan",
      lines: [{ productId: "brown", pack: 12, qtyPacks: 1, pricePerEggPaise: 900 }],
      slotId: "morning",
      date: today,
      method: "cod",
      capturedPaise: 0,
      totalPaise: 10800,
      discountPaise: 0,
      status: "out_for_delivery",
      coupon: null,
      createdAt: now,
      settled: false,
      events: [{ at: now, text: bi("Selvam has the tray.", "செல்வத்திடம் தட்டு உள்ளது.") }],
    }),
    order({
      id: "EGX-3202",
      customerKey: "other",
      customerName: "Palmyra Hotel",
      phone: "9840011550",
      accountType: "hotel",
      businessName: "Palmyra Hotel",
      address: addr("alwarpet", "alw-cp", "90", "Receiving", "Side gate"),
      vendorId: "v-lakshmi",
      lines: [{ productId: "country", pack: 30, qtyPacks: 2, pricePerEggPaise: 1500 }],
      slotId: "late",
      date: today,
      method: "upi",
      capturedPaise: 85500,
      totalPaise: 85500,
      discountPaise: 4500,
      status: "accepted",
      coupon: null,
      createdAt: now,
      settled: false,
      events: [{ at: now, text: bi("Paid. Accepted by Lakshmi.", "செலுத்தப்பட்டது. லட்சுமி ஏற்றார்.") }],
    }),
    order({
      id: "EGX-3301",
      customerKey: "other",
      customerName: "Sunrise Tea Stall",
      phone: "9840011661",
      accountType: "tea",
      businessName: "Sunrise Tea Stall",
      address: addr("velachery", "vel-main", "5", "", "Beside the bus stop"),
      vendorId: "v-sun",
      lines: [{ productId: "white", pack: 30, qtyPacks: 3, pricePerEggPaise: 720 }],
      slotId: "late",
      date: today,
      method: "cod",
      capturedPaise: 0,
      totalPaise: 61560,
      discountPaise: 3240,
      status: "preparing",
      coupon: null,
      createdAt: now,
      settled: false,
      events: [{ at: now, text: bi("Tea-shop tray is being packed.", "டீக்கடை தட்டு பொதியாகிறது.") }],
    }),
    order({
      id: "EGX-3404",
      customerKey: "other",
      customerName: "Anbu Bakery",
      phone: "9840011772",
      accountType: "bakery",
      businessName: "Anbu Bakery",
      address: addr("annanagar", "an-sh4", "21", "Kitchen", "Shanthi colony corner"),
      vendorId: "v-anna",
      lines: [{ productId: "protein", pack: 12, qtyPacks: 4, pricePerEggPaise: 1100 }],
      slotId: "late",
      date: today,
      method: "upi",
      capturedPaise: 50160,
      totalPaise: 50160,
      discountPaise: 2640,
      status: "accepted",
      coupon: null,
      createdAt: now,
      settled: false,
      events: [{ at: now, text: bi("Paid bakery order accepted.", "பேக்கரி ஆர்டர் ஏற்கப்பட்டது.") }],
    }),
  ];

  const complaints: Complaint[] = [
    {
      id: "iss-104",
      orderId: "EGX-2218",
      kind: "broken",
      note: "Two country eggs cracked on yesterday’s dawn drop.",
      status: "open",
      createdAt: now,
      customerKey: "self",
    },
  ];

  return {
    localities: L,
    streets: STREETS,
    vendors: VENDORS,
    assignments,
    products: PRODUCTS,
    vendorProducts: VROWS,
    slots: SLOTS,
    capacities,
    coupons: [],
    offers: [],
    orders: [],
    subscriptions: [],
    complaints: [],
    audits: [
      { id: nid("aud"), at: now, actor: "Command", action: "street.pause", detail: "ECR Service Lane paused after a washout." },
      { id: nid("aud"), at: now, actor: "Command", action: "vendor.pending", detail: "Pondy Bazaar Bulk is waiting for approval." },
    ],
    settlements: [
      { id: "set-88", vendorId: "v-murugan", label: "27 Oct – 2 Nov", grossPaise: 186400, commissionPaise: 14912, netPaise: 171488, status: "paid", at: now },
      { id: "set-74", vendorId: "v-lakshmi", label: "27 Oct – 2 Nov", grossPaise: 142000, commissionPaise: 11360, netPaise: 130640, status: "paid", at: now },
    ],
    notices: [],
    streetRequests: [
      { id: "req-2", query: "Indira Nagar 12th Cross", localityId: "adyar", at: now, status: "open" },
    ],
    campaign: {
      active: false,
      title: bi("Freshness, delivered.", "புத்துணர்ச்சி உங்கள் வாசலில்."),
      body: bi("Simple, fresh eggs delivered within your local service area.", "உங்கள் உள்ளூர் சேவை எல்லைக்குள் புதிய முட்டைகள்."),
    },
    roles: [
      { id: "ops", streets: true, vendors: true, reassign: true, refunds: false, settle: false, broadcast: true },
      { id: "support", streets: false, vendors: false, reassign: false, refunds: true, settle: false, broadcast: false },
      { id: "finance", streets: false, vendors: false, reassign: false, refunds: true, settle: true, broadcast: false },
    ],
    config: { cityActive: true, codEnabled: true, upiEnabled: false, walletEnabled: true, tradeBps: 0, earlyOpen: "05:30" },
  };
}

export type { Catalogue };
