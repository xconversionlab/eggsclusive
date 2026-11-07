import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as reassignBlock, C as formatDay, E as packLabel, N as tx, P as useEggs, T as inr, _ as TextArea, c as ISSUE_KIND, d as PACKS, g as STREET_STATUS, h as STATUS_LABEL, i as DEMAND, k as readChennai, l as ISSUE_STATUS, m as ROLE_LABEL, n as Button, p as Panel, r as Chip, s as Field, t as ACCOUNT_LABEL, v as VENDOR_STATUS, x as bi } from "./ui-9V5_dOcT.mjs";
import { t as CityDots } from "./catalog-BXbetZ0b.mjs";
import { i as ResponsiveContainer, n as XAxis, r as Bar, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-Dwl5CFTl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useT() {
	const lang = useEggs((s) => s.lang);
	return {
		lang,
		t: (text) => tx(lang, text)
	};
}
function RoleBar() {
	const { t } = useT();
	const role = useEggs((s) => s.actingRole);
	const setRole = useEggs((s) => s.setActingRole);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-4 flex flex-wrap gap-2",
		children: [
			"owner",
			"ops",
			"support",
			"finance"
		].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
			active: role === id,
			onClick: () => setRole(id),
			children: t(ROLE_LABEL[id])
		}, id))
	});
}
function AdminHome() {
	const { t, lang } = useT();
	const orders = useEggs((s) => s.orders);
	const vendors = useEggs((s) => s.vendors);
	const streets = useEggs((s) => s.streets);
	const live = orders.filter((o) => ![
		"delivered",
		"cancelled",
		"rejected"
	].includes(o.status));
	const gross = orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.totalPaise, 0);
	const served = streets.filter((s) => s.status === "active").length;
	const series = DEMAND.map((row, i) => ({
		...row,
		d: String(i + 1)
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("Chennai command", "சென்னை நிர்வாகம்"))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("The city, live.", "நகரம், நேரலையில்."))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: t(bi("Open orders", "திறந்த ஆர்டர்")),
						v: String(live.length)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: t(bi("Delivered value", "வழங்கிய மதிப்பு")),
						v: inr(gross, lang)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: t(bi("Streets in service", "சேவைத் தெருக்கள்")),
						v: String(served)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: t(bi("Approved shops", "அனுமதி கடைகள்")),
						v: String(vendors.filter((v) => v.status === "approved").length)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				className: "h-44",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data: series,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "d",
							tick: {
								fill: "var(--color-muted)",
								fontSize: 12
							},
							axisLine: false,
							tickLine: false
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							dataKey: "orders",
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CityDots, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-medium",
				children: t(bi("Open orders", "திறந்த ஆர்டர்கள்"))
			}),
			live.map((order) => {
				const vendor = vendors.find((v) => v.id === order.vendorId);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								order.id,
								" · ",
								t(STATUS_LABEL[order.status])
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: order.businessName || order.customerName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								vendor ? t(vendor.name) : "",
								" · ",
								t(ACCOUNT_LABEL[order.accountType])
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "tabular-nums",
						children: inr(order.totalPaise, lang)
					})]
				}, order.id);
			})
		]
	});
}
function Stat({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-2xl tabular-nums",
		children: v
	})] });
}
function AdminStreets() {
	const { t } = useT();
	const streets = useEggs((s) => s.streets);
	const localities = useEggs((s) => s.localities);
	const vendors = useEggs((s) => s.vendors);
	const assignments = useEggs((s) => s.assignments);
	const setStatus = useEggs((s) => s.adminSetStreetStatus);
	const assign = useEggs((s) => s.adminSetAssignment);
	const clear = useEggs((s) => s.adminClearAssignment);
	const add = useEggs((s) => s.adminAddStreet);
	const requests = useEggs((s) => s.streetRequests);
	const closeReq = useEggs((s) => s.closeRequest);
	const [loc, setLoc] = (0, import_react.useState)("all");
	const [q, setQ] = (0, import_react.useState)("");
	const [form, setForm] = (0, import_react.useState)({
		localityId: "adyar",
		en: "",
		ta: "",
		aliases: "",
		pin: ""
	});
	const rows = streets.filter((s) => {
		if (loc !== "all" && s.localityId !== loc) return false;
		return `${s.name.en} ${s.name.ta} ${s.aliases.join(" ")}`.toLowerCase().includes(q.trim().toLowerCase());
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Street directory", "தெருப் பட்டியல்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("Assign shops here. The apps do not need a new release.", "கடைகளை இங்கே ஒதுக்குங்கள். செயலிக்கு புதிய வெளியீடு தேவையில்லை."))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CityDots, { activeId: loc === "all" ? void 0 : loc }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 overflow-x-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: loc === "all",
					onClick: () => setLoc("all"),
					children: t(bi("All", "அனைத்தும்"))
				}), localities.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: loc === l.id,
					onClick: () => setLoc(l.id),
					children: t(l.name)
				}, l.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: t(bi("Search English, Tamil, or a short form", "ஆங்கிலம், தமிழ் அல்லது சுருக்கம்"))
			}),
			rows.map((street) => {
				const links = assignments.filter((a) => a.streetId === street.id);
				const primary = links.find((a) => a.role === "primary");
				const locality = localities.find((l) => l.id === street.localityId);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										locality ? t(locality.name) : "",
										" · ",
										street.pin
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-medium",
									children: t(street.name)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: street.aliases.join(" · ")
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm",
								children: t(STREET_STATUS[street.status])
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								"active",
								"suspended",
								"inactive"
							].map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								active: street.status === status,
								onClick: () => setStatus(street.id, status),
								children: t(STREET_STATUS[status])
							}, status))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2 md:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "min-h-12 rounded-control border border-line bg-shell px-3",
								value: primary?.vendorId ?? "",
								onChange: (e) => e.target.value && assign(street.id, e.target.value, "primary"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: t(bi("Primary shop", "முதன்மைக் கடை"))
								}), vendors.filter((v) => v.status === "approved").map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: v.id,
									children: t(v.name)
								}, v.id))]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "min-h-12 rounded-control border border-line bg-shell px-3",
								value: "",
								onChange: (e) => e.target.value && assign(street.id, e.target.value, "backup"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: t(bi("Add backup", "மாற்று சேர்"))
								}), vendors.filter((v) => v.status === "approved").map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: v.id,
									children: t(v.name)
								}, v.id))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: links.map((link) => {
								const vendor = vendors.find((v) => v.id === link.vendorId);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "line",
									onClick: () => clear(street.id, link.vendorId),
									children: [
										link.role === "primary" ? t(bi("Primary", "முதன்மை")) : t(bi("Backup", "மாற்று")),
										": ",
										vendor ? t(vendor.name) : link.vendorId,
										" ×"
									]
								}, link.vendorId + link.role);
							})
						})
					]
				}, street.id);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(bi("Add a street", "தெரு சேர்"))
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						placeholder: t(bi("English name", "ஆங்கிலப் பெயர்")),
						value: form.en,
						onChange: (e) => setForm({
							...form,
							en: e.target.value
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						placeholder: t(bi("Tamil name", "தமிழ் பெயர்")),
						value: form.ta,
						onChange: (e) => setForm({
							...form,
							ta: e.target.value
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						placeholder: t(bi("Other spellings, comma separated", "மற்ற எழுத்துகள், காற்புள்ளி")),
						value: form.aliases,
						onChange: (e) => setForm({
							...form,
							aliases: e.target.value
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						placeholder: t(bi("PIN", "அஞ்சல்")),
						value: form.pin,
						onChange: (e) => setForm({
							...form,
							pin: e.target.value
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => add(form),
						children: t(bi("Add to directory", "பட்டியலில் சேர்"))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-medium",
				children: t(bi("Requested streets", "கோரப்பட்ட தெருக்கள்"))
			}),
			requests.map((req) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: req.query }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: req.status
				})] }), req.status === "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					onClick: () => closeReq(req.id),
					children: t(bi("Mark added", "சேர்த்ததாகக் குறி"))
				}) : null]
			}, req.id))
		]
	});
}
function AdminVendors() {
	const { t, lang } = useT();
	const vendors = useEggs((s) => s.vendors);
	const setStatus = useEggs((s) => s.adminSetVendorStatus);
	const setBps = useEggs((s) => s.adminSetCommission);
	const rows = useEggs((s) => s.vendorProducts);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Shops", "கடைகள்"))
			}),
			vendors.map((vendor) => {
				const low = rows.filter((r) => r.vendorId === vendor.id && r.stockEggs <= r.lowStockAt).length;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xl",
								children: t(vendor.name)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									vendor.phone,
									" · ",
									vendor.hours.open,
									"–",
									vendor.hours.close,
									" · ",
									vendor.rating.toFixed(1)
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm",
								children: t(VENDOR_STATUS[vendor.status])
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								t(bi("Low lines", "குறைந்த வரிசை")),
								": ",
								low,
								" · ",
								t(bi("Commission", "கமிஷன்")),
								" ",
								vendor.commissionBps / 100,
								"%"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								"approved",
								"pending",
								"suspended"
							].map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								active: vendor.status === status,
								onClick: () => setStatus(vendor.id, status),
								children: t(VENDOR_STATUS[status])
							}, status))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm text-muted",
							children: t(bi("Commission, percent", "கமிஷன், சதவீதம்"))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							defaultValue: String(vendor.commissionBps / 100),
							onBlur: (e) => setBps(vendor.id, Math.round(Number(e.target.value) * 100))
						}, vendor.commissionBps)
					]
				}, vendor.id);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: lang === "ta" ? "ஒவ்வொரு கடையின் தரவும் தனி." : "Each shop’s stock and money stay separate."
			})
		]
	});
}
function AdminOrders() {
	const { t, lang } = useT();
	const orders = useEggs((s) => s.orders);
	const vendors = useEggs((s) => s.vendors);
	const reassign = useEggs((s) => s.adminReassign);
	const [pick, setPick] = (0, import_react.useState)({});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Orders", "ஆர்டர்கள்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t(bi("Paid orders stay with the shop that was paid. The move is written on the order, never silent.", "செலுத்திய ஆர்டர் பணம் சென்ற கடையிலேயே இருக்கும். நகர்த்தல் ஆர்டரில் எழுதப்படும்."))
			}),
			orders.map((order) => {
				const block = reassignBlock(order);
				const vendor = vendors.find((v) => v.id === order.vendorId);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										order.id,
										" · ",
										formatDay(order.date, lang),
										" · ",
										t(STATUS_LABEL[order.status])
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: order.businessName || order.customerName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										vendor ? t(vendor.name) : "",
										" · ",
										order.method,
										" · ",
										t(bi("captured", "பிடித்தது")),
										" ",
										inr(order.capturedPaise, lang)
									]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "tabular-nums",
								children: inr(order.totalPaise, lang)
							})]
						}),
						block === "PAID_LOCK" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: t(bi("Blocked. Refund from the desk, then the customer orders again.", "தடை. மேசையில் பணம் திருப்புங்கள், பின் வாடிக்கையாளர் மீண்டும் ஆர்டர் செய்யட்டும்."))
						}) : null,
						block === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "min-h-12 flex-1 rounded-control border border-line bg-shell px-3",
								value: pick[order.id] ?? "",
								onChange: (e) => setPick({
									...pick,
									[order.id]: e.target.value
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: t(bi("Move unpaid order", "செலுத்தாத ஆர்டரை நகர்த்து"))
								}), vendors.filter((v) => v.status === "approved" && v.id !== order.vendorId).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: v.id,
									children: t(v.name)
								}, v.id))]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								disabled: !pick[order.id],
								onClick: () => reassign(order.id, pick[order.id]),
								children: t(bi("Move", "நகர்த்து"))
							})]
						}) : null
					]
				}, order.id);
			})
		]
	});
}
function AdminCatalogue() {
	const { t, lang } = useT();
	const products = useEggs((s) => s.products);
	const rows = useEggs((s) => s.vendorProducts);
	const vendors = useEggs((s) => s.vendors);
	const togglePack = useEggs((s) => s.adminTogglePack);
	const toggleProduct = useEggs((s) => s.adminToggleProduct);
	const setPrice = useEggs((s) => s.adminSetVendorPrice);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Catalogue", "பட்டியல்"))
			}),
			products.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl",
							children: t(product.name)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							onClick: () => toggleProduct(product.id),
							children: product.active ? t(bi("Live", "நேரலை")) : t(bi("Hidden", "மறைவு"))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: PACKS.map((pack) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: product.packs.includes(pack),
							onClick: () => togglePack(product.id, pack),
							children: packLabel(pack, lang)
						}, pack))
					}),
					rows.filter((r) => r.productId === product.id).map((row) => {
						const vendor = vendors.find((v) => v.id === row.vendorId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid items-center gap-2 sm:grid-cols-[1fr_8rem_6rem]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm",
									children: vendor ? t(vendor.name) : row.vendorId
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm tabular-nums text-muted",
									children: [
										row.stockEggs,
										" ",
										t(bi("eggs", "முட்டை"))
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									defaultValue: String(row.pricePerEggPaise / 100),
									onBlur: (e) => setPrice(row.vendorId, product.id, Math.round(Number(e.target.value) * 100))
								}, `${row.vendorId}-${row.pricePerEggPaise}`)
							]
						}, row.vendorId);
					})
				]
			}, product.id))
		]
	});
}
function AdminOps() {
	const { t, lang } = useT();
	const orders = useEggs((s) => s.orders);
	const complaints = useEggs((s) => s.complaints);
	const resolve = useEggs((s) => s.resolveIssue);
	const coupons = useEggs((s) => s.coupons);
	const subs = useEggs((s) => s.subscriptions);
	const release = useEggs((s) => s.releaseDueSubs);
	const audits = useEggs((s) => s.audits);
	const roles = useEggs((s) => s.roles);
	const setPerm = useEggs((s) => s.setRolePerm);
	const config = useEggs((s) => s.config);
	const setConfig = useEggs((s) => s.setConfig);
	const campaign = useEggs((s) => s.campaign);
	const setCampaign = useEggs((s) => s.setCampaign);
	const broadcast = useEggs((s) => s.broadcast);
	const settlements = useEggs((s) => s.settlements);
	const markSettled = useEggs((s) => s.markSettled);
	const vendors = useEggs((s) => s.vendors);
	const support = useEggs((s) => s.support);
	const [note, setNote] = (0, import_react.useState)("");
	const [title, setTitle] = (0, import_react.useState)(campaign.title.en);
	const [body, setBody] = (0, import_react.useState)(campaign.body.en);
	const customers = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const order of orders) {
			const key = order.customerName;
			const prev = map.get(key);
			map.set(key, {
				name: key,
				type: order.accountType,
				n: (prev?.n ?? 0) + 1
			});
		}
		return [...map.values()];
	}, [orders]);
	const paid = orders.filter((o) => o.capturedPaise > 0).reduce((sum, o) => sum + o.capturedPaise, 0);
	const keys = [
		"streets",
		"vendors",
		"reassign",
		"refunds",
		"settle",
		"broadcast"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: t(bi("Desk", "மேசை"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: t(bi("Captured", "பிடித்தது")),
						v: inr(paid, lang)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: t(bi("Open issues", "திறந்த புகார்")),
						v: String(complaints.filter((c) => c.status === "open").length)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: t(bi("Plans", "சந்தா")),
						v: String(subs.filter((s) => s.status === "active").length)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(bi("City", "நகரம்"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: ["Chennai · ", config.cityActive ? t(bi("open", "திறந்து")) : t(bi("closed", "மூடல்"))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								active: config.cityActive,
								onClick: () => setConfig({ cityActive: !config.cityActive }),
								children: t(bi("City active", "நகரம் செயலில்"))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								active: config.upiEnabled,
								onClick: () => setConfig({ upiEnabled: !config.upiEnabled }),
								children: "UPI"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								active: config.codEnabled,
								onClick: () => setConfig({ codEnabled: !config.codEnabled }),
								children: t(bi("Cash", "பணம்"))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								active: config.walletEnabled,
								onClick: () => setConfig({ walletEnabled: !config.walletEnabled }),
								children: t(bi("Wallet", "பணப்பை"))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							t(bi("Early slots open at", "அதிகாலை தொடக்கம்")),
							" ",
							config.earlyOpen,
							". ",
							t(bi("Trade discount", "வணிகத் தள்ளுபடி")),
							" ",
							config.tradeBps / 100,
							"%."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(bi("Campaign", "பிரச்சாரம்"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						value: title,
						onChange: (e) => setTitle(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
						value: body,
						onChange: (e) => setBody(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => setCampaign({
								titleEn: title,
								bodyEn: body,
								active: true
							}),
							children: t(bi("Publish", "வெளியிடு"))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							onClick: () => setCampaign({ active: !campaign.active }),
							children: campaign.active ? t(bi("Hide", "மறை")) : t(bi("Show", "காட்டு"))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-medium",
					children: t(bi("Coupons", "கூப்பன்கள்"))
				}), coupons.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm",
					children: [
						c.code,
						" · ",
						t(c.label),
						" · ",
						c.active ? t(bi("on", "ஆன்")) : t(bi("off", "ஆஃப்"))
					]
				}, c.code))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(bi("Subscriptions", "சந்தாக்கள்"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: t(bi("Release creates orders only for the original shop. If that shop cannot fulfil, the drop is held.", "விடுவிப்பு அசல் கடைக்கு மட்டும் ஆர்டர் உருவாக்கும். அந்தக் கடை செய்ய முடியாவிட்டால் நிறுத்தப்படும்."))
					}),
					subs.map((sub) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							sub.id,
							" · ",
							sub.status,
							" · ",
							formatDay(sub.nextDate, lang)
						]
					}, sub.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => release(),
						children: t(bi("Release due drops", "நிலுவை விநியோகத்தை விடு"))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-medium",
				children: t(bi("Issues", "புகார்கள்"))
			}),
			complaints.map((issue) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-medium",
						children: [
							issue.orderId,
							" · ",
							t(ISSUE_KIND[issue.kind])
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: issue.note
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: t(ISSUE_STATUS[issue.status])
					}),
					issue.status === "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "line",
								onClick: () => resolve(issue.id, "replacement"),
								children: t(bi("Replace, same shop", "அதே கடையில் மாற்று"))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "line",
								onClick: () => resolve(issue.id, "refunded"),
								children: t(bi("Refund wallet", "பணப்பைக்குத் திருப்பு"))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "line",
								onClick: () => resolve(issue.id, "closed"),
								children: t(bi("Close", "மூடு"))
							})
						]
					}) : null
				]
			}, issue.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-medium",
				children: t(bi("Settlements", "தீர்வுகள்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: vendors.filter((v) => v.status === "approved").map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					onClick: () => markSettled(v.id),
					children: t(bi(`Settle ${v.name.en}`, `${t(v.name)} தீர்`))
				}, v.id))
			}),
			settlements.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm",
				children: [
					row.label,
					" · ",
					row.vendorId,
					" · ",
					inr(row.netPaise, lang),
					" · ",
					row.status
				]
			}, row.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: t(bi("Broadcast", "ஒலிபரப்பு"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
						value: note,
						onChange: (e) => setNote(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: !note.trim(),
						onClick: () => {
							broadcast(note.trim(), note.trim());
							setNote("");
						},
						children: t(bi("Send notice", "அறிவிப்பு அனுப்பு"))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-medium",
				children: t(bi("Customers", "வாடிக்கையாளர்கள்"))
			}),
			customers.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm",
				children: [
					c.name,
					" · ",
					c.type,
					" · ",
					c.n
				]
			}, c.name)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-medium",
				children: t(bi("Roles", "பாத்திரங்கள்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-card border border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[36rem] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3 font-medium",
							children: t(bi("Seat", "இருக்கை"))
						}), keys.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3 font-medium",
							children: k
						}, k))]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: roles.map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-3",
							children: t(ROLE_LABEL[role.id])
						}), keys.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: role[k],
								onChange: (e) => setPerm(role.id, k, e.target.checked)
							})
						}, k))]
					}, role.id)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-medium",
				children: t(bi("Desk thread", "மேசை உரையாடல்"))
			}),
			support.slice(-4).map((msg, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm",
				children: [
					msg.from,
					": ",
					msg.text
				]
			}, i)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-medium",
				children: t(bi("Audit", "தணிக்கை"))
			}),
			audits.slice(0, 12).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted",
					children: [
						row.actor,
						" · ",
						row.action,
						" · "
					]
				}), row.detail]
			}, row.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-medium",
					children: t(bi("How this holds together", "இது எப்படி இணைகிறது"))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: t(bi("Customer, vendor and command share one street engine. Shops only see their own orders. A captured payment is never moved to another shop. Pin codes and the map are recorded; the directory decides service.", "வாடிக்கையாளர், கடை, நிர்வாகம் ஒரே தெரு இயந்திரத்தைப் பகிர்கின்றன. கடை தன் ஆர்டரை மட்டும் பார்க்கும். பிடித்த பணம் வேறு கடைக்குப் போகாது. அஞ்சல் குறியீடும் வரைபடமும் பதிவு; சேவையைப் பட்டியல் முடிக்கும்."))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: readChennai().label
				})
			] })
		]
	});
}
//#endregion
export { AdminStreets as a, AdminOrders as i, AdminHome as n, AdminVendors as o, AdminOps as r, AdminCatalogue as t };
