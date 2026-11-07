import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as formatDay, D as quoteCart, E as packLabel, M as seatsLeft, N as tx, O as rankVendors, P as useEggs, T as inr, _ as TextArea, a as EXCEPTION_LABEL, b as addDays, c as ISSUE_KIND, f as PAY_LABEL, h as STATUS_LABEL, n as Button, p as Panel, r as Chip, s as Field, t as ACCOUNT_LABEL, w as formatWhen, x as bi } from "./ui-9V5_dOcT.mjs";
import { i as Gate } from "./router-CMhCLoa6.mjs";
import { a as useShop, i as priceOf, n as ProductCard, r as StreetLine, t as CityDots } from "./catalog-BXbetZ0b.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/customer-pKCr0Vdq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useT() {
	const lang = useEggs((s) => s.lang);
	return (text) => tx(lang, text);
}
function HomeBody() {
	const t = useT();
	const shop = useShop();
	const campaign = useEggs((s) => s.campaign);
	const offers = useEggs((s) => s.offers);
	const orders = useEggs((s) => s.orders);
	const hour = shop.clock.hour;
	const greet = hour < 12 ? bi("Good morning.", "காலை வணக்கம்.") : hour < 17 ? bi("Good afternoon.", "மதிய வணக்கம்.") : bi("Good evening.", "மாலை வணக்கம்.");
	const active = orders.find((o) => o.customerKey === "self" && ![
		"delivered",
		"cancelled",
		"rejected"
	].includes(o.status));
	const offer = offers.find((o) => o.vendorId === shop.vendorId && o.active);
	const carried = shop.products.filter((p) => p.active && priceOf(shop.vendorProducts, shop.vendorId, p.id));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(greet)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl tracking-tight",
				children: t(bi("What the street can deliver today.", "இன்று இந்தத் தெரு வழங்கும் முட்டை."))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StreetLine, {
				street: shop.street,
				locality: shop.locality
			}),
			shop.vendor ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t(bi("Priced by the shop on your street", "உங்கள் தெருக் கடையின் விலை"))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-medium",
					children: t(shop.vendor.name)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						shop.vendor.hours.open,
						"–",
						shop.vendor.hours.close,
						" · ",
						shop.vendor.rating.toFixed(1),
						" · ",
						shop.vendor.reviewCount,
						" ",
						t(bi("ratings", "மதிப்பெண்"))
					]
				}),
				offer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-sm",
					children: [
						t(offer.title),
						". ",
						t(offer.detail)
					]
				}) : null
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t(EXCEPTION_LABEL[shop.decision?.exception ?? "NO_VENDOR"]) }) }),
			campaign.active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-foam",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: t(bi("This week", "இந்த வாரம்"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: t(campaign.title)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm",
						children: t(campaign.body)
					})
				]
			}) : null,
			active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/track/$orderId",
				params: { orderId: active.id },
				className: "rounded-card border border-line bg-shell p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: active.id
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: t(STATUS_LABEL[active.status])
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CityDots, { activeId: shop.locality?.id }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-3",
				children: carried.slice(0, 4).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product: p }, p.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/browse",
				className: "text-sm font-medium underline",
				children: t(bi("All eggs on this street", "இந்தத் தெருவின் அனைத்து முட்டைகளும்"))
			})
		]
	}) });
}
function BrowseBody() {
	const t = useT();
	const shop = useShop();
	const [q, setQ] = (0, import_react.useState)("");
	const [pack, setPack] = (0, import_react.useState)(null);
	const [savedOnly, setSavedOnly] = (0, import_react.useState)(false);
	const fav = useEggs((s) => s.favourites);
	const list = shop.products.filter((p) => {
		if (!p.active) return false;
		const row = priceOf(shop.vendorProducts, shop.vendorId, p.id);
		if (!row || row.stockEggs <= 0) return false;
		if (savedOnly && !fav.includes(p.id)) return false;
		if (pack && !p.packs.includes(pack)) return false;
		return `${p.name.en} ${p.name.ta}`.toLowerCase().includes(q.trim().toLowerCase());
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("The case", "பெட்டி"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: t(bi("Search varieties", "வகைகளைத் தேடுங்கள்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 overflow-x-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: pack === null,
						onClick: () => setPack(null),
						children: t(bi("Any pack", "எந்தப் பொதியும்"))
					}),
					[
						6,
						12,
						30,
						210
					].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: pack === n,
						onClick: () => setPack(n),
						children: packLabel(n, shop.lang)
					}, n)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: savedOnly,
						onClick: () => setSavedOnly((v) => !v),
						children: t(bi("Saved", "சேமிப்பு"))
					})
				]
			}),
			list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("Nothing in stock matches.", "இருப்பில் பொருத்தம் இல்லை."))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-3",
				children: list.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product: p }, p.id))
			})
		]
	}) });
}
function ProductBody({ sku }) {
	const t = useT();
	const shop = useShop();
	const product = shop.products.find((p) => p.id === sku);
	const add = useEggs((s) => s.addToCart);
	const createSub = useEggs((s) => s.createSub);
	const profile = useEggs((s) => s.profile);
	const [pack, setPack] = (0, import_react.useState)(product?.packs[0] ?? 6);
	const [cadence, setCadence] = (0, import_react.useState)("daily");
	if (!product) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t(bi("That egg is not in the catalogue.", "அந்த முட்டை பட்டியலில் இல்லை.")) }) });
	const row = priceOf(shop.vendorProducts, shop.vendorId, product.id);
	const business = profile.accountType !== "home";
	const packs = product.packs.filter((n) => business || n !== 210);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EggRow, { id: product.id }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl",
					children: t(product.name)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: t(product.blurb)
				}),
				row?.batch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm",
					children: t(row.batch)
				}) : null,
				row ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-lg tabular-nums",
					children: [inr(row.pricePerEggPaise * pack, shop.lang), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-sm text-muted",
						children: [
							" · ",
							row.stockEggs,
							" ",
							t(bi("eggs left", "முட்டை மீதம்"))
						]
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: t(bi("This shop does not carry it.", "இந்தக் கடை இதை வைத்திருக்கவில்லை."))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: packs.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: pack === n,
					onClick: () => setPack(n),
					children: packLabel(n, shop.lang)
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				"data-testid": "add-pack",
				disabled: !row || row.stockEggs < pack,
				onClick: () => add(product.id, pack),
				children: t(bi("Add pack", "பொதியைச் சேர்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(bi("Repeat it", "மீண்டும்"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: cadence === "daily",
							onClick: () => setCadence("daily"),
							children: t(bi("Daily", "தினமும்"))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: cadence === "weekly",
							onClick: () => setCadence("weekly"),
							children: t(bi("Weekly", "வாரம்"))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: t(bi("Dawn slot, same shop. It will not jump to a backup if this shop is short.", "அதிகாலை, அதே கடை. இருப்பு குறைந்தால் மாற்றுக் கடைக்குத் தானாகப் போகாது."))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "line",
						disabled: !row,
						onClick: () => createSub({
							productId: product.id,
							pack,
							qtyPacks: 1,
							cadence,
							slotId: "dawn"
						}),
						children: t(bi("Start subscription", "சந்தா தொடங்கு"))
					})
				]
			})
		]
	}) });
}
function EggRow({ id }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-40 place-items-center rounded-card border border-line bg-foam",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cnEgg(id) })
	});
}
function cnEgg(id) {
	const base = "block rounded-full border border-line ";
	if (id === "quail") return base + "h-10 w-8 bg-shell";
	if (id === "duck") return base + "h-24 w-16 bg-shell";
	if (id === "brown" || id === "country") return base + "h-20 w-14 bg-paper";
	return base + "h-20 w-14 bg-shell";
}
function CartBody() {
	const t = useT();
	const shop = useShop();
	const cart = useEggs((s) => s.cart);
	const setQty = useEggs((s) => s.setLineQty);
	const setCoupon = useEggs((s) => s.setCoupon);
	const couponCode = useEggs((s) => s.couponCode);
	const coupons = useEggs((s) => s.coupons);
	const place = useEggs((s) => s.placeOrder);
	const profile = useEggs((s) => s.profile);
	const orders = useEggs((s) => s.orders);
	const wallet = useEggs((s) => s.walletPaise);
	const config = useEggs((s) => s.config);
	const setCartVendor = useEggs((s) => s.setCartVendor);
	const cartVendorId = useEggs((s) => s.cartVendorId);
	const streets = useEggs((s) => s.streets);
	const vendors = useEggs((s) => s.vendors);
	const assignments = useEggs((s) => s.assignments);
	const [datePick, setDatePick] = (0, import_react.useState)("today");
	const [slotId, setSlotId] = (0, import_react.useState)("late");
	const [method, setMethod] = (0, import_react.useState)("upi");
	const [useWallet, setUseWallet] = (0, import_react.useState)(false);
	const [code, setCode] = (0, import_react.useState)("");
	const [upiOpen, setUpiOpen] = (0, import_react.useState)(false);
	const date = datePick === "today" ? shop.clock.isoDate : addDays(shop.clock.isoDate, 1);
	const prior = orders.filter((o) => o.customerKey === "self" && o.status !== "cancelled" && o.status !== "rejected").length;
	const coupon = coupons.find((c) => c.code === couponCode) ?? null;
	const slot = shop.slots.find((s) => s.id === slotId);
	const quote = quoteCart({
		lines: cart,
		vendorId: cartVendorId,
		vendorProducts: shop.vendorProducts,
		accountType: profile.accountType,
		tradeBps: config.tradeBps,
		coupon,
		slot,
		priorOrders: prior
	});
	const walletOff = useWallet ? Math.min(wallet, quote.total) : 0;
	const due = Math.max(0, quote.total - walletOff);
	const demand = cart.map((l) => ({
		productId: l.productId,
		eggs: l.pack * l.qtyPacks
	}));
	const decision = shop.address ? rankVendors({
		streetId: shop.address.streetId,
		streets,
		vendors,
		assignments,
		vendorProducts: shop.vendorProducts,
		capacities: shop.capacities,
		slots: shop.slots,
		clock: shop.clock,
		demand,
		slotId,
		date
	}) : null;
	const mine = decision?.ranked.find((r) => r.vendorId === cartVendorId);
	const alternatives = decision?.ranked.filter((r) => r.eligible && r.vendorId !== cartVendorId) ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Basket", "கூடை"))
			}),
			cart.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("The basket is empty.", "கூடை காலி."))
			}) : null,
			cart.map((line) => {
				const product = shop.products.find((p) => p.id === line.productId);
				const row = priceOf(shop.vendorProducts, cartVendorId, line.productId);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: product ? t(product.name) : line.productId
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							packLabel(line.pack, shop.lang),
							" · ",
							row ? inr(row.pricePerEggPaise * line.pack, shop.lang) : ""
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "line",
								onClick: () => setQty(line.productId, line.pack, line.qtyPacks - 1),
								children: "-"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-6 text-center tabular-nums",
								children: line.qtyPacks
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "line",
								onClick: () => setQty(line.productId, line.pack, line.qtyPacks + 1),
								children: "+"
							})
						]
					})]
				}, `${line.productId}-${line.pack}`);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: datePick === "today",
					onClick: () => setDatePick("today"),
					children: t(bi("Today", "இன்று"))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: datePick === "tomorrow",
					onClick: () => setDatePick("tomorrow"),
					children: t(bi("Tomorrow", "நாளை"))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-2",
				children: shop.slots.map((s) => {
					const left = cartVendorId ? seatsLeft(shop.capacities, cartVendorId, s.id, date).left : 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
						active: slotId === s.id,
						onClick: () => setSlotId(s.id),
						children: [
							t(s.label),
							" · ",
							s.start,
							"–",
							s.end,
							" · ",
							left === 0 ? t(bi("Full", "நிரம்பியது")) : `${left} ${t(bi("left", "மீதம்"))}`
						]
					}, s.id);
				})
			}),
			mine && !mine.eligible ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: t(EXCEPTION_LABEL[mine.reason ?? decision?.exception ?? "NO_VENDOR"])
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: t(bi("A paid or in-progress order is never moved for you. You can switch the basket yourself.", "செலுத்திய அல்லது நடப்பில் உள்ள ஆர்டர் தானாக மாறாது. கூடையை நீங்களே மாற்றலாம்."))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-col gap-2",
					children: alternatives.map((alt) => {
						const vendor = vendors.find((v) => v.id === alt.vendorId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							onClick: () => setCartVendor(alt.vendorId),
							children: t(bi(`Use ${vendor?.name.en ?? "backup"}`, `${vendor?.name.ta ?? "மாற்று"} கடையைப் பயன்படுத்து`))
						}, alt.vendorId);
					})
				})
			] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [config.upiEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: method === "upi",
					onClick: () => setMethod("upi"),
					children: t(PAY_LABEL.upi)
				}) : null, config.codEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: method === "cod",
					onClick: () => setMethod("cod"),
					children: t(PAY_LABEL.cod)
				}) : null]
			}),
			config.walletEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex min-h-11 items-center gap-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: useWallet,
						onChange: (e) => setUseWallet(e.target.checked)
					}),
					t(bi("Use wallet", "பணப்பையைப் பயன்படுத்து")),
					" · ",
					inr(wallet, shop.lang)
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					value: code,
					onChange: (e) => setCode(e.target.value),
					placeholder: "DAWN15"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					onClick: () => setCoupon(code),
					children: t(bi("Apply", "பொருத்து"))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "text-sm text-muted",
				children: coupons.filter((c) => c.active).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					c.code,
					" — ",
					t(c.label)
				] }, c.code))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: t(bi("Eggs", "முட்டை")),
					v: String(quote.eggs)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: t(bi("Subtotal", "கூட்டுத்தொகை")),
					v: inr(quote.subtotal, shop.lang)
				}),
				quote.trade > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: t(bi("Trade price", "வணிக விலை")),
					v: `−${inr(quote.trade, shop.lang)}`
				}) : null,
				quote.couponOff > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: couponCode ?? "",
					v: `−${inr(quote.couponOff, shop.lang)}`
				}) : null,
				walletOff > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: t(bi("Wallet", "பணப்பை")),
					v: `−${inr(walletOff, shop.lang)}`
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: t(bi("Due", "செலுத்த")),
					v: inr(due, shop.lang)
				})
			] }),
			method === "upi" && due > 0 ? upiOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t(bi("UPI ID", "UPI எண்"))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "eggsclusive@okaxis"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm",
					children: t(bi("This preview confirms the payment. It does not charge a bank.", "இந்த முன்னோட்டம் பணத்தை உறுதி செய்கிறது. வங்கியில் பிடிக்காது."))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-3",
					"data-testid": "place-order",
					disabled: !mine?.eligible || cart.length === 0,
					onClick: () => place({
						slotId,
						date,
						method: "upi",
						useWallet
					}),
					children: [
						t(bi("I have paid", "செலுத்திவிட்டேன்")),
						" · ",
						inr(due, shop.lang)
					]
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				disabled: !mine?.eligible || cart.length === 0,
				onClick: () => setUpiOpen(true),
				children: t(bi("Pay by UPI", "UPI செலுத்து"))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				"data-testid": "place-order",
				disabled: !mine?.eligible || cart.length === 0,
				onClick: () => place({
					slotId,
					date,
					method: due === 0 ? "wallet" : method,
					useWallet
				}),
				children: t(bi("Place order", "ஆர்டர் செய்"))
			})
		]
	}) });
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "flex justify-between gap-3 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "tabular-nums",
			children: v
		})]
	});
}
function OrdersBody() {
	const t = useT();
	const lang = useEggs((s) => s.lang);
	const orders = useEggs((s) => s.orders.filter((o) => o.customerKey === "self"));
	const reorder = useEggs((s) => s.reorder);
	const products = useEggs((s) => s.products);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Orders", "ஆர்டர்கள்"))
			}),
			orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("No orders yet.", "இன்னும் ஆர்டர் இல்லை."))
			}) : null,
			orders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							order.id,
							" · ",
							formatDay(order.date, lang)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: t(STATUS_LABEL[order.status])
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: order.lines.map((l) => `${products.find((p) => p.id === l.productId)?.name[lang] ?? l.productId} · ${packLabel(l.pack, lang)} × ${l.qtyPacks}`).join(", ")
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "tabular-nums",
					children: inr(order.totalPaise, lang)
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/track/$orderId",
					params: { orderId: order.id },
					className: "press inline-flex min-h-11 items-center rounded-control border border-line px-3 text-sm",
					children: t(bi("Track", "தடம்"))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					onClick: () => reorder(order.id),
					children: t(bi("Reorder", "மீண்டும்"))
				})]
			})] }, order.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/cart",
				className: "text-sm font-medium underline",
				children: t(bi("Open basket", "கூடையைத் திற"))
			})
		]
	}) });
}
function TrackBody({ orderId }) {
	const t = useT();
	const lang = useEggs((s) => s.lang);
	const order = useEggs((s) => s.orders.find((o) => o.id === orderId && o.customerKey === "self"));
	const vendors = useEggs((s) => s.vendors);
	const streets = useEggs((s) => s.streets);
	const slots = useEggs((s) => s.slots);
	const cancel = useEggs((s) => s.cancelOrder);
	const rate = useEggs((s) => s.rateOrder);
	const report = useEggs((s) => s.reportIssue);
	const [note, setNote] = (0, import_react.useState)("");
	const [kind, setKind] = (0, import_react.useState)("broken");
	if (!order) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t(bi("Order not on this account.", "இந்தக் கணக்கில் ஆர்டர் இல்லை.")) }) });
	const vendor = vendors.find((v) => v.id === order.vendorId);
	const street = streets.find((s) => s.id === order.address.streetId);
	const slot = slots.find((s) => s.id === order.slotId);
	const steps = [
		"placed",
		"accepted",
		"preparing",
		"out_for_delivery",
		"delivered"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: order.id
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(STATUS_LABEL[order.status])
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: vendor ? t(vendor.name) : order.vendorId
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						street ? t(street.name) : "",
						" · ",
						slot ? `${t(slot.label)} ${slot.start}–${slot.end}` : "",
						" · ",
						formatDay(order.date, lang)
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm",
					children: [
						t(PAY_LABEL[order.method]),
						" · ",
						inr(order.totalPaise, lang)
					]
				}),
				order.capturedPaise > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: t(bi("Money is captured, so this order cannot be moved to another shop.", "பணம் பிடிக்கப்பட்டதால் இந்த ஆர்டர் வேறு கடைக்குப் போகாது."))
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "flex flex-col gap-2",
				children: order.events.map((ev, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: [formatWhen(ev.at, lang), " · "]
					}), t(ev.text)]
				}, i))
			}),
			order.status !== "cancelled" && order.status !== "rejected" && order.status !== "delivered" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1",
				children: steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1 flex-1 rounded-full ${steps.indexOf(step) <= steps.indexOf(order.status) ? "bg-ink" : "bg-line"}` }, step))
			}) : null,
			order.status === "placed" || order.status === "accepted" || order.status === "preparing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "line",
				onClick: () => cancel(order.id),
				children: order.status === "placed" ? t(bi("Cancel", "ரத்து")) : t(bi("Ask to cancel", "ரத்து கோரு"))
			}) : null,
			order.status === "delivered" && !order.rating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2",
				children: [
					1,
					2,
					3,
					4,
					5
				].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					onClick: () => rate(order.id, n),
					children: n
				}, n))
			}) : null,
			order.status === "delivered" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(bi("Something wrong with the eggs?", "முட்டையில் பிரச்சனையா?"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							"broken",
							"replacement",
							"refund"
						].map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: kind === k,
							onClick: () => setKind(k),
							children: t(ISSUE_KIND[k])
						}, k))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
						value: note,
						onChange: (e) => setNote(e.target.value),
						placeholder: t(bi("How many, and which pack?", "எத்தனை, எந்தப் பொதி?"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: !note.trim(),
						onClick: () => report(order.id, kind, note.trim()),
						children: t(bi("Send to the shop", "கடைக்கு அனுப்பு"))
					})
				]
			}) : null
		]
	}) });
}
function PlansBody() {
	const t = useT();
	const lang = useEggs((s) => s.lang);
	const subs = useEggs((s) => s.subscriptions);
	const products = useEggs((s) => s.products);
	const setStatus = useEggs((s) => s.setSubStatus);
	const skip = useEggs((s) => s.skipSub);
	const slots = useEggs((s) => s.slots);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Subscriptions", "சந்தாக்கள்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("Each plan is locked to the shop that started it.", "ஒவ்வொரு திட்டமும் தொடங்கிய கடையுடன் பூட்டப்பட்டுள்ளது."))
			}),
			subs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("No plan yet. Open an egg and start one.", "இன்னும் திட்டம் இல்லை. ஒரு முட்டையைத் திறந்து தொடங்குங்கள்."))
			}) : null,
			subs.map((sub) => {
				const product = products.find((p) => p.id === sub.productId);
				const slot = slots.find((s) => s.id === sub.slotId);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: product ? t(product.name) : sub.productId
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							packLabel(sub.pack, lang),
							" · ",
							sub.cadence === "daily" ? t(bi("Daily", "தினமும்")) : t(bi("Weekly", "வாரம்")),
							" · ",
							slot ? t(slot.label) : "",
							" · ",
							formatDay(sub.nextDate, lang)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm",
						children: sub.status === "active" ? t(bi("Running", "நடக்கிறது")) : t(bi("Paused", "இடைநிறுத்தம்"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [sub.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							onClick: () => setStatus(sub.id, "paused"),
							children: t(bi("Pause", "நிறுத்து"))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							onClick: () => setStatus(sub.id, "active"),
							children: t(bi("Resume", "தொடர்"))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							onClick: () => skip(sub.id),
							children: t(bi("Skip next", "அடுத்ததைத் தவிர்"))
						})]
					})
				] }, sub.id);
			})
		]
	}) });
}
function AccountBody() {
	const t = useT();
	const lang = useEggs((s) => s.lang);
	const profile = useEggs((s) => s.profile);
	const setAccount = useEggs((s) => s.setAccount);
	const wallet = useEggs((s) => s.walletPaise);
	const topUp = useEggs((s) => s.topUp);
	const support = useEggs((s) => s.support);
	const send = useEggs((s) => s.sendSupport);
	const reset = useEggs((s) => s.resetDemo);
	const favs = useEggs((s) => s.favourites);
	const products = useEggs((s) => s.products);
	const [name, setName] = (0, import_react.useState)(profile.name);
	const [business, setBusiness] = (0, import_react.useState)(profile.businessName);
	const [note, setNote] = (0, import_react.useState)("");
	const types = [
		"home",
		"restaurant",
		"bakery",
		"hotel",
		"tea"
	];
	const saved = (0, import_react.useMemo)(() => products.filter((p) => favs.includes(p.id)), [products, favs]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: profile.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: profile.phone
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(bi("Account", "கணக்கு"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						value: name,
						onChange: (e) => setName(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: types.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: profile.accountType === type,
							onClick: () => setAccount(type, business, name),
							children: t(ACCOUNT_LABEL[type])
						}, type))
					}),
					profile.accountType !== "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						value: business,
						placeholder: t(bi("Kitchen or shop name", "சமையலறை அல்லது கடைப் பெயர்")),
						onChange: (e) => setBusiness(e.target.value)
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "line",
						onClick: () => setAccount(profile.accountType, business, name),
						children: t(bi("Save profile", "சுயவிவரத்தைச் சேமி"))
					}),
					profile.accountType !== "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: t(bi("Trade accounts see bulk trays and a 5% street price.", "வணிகக் கணக்குகள் மொத்த தட்டையும் 5% தெரு விலையையும் பெறும்."))
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-medium",
					children: t(bi("Wallet", "பணப்பை"))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-2xl tabular-nums",
					children: inr(wallet, lang)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "line",
						onClick: () => topUp(2e4),
						children: t(bi("Add ₹200", "₹200 சேர்"))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "line",
						onClick: () => topUp(5e4),
						children: t(bi("Add ₹500", "₹500 சேர்"))
					})]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-medium",
				children: t(bi("Saved eggs", "சேமித்த முட்டை"))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-col gap-2",
				children: [saved.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/product/$sku",
					params: { sku: p.id },
					className: "text-sm underline",
					children: t(p.name)
				}, p.id)), saved.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t(bi("None saved.", "சேமிப்பு இல்லை."))
				}) : null]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(bi("Desk", "உதவி"))
					}),
					support.map((msg, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [msg.from === "you" ? t(bi("You", "நீங்கள்")) : t(bi("Desk", "மேசை")), " · "]
						}), msg.text]
					}, i)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
						value: note,
						onChange: (e) => setNote(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: !note.trim(),
						onClick: () => {
							send(note.trim());
							setNote("");
						},
						children: t(bi("Send", "அனுப்பு"))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => reset(),
				children: t(bi("Reset preview", "முன்னோட்டத்தை மீட்டமை"))
			})
		]
	}) });
}
//#endregion
export { OrdersBody as a, TrackBody as c, HomeBody as i, BrowseBody as n, PlansBody as o, CartBody as r, ProductBody as s, AccountBody as t };
