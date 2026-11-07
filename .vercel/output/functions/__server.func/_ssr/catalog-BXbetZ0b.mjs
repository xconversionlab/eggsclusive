import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { E as packLabel, N as tx, O as rankVendors, P as useEggs, S as cn, T as inr, k as readChennai, n as Button, o as EggMark, p as Panel } from "./ui-9V5_dOcT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/catalog-BXbetZ0b.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useShop() {
	const address = useEggs((s) => s.address);
	const streets = useEggs((s) => s.streets);
	const localities = useEggs((s) => s.localities);
	const vendors = useEggs((s) => s.vendors);
	const assignments = useEggs((s) => s.assignments);
	const vendorProducts = useEggs((s) => s.vendorProducts);
	const capacities = useEggs((s) => s.capacities);
	const slots = useEggs((s) => s.slots);
	const products = useEggs((s) => s.products);
	const cartVendorId = useEggs((s) => s.cartVendorId);
	const lang = useEggs((s) => s.lang);
	const [clock, setClock] = (0, import_react.useState)(() => readChennai());
	(0, import_react.useEffect)(() => {
		const t = setInterval(() => setClock(readChennai()), 3e4);
		return () => clearInterval(t);
	}, []);
	const decision = address ? rankVendors({
		streetId: address.streetId,
		streets,
		vendors,
		assignments,
		vendorProducts,
		capacities,
		slots,
		clock
	}) : null;
	const vendorId = cartVendorId && decision?.ranked.some((r) => r.vendorId === cartVendorId && r.eligible) ? cartVendorId : decision?.recommendedId ?? null;
	return {
		clock,
		decision,
		vendorId,
		vendor: vendors.find((v) => v.id === vendorId) ?? null,
		street: streets.find((s) => s.id === address?.streetId) ?? null,
		locality: localities.find((l) => l.id === address?.localityId) ?? null,
		products,
		vendorProducts,
		slots,
		capacities,
		lang,
		address
	};
}
function priceOf(rows, vendorId, productId) {
	return rows.find((r) => r.vendorId === vendorId && r.productId === productId && r.active) ?? null;
}
function ProductCard({ product }) {
	const { vendorId, vendorProducts, lang } = useShop();
	const fav = useEggs((s) => s.favourites.includes(product.id));
	const toggle = useEggs((s) => s.toggleFav);
	const t = (text) => tx(lang, text);
	const row = priceOf(vendorProducts, vendorId, product.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex gap-3 rounded-card border border-line bg-shell p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EggMark, { id: product.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-medium",
						children: t(product.name)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "min-h-11 px-2 text-sm text-muted",
						onClick: () => toggle(product.id),
						"aria-pressed": fav,
						children: fav ? t({
							en: "Saved",
							ta: "சேமிப்பு"
						}) : t({
							en: "Save",
							ta: "சேமி"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t(product.blurb)
				}),
				row ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm tabular-nums",
					children: [
						inr(row.pricePerEggPaise, lang),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [" ", t({
								en: " / egg",
								ta: " / முட்டை"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [
								" · ",
								row.stockEggs,
								" ",
								t({
									en: "in stock",
									ta: "இருப்பில்"
								})
							]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: t({
						en: "Not carried on this street’s shop.",
						ta: "இந்தத் தெருக் கடையில் இல்லை."
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: product.packs.slice(0, 4).map((pack) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/product/$sku",
						params: { sku: product.id },
						className: "press inline-flex min-h-11 items-center rounded-control border border-line px-3 text-sm",
						children: packLabel(pack, lang)
					}, pack))
				})
			]
		})]
	});
}
function CityDots({ activeId }) {
	const localities = useEggs((s) => s.localities);
	const streets = useEggs((s) => s.streets);
	const assignments = useEggs((s) => s.assignments);
	const lang = useEggs((s) => s.lang);
	const lats = localities.map((l) => l.lat);
	const lngs = localities.map((l) => l.lng);
	const minLat = Math.min(...lats);
	const maxLat = Math.max(...lats);
	const minLng = Math.min(...lngs);
	const maxLng = Math.max(...lngs);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "relative h-64 overflow-hidden rounded-card border border-line bg-foam",
		children: localities.map((loc) => {
			const x = (loc.lng - minLng) / (maxLng - minLng || 1) * 78 + 11;
			const y = (maxLat - loc.lat) / (maxLat - minLat || 1) * 70 + 14;
			const served = streets.some((s) => s.localityId === loc.id && s.status === "active" && assignments.some((a) => a.streetId === s.id));
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute",
				style: {
					left: `${x}%`,
					top: `${y}%`
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "-translate-x-1/2 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("mx-auto h-2.5 w-2.5 rounded-full", served ? "bg-ink" : "bg-line", loc.id === activeId && "ring-2 ring-mark ring-offset-2 ring-offset-foam") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("mt-1 text-xs", loc.id === activeId ? "text-ink" : "text-muted"),
						children: tx(lang, loc.name).split(" ")[0]
					})]
				})
			}, loc.id);
		})
	});
}
function StreetLine({ street, locality }) {
	const lang = useEggs((s) => s.lang);
	const address = useEggs((s) => s.address);
	const edit = useEggs((s) => s.setEditingStreet);
	if (!street || !locality || !address) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		className: "flex items-start justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					tx(lang, locality.name),
					" · ",
					address.pin
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "font-display text-3xl tracking-tight",
				children: [
					address.door,
					", ",
					tx(lang, street.name)
				]
			}),
			address.landmark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: address.landmark
			}) : null
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "line",
			onClick: () => edit(true),
			children: tx(lang, {
				en: "Change",
				ta: "மாற்று"
			})
		})]
	});
}
//#endregion
export { useShop as a, priceOf as i, ProductCard as n, StreetLine as r, CityDots as t };
