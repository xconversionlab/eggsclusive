import { S as require_jsx_runtime, b as Link, p as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ui-9V5_dOcT.js
var import_jsx_runtime = require_jsx_runtime();
var MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
function readChennai(now = /* @__PURE__ */ new Date()) {
	const fmt = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Asia/Kolkata",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		weekday: "short",
		hourCycle: "h23"
	});
	const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
	const hour = Number(parts.hour);
	const minute = Number(parts.minute);
	const month = Number(parts.month);
	const day = Number(parts.day);
	const isoDate = `${parts.year}-${parts.month}-${parts.day}`;
	const hh = String(hour).padStart(2, "0");
	const mm = String(minute).padStart(2, "0");
	return {
		year: Number(parts.year),
		month,
		day,
		hour,
		minute,
		isoDate,
		weekday: parts.weekday ?? "",
		label: `${parts.weekday} ${day} ${MONTHS[month - 1]} · ${hh}:${mm} IST`
	};
}
function addDays(iso, n) {
	const [y, m, d] = iso.split("-").map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d + n));
	return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}
function minutesOf(hhmm) {
	const [h, m] = hhmm.split(":").map(Number);
	return h * 60 + m;
}
function formatWhen(iso, lang) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return new Intl.DateTimeFormat(lang === "ta" ? "ta-IN" : "en-IN", {
		timeZone: "Asia/Kolkata",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit"
	}).format(date);
}
function formatDay(iso, lang) {
	const [y, m, d] = iso.split("-").map(Number);
	const date = new Date(Date.UTC(y, m - 1, d, 6, 0, 0));
	return new Intl.DateTimeFormat(lang === "ta" ? "ta-IN" : "en-IN", {
		timeZone: "Asia/Kolkata",
		weekday: "short",
		day: "numeric",
		month: "short"
	}).format(date);
}
function tx(lang, text) {
	return text[lang];
}
var bi = (en, ta) => ({
	en,
	ta
});
var STATUS_LABEL = {
	placed: bi("Placed", "பெறப்பட்டது"),
	accepted: bi("Accepted", "ஏற்கப்பட்டது"),
	preparing: bi("Packing", "பொதியாகிறது"),
	out_for_delivery: bi("On the way", "வழியில்"),
	delivered: bi("Delivered", "வழங்கப்பட்டது"),
	rejected: bi("Declined", "நிராகரிப்பு"),
	cancelled: bi("Cancelled", "ரத்து")
};
var EXCEPTION_LABEL = {
	STREET_UNKNOWN: bi("That street is not in the Chennai directory yet.", "அந்தத் தெரு இன்னும் சென்னைப் பட்டியலில் இல்லை."),
	STREET_SUSPENDED: bi("This street is paused. Command can reopen it without an app update.", "இந்தத் தெரு தற்காலிகமாக நிறுத்தப்பட்டுள்ளது."),
	STREET_INACTIVE: bi("This street is not in service.", "இந்தத் தெரு சேவையில் இல்லை."),
	NO_VENDOR: bi("No shop is assigned to this street.", "இந்தத் தெருவுக்கு கடை ஒதுக்கப்படவில்லை."),
	OUTSIDE_HOURS: bi("That slot sits outside the shop’s hours.", "அந்த நேரம் கடையின் நேரத்துக்கு வெளியே."),
	NO_STOCK: bi("The shop does not have this stock.", "கடையில் இந்த இருப்பு இல்லை."),
	CAPACITY_FULL: bi("That delivery slot is full.", "அந்த டெலிவரி நேரம் நிரம்பியது."),
	VENDOR_UNAVAILABLE: bi("The assigned shop is not taking orders.", "ஒதுக்கப்பட்ட கடை ஆர்டர் எடுக்கவில்லை.")
};
var ACCOUNT_LABEL = {
	home: bi("Home", "வீடு"),
	restaurant: bi("Restaurant", "உணவகம்"),
	bakery: bi("Bakery", "பேக்கரி"),
	hotel: bi("Hotel", "ஹோட்டல்"),
	tea: bi("Tea shop", "டீ கடை")
};
var VENDOR_STATUS = {
	pending: bi("Awaiting approval", "அனுமதி நிலுவை"),
	approved: bi("Approved", "அனுமதி"),
	suspended: bi("Suspended", "இடைநிறுத்தம்")
};
var STREET_STATUS = {
	active: bi("In service", "சேவையில்"),
	suspended: bi("Paused", "நிறுத்தம்"),
	inactive: bi("Closed", "மூடல்")
};
var PAY_LABEL = {
	upi: bi("UPI", "UPI"),
	cod: bi("Cash on delivery", "டெலிவரியில் பணம்"),
	wallet: bi("Wallet", "பணப்பை")
};
var ISSUE_KIND = {
	broken: bi("Broken eggs", "உடைந்த முட்டை"),
	refund: bi("Refund", "பணம் திரும்ப"),
	replacement: bi("Replacement", "மாற்று"),
	support: bi("Support", "உதவி")
};
var ISSUE_STATUS = {
	open: bi("Open", "திறந்து"),
	replacement: bi("Replacement sent", "மாற்று அனுப்பப்பட்டது"),
	refunded: bi("Refunded", "திருப்பப்பட்டது"),
	closed: bi("Closed", "மூடப்பட்டது")
};
var ROLE_LABEL = {
	owner: bi("Owner", "உரிமையாளர்"),
	ops: bi("Operations", "செயல்பாடு"),
	support: bi("Support", "உதவி"),
	finance: bi("Finance", "நிதி")
};
function inr(paise, lang = "en") {
	const rupees = paise / 100;
	return new Intl.NumberFormat(lang === "ta" ? "ta-IN" : "en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: rupees % 1 === 0 ? 0 : 2
	}).format(rupees);
}
function nid(prefix) {
	return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
function eggsIn(lines) {
	return lines.reduce((sum, line) => sum + line.pack * line.qtyPacks, 0);
}
function quoteCart(input) {
	let subtotal = 0;
	let missing = !input.vendorId || input.lines.length === 0;
	for (const line of input.lines) {
		const row = input.vendorProducts.find((p) => p.vendorId === input.vendorId && p.productId === line.productId && p.active);
		if (!row) {
			missing = true;
			continue;
		}
		subtotal += row.pricePerEggPaise * line.pack * line.qtyPacks;
	}
	const trade = input.accountType === "home" ? 0 : Math.round(subtotal * input.tradeBps / 1e4);
	const afterTrade = Math.max(0, subtotal - trade);
	let couponOff = 0;
	const coupon = input.coupon;
	if (coupon?.active) {
		if (coupon.rule === "first" && input.priorOrders === 0 || coupon.rule === "early" && !!input.slot?.early || coupon.rule === "tray" && input.lines.some((l) => l.pack >= 30)) {
			couponOff = coupon.kind === "flat" ? coupon.value : Math.round(afterTrade * coupon.value / 100);
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
		missing
	};
}
var PACKS = [
	1,
	6,
	12,
	15,
	30,
	210
];
function packLabel(pack, lang) {
	if (pack === 210) return lang === "ta" ? "மொத்த தட்டு · 210" : "Bulk tray · 210";
	if (pack === 30) return lang === "ta" ? "தட்டு · 30" : "Tray · 30";
	if (pack === 1) return lang === "ta" ? "1 முட்டை" : "1 egg";
	return lang === "ta" ? `${pack} முட்டை` : `${pack} eggs`;
}
function haversine(aLat, aLng, bLat, bLng) {
	const R = 6371;
	const dLat = (bLat - aLat) * Math.PI / 180;
	const dLng = (bLng - aLng) * Math.PI / 180;
	const s1 = Math.sin(dLat / 2) ** 2;
	const s2 = Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(s1 + s2)));
}
function vendorOpen(vendor, clock) {
	const now = clock.hour * 60 + clock.minute;
	return now >= minutesOf(vendor.hours.open) && now < minutesOf(vendor.hours.close);
}
function slotFitsVendor(vendor, slot, date, clock) {
	const start = minutesOf(slot.start);
	const end = minutesOf(slot.end);
	if (start < minutesOf(vendor.hours.open) || end > minutesOf(vendor.hours.close)) return false;
	if (date < clock.isoDate) return false;
	const [y, m, d] = clock.isoDate.split("-").map(Number);
	const tomorrowDate = new Date(Date.UTC(y, m - 1, d + 1));
	if (date > `${tomorrowDate.getUTCFullYear()}-${String(tomorrowDate.getUTCMonth() + 1).padStart(2, "0")}-${String(tomorrowDate.getUTCDate()).padStart(2, "0")}`) return false;
	if (date === clock.isoDate && end <= clock.hour * 60 + clock.minute) return false;
	return true;
}
function seatsLeft(caps, vendorId, slotId, date) {
	const cap = caps.find((c) => c.vendorId === vendorId && c.slotId === slotId && c.date === date);
	const capacity = cap?.capacity ?? 25;
	const booked = cap?.booked ?? 0;
	return {
		capacity,
		booked,
		left: Math.max(0, capacity - booked)
	};
}
function searchStreets(streets, localities, query, localityId) {
	const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
	return streets.filter((street) => {
		if (localityId && street.localityId !== localityId) return false;
		if (tokens.length === 0) return true;
		const loc = localities.find((l) => l.id === street.localityId);
		const hay = [
			street.name.en,
			street.name.ta,
			street.pin,
			loc?.name.en ?? "",
			loc?.name.ta ?? "",
			...street.aliases
		].join(" \n ").toLowerCase();
		return tokens.every((token) => hay.includes(token));
	});
}
function rankVendors(input) {
	const street = input.streets.find((s) => s.id === input.streetId);
	if (!street) return {
		ok: false,
		ranked: [],
		exception: "STREET_UNKNOWN"
	};
	if (street.status === "suspended") return {
		ok: false,
		street,
		ranked: [],
		exception: "STREET_SUSPENDED"
	};
	if (street.status === "inactive") return {
		ok: false,
		street,
		ranked: [],
		exception: "STREET_INACTIVE"
	};
	const links = input.assignments.filter((a) => a.streetId === street.id);
	if (links.length === 0) return {
		ok: false,
		street,
		ranked: [],
		exception: "NO_VENDOR"
	};
	const slot = input.slotId ? input.slots.find((s) => s.id === input.slotId) : void 0;
	const ranked = links.map((link) => {
		const vendor = input.vendors.find((v) => v.id === link.vendorId);
		const distanceKm = vendor ? haversine(street.lat, street.lng, vendor.lat, vendor.lng) : 99;
		const etaMin = Math.max(18, Math.round(14 + distanceKm * 8));
		const shell = {
			vendorId: link.vendorId,
			role: link.role,
			priority: link.priority,
			eligible: false,
			openNow: false,
			etaMin,
			distanceKm: Math.round(distanceKm * 10) / 10,
			stockOk: true,
			capacityOk: true,
			hoursOk: true
		};
		if (!vendor || vendor.status !== "approved" || !vendor.acceptingOrders) return {
			...shell,
			reason: "VENDOR_UNAVAILABLE"
		};
		const openNow = vendorOpen(vendor, input.clock);
		let stockOk = true;
		if (input.demand?.length) stockOk = input.demand.every((d) => {
			const row = input.vendorProducts.find((p) => p.vendorId === vendor.id && p.productId === d.productId && p.active);
			return !!row && row.stockEggs >= d.eggs;
		});
		let capacityOk = true;
		if (input.slotId && input.date) capacityOk = seatsLeft(input.capacities, vendor.id, input.slotId, input.date).left > 0;
		let hoursOk = true;
		if (slot && input.date) hoursOk = slotFitsVendor(vendor, slot, input.date, input.clock);
		let reason;
		if (!stockOk) reason = "NO_STOCK";
		else if (!capacityOk) reason = "CAPACITY_FULL";
		else if (!hoursOk) reason = "OUTSIDE_HOURS";
		const eligible = stockOk && capacityOk && hoursOk;
		return {
			...shell,
			openNow,
			stockOk,
			capacityOk,
			hoursOk,
			eligible,
			reason
		};
	});
	ranked.sort((a, b) => {
		if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
		if (a.role !== b.role) return a.role === "primary" ? -1 : 1;
		if (a.priority !== b.priority) return a.priority - b.priority;
		return a.etaMin - b.etaMin;
	});
	const recommended = ranked.find((r) => r.eligible);
	if (!recommended) return {
		ok: false,
		street,
		ranked,
		exception: ranked.find((r) => r.reason)?.reason ?? "NO_VENDOR"
	};
	return {
		ok: true,
		street,
		ranked,
		recommendedId: recommended.vendorId
	};
}
function reassignBlock(order) {
	if (order.capturedPaise > 0) return "PAID_LOCK";
	if (order.status === "delivered" || order.status === "cancelled" || order.status === "rejected" || order.status === "out_for_delivery") return "STATUS_LOCK";
	return null;
}
var L = [
	{
		id: "adyar",
		name: bi("Adyar", "அடையாறு"),
		pin: "600020",
		lat: 13.0012,
		lng: 80.2565
	},
	{
		id: "besant",
		name: bi("Besant Nagar", "பெசன்ட் நகர்"),
		pin: "600090",
		lat: 13.0003,
		lng: 80.2668
	},
	{
		id: "mylapore",
		name: bi("Mylapore", "மயிலாப்பூர்"),
		pin: "600004",
		lat: 13.0368,
		lng: 80.2676
	},
	{
		id: "tnagar",
		name: bi("T. Nagar", "தி. நகர்"),
		pin: "600017",
		lat: 13.0418,
		lng: 80.2341
	},
	{
		id: "annanagar",
		name: bi("Anna Nagar", "அண்ணா நகர்"),
		pin: "600040",
		lat: 13.085,
		lng: 80.2101
	},
	{
		id: "velachery",
		name: bi("Velachery", "வேளச்சேரி"),
		pin: "600042",
		lat: 12.9815,
		lng: 80.218
	},
	{
		id: "alwarpet",
		name: bi("Alwarpet", "அல்வார்பேட்டை"),
		pin: "600018",
		lat: 13.0336,
		lng: 80.2498
	},
	{
		id: "tvm",
		name: bi("Thiruvanmiyur", "திருவான்மியூர்"),
		pin: "600041",
		lat: 12.9832,
		lng: 80.2594
	},
	{
		id: "nungambakkam",
		name: bi("Nungambakkam", "நுங்கம்பாக்கம்"),
		pin: "600034",
		lat: 13.0569,
		lng: 80.2426
	},
	{
		id: "rapuram",
		name: bi("R. A. Puram", "ஆர். ஏ. புரம்"),
		pin: "600028",
		lat: 13.0272,
		lng: 80.2562
	}
];
function loc(id) {
	const row = L.find((l) => l.id === id);
	if (!row) throw new Error(id);
	return row;
}
function street(id, localityId, en, ta, aliases, status = "active", jitter = 0) {
	const base = loc(localityId);
	return {
		id,
		localityId,
		name: bi(en, ta),
		aliases,
		pin: base.pin,
		lat: base.lat + jitter * .0035,
		lng: base.lng + (jitter % 3 - 1) * .0032,
		status
	};
}
var STREETS = [
	street("besant-2", "besant", "2nd Avenue", "2ஆவது அவென்யூ", [
		"second avenue",
		"2nd av",
		"2 avenue"
	], "active", 1),
	street("besant-4", "besant", "4th Cross Street", "4ஆம் கிராஸ் தெரு", [
		"4th cross",
		"fourth cross",
		"naalam cross",
		"4th street"
	], "active", 2),
	street("besant-7", "besant", "7th Cross Street", "7ஆம் கிராஸ் தெரு", ["7th cross", "seventh cross"], "active", -1),
	street("besant-3", "besant", "3rd Main Road", "3ஆம் மெயின் ரோடு", ["3rd main", "third main"], "active", 3),
	street("besant-beach", "besant", "Elliot's Beach Road", "எல்லியட்ஸ் பீச் சாலை", [
		"elliots beach",
		"beach road",
		"besant beach"
	], "active", -2),
	street("adyar-lb", "adyar", "Lattice Bridge Road", "லட்டீஸ் பிரிட்ஜ் ரோடு", [
		"lb road",
		"l b road",
		"lattice bridge"
	], "active", 1),
	street("adyar-g1", "adyar", "Gandhi Nagar 1st Main Road", "காந்தி நகர் 1ஆம் மெயின்", ["gandhi nagar", "gandhinagar 1st"], "active", 2),
	street("adyar-g4", "adyar", "Gandhi Nagar 4th Main Road", "காந்தி நகர் 4ஆம் மெயின்", ["gandhi nagar 4th", "4th main gandhi"], "active", -1),
	street("adyar-sp", "adyar", "Sardar Patel Road", "சர்தார் படேல் சாலை", ["sardar patel", "sp road"], "active", 3),
	street("adyar-kas", "adyar", "Kasturba Nagar 2nd Street", "கஸ்தூர்பா நகர் 2ஆம் தெரு", ["kasturba nagar", "kasturiba"], "active", -2),
	street("myla-luz", "mylapore", "Luz Church Road", "லூஸ் சர்ச் ரோடு", [
		"luz",
		"loose church",
		"luz church"
	], "active", 1),
	street("myla-mada", "mylapore", "South Mada Street", "தெற்கு மாட வீதி", [
		"south mada",
		"mada street",
		"therku mada"
	], "active", 2),
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
	street("alw-cp", "alwarpet", "C. P. Ramaswami Road", "சி. பி. ராமஸ்வாமி சாலை", [
		"cp ramaswamy",
		"cpr road",
		"c p ramaswami"
	], "active", 1),
	street("alw-ttk", "alwarpet", "TTK Road", "டி. டி. கே. சாலை", ["ttk", "ttk road"], "active", 2),
	street("alw-mary", "alwarpet", "St. Mary's Road", "செயின்ட் மேரிஸ் ரோடு", [
		"st marys",
		"st. marys",
		"saint marys"
	], "active", -1),
	street("tvm-ecr", "tvm", "East Coast Road", "கிழக்கு கடற்கரை சாலை", ["ecr", "east coast"], "active", 1),
	street("tvm-kala", "tvm", "Kalakshetra Road", "கலாஷேத்ரா சாலை", ["kalakshetra", "kala shetra"], "active", 2),
	street("tvm-val", "tvm", "Valmiki Nagar 2nd Street", "வால்மீகி நகர் 2ஆம் தெரு", ["valmiki", "valmiki nagar"], "active", -1),
	street("tvm-svc", "tvm", "ECR Service Lane", "ஈசிஆர் சர்வீஸ் லேன்", ["service lane", "ecr service"], "suspended", 3),
	street("nun-knk", "nungambakkam", "Khader Nawaz Khan Road", "காதர் நவாஸ் கான் சாலை", [
		"knk",
		"khader nawaz",
		"kader nawaz"
	], "active", 1),
	street("nun-ster", "nungambakkam", "Sterling Road", "ஸ்டெர்லிங் ரோடு", ["sterling"], "active", 2),
	street("nun-col", "nungambakkam", "College Road", "காலேஜ் ரோடு", ["college road", "college rd"], "active", -1),
	street("ra-3", "rapuram", "3rd Cross Street", "3ஆம் கிராஸ் தெரு", ["ra puram 3rd", "3rd cross ra"], "active", 1),
	street("ra-1", "rapuram", "1st Main Road", "1ஆம் மெயின் ரோடு", ["ra puram 1st", "first main ra"], "active", 2),
	street("ra-cv", "rapuram", "C. V. Raman Road", "சி. வி. ராமன் சாலை", ["cv raman", "c v raman"], "active", -1)
];
var DEFAULT_PRICE = {
	white: 700,
	brown: 900,
	country: 1400,
	quail: 500,
	duck: 1800,
	freerange: 1600,
	protein: 1200
};
var PRODUCTS = [
	{
		id: "white",
		name: bi("White eggs", "வெள்ளை முட்டை"),
		blurb: bi("The everyday dozen from a partner farm.", "தினசரி வெள்ளை முட்டை. பங்காளிப் பண்ணை."),
		packs: [
			1,
			6,
			12,
			15,
			30,
			210
		],
		active: true
	},
	{
		id: "brown",
		name: bi("Brown eggs", "பழுப்பு முட்டை"),
		blurb: bi("Brown shell, same careful pack.", "பழுப்பு ஓடு. அதே கவனமான பொதி."),
		packs: [
			6,
			12,
			15,
			30
		],
		active: true
	},
	{
		id: "country",
		name: bi("Country eggs", "நாட்டுக்கோழி முட்டை"),
		blurb: bi("Naatu kozhi muttai. Smaller, deeper yolk.", "நாட்டுக்கோழி முட்டை. சிறியது, ஆழமான மஞ்சள்."),
		packs: [
			6,
			12,
			15,
			30
		],
		active: true
	},
	{
		id: "quail",
		name: bi("Quail eggs", "காடை முட்டை"),
		blurb: bi("Speckled, sold by the half-dozen and up.", "புள்ளிகள். அரை டஜன் முதல்."),
		packs: [
			6,
			12,
			30
		],
		active: true
	},
	{
		id: "duck",
		name: bi("Duck eggs", "வாத்து முட்டை"),
		blurb: bi("Larger eggs for baking and hotels.", "பேக்கிங் மற்றும் ஹோட்டலுக்கு பெரிய முட்டை."),
		packs: [
			1,
			6,
			12
		],
		active: true
	},
	{
		id: "freerange",
		name: bi("Free-range eggs", "திறந்தவெளி முட்டை"),
		blurb: bi("From open runs. Batch noted when the shop supplies it.", "திறந்தவெளி. கடை தந்தால் தொகுதி குறிப்பு."),
		packs: [
			6,
			12,
			30
		],
		active: true
	},
	{
		id: "protein",
		name: bi("Protein-rich eggs", "புரத முட்டை"),
		blurb: bi("Marked protein lots for kitchens that ask.", "கேட்கும் சமையலறைகளுக்கு புரத இனம்."),
		packs: [
			6,
			12,
			15,
			30,
			210
		],
		active: true
	}
];
function vendor(id, en, ta, phone, status, localityId, open, close, rating, reviewCount, bps, accepting, riderEn, riderTa, pin, jitter) {
	const base = loc(localityId);
	return {
		id,
		name: bi(en, ta),
		phone,
		status,
		localityId,
		lat: base.lat + jitter,
		lng: base.lng + jitter / 2,
		hours: {
			open,
			close
		},
		rating,
		reviewCount,
		commissionBps: bps,
		acceptingOrders: accepting,
		rider: bi(riderEn, riderTa),
		pin
	};
}
var VENDORS = [
	vendor("v-murugan", "Murugan Egg Mart", "முருகன் முட்டை மார்ட்", "98410 22001", "approved", "besant", "05:00", "14:00", 4.8, 126, 800, true, "Selvam", "செல்வம்", "1104", .004),
	vendor("v-lakshmi", "Lakshmi Naatu Kozhi", "லட்சுமி நாட்டுக்கோழி", "98410 22014", "approved", "mylapore", "05:30", "13:30", 4.9, 88, 800, true, "Kannan", "கண்ணன்", "2218", .003),
	vendor("v-anna", "Anna Fresh Trays", "அண்ணா ஃப்ரெஷ் ட்ரே", "98410 22030", "approved", "annanagar", "06:00", "15:00", 4.6, 64, 700, true, "Imran", "இம்ரான்", "3340", .002),
	vendor("v-sun", "Velachery Sunrise", "வேளச்சேரி சன்ரைஸ்", "98410 22042", "approved", "velachery", "05:00", "12:30", 4.5, 51, 900, true, "Divya", "திவ்யா", "4412", -.002),
	vendor("v-pondy", "Pondy Bazaar Bulk", "பாண்டி பஜார் மொத்தம்", "98410 22057", "pending", "tnagar", "06:00", "13:00", 0, 0, 800, false, "Ravi", "ரவி", "5501", .001),
	vendor("v-old", "Old Depot Eggs", "பழைய டிப்போ முட்டை", "98410 22060", "suspended", "besant", "05:00", "11:00", 3.4, 12, 800, false, "Kumar", "குமார்", "6602", -.006)
];
var PRIMARY = {
	"v-murugan": [
		"besant-2",
		"besant-4",
		"besant-7",
		"besant-3",
		"besant-beach",
		"adyar-lb",
		"adyar-g1",
		"adyar-g4",
		"adyar-sp",
		"adyar-kas",
		"tvm-ecr",
		"tvm-kala",
		"tvm-val",
		"tvm-svc"
	],
	"v-lakshmi": [
		"myla-luz",
		"myla-mada",
		"myla-rk",
		"myla-kut",
		"alw-cp",
		"alw-ttk",
		"alw-mary",
		"ra-3",
		"ra-1",
		"ra-cv"
	],
	"v-anna": [
		"an-2",
		"an-sh4",
		"an-w3",
		"an-6",
		"nun-knk",
		"nun-ster",
		"nun-col"
	],
	"v-sun": [
		"vel-vij",
		"vel-dand",
		"vel-main",
		"tn-usman",
		"tn-gn",
		"tn-ven",
		"tn-bur"
	]
};
var BACKUP = [
	["v-lakshmi", "besant-4"],
	["v-lakshmi", "adyar-lb"],
	["v-sun", "myla-luz"],
	["v-anna", "tn-usman"],
	["v-murugan", "myla-rk"],
	["v-old", "besant-beach"]
];
function stockRow(vendorId, productId, price, stock, low, batch) {
	return {
		vendorId,
		productId,
		pricePerEggPaise: price,
		stockEggs: stock,
		lowStockAt: low,
		active: true,
		batch: batch ? bi(batch.en, batch.ta) : void 0
	};
}
var VROWS = [
	stockRow("v-murugan", "white", 700, 420, 40, {
		en: "Laid yesterday · Sriperumbudur partner farm",
		ta: "நேற்று இட்டது · ஸ்ரீபெரும்புதூர் பண்ணை"
	}),
	stockRow("v-murugan", "brown", 900, 160, 30),
	stockRow("v-murugan", "country", 1400, 90, 24, {
		en: "This morning · Chengalpattu collective",
		ta: "இன்று காலை · செங்கல்பட்டு குழு"
	}),
	stockRow("v-murugan", "quail", 500, 70, 20),
	stockRow("v-murugan", "duck", 1800, 24, 12),
	stockRow("v-murugan", "freerange", 1600, 48, 18),
	stockRow("v-murugan", "protein", 1200, 110, 24),
	stockRow("v-lakshmi", "country", 1500, 280, 40, {
		en: "This morning · backyard collective",
		ta: "இன்று காலை · வீட்டுப் பண்ணை"
	}),
	stockRow("v-lakshmi", "white", 750, 40, 20),
	stockRow("v-lakshmi", "brown", 950, 36, 16),
	stockRow("v-lakshmi", "freerange", 1700, 60, 20),
	stockRow("v-anna", "white", 650, 640, 80),
	stockRow("v-anna", "brown", 850, 200, 40),
	stockRow("v-anna", "protein", 1100, 260, 40),
	stockRow("v-anna", "country", 1350, 70, 20),
	stockRow("v-sun", "white", 720, 180, 40),
	stockRow("v-sun", "brown", 920, 8, 20),
	stockRow("v-sun", "duck", 1700, 40, 10),
	stockRow("v-sun", "quail", 480, 90, 24),
	stockRow("v-sun", "country", 1450, 30, 12),
	stockRow("v-pondy", "white", 680, 0, 40),
	stockRow("v-pondy", "protein", 1150, 0, 20),
	stockRow("v-old", "white", 700, 20, 10)
];
var SLOTS = [
	{
		id: "dawn",
		label: bi("Dawn", "அதிகாலை"),
		start: "05:30",
		end: "07:30",
		early: true
	},
	{
		id: "morning",
		label: bi("Morning", "காலை"),
		start: "07:30",
		end: "09:30",
		early: true
	},
	{
		id: "late",
		label: bi("Late morning", "காலை தாமதம்"),
		start: "09:30",
		end: "11:30",
		early: false
	}
];
function addr(localityId, streetId, door, apartment, landmark) {
	return {
		city: "chennai",
		localityId,
		streetId,
		door,
		apartment,
		landmark,
		pin: STREETS.find((row) => row.id === streetId)?.pin ?? "",
		confirmed: true
	};
}
function order(partial) {
	return partial;
}
var DEMAND = [
	{
		orders: 18,
		revenue: 4200
	},
	{
		orders: 22,
		revenue: 5100
	},
	{
		orders: 19,
		revenue: 4600
	},
	{
		orders: 27,
		revenue: 6400
	},
	{
		orders: 24,
		revenue: 5900
	},
	{
		orders: 31,
		revenue: 7200
	},
	{
		orders: 14,
		revenue: 2800
	}
];
function createCatalogue() {
	const today = readChennai().isoDate;
	const tomorrow = addDays(today, 1);
	const yesterday = addDays(today, -1);
	const assignments = [];
	for (const [vendorId, streets] of Object.entries(PRIMARY)) for (const streetId of streets) assignments.push({
		vendorId,
		streetId,
		role: "primary",
		priority: 1
	});
	for (const [vendorId, streetId] of BACKUP) assignments.push({
		vendorId,
		streetId,
		role: "backup",
		priority: 2
	});
	const capacities = [];
	for (const v of VENDORS) {
		if (v.status !== "approved") continue;
		for (const slot of SLOTS) for (const date of [today, tomorrow]) {
			const full = v.id === "v-murugan" && slot.id === "dawn" && date === today;
			capacities.push({
				vendorId: v.id,
				slotId: slot.id,
				date,
				capacity: v.id === "v-sun" ? 12 : 25,
				booked: full ? 25 : slot.id === "morning" && date === today ? 6 : 2
			});
		}
	}
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const orders = [
		order({
			id: "EGX-2218",
			customerKey: "self",
			customerName: "Meenakshi R.",
			phone: "9840011220",
			accountType: "home",
			businessName: "",
			address: addr("besant", "besant-4", "18", "Ground", "Blue gate, near the park"),
			vendorId: "v-murugan",
			lines: [{
				productId: "country",
				pack: 12,
				qtyPacks: 1,
				pricePerEggPaise: 1400
			}],
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
			events: [{
				at: now,
				text: bi("Delivered at the door.", "வாசலில் வழங்கப்பட்டது.")
			}]
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
			lines: [{
				productId: "white",
				pack: 12,
				qtyPacks: 1,
				pricePerEggPaise: 700
			}],
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
			events: [{
				at: now,
				text: bi("Order placed. Waiting for the shop.", "ஆர்டர் வந்தது. கடை பதிலுக்காக.")
			}]
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
			lines: [{
				productId: "white",
				pack: 30,
				qtyPacks: 4,
				pricePerEggPaise: 700
			}],
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
			events: [{
				at: now,
				text: bi("Kitchen order placed.", "சமையலறை ஆர்டர் வந்தது.")
			}]
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
			lines: [{
				productId: "country",
				pack: 6,
				qtyPacks: 2,
				pricePerEggPaise: 1400
			}],
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
			events: [{
				at: now,
				text: bi("Paid by UPI. Shop is packing.", "UPI செலுத்தப்பட்டது. கடை பொதியாக்குகிறது.")
			}]
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
			lines: [{
				productId: "brown",
				pack: 12,
				qtyPacks: 1,
				pricePerEggPaise: 900
			}],
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
			events: [{
				at: now,
				text: bi("Selvam has the tray.", "செல்வத்திடம் தட்டு உள்ளது.")
			}]
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
			lines: [{
				productId: "country",
				pack: 30,
				qtyPacks: 2,
				pricePerEggPaise: 1500
			}],
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
			events: [{
				at: now,
				text: bi("Paid. Accepted by Lakshmi.", "செலுத்தப்பட்டது. லட்சுமி ஏற்றார்.")
			}]
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
			lines: [{
				productId: "white",
				pack: 30,
				qtyPacks: 3,
				pricePerEggPaise: 720
			}],
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
			events: [{
				at: now,
				text: bi("Tea-shop tray is being packed.", "டீக்கடை தட்டு பொதியாகிறது.")
			}]
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
			lines: [{
				productId: "protein",
				pack: 12,
				qtyPacks: 4,
				pricePerEggPaise: 1100
			}],
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
			events: [{
				at: now,
				text: bi("Paid bakery order accepted.", "பேக்கரி ஆர்டர் ஏற்கப்பட்டது.")
			}]
		})
	];
	const complaints = [{
		id: "iss-104",
		orderId: "EGX-2218",
		kind: "broken",
		note: "Two country eggs cracked on yesterday’s dawn drop.",
		status: "open",
		createdAt: now,
		customerKey: "self"
	}];
	return {
		localities: L,
		streets: STREETS,
		vendors: VENDORS,
		assignments,
		products: PRODUCTS,
		vendorProducts: VROWS,
		slots: SLOTS,
		capacities,
		coupons: [
			{
				code: "FIRSTEGG",
				kind: "percent",
				value: 20,
				capPaise: 4e3,
				rule: "first",
				label: bi("First order · 20% off, up to ₹40", "முதல் ஆர்டர் · 20% தள்ளுபடி, ₹40 வரை"),
				active: true
			},
			{
				code: "DAWN15",
				kind: "flat",
				value: 1500,
				rule: "early",
				label: bi("₹15 off dawn and morning slots", "அதிகாலை மற்றும் காலைக்கு ₹15"),
				active: true
			},
			{
				code: "TRAY30",
				kind: "flat",
				value: 3e3,
				rule: "tray",
				label: bi("₹30 off a tray of 30 or more", "30 அல்லது அதற்கு மேல் தட்டுக்கு ₹30"),
				active: true
			}
		],
		offers: [{
			id: "off-1",
			vendorId: "v-murugan",
			title: bi("Dawn country tray", "அதிகாலை நாட்டுத் தட்டு"),
			detail: bi("Ask for the morning batch before 7.", "7 மணிக்குள் காலைத் தொகுதியைக் கேளுங்கள்."),
			active: true
		}, {
			id: "off-2",
			vendorId: "v-lakshmi",
			title: bi("Hotel tray standing order", "ஹோட்டல் நிலை ஆர்டர்"),
			detail: bi("Country eggs, same door, every dawn.", "நாட்டு முட்டை, அதே வாசல், ஒவ்வொரு அதிகாலையும்."),
			active: true
		}],
		orders,
		subscriptions: [{
			id: "sub-14",
			productId: "country",
			pack: 12,
			qtyPacks: 1,
			cadence: "daily",
			slotId: "dawn",
			status: "active",
			skipDates: [],
			vendorId: "v-murugan",
			address: addr("besant", "besant-4", "18", "Ground", "Blue gate, near the park"),
			nextDate: tomorrow,
			pricePerEggPaise: 1400
		}],
		complaints,
		audits: [{
			id: nid("aud"),
			at: now,
			actor: "Command",
			action: "street.pause",
			detail: "ECR Service Lane paused after a washout."
		}, {
			id: nid("aud"),
			at: now,
			actor: "Command",
			action: "vendor.pending",
			detail: "Pondy Bazaar Bulk is waiting for approval."
		}],
		settlements: [{
			id: "set-88",
			vendorId: "v-murugan",
			label: "27 Oct – 2 Nov",
			grossPaise: 186400,
			commissionPaise: 14912,
			netPaise: 171488,
			status: "paid",
			at: now
		}, {
			id: "set-74",
			vendorId: "v-lakshmi",
			label: "27 Oct – 2 Nov",
			grossPaise: 142e3,
			commissionPaise: 11360,
			netPaise: 130640,
			status: "paid",
			at: now
		}],
		notices: [{
			id: "nt-1",
			at: now,
			title: bi("Dawn is full on 7th Cross", "7ஆம் கிராஸில் அதிகாலை நிரம்பியது"),
			body: bi("Murugan’s dawn slot is at capacity today. Late morning is still open.", "முருகனின் அதிகாலை நேரம் இன்று நிரம்பியது. காலை தாமதம் திறந்துள்ளது."),
			read: false
		}, {
			id: "nt-2",
			at: now,
			title: bi("Yesterday’s country dozen", "நேற்றைய நாட்டு டஜன்"),
			body: bi("Delivered to 18, 4th Cross. You can report a crack from the order.", "4ஆம் கிராஸ், 18-க்கு வழங்கப்பட்டது. உடைந்ததை ஆர்டரில் தெரிவிக்கலாம்."),
			read: false
		}],
		streetRequests: [{
			id: "req-2",
			query: "Indira Nagar 12th Cross",
			localityId: "adyar",
			at: now,
			status: "open"
		}],
		campaign: {
			active: true,
			title: bi("Laid this morning", "இன்று காலை இட்டது"),
			body: bi("Country eggs on Besant, Mylapore and Adyar streets. Batch is on the product.", "பெசன்ட், மயிலாப்பூர், அடையாறு தெருக்களில் நாட்டு முட்டை. தொகுதி பொருளில் உள்ளது.")
		},
		roles: [
			{
				id: "ops",
				streets: true,
				vendors: true,
				reassign: true,
				refunds: false,
				settle: false,
				broadcast: true
			},
			{
				id: "support",
				streets: false,
				vendors: false,
				reassign: false,
				refunds: true,
				settle: false,
				broadcast: false
			},
			{
				id: "finance",
				streets: false,
				vendors: false,
				reassign: false,
				refunds: true,
				settle: true,
				broadcast: false
			}
		],
		config: {
			cityActive: true,
			codEnabled: true,
			upiEnabled: true,
			walletEnabled: true,
			tradeBps: 500,
			earlyOpen: "05:30"
		}
	};
}
function session() {
	return {
		lang: "en",
		profile: {
			name: "Meenakshi R.",
			phone: "",
			phoneVerified: false,
			accountType: "home",
			businessName: ""
		},
		address: null,
		editingStreet: false,
		cart: [],
		cartVendorId: null,
		couponCode: null,
		walletPaise: 12e3,
		favourites: ["country"],
		activeVendorId: "v-murugan",
		actingRole: "owner",
		support: [{
			from: "desk",
			text: "Eggsclusive desk · Chennai. Write in English or Tamil. Broken eggs are handled from the order, not here.",
			at: (/* @__PURE__ */ new Date()).toISOString()
		}],
		flash: null
	};
}
function say(text) {
	return {
		id: Date.now() + Math.floor(Math.random() * 1e3),
		text
	};
}
function audit(actor, action, detail) {
	return {
		id: nid("aud"),
		at: (/* @__PURE__ */ new Date()).toISOString(),
		actor,
		action,
		detail
	};
}
function allowed(state, key) {
	if (state.actingRole === "owner") return true;
	return !!state.roles.find((r) => r.id === state.actingRole)?.[key];
}
function restoreStock(state, order) {
	return state.vendorProducts.map((row) => {
		if (row.vendorId !== order.vendorId) return row;
		const eggs = order.lines.filter((l) => l.productId === row.productId).reduce((sum, l) => sum + l.pack * l.qtyPacks, 0);
		return eggs ? {
			...row,
			stockEggs: row.stockEggs + eggs
		} : row;
	});
}
function releaseSeat(caps, order) {
	return caps.map((cap) => cap.vendorId === order.vendorId && cap.slotId === order.slotId && cap.date === order.date ? {
		...cap,
		booked: Math.max(0, cap.booked - 1)
	} : cap);
}
function takeSeat(caps, vendorId, slotId, date) {
	const idx = caps.findIndex((c) => c.vendorId === vendorId && c.slotId === slotId && c.date === date);
	if (idx < 0) return [...caps, {
		vendorId,
		slotId,
		date,
		capacity: 25,
		booked: 1
	}];
	return caps.map((cap, i) => i === idx ? {
		...cap,
		booked: cap.booked + 1
	} : cap);
}
var useEggs = create()(persist((set, get) => ({
	...createCatalogue(),
	...session(),
	setLang: (lang) => set({ lang }),
	clearFlash: () => set({ flash: null }),
	verifyPhone: (phone, name) => set({
		profile: {
			...get().profile,
			phone,
			name: name.trim() || get().profile.name,
			phoneVerified: true
		},
		flash: say(bi("Number confirmed.", "எண் உறுதி."))
	}),
	setAccount: (accountType, businessName, name) => set({ profile: {
		...get().profile,
		accountType,
		businessName,
		name: name.trim() || get().profile.name
	} }),
	confirmAddress: (address) => {
		const decision = rankVendors({
			streetId: address.streetId,
			streets: get().streets,
			vendors: get().vendors,
			assignments: get().assignments,
			vendorProducts: get().vendorProducts,
			capacities: get().capacities,
			slots: get().slots,
			clock: readChennai()
		});
		set({
			address,
			editingStreet: false,
			cart: [],
			cartVendorId: decision.recommendedId ?? null,
			flash: decision.ok ? say(bi("Street saved. Prices are from the shop on this street.", "தெரு சேமிக்கப்பட்டது. விலை இந்தத் தெருக் கடையிலிருந்து.")) : say(bi("Street saved. It is not in service yet.", "தெரு சேமிக்கப்பட்டது. இன்னும் சேவையில் இல்லை."))
		});
	},
	setEditingStreet: (editingStreet) => set({ editingStreet }),
	setActiveVendor: (activeVendorId) => set({ activeVendorId }),
	setCartVendor: (id) => set({
		cartVendorId: id,
		cart: [],
		couponCode: null,
		flash: say(bi("Cart moved to the other shop on your street.", "கூடை இந்தத் தெருவின் மற்ற கடைக்கு மாற்றப்பட்டது."))
	}),
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
			clock: readChennai()
		});
		const vendorId = s.cartVendorId && decision.ranked.some((r) => r.vendorId === s.cartVendorId && r.eligible) ? s.cartVendorId : decision.recommendedId;
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
		if (idx >= 0) cart[idx] = {
			...cart[idx],
			qtyPacks: nextQty
		};
		else cart.push({
			productId,
			pack,
			qtyPacks: 1
		});
		set({
			cart,
			cartVendorId: vendorId,
			flash: say(bi("Added to the basket.", "கூடையில் சேர்க்கப்பட்டது."))
		});
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
		set({ cart: s.cart.map((l) => l.productId === productId && l.pack === pack ? {
			...l,
			qtyPacks
		} : l) });
	},
	clearCart: () => set({
		cart: [],
		couponCode: null
	}),
	setCoupon: (code) => {
		const found = get().coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase() && c.active);
		if (!found) {
			set({
				couponCode: null,
				flash: say(bi("That code is not active.", "அந்தக் குறியீடு செயலில் இல்லை."))
			});
			return;
		}
		set({
			couponCode: found.code,
			flash: say(bi("Code applied if the basket qualifies.", "கூடை பொருந்தினால் குறியீடு பொருந்தும்."))
		});
	},
	placeOrder: ({ slotId, date, method, useWallet }) => {
		const s = get();
		if (!s.address || !s.cartVendorId || s.cart.length === 0) return null;
		const demand = s.cart.map((l) => ({
			productId: l.productId,
			eggs: l.pack * l.qtyPacks
		}));
		if (!rankVendors({
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
			date
		}).ranked.find((r) => r.vendorId === s.cartVendorId)?.eligible) {
			set({ flash: say(bi("This shop cannot take the slot. Nothing was moved to another shop.", "இந்தக் கடை இந்த நேரத்தை எடுக்க முடியாது. வேறு கடைக்கு மாற்றப்படவில்லை.")) });
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
			priorOrders: prior
		});
		if (quote.missing || quote.total < 0) return null;
		let walletOff = 0;
		if (useWallet && s.config.walletEnabled) walletOff = Math.min(s.walletPaise, quote.total);
		const due = quote.total - walletOff;
		if (method === "upi" && !s.config.upiEnabled) return null;
		if (method === "cod" && due > 0 && !s.config.codEnabled) return null;
		const captured = method === "upi" ? quote.total : walletOff;
		const payMethod = due === 0 ? "wallet" : method;
		const lines = s.cart.map((line) => {
			const row = s.vendorProducts.find((p) => p.vendorId === s.cartVendorId && p.productId === line.productId);
			return {
				...line,
				pricePerEggPaise: row?.pricePerEggPaise ?? 0
			};
		});
		const id = `EGX-${Math.floor(1e3 + Math.random() * 9e3)}`;
		const vendor = s.vendors.find((v) => v.id === s.cartVendorId);
		set({
			orders: [{
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
				createdAt: (/* @__PURE__ */ new Date()).toISOString(),
				settled: false,
				events: [{
					at: (/* @__PURE__ */ new Date()).toISOString(),
					text: bi(`Placed with ${vendor?.name.en ?? "the shop"}. Paid orders stay with this shop.`, `${vendor?.name.ta ?? "கடை"} உடன் வைக்கப்பட்டது. செலுத்திய ஆர்டர் இந்தக் கடையிலேயே இருக்கும்.`)
				}]
			}, ...s.orders],
			vendorProducts: s.vendorProducts.map((row) => {
				if (row.vendorId !== s.cartVendorId) return row;
				const eggs = demand.find((d) => d.productId === row.productId)?.eggs ?? 0;
				return eggs ? {
					...row,
					stockEggs: row.stockEggs - eggs
				} : row;
			}),
			capacities: takeSeat(s.capacities, s.cartVendorId, slotId, date),
			walletPaise: s.walletPaise - walletOff,
			cart: [],
			couponCode: null,
			notices: [{
				id: nid("nt"),
				at: (/* @__PURE__ */ new Date()).toISOString(),
				title: bi(`Order ${id}`, `ஆர்டர் ${id}`),
				body: bi("The shop has to accept it. We will not pass it on quietly.", "கடை ஏற்க வேண்டும். அமைதியாக வேறு கடைக்கு போகாது."),
				read: false
			}, ...s.notices],
			flash: say(bi(`Order ${id} is with the shop.`, `ஆர்டர் ${id} கடையிடம் உள்ளது.`))
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
				orders: s.orders.map((o) => o.id === orderId ? {
					...o,
					status: "cancelled",
					events: [...o.events, {
						at: (/* @__PURE__ */ new Date()).toISOString(),
						text: bi("You cancelled before the shop accepted.", "கடை ஏற்கும் முன் நீங்கள் ரத்து செய்தீர்கள்.")
					}]
				} : o),
				vendorProducts: restoreStock(s, order),
				capacities: releaseSeat(s.capacities, order),
				walletPaise: s.walletPaise + refund,
				flash: say(refund ? bi("Cancelled. Captured money is back in the wallet.", "ரத்து. பிடித்த பணம் பணப்பையில்.") : bi("Cancelled.", "ரத்து செய்யப்பட்டது."))
			});
			return;
		}
		if (order.status === "accepted" || order.status === "preparing") set({
			orders: s.orders.map((o) => o.id === orderId ? {
				...o,
				cancelRequested: true
			} : o),
			flash: say(bi("Cancellation asked. The shop still has to confirm.", "ரத்து கோரப்பட்டது. கடை உறுதி செய்ய வேண்டும்."))
		});
	},
	confirmCancel: (orderId) => {
		const s = get();
		const order = s.orders.find((o) => o.id === orderId && o.vendorId === s.activeVendorId);
		if (!order || !order.cancelRequested) return;
		const refund = order.customerKey === "self" ? order.capturedPaise : 0;
		set({
			orders: s.orders.map((o) => o.id === orderId ? {
				...o,
				status: "cancelled",
				cancelRequested: false,
				events: [...o.events, {
					at: (/* @__PURE__ */ new Date()).toISOString(),
					text: bi("Shop confirmed the cancellation.", "கடை ரத்தை உறுதி செய்தது.")
				}]
			} : o),
			vendorProducts: restoreStock(s, order),
			capacities: releaseSeat(s.capacities, order),
			walletPaise: s.walletPaise + refund,
			audits: [audit("Vendor", "order.cancel", `${orderId} cancelled by the shop.`), ...s.audits]
		});
	},
	vendorAdvance: (orderId, status, cashCollected) => {
		const s = get();
		const order = s.orders.find((o) => o.id === orderId && o.vendorId === s.activeVendorId);
		if (!order) return;
		const flow = [
			"placed",
			"accepted",
			"preparing",
			"out_for_delivery",
			"delivered"
		];
		if (flow.indexOf(status) !== flow.indexOf(order.status) + 1) return;
		const vendor = s.vendors.find((v) => v.id === s.activeVendorId);
		const labels = {
			accepted: bi("Shop accepted.", "கடை ஏற்றது."),
			preparing: bi("Eggs are being packed.", "முட்டை பொதியாகிறது."),
			out_for_delivery: bi(`${vendor?.rider.en ?? "Rider"} is out with the order.`, `${vendor?.rider.ta ?? "டெலிவரி"} ஆர்டருடன் புறப்பட்டார்.`),
			delivered: bi("Delivered.", "வழங்கப்பட்டது.")
		};
		let captured = order.capturedPaise;
		let cashPending = order.cashPending;
		if (status === "delivered" && order.method === "cod") {
			const due = order.totalPaise - order.capturedPaise;
			if (cashCollected) captured = order.totalPaise;
			else cashPending = due > 0;
		}
		set({
			orders: s.orders.map((o) => o.id === orderId ? {
				...o,
				status,
				capturedPaise: captured,
				cashPending,
				events: [...o.events, {
					at: (/* @__PURE__ */ new Date()).toISOString(),
					text: labels[status] ?? bi(status, status)
				}]
			} : o),
			flash: say(labels[status] ?? bi("Updated.", "புதுப்பிக்கப்பட்டது."))
		});
	},
	vendorReject: (orderId, reason) => {
		const s = get();
		const order = s.orders.find((o) => o.id === orderId && o.vendorId === s.activeVendorId);
		if (!order || order.status !== "placed") return;
		const refund = order.customerKey === "self" ? order.capturedPaise : 0;
		set({
			orders: s.orders.map((o) => o.id === orderId ? {
				...o,
				status: "rejected",
				events: [...o.events, {
					at: (/* @__PURE__ */ new Date()).toISOString(),
					text: bi(`Shop declined: ${reason}. Not passed to a backup.`, `கடை மறுத்தது: ${reason}. மாற்றுக் கடைக்கு அனுப்பப்படவில்லை.`)
				}]
			} : o),
			vendorProducts: restoreStock(s, order),
			capacities: releaseSeat(s.capacities, order),
			walletPaise: s.walletPaise + refund,
			audits: [audit(s.vendors.find((v) => v.id === s.activeVendorId)?.name.en ?? "Vendor", "order.reject", `${orderId}: ${reason}`), ...s.audits],
			flash: say(bi("Declined. Stock released. Customer was not moved.", "நிராகரிப்பு. இருப்பு விடுவிக்கப்பட்டது. வாடிக்கையாளர் மாற்றப்படவில்லை."))
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
				at: (/* @__PURE__ */ new Date()).toISOString(),
				title: bi("Low stock", "குறைந்த இருப்பு"),
				body: bi(`${product?.name.en ?? "Eggs"} is down to ${next}.`, `${product?.name.ta ?? "முட்டை"} ${next} ஆகக் குறைந்தது.`),
				read: false
			});
		}
		set({
			vendorProducts: s.vendorProducts.map((p) => p.vendorId === s.activeVendorId && p.productId === productId ? {
				...p,
				stockEggs: next
			} : p),
			notices
		});
	},
	vendorSetPrice: (productId, pricePerEggPaise) => {
		const s = get();
		const price = Math.max(100, Math.round(pricePerEggPaise));
		set({ vendorProducts: s.vendorProducts.map((p) => p.vendorId === s.activeVendorId && p.productId === productId ? {
			...p,
			pricePerEggPaise: price
		} : p) });
	},
	vendorSetHours: (open, close) => {
		const s = get();
		set({ vendors: s.vendors.map((v) => v.id === s.activeVendorId ? {
			...v,
			hours: {
				open,
				close
			}
		} : v) });
	},
	vendorSetAccepting: (acceptingOrders) => {
		const s = get();
		set({
			vendors: s.vendors.map((v) => v.id === s.activeVendorId ? {
				...v,
				acceptingOrders
			} : v),
			audits: [audit("Vendor", "vendor.accepting", `${s.activeVendorId} accepting=${acceptingOrders}. Open orders stay put.`), ...s.audits]
		});
	},
	vendorToggleOffer: (offerId) => {
		const s = get();
		set({ offers: s.offers.map((o) => o.id === offerId && o.vendorId === s.activeVendorId ? {
			...o,
			active: !o.active
		} : o) });
	},
	vendorProfile: (patch) => {
		const s = get();
		set({ vendors: s.vendors.map((v) => v.id === s.activeVendorId ? {
			...v,
			phone: patch.phone ?? v.phone,
			name: {
				en: patch.nameEn?.trim() || v.name.en,
				ta: patch.nameTa?.trim() || v.name.ta
			}
		} : v) });
	},
	registerVendor: ({ nameEn, nameTa, phone, localityId }) => {
		const s = get();
		const loc = s.localities.find((l) => l.id === localityId) ?? s.localities[0];
		const id = nid("v");
		const created = {
			id,
			name: bi(nameEn.trim() || "New shop", nameTa.trim() || nameEn.trim() || "புதிய கடை"),
			phone,
			status: "pending",
			localityId: loc.id,
			lat: loc.lat,
			lng: loc.lng,
			hours: {
				open: "05:30",
				close: "13:00"
			},
			rating: 0,
			reviewCount: 0,
			commissionBps: 800,
			acceptingOrders: false,
			rider: bi("Rider", "டெலிவரி"),
			pin: "0000"
		};
		const rows = s.products.map((p) => ({
			vendorId: id,
			productId: p.id,
			pricePerEggPaise: DEFAULT_PRICE[p.id] ?? 800,
			stockEggs: 0,
			lowStockAt: 20,
			active: true
		}));
		set({
			vendors: [...s.vendors, created],
			vendorProducts: [...s.vendorProducts, ...rows],
			activeVendorId: id,
			audits: [audit("Vendor", "vendor.apply", `${created.name.en} applied. No streets until command approves.`), ...s.audits],
			flash: say(bi("Application sent. You can set stock, not streets.", "விண்ணப்பம் சென்றது. இருப்பு வைக்கலாம், தெரு இல்லை."))
		});
	},
	toggleFav: (productId) => {
		const s = get();
		set({ favourites: s.favourites.includes(productId) ? s.favourites.filter((id) => id !== productId) : [...s.favourites, productId] });
	},
	topUp: (paise) => set({
		walletPaise: get().walletPaise + paise,
		flash: say(bi("Wallet topped up.", "பணப்பை நிரப்பப்பட்டது."))
	}),
	createSub: ({ productId, pack, qtyPacks, cadence, slotId }) => {
		const s = get();
		if (!s.address || !s.cartVendorId) return;
		const row = s.vendorProducts.find((p) => p.vendorId === s.cartVendorId && p.productId === productId && p.active);
		if (!row) return;
		set({
			subscriptions: [{
				id: nid("sub"),
				productId,
				pack,
				qtyPacks,
				cadence,
				slotId,
				status: "active",
				skipDates: [],
				vendorId: s.cartVendorId,
				address: s.address,
				nextDate: addDays(readChennai().isoDate, 1),
				pricePerEggPaise: row.pricePerEggPaise
			}, ...s.subscriptions],
			flash: say(bi("Subscription stays with this shop.", "சந்தா இந்தக் கடையுடன் இருக்கும்."))
		});
	},
	setSubStatus: (id, status) => set({ subscriptions: get().subscriptions.map((sub) => sub.id === id ? {
		...sub,
		status
	} : sub) }),
	skipSub: (id) => {
		set({
			subscriptions: get().subscriptions.map((sub) => sub.id === id ? {
				...sub,
				skipDates: [...sub.skipDates, sub.nextDate],
				nextDate: addDays(sub.nextDate, sub.cadence === "daily" ? 1 : 7)
			} : sub),
			flash: say(bi("Next drop skipped. The shop was not changed.", "அடுத்த விநியோகம் தவிர்க்கப்பட்டது. கடை மாறவில்லை."))
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
			if (!rankVendors({
				streetId: sub.address.streetId,
				streets: s.streets,
				vendors: s.vendors,
				assignments: s.assignments,
				vendorProducts,
				capacities,
				slots: s.slots,
				clock,
				demand: [{
					productId: sub.productId,
					eggs
				}],
				slotId: sub.slotId,
				date: sub.nextDate
			}).ranked.find((r) => r.vendorId === sub.vendorId && r.eligible)) {
				audits = [audit("Command", "sub.hold", `${sub.id} held. Not moved to a backup shop.`), ...audits];
				return sub;
			}
			const total = sub.pricePerEggPaise * eggs;
			orders = [{
				id: `EGX-${Math.floor(1e3 + Math.random() * 9e3)}`,
				customerKey: "self",
				customerName: s.profile.name,
				phone: s.profile.phone || "9840011220",
				accountType: s.profile.accountType,
				businessName: s.profile.businessName,
				address: sub.address,
				vendorId: sub.vendorId,
				lines: [{
					productId: sub.productId,
					pack: sub.pack,
					qtyPacks: sub.qtyPacks,
					pricePerEggPaise: sub.pricePerEggPaise
				}],
				slotId: sub.slotId,
				date: sub.nextDate,
				method: "cod",
				capturedPaise: 0,
				totalPaise: total,
				discountPaise: 0,
				status: "placed",
				coupon: null,
				createdAt: (/* @__PURE__ */ new Date()).toISOString(),
				subscriptionId: sub.id,
				settled: false,
				events: [{
					at: (/* @__PURE__ */ new Date()).toISOString(),
					text: bi("Subscription drop placed with the same shop.", "சந்தா அதே கடையில் வைக்கப்பட்டது.")
				}]
			}, ...orders];
			vendorProducts = vendorProducts.map((row) => row.vendorId === sub.vendorId && row.productId === sub.productId ? {
				...row,
				stockEggs: row.stockEggs - eggs
			} : row);
			capacities = takeSeat(capacities, sub.vendorId, sub.slotId, sub.nextDate);
			return {
				...sub,
				nextDate: addDays(sub.nextDate, sub.cadence === "daily" ? 1 : 7)
			};
		});
		set({
			orders,
			vendorProducts,
			capacities,
			subscriptions,
			audits,
			flash: say(bi("Due subscriptions released. Held ones were not reassigned.", "நிலுவை சந்தாக்கள் விடுவிக்கப்பட்டன. நிறுத்தப்பட்டவை மாற்றப்படவில்லை."))
		});
	},
	reportIssue: (orderId, kind, note) => {
		const s = get();
		if (!s.orders.find((o) => o.id === orderId && o.customerKey === "self")) return;
		set({
			complaints: [{
				id: nid("iss"),
				orderId,
				kind,
				note,
				status: "open",
				createdAt: (/* @__PURE__ */ new Date()).toISOString(),
				customerKey: "self"
			}, ...s.complaints],
			flash: say(bi("Report is with the desk and the shop. The order was not moved.", "அறிக்கை மேசைக்கும் கடைக்கும் சென்றது. ஆர்டர் மாறவில்லை."))
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
		if (status === "refunded" && order && issue.customerKey === "self") wallet += order.totalPaise;
		if (status === "replacement" && order) orders = [{
			...order,
			id: `EGX-${Math.floor(1e3 + Math.random() * 9e3)}`,
			status: "placed",
			method: "wallet",
			capturedPaise: 0,
			totalPaise: 0,
			discountPaise: 0,
			settled: false,
			cashPending: false,
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			events: [{
				at: (/* @__PURE__ */ new Date()).toISOString(),
				text: bi("Replacement with the same shop. No new charge.", "அதே கடையில் மாற்று. புதிய கட்டணம் இல்லை.")
			}]
		}, ...orders];
		set({
			walletPaise: wallet,
			orders,
			complaints: s.complaints.map((c) => c.id === id ? {
				...c,
				status
			} : c),
			audits: [audit("Command", "issue.resolve", `${id} → ${status}`), ...s.audits],
			flash: say(bi("Issue updated.", "புகார் புதுப்பிக்கப்பட்டது."))
		});
	},
	sendSupport: (text) => {
		const s = get();
		const at = (/* @__PURE__ */ new Date()).toISOString();
		set({ support: [
			...s.support,
			{
				from: "you",
				text,
				at
			},
			{
				from: "desk",
				text: s.lang === "ta" ? "பெற்றோம். உடைந்த முட்டையை ஆர்டர் திரையில் தெரிவியுங்கள். தெரு மாற்றம் கட்டளையில் செய்யப்படும்." : "Received. Report cracked eggs from the order. Street changes are made in Command, not by moving a paid order.",
				at
			}
		] });
	},
	requestStreet: (query, localityId) => {
		const s = get();
		set({
			streetRequests: [{
				id: nid("req"),
				query,
				localityId,
				at: (/* @__PURE__ */ new Date()).toISOString(),
				status: "open"
			}, ...s.streetRequests],
			flash: say(bi("Street request is on the command desk.", "தெரு கோரிக்கை கட்டளை மேசையில்."))
		});
	},
	markNotices: () => set({ notices: get().notices.map((n) => ({
		...n,
		read: true
	})) }),
	rateOrder: (orderId, stars) => {
		const s = get();
		const order = s.orders.find((o) => o.id === orderId && o.customerKey === "self" && o.status === "delivered");
		if (!order || order.rating) return;
		set({
			orders: s.orders.map((o) => o.id === orderId ? {
				...o,
				rating: stars
			} : o),
			vendors: s.vendors.map((v) => {
				if (v.id !== order.vendorId) return v;
				const reviewCount = v.reviewCount + 1;
				const rating = Math.round((v.rating * v.reviewCount + stars) / reviewCount * 10) / 10;
				return {
					...v,
					reviewCount,
					rating
				};
			}),
			flash: say(bi("Rating saved on this shop.", "மதிப்பெண் இந்தக் கடையில் சேமிக்கப்பட்டது."))
		});
	},
	reorder: (orderId) => {
		const s = get();
		const order = s.orders.find((o) => o.id === orderId && o.customerKey === "self");
		if (!order || !s.address) return;
		const vendorId = rankVendors({
			streetId: s.address.streetId,
			streets: s.streets,
			vendors: s.vendors,
			assignments: s.assignments,
			vendorProducts: s.vendorProducts,
			capacities: s.capacities,
			slots: s.slots,
			clock: readChennai()
		}).recommendedId;
		if (!vendorId) {
			set({ flash: say(bi("This street has no shop to reorder from.", "மறுபதிவுக்கு இந்தத் தெருவில் கடை இல்லை.")) });
			return;
		}
		const cart = order.lines.filter((line) => {
			const row = s.vendorProducts.find((p) => p.vendorId === vendorId && p.productId === line.productId && p.active);
			return !!row && row.stockEggs >= line.pack * line.qtyPacks;
		}).map(({ productId, pack, qtyPacks }) => ({
			productId,
			pack,
			qtyPacks
		}));
		set({
			cart,
			cartVendorId: vendorId,
			flash: say(cart.length ? bi("Last order is in the basket, priced by today’s shop.", "கடந்த ஆர்டர் கூடையில். இன்றைய கடை விலை.") : bi("Those eggs are not in stock on your street today.", "அந்த முட்டை இன்று உங்கள் தெருவில் இல்லை."))
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
			streets: s.streets.map((st) => st.id === streetId ? {
				...st,
				status
			} : st),
			audits: [audit("Command", "street.status", `${street?.name.en ?? streetId} → ${status}. Open orders were not moved.`), ...s.audits]
		});
	},
	adminAddStreet: ({ localityId, en, ta, aliases, pin }) => {
		const s = get();
		if (!allowed(s, "streets")) return;
		const loc = s.localities.find((l) => l.id === localityId);
		if (!loc || !en.trim()) return;
		const id = nid("st");
		set({
			streets: [...s.streets, {
				id,
				localityId,
				name: bi(en.trim(), ta.trim() || en.trim()),
				aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
				pin: pin.trim() || loc.pin,
				lat: loc.lat + .002,
				lng: loc.lng + .002,
				status: "active"
			}],
			audits: [audit("Command", "street.add", en.trim()), ...s.audits],
			flash: say(bi("Street added to the directory.", "தெரு பட்டியலில் சேர்க்கப்பட்டது."))
		});
	},
	adminSetAssignment: (streetId, vendorId, role) => {
		const s = get();
		if (!allowed(s, "streets")) return;
		set({
			assignments: [...(role === "primary" ? s.assignments.filter((a) => !(a.streetId === streetId && a.role === "primary")) : s.assignments.filter((a) => !(a.streetId === streetId && a.vendorId === vendorId))).filter((a) => !(a.streetId === streetId && a.vendorId === vendorId)), {
				streetId,
				vendorId,
				role,
				priority: role === "primary" ? 1 : 2
			}],
			audits: [audit("Command", "street.assign", `${streetId} ${role} → ${vendorId}. Paid orders stay where they were paid.`), ...s.audits]
		});
	},
	adminClearAssignment: (streetId, vendorId) => {
		const s = get();
		if (!allowed(s, "streets")) return;
		set({
			assignments: s.assignments.filter((a) => !(a.streetId === streetId && a.vendorId === vendorId)),
			audits: [audit("Command", "street.unassign", `${vendorId} off ${streetId}`), ...s.audits]
		});
	},
	adminSetVendorStatus: (vendorId, status) => {
		const s = get();
		if (!allowed(s, "vendors")) {
			set({ flash: say(bi("This seat cannot change shop status.", "இந்த இருக்கை கடை நிலையை மாற்ற முடியாது.")) });
			return;
		}
		set({
			vendors: s.vendors.map((v) => v.id === vendorId ? {
				...v,
				status,
				acceptingOrders: status === "approved"
			} : v),
			audits: [audit("Command", "vendor.status", `${vendorId} → ${status}`), ...s.audits]
		});
	},
	adminSetCommission: (vendorId, bps) => {
		const s = get();
		if (!allowed(s, "settle")) return;
		set({ vendors: s.vendors.map((v) => v.id === vendorId ? {
			...v,
			commissionBps: bps
		} : v) });
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
				audits: [audit("Command", "order.reassign.blocked", `${orderId} blocked: money already captured.`), ...s.audits]
			});
			return;
		}
		if (block) {
			set({ flash: say(bi("This order can no longer be moved.", "இந்த ஆர்டரை இனி நகர்த்த முடியாது.")) });
			return;
		}
		const vendor = s.vendors.find((v) => v.id === vendorId);
		set({
			orders: s.orders.map((o) => o.id === orderId ? {
				...o,
				vendorId,
				events: [...o.events, {
					at: (/* @__PURE__ */ new Date()).toISOString(),
					text: bi(`Command moved this unpaid order to ${vendor?.name.en ?? "another shop"}.`, `கட்டளை இந்த செலுத்தாத ஆர்டரை ${vendor?.name.ta ?? "மற்ற கடை"}க்கு மாற்றியது.`)
				}]
			} : o),
			audits: [audit("Command", "order.reassign", `${orderId} → ${vendorId}. Customer can see the move.`), ...s.audits],
			flash: say(bi("Unpaid order moved. The customer can see who has it.", "செலுத்தாத ஆர்டர் மாற்றப்பட்டது. வாடிக்கையாளர் பார்க்கலாம்."))
		});
	},
	adminTogglePack: (productId, pack) => {
		set({ products: get().products.map((p) => {
			if (p.id !== productId) return p;
			const packs = p.packs.includes(pack) ? p.packs.filter((n) => n !== pack) : [...p.packs, pack].sort((a, b) => a - b);
			return {
				...p,
				packs
			};
		}) });
	},
	adminToggleProduct: (productId) => {
		set({ products: get().products.map((p) => p.id === productId ? {
			...p,
			active: !p.active
		} : p) });
	},
	adminSetVendorPrice: (vendorId, productId, price) => {
		set({ vendorProducts: get().vendorProducts.map((p) => p.vendorId === vendorId && p.productId === productId ? {
			...p,
			pricePerEggPaise: Math.max(100, price)
		} : p) });
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
		const commission = Math.round(gross * (vendor?.commissionBps ?? 800) / 1e4);
		set({
			orders: s.orders.map((o) => open.some((x) => x.id === o.id) ? {
				...o,
				settled: true
			} : o),
			settlements: [{
				id: nid("set"),
				vendorId,
				label: "Manual batch",
				grossPaise: gross,
				commissionPaise: commission,
				netPaise: gross - commission,
				status: "paid",
				at: (/* @__PURE__ */ new Date()).toISOString()
			}, ...s.settlements],
			audits: [audit("Finance", "settlement.paid", `${vendor?.name.en ?? vendorId} net ${gross - commission}`), ...s.audits],
			flash: say(bi("Settlement marked paid.", "தீர்வு செலுத்தப்பட்டதாகக் குறிக்கப்பட்டது."))
		});
	},
	setActingRole: (actingRole) => set({ actingRole }),
	setRolePerm: (id, key, value) => {
		if (get().actingRole !== "owner") return;
		set({ roles: get().roles.map((r) => r.id === id ? {
			...r,
			[key]: value
		} : r) });
	},
	setConfig: (patch) => set({ config: {
		...get().config,
		...patch
	} }),
	setCampaign: (patch) => {
		const s = get();
		set({ campaign: {
			...s.campaign,
			active: patch.active ?? s.campaign.active,
			title: {
				en: patch.titleEn ?? s.campaign.title.en,
				ta: s.campaign.title.ta
			},
			body: {
				en: patch.bodyEn ?? s.campaign.body.en,
				ta: s.campaign.body.ta
			}
		} });
	},
	broadcast: (en, ta) => {
		const s = get();
		if (!allowed(s, "broadcast")) return;
		set({
			notices: [{
				id: nid("nt"),
				at: (/* @__PURE__ */ new Date()).toISOString(),
				title: bi("From command", "கட்டளையிலிருந்து"),
				body: bi(en, ta || en),
				read: false
			}, ...s.notices],
			audits: [audit("Command", "notice.broadcast", en), ...s.audits]
		});
	},
	closeRequest: (id) => {
		set({ streetRequests: get().streetRequests.map((r) => r.id === id ? {
			...r,
			status: "added"
		} : r) });
	},
	resetDemo: () => set({
		...createCatalogue(),
		...session(),
		flash: say(bi("Preview data reset.", "முன்னோட்டத் தரவு மீட்டமைக்கப்பட்டது."))
	})
}), {
	name: "eggsclusive-v1",
	version: 1,
	partialize: (state) => ({
		...state,
		flash: null
	})
}));
function cn(...parts) {
	return parts.filter(Boolean).join(" ");
}
function Button({ variant = "primary", className, ...props }) {
	const look = {
		primary: "bg-ink text-shell",
		line: "border border-line bg-shell text-ink",
		ghost: "bg-transparent text-ink",
		mark: "bg-mark text-shell"
	}[variant];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn("press inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium disabled:opacity-40", look, className),
		...props
	});
}
function Field({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("min-h-12 w-full rounded-control border border-line bg-shell px-3 text-base text-ink placeholder:text-muted", className),
		...props
	});
}
function TextArea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("min-h-24 w-full rounded-control border border-line bg-shell px-3 py-3 text-base text-ink placeholder:text-muted", className),
		...props
	});
}
function Chip({ active, className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn("press min-h-11 shrink-0 rounded-full border px-3 text-sm", active ? "border-ink bg-ink text-shell" : "border-line bg-shell text-ink", className),
		...props
	});
}
function Panel({ className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: cn("rounded-card border border-line bg-shell p-4", className),
		children
	});
}
function Wordmark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-2 font-display text-xl tracking-tight text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "relative block h-5 w-3.5 rounded-full border border-ink bg-shell",
			"aria-hidden": true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-mark" })
		}), "Eggsclusive"]
	});
}
function EggMark({ id }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "grid h-20 w-20 place-items-center rounded-card bg-foam",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "relative",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("block rounded-full border border-line", id === "brown" || id === "country" ? "bg-foam" : "bg-shell", id === "quail" ? "h-8 w-6" : id === "duck" ? "h-14 w-10" : "h-12 w-9") }),
				id === "protein" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-4 left-3 h-3 w-3 rounded-full bg-mark" }) : null,
				id === "country" || id === "quail" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-3 right-1 h-1 w-1 rounded-full bg-ink" }) : null,
				id === "freerange" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -bottom-1 left-1 h-px w-6 bg-mark" }) : null
			]
		})
	});
}
function NavLink({ to, label, icon, exact }) {
	const path = useRouterState({ select: (s) => s.location.pathname });
	const active = exact || to === "/" ? path === to : path === to || path.startsWith(`${to}/`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: cn("press inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-3 text-sm", active ? "bg-ink text-shell" : "text-muted"),
		children: [icon, label]
	});
}
//#endregion
export { reassignBlock as A, formatDay as C, quoteCart as D, packLabel as E, seatsLeft as M, tx as N, rankVendors as O, useEggs as P, cn as S, inr as T, TextArea as _, EXCEPTION_LABEL as a, addDays as b, ISSUE_KIND as c, PACKS as d, PAY_LABEL as f, STREET_STATUS as g, STATUS_LABEL as h, DEMAND as i, searchStreets as j, readChennai as k, ISSUE_STATUS as l, ROLE_LABEL as m, Button as n, EggMark as o, Panel as p, Chip as r, Field as s, ACCOUNT_LABEL as t, NavLink as u, VENDOR_STATUS as v, formatWhen as w, bi as x, Wordmark as y };
