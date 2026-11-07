import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as formatDay, N as tx, P as useEggs, T as inr, h as STATUS_LABEL, i as DEMAND, n as Button, p as Panel, s as Field, v as VENDOR_STATUS, x as bi } from "./ui-9V5_dOcT.mjs";
import { i as ResponsiveContainer, n as XAxis, r as Bar, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vendor-BzXowPJ7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useT() {
	const lang = useEggs((s) => s.lang);
	return {
		lang,
		t: (text) => tx(lang, text)
	};
}
function ShopPicker() {
	const { t } = useT();
	const vendors = useEggs((s) => s.vendors);
	const active = useEggs((s) => s.activeVendorId);
	const setActive = useEggs((s) => s.setActiveVendor);
	const vendor = vendors.find((v) => v.id === active);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-4 flex flex-col gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-sm text-muted",
				htmlFor: "shop",
				children: t(bi("You are in", "நீங்கள் உள்ள கடை"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				id: "shop",
				className: "min-h-12 rounded-control border border-line bg-shell px-3 text-base",
				value: active,
				onChange: (e) => setActive(e.target.value),
				children: vendors.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
					value: v.id,
					children: [
						t(v.name),
						" · ",
						t(VENDOR_STATUS[v.status])
					]
				}, v.id))
			}),
			vendor ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("Only this shop’s orders, stock and money are on screen.", "இந்தக் கடையின் ஆர்டர், இருப்பு, பணம் மட்டும் திரையில்."))
			}) : null
		]
	});
}
function VendorHome() {
	const { t, lang } = useT();
	const vendor = useEggs((s) => s.vendors.find((v) => v.id === s.activeVendorId));
	const orders = useEggs((s) => s.orders.filter((o) => o.vendorId === s.activeVendorId));
	const advance = useEggs((s) => s.vendorAdvance);
	const reject = useEggs((s) => s.vendorReject);
	const confirmCancel = useEggs((s) => s.confirmCancel);
	const streets = useEggs((s) => s.streets);
	const products = useEggs((s) => s.products);
	const [reason, setReason] = (0, import_react.useState)("Out of stock");
	const [rider, setRider] = (0, import_react.useState)(false);
	const live = orders.filter((o) => ![
		"delivered",
		"cancelled",
		"rejected"
	].includes(o.status));
	const focus = live[0];
	if (!vendor) return null;
	if (vendor.status !== "approved") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopPicker, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: t(vendor.name)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2",
			children: t(VENDOR_STATUS[vendor.status])
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: t(bi("Command has to approve the shop before orders arrive. Stock can still be prepared.", "ஆர்டர் வரும் முன் நிர்வாகம் அனுமதிக்க வேண்டும். இருப்பைத் தயார் செய்யலாம்."))
		})
	] })] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopPicker, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl",
					children: t(bi("Today", "இன்று"))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					onClick: () => setRider((v) => !v),
					children: rider ? t(bi("Shop view", "கடை பார்வை")) : t(bi("Rider view", "டெலிவரி பார்வை"))
				})]
			}),
			rider && focus ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RiderCard, {}) : null,
			!rider ? live.map((order) => {
				const street = streets.find((s) => s.id === order.address.streetId);
				const next = nextStatus(order.status);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: order.id
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-2xl font-medium",
									children: order.businessName || order.customerName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm",
									children: order.accountType !== "home" ? order.accountType : t(bi("Home", "வீடு"))
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-lg tabular-nums",
								children: inr(order.totalPaise, lang)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-base",
							children: [
								order.address.door,
								order.address.apartment ? `, ${order.address.apartment}` : "",
								" · ",
								street ? t(street.name) : ""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								order.address.landmark || t(bi("No landmark", "அடையாளம் இல்லை")),
								" · ",
								order.phone
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: order.lines.map((l) => `${products.find((p) => p.id === l.productId)?.name[lang] ?? l.productId} × ${l.pack * l.qtyPacks}`).join(" · ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: t(STATUS_LABEL[order.status])
						}),
						order.cancelRequested ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "min-h-14 text-base",
							onClick: () => confirmCancel(order.id),
							children: t(bi("Confirm cancellation", "ரத்தை உறுதி செய்"))
						}) : null,
						order.status === "placed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "min-h-14 text-base",
									onClick: () => advance(order.id, "accepted"),
									children: t(bi("Accept", "ஏற்கவும்"))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "min-h-14 text-base",
									variant: "line",
									onClick: () => reject(order.id, reason),
									children: t(bi("Decline", "நிராகரி"))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									value: reason,
									onChange: (e) => setReason(e.target.value)
								})
							]
						}) : null,
						next && order.status !== "placed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "min-h-14 text-base",
							onClick: () => advance(order.id, next, true),
							children: next === "preparing" ? t(bi("Start packing", "பொதி தொடங்கு")) : next === "out_for_delivery" ? t(bi(`Hand to ${vendor.rider.en}`, `${t(vendor.rider)} இடம் கொடு`)) : t(bi("Mark delivered", "வழங்கப்பட்டது"))
						}) : null,
						order.status === "out_for_delivery" && order.method === "cod" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							className: "min-h-14",
							onClick: () => advance(order.id, "delivered", false),
							children: t(bi("Delivered, cash not collected", "வழங்கப்பட்டது, பணம் வரவில்லை"))
						}) : null
					]
				}, order.id);
			}) : null,
			!rider && live.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("No open orders.", "திறந்த ஆர்டர் இல்லை."))
			}) : null
		]
	});
	function RiderCard() {
		if (!focus || !vendor) return null;
		const street = streets.find((s) => s.id === focus.address.streetId);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			className: "flex flex-col gap-4 bg-ink text-shell",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-shell/80",
					children: [
						t(bi("Rider", "டெலிவரி")),
						" · ",
						t(vendor.rider)
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-4xl",
					children: focus.businessName || focus.customerName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-2xl",
					children: [
						focus.address.door,
						" · ",
						street ? t(street.name) : ""
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: focus.address.landmark }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xl tabular-nums",
					children: focus.phone
				}),
				focus.status === "out_for_delivery" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					className: "min-h-14 bg-shell text-base text-ink",
					onClick: () => advance(focus.id, "delivered", true),
					children: t(bi("Delivered", "வழங்கப்பட்டது"))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: t(bi("Pack it in the shop view, then hand it over.", "கடை பார்வையில் பொதி செய்து, பின் கொடுங்கள்."))
				})
			]
		});
	}
}
function nextStatus(status) {
	if (status === "accepted") return "preparing";
	if (status === "preparing") return "out_for_delivery";
	if (status === "out_for_delivery") return "delivered";
	return null;
}
function VendorStock() {
	const { t, lang } = useT();
	const vendorId = useEggs((s) => s.activeVendorId);
	const rows = useEggs((s) => s.vendorProducts.filter((p) => p.vendorId === vendorId));
	const products = useEggs((s) => s.products);
	const setStock = useEggs((s) => s.vendorSetStock);
	const setPrice = useEggs((s) => s.vendorSetPrice);
	const low = rows.filter((r) => r.stockEggs <= r.lowStockAt);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopPicker, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Stock", "இருப்பு"))
			}),
			low.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: t(bi("Running low", "குறைகிறது"))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: low.map((r) => products.find((p) => p.id === r.productId)?.name[lang]).join(", ")
			})] }) : null,
			rows.map((row) => {
				const product = products.find((p) => p.id === row.productId);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xl",
								children: product ? t(product.name) : row.productId
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-2xl tabular-nums",
								children: row.stockEggs
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "min-h-14",
									variant: "line",
									onClick: () => setStock(row.productId, row.stockEggs - 6),
									children: "-6"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "min-h-14",
									variant: "line",
									onClick: () => setStock(row.productId, row.stockEggs + 6),
									children: "+6"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "min-h-14",
									variant: "line",
									onClick: () => setStock(row.productId, row.stockEggs + 30),
									children: "+30"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm text-muted",
							children: t(bi("Price per egg, rupees", "ஒரு முட்டை விலை, ரூபாய்"))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							inputMode: "decimal",
							defaultValue: String(row.pricePerEggPaise / 100),
							onBlur: (e) => setPrice(row.productId, Math.round(Number(e.target.value) * 100))
						}, `${row.productId}-${row.pricePerEggPaise}`)
					]
				}, row.productId);
			})
		]
	});
}
function VendorStreets() {
	const { t } = useT();
	const vendor = useEggs((s) => s.vendors.find((v) => v.id === s.activeVendorId));
	const assignments = useEggs((s) => s.assignments.filter((a) => a.vendorId === s.activeVendorId));
	const streets = useEggs((s) => s.streets);
	const localities = useEggs((s) => s.localities);
	const setHours = useEggs((s) => s.vendorSetHours);
	const setAccepting = useEggs((s) => s.vendorSetAccepting);
	const setProfile = useEggs((s) => s.vendorProfile);
	const register = useEggs((s) => s.registerVendor);
	const [open, setOpen] = (0, import_react.useState)(vendor?.hours.open ?? "05:00");
	const [close, setClose] = (0, import_react.useState)(vendor?.hours.close ?? "13:00");
	const [form, setForm] = (0, import_react.useState)({
		nameEn: "",
		nameTa: "",
		phone: "",
		localityId: "velachery"
	});
	if (!vendor) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopPicker, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Streets", "தெருக்கள்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(vendor.name)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						defaultValue: vendor.name.en,
						onBlur: (e) => setProfile({ nameEn: e.target.value })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						defaultValue: vendor.name.ta,
						onBlur: (e) => setProfile({ nameTa: e.target.value })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						defaultValue: vendor.phone,
						onBlur: (e) => setProfile({ phone: e.target.value })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							value: open,
							onChange: (e) => setOpen(e.target.value)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							value: close,
							onChange: (e) => setClose(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "min-h-14",
						onClick: () => setHours(open, close),
						children: t(bi("Save hours", "நேரத்தைச் சேமி"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "min-h-14",
						variant: "line",
						onClick: () => setAccepting(!vendor.acceptingOrders),
						children: vendor.acceptingOrders ? t(bi("Pause new orders", "புதிய ஆர்டரை நிறுத்து")) : t(bi("Take orders", "ஆர்டர் எடு"))
					})
				]
			}),
			assignments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("No streets yet. Command assigns them.", "இன்னும் தெரு இல்லை. நிர்வாகம் ஒதுக்கும்."))
			}) : null,
			assignments.map((a) => {
				const street = streets.find((s) => s.id === a.streetId);
				const loc = localities.find((l) => l.id === street?.localityId);
				if (!street) return null;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							loc ? t(loc.name) : "",
							" · ",
							a.role === "primary" ? t(bi("Primary", "முதன்மை")) : t(bi("Backup", "மாற்று"))
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg",
						children: t(street.name)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: street.status === "active" ? t(bi("In service", "சேவையில்")) : t(bi("Paused by command", "நிர்வாகம் நிறுத்தியது"))
					})
				] }, a.streetId + a.role);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(bi("Apply as a new shop", "புதிய கடையாக விண்ணப்பி"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						placeholder: t(bi("Shop name", "கடைப் பெயர்")),
						value: form.nameEn,
						onChange: (e) => setForm({
							...form,
							nameEn: e.target.value
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						placeholder: t(bi("Tamil name", "தமிழ் பெயர்")),
						value: form.nameTa,
						onChange: (e) => setForm({
							...form,
							nameTa: e.target.value
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						placeholder: t(bi("Phone", "தொலைபேசி")),
						value: form.phone,
						onChange: (e) => setForm({
							...form,
							phone: e.target.value
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "min-h-12 rounded-control border border-line bg-shell px-3",
						value: form.localityId,
						onChange: (e) => setForm({
							...form,
							localityId: e.target.value
						}),
						children: localities.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: l.id,
							children: t(l.name)
						}, l.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: !form.nameEn.trim(),
						onClick: () => register(form),
						children: t(bi("Submit for approval", "அனுமதிக்கு அனுப்பு"))
					})
				]
			})
		]
	});
}
function VendorLedger() {
	const { t, lang } = useT();
	const vendor = useEggs((s) => s.vendors.find((v) => v.id === s.activeVendorId));
	const orders = useEggs((s) => s.orders.filter((o) => o.vendorId === s.activeVendorId && o.status === "delivered"));
	const settlements = useEggs((s) => s.settlements.filter((s) => s.vendorId === vendor?.id));
	const offers = useEggs((s) => s.offers.filter((o) => o.vendorId === vendor?.id));
	const toggle = useEggs((s) => s.vendorToggleOffer);
	const today = (0, import_react.useMemo)(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), []);
	if (!vendor) return null;
	const gross = orders.filter((o) => !o.settled && !o.cashPending).reduce((sum, o) => sum + o.totalPaise, 0);
	const commission = Math.round(gross * vendor.commissionBps / 1e4);
	const todayGross = orders.filter((o) => o.date === today).reduce((sum, o) => sum + o.totalPaise, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopPicker, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Money", "பணம்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: t(bi("Delivered today", "இன்று வழங்கியது"))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl tabular-nums",
						children: inr(todayGross, lang)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: t(bi("Unsettled", "தீர்க்கப்படாதது"))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl tabular-nums",
						children: inr(gross - commission, lang)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: t(bi("Commission", "கமிஷன்"))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-2xl tabular-nums",
						children: [vendor.commissionBps / 100, "%"]
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				className: "h-40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data: DEMAND,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "orders",
							hide: true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							dataKey: "revenue",
							fill: "var(--color-ink)",
							radius: [
								4,
								4,
								0,
								0
							]
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-medium",
				children: [
					vendor.rating.toFixed(1),
					" · ",
					vendor.reviewCount,
					" ",
					t(bi("ratings", "மதிப்பெண்"))
				]
			}) }),
			offers.map((offer) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: t(offer.title)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t(offer.detail)
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					onClick: () => toggle(offer.id),
					children: offer.active ? t(bi("On", "ஆன்")) : t(bi("Off", "ஆஃப்"))
				})]
			}, offer.id)),
			settlements.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: row.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "tabular-nums",
				children: [
					t(bi("Net", "நிகரம்")),
					" ",
					inr(row.netPaise, lang),
					" · ",
					row.status
				]
			})] }, row.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("A week of sample demand. Today’s number is yours.", "ஒரு வார மாதிரி தேவை. இன்றைய எண் உங்களுடையது."))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: formatDay(today, lang)
			})
		]
	});
}
//#endregion
export { VendorStreets as i, VendorLedger as n, VendorStock as r, VendorHome as t };
