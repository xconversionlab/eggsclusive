import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, _ as lazyRouteComponent, b as Link, d as Scripts, f as HeadContent, g as Outlet, h as createRouter, p as useRouterState, v as createFileRoute, x as useRouter, y as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as tx, O as rankVendors, P as useEggs, S as cn, a as EXCEPTION_LABEL, j as searchStreets, k as readChennai, n as Button, p as Panel, r as Chip, s as Field, u as NavLink, x as bi, y as Wordmark } from "./ui-9V5_dOcT.mjs";
import { a as House, i as Repeat, n as TriangleAlert, o as Egg, r as Store, s as Bell, t as UserRound } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CMhCLoa6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var OTP = "482913";
function Onboarding() {
	const lang = useEggs((s) => s.lang);
	const profile = useEggs((s) => s.profile);
	const address = useEggs((s) => s.address);
	const localities = useEggs((s) => s.localities);
	const streets = useEggs((s) => s.streets);
	const vendors = useEggs((s) => s.vendors);
	const assignments = useEggs((s) => s.assignments);
	const vendorProducts = useEggs((s) => s.vendorProducts);
	const capacities = useEggs((s) => s.capacities);
	const slots = useEggs((s) => s.slots);
	const verifyPhone = useEggs((s) => s.verifyPhone);
	const confirmAddress = useEggs((s) => s.confirmAddress);
	const requestStreet = useEggs((s) => s.requestStreet);
	const t = (text) => tx(lang, text);
	const [step, setStep] = (0, import_react.useState)(profile.phoneVerified ? 2 : 1);
	const [name, setName] = (0, import_react.useState)(profile.name);
	const [phone, setPhone] = (0, import_react.useState)(profile.phone);
	const [sent, setSent] = (0, import_react.useState)(profile.phoneVerified);
	const [code, setCode] = (0, import_react.useState)("");
	const [localityId, setLocalityId] = (0, import_react.useState)(address?.localityId ?? "besant");
	const [query, setQuery] = (0, import_react.useState)("");
	const [streetId, setStreetId] = (0, import_react.useState)(address?.streetId ?? "");
	const [door, setDoor] = (0, import_react.useState)(address?.door ?? "");
	const [apartment, setApartment] = (0, import_react.useState)(address?.apartment ?? "");
	const [landmark, setLandmark] = (0, import_react.useState)(address?.landmark ?? "");
	const matches = (0, import_react.useMemo)(() => searchStreets(streets, localities, query, localityId).slice(0, 8), [
		streets,
		localities,
		query,
		localityId
	]);
	const street = streets.find((s) => s.id === streetId);
	const decision = street ? rankVendors({
		streetId: street.id,
		streets,
		vendors,
		assignments,
		vendorProducts,
		capacities,
		slots,
		clock: readChennai()
	}) : null;
	const phoneOk = /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex max-w-xl flex-col gap-6 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						t(bi("Chennai", "சென்னை")),
						" · 0",
						step,
						" / 03"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-tight md:text-5xl",
					children: step === 1 ? t(bi("Eggs from the street that actually has them.", "முட்டை கிடைக்கும் தெருவிலிருந்தே.")) : step === 2 ? t(bi("Which street is the door on?", "வாசல் எந்தத் தெருவில்?")) : t(bi("Confirm the door.", "வாசலை உறுதி செய்யுங்கள்."))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted",
					children: t(bi("Service follows a street directory in English and Tamil. A pin code alone never assigns a shop.", "சேவை ஆங்கிலம் மற்றும் தமிழ் தெருப் பட்டியலைப் பின்பற்றும். அஞ்சல் குறியீடு மட்டும் கடையை ஒதுக்காது."))
				})
			] }),
			step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm text-muted",
						htmlFor: "name",
						children: t(bi("Name", "பெயர்"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "name",
						value: name,
						onChange: (e) => setName(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm text-muted",
						htmlFor: "phone",
						children: t(bi("Mobile number", "கைபேசி எண்"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						id: "phone",
						inputMode: "numeric",
						autoComplete: "tel",
						placeholder: "9840011220",
						value: phone,
						onChange: (e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))
					}),
					sent ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm text-muted",
							htmlFor: "otp",
							children: t(bi("One-time code", "ஒரு முறை குறியீடு"))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							id: "otp",
							"data-testid": "otp-input",
							inputMode: "numeric",
							autoComplete: "one-time-code",
							value: code,
							onChange: (e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: t(bi(`Preview code ${OTP}. Production would send this by SMS.`, `முன்னோட்டக் குறியீடு ${OTP}. நேரடியாக SMS போகும்.`))
						})
					] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-2",
						disabled: !phoneOk || sent && code !== OTP,
						onClick: () => {
							if (!sent) {
								setSent(true);
								return;
							}
							verifyPhone(phone, name);
							setStep(2);
						},
						children: sent ? t(bi("Continue", "தொடரவும்")) : t(bi("Send code", "குறியீடு அனுப்பு"))
					})
				]
			}) : null,
			step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2 overflow-x-auto pb-1",
						children: localities.map((loc) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: loc.id === localityId,
							onClick: () => {
								setLocalityId(loc.id);
								setStreetId("");
							},
							children: t(loc.name)
						}, loc.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						"data-testid": "street-search",
						value: query,
						placeholder: t(bi("4th cross, LB Road, லூஸ், ECR", "4th cross, LB Road, லூஸ், ECR")),
						onChange: (e) => setQuery(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2",
						children: [matches.map((row) => {
							const verdict = rankVendors({
								streetId: row.id,
								streets,
								vendors,
								assignments,
								vendorProducts,
								capacities,
								slots,
								clock: readChennai()
							});
							const primary = vendors.find((v) => v.id === verdict.recommendedId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "press rounded-card border border-line bg-shell p-4 text-left",
								onClick: () => {
									setStreetId(row.id);
									setStep(3);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block font-medium",
									children: t(row.name)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 block text-sm text-muted",
									children: row.status !== "active" ? t(EXCEPTION_LABEL[row.status === "suspended" ? "STREET_SUSPENDED" : "STREET_INACTIVE"]) : verdict.ok ? t(bi(`Served · ${primary?.name.en ?? ""}`, `சேவை · ${primary?.name.ta ?? ""}`)) : t(EXCEPTION_LABEL[verdict.exception ?? "NO_VENDOR"])
								})]
							}, row.id);
						}), matches.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: t(EXCEPTION_LABEL.STREET_UNKNOWN)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-3",
							variant: "line",
							onClick: () => requestStreet(query || localityId, localityId),
							children: t(bi("Request this street", "இந்தத் தெருவைக் கோருங்கள்"))
						})] }) : null]
					})
				]
			}) : null,
			step === 3 && street ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: t(localities.find((l) => l.id === street.localityId)?.name ?? bi("", ""))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-3xl",
							children: t(street.name)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: t(bi("Pin code is recorded. Routing uses the street.", "அஞ்சல் குறியீடு பதிவாகும். வழித்தடம் தெருவைப் பயன்படுத்தும்."))
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							placeholder: t(bi("Door number", "கதவு எண்")),
							value: door,
							onChange: (e) => setDoor(e.target.value),
							"data-testid": "door"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							placeholder: t(bi("Apartment", "அபார்ட்மெண்ட்")),
							value: apartment,
							onChange: (e) => setApartment(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						placeholder: t(bi("Landmark", "அடையாளம்")),
						value: landmark,
						onChange: (e) => setLandmark(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceCard, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							onClick: () => setStep(2),
							children: t(bi("Back", "பின்"))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							"data-testid": "confirm-door",
							disabled: !door.trim(),
							onClick: () => {
								const next = {
									city: "chennai",
									localityId: street.localityId,
									streetId: street.id,
									door: door.trim(),
									apartment: apartment.trim(),
									landmark: landmark.trim(),
									pin: street.pin,
									confirmed: true
								};
								confirmAddress(next);
							},
							children: t(bi("This is my door", "இது என் வாசல்"))
						})]
					})
				]
			}) : null
		]
	});
	function ServiceCard() {
		if (!decision) return null;
		if (!decision.ok) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium",
			children: t(bi("Not in service", "சேவையில் இல்லை"))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: t(EXCEPTION_LABEL[decision.exception ?? "NO_VENDOR"])
		})] });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-2",
			children: decision.ranked.map((row) => {
				const vendor = vendors.find((v) => v.id === row.vendorId);
				if (!vendor) return null;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: row.role === "primary" ? t(bi("Primary shop", "முதன்மைக் கடை")) : t(bi("Backup shop", "மாற்றுக் கடை"))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-lg font-medium",
						children: t(vendor.name)
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm tabular-nums text-muted",
						children: vendor.rating.toFixed(1)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted",
					children: [
						vendor.hours.open,
						"–",
						vendor.hours.close,
						" · ",
						row.eligible ? t(bi(`${row.etaMin} min once accepted`, `ஏற்ற பின் ${row.etaMin} நிமிடம்`)) : t(EXCEPTION_LABEL[row.reason ?? "VENDOR_UNAVAILABLE"])
					]
				})] }, row.vendorId);
			})
		});
	}
}
function useHydrated() {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const finish = () => setReady(true);
		if (useEggs.persist.hasHydrated()) finish();
		return useEggs.persist.onFinishHydration(finish);
	}, []);
	return ready;
}
function Splash() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-paper px-6 text-ink",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Chennai"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-5xl tracking-tight",
					children: "Eggsclusive"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-base text-muted",
					children: "Street delivery. Not a pin-code guess."
				})
			]
		})
	});
}
function Frame({ children }) {
	const ready = useHydrated();
	const lang = useEggs((s) => s.lang);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		document.documentElement.lang = lang === "ta" ? "ta" : "en";
	}, [lang, ready]);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Splash, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-paper text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlashBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children })
		]
	});
}
function TopBar() {
	const path = useRouterState({ select: (s) => s.location.pathname });
	const lang = useEggs((s) => s.lang);
	const setLang = useEggs((s) => s.setLang);
	const notices = useEggs((s) => s.notices);
	const mark = useEggs((s) => s.markNotices);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [clock, setClock] = (0, import_react.useState)(() => readChennai());
	(0, import_react.useEffect)(() => {
		const t = setInterval(() => setClock(readChennai()), 3e4);
		return () => clearInterval(t);
	}, []);
	const unread = notices.filter((n) => !n.read).length;
	const surface = path.startsWith("/admin") ? "/admin" : path.startsWith("/vendor") ? "/vendor" : "/";
	const t = (text) => tx(lang, text);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-30 border-b border-line bg-paper",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "min-h-11",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden text-sm text-muted md:block",
						children: clock.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "press relative grid h-11 w-11 place-items-center rounded-control border border-line bg-shell",
						"aria-label": t(bi("Notices", "அறிவிப்பு")),
						onClick: () => {
							setOpen((v) => !v);
							mark();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4" }), unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-2 right-2 h-2 w-2 rounded-full bg-mark" }) : null]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid flex-1 grid-cols-3 gap-1 rounded-card border border-line bg-shell p-1 md:flex-none",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Surface, {
							to: "/",
							active: surface === "/",
							label: t(bi("Customer", "வாடிக்கையாளர்"))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Surface, {
							to: "/vendor",
							active: surface === "/vendor",
							label: t(bi("Vendor", "கடை"))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Surface, {
							to: "/admin",
							active: surface === "/admin",
							label: t(bi("Command", "நிர்வாகம்"))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "press min-h-11 rounded-control border border-line bg-shell px-3 text-sm",
					onClick: () => setLang(lang === "en" ? "ta" : "en"),
					children: lang === "en" ? "தமிழ்" : "English"
				})]
			})]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto w-full max-w-6xl px-4 pb-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-72 space-y-3 overflow-auto rounded-card border border-line bg-shell p-4",
				children: [notices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t(bi("No notices.", "அறிவிப்பு இல்லை."))
				}) : null, notices.slice(0, 8).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: t(n.title)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t(n.body)
				})] }, n.id))]
			})
		}) : null]
	});
}
function Surface({ to, label, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to,
		className: cn("press inline-flex min-h-11 items-center justify-center rounded-control px-3 text-sm", active ? "bg-ink text-shell" : "text-ink"),
		children: label
	});
}
function FlashBar() {
	const flash = useEggs((s) => s.flash);
	const lang = useEggs((s) => s.lang);
	const clear = useEggs((s) => s.clearFlash);
	(0, import_react.useEffect)(() => {
		if (!flash) return;
		const t = setTimeout(() => clear(), 3800);
		return () => clearTimeout(t);
	}, [flash, clear]);
	if (!flash) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "border-b border-line bg-foam px-4 py-2 text-sm text-ink",
		children: tx(lang, flash.text)
	});
}
function Shell({ children }) {
	const path = useRouterState({ select: (s) => s.location.pathname });
	const onboarded = useEggs((s) => s.profile.phoneVerified && !!s.address?.confirmed && !s.editingStreet);
	const lang = useEggs((s) => s.lang);
	const t = (text) => tx(lang, text);
	const customer = !path.startsWith("/vendor") && !path.startsWith("/admin");
	const vendor = path.startsWith("/vendor");
	const admin = path.startsWith("/admin");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("mx-auto w-full px-4 pt-4", admin ? "max-w-6xl" : "max-w-3xl", customer && onboarded ? "pb-28 md:pb-10" : "pb-10"),
		children: [
			vendor ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VendorNav, { t }) : null,
			admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminNav, { t }) : null,
			customer && onboarded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "mb-4 hidden gap-1 md:flex",
				"aria-label": t(bi("Customer", "வாடிக்கையாளர்")),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerLinks, { t })
			}) : null,
			children,
			customer && onboarded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-20 border-t border-line bg-shell md:hidden",
				"aria-label": t(bi("Customer", "வாடிக்கையாளர்")),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid max-w-3xl grid-cols-5 px-2 py-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerLinks, {
						t,
						icons: true
					})
				})
			}) : null
		]
	});
}
function CustomerLinks({ t, icons }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
			to: "/",
			label: t(bi("Home", "முகப்பு")),
			icon: icons ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "h-4 w-4" }) : void 0
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
			to: "/browse",
			label: t(bi("Eggs", "முட்டை")),
			icon: icons ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Egg, { className: "h-4 w-4" }) : void 0
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
			to: "/orders",
			label: t(bi("Orders", "ஆர்டர்")),
			icon: icons ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "h-4 w-4" }) : void 0
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
			to: "/plans",
			label: t(bi("Plans", "சந்தா")),
			icon: icons ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, { className: "h-4 w-4" }) : void 0
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
			to: "/account",
			label: t(bi("You", "நீங்கள்")),
			icon: icons ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-4 w-4" }) : void 0
		})
	] });
}
function VendorNav({ t }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		className: "mb-4 flex gap-1 overflow-x-auto",
		"aria-label": t(bi("Vendor", "கடை")),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
				to: "/vendor",
				label: t(bi("Orders", "ஆர்டர்")),
				exact: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
				to: "/vendor/stock",
				label: t(bi("Stock", "இருப்பு"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
				to: "/vendor/streets",
				label: t(bi("Streets", "தெரு"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
				to: "/vendor/ledger",
				label: t(bi("Money", "பணம்"))
			})
		]
	});
}
function AdminNav({ t }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		className: "mb-4 flex gap-1 overflow-x-auto",
		"aria-label": t(bi("Command", "நிர்வாகம்")),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
				to: "/admin",
				label: t(bi("Live", "நேரலை")),
				exact: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
				to: "/admin/streets",
				label: t(bi("Streets", "தெருக்கள்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
				to: "/admin/vendors",
				label: t(bi("Vendors", "கடைகள்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
				to: "/admin/orders",
				label: t(bi("Orders", "ஆர்டர்கள்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
				to: "/admin/catalogue",
				label: t(bi("Catalogue", "பட்டியல்"))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
				to: "/admin/ops",
				label: t(bi("Desk", "மேசை"))
			})
		]
	});
}
function Gate({ children }) {
	const verified = useEggs((s) => s.profile.phoneVerified);
	const address = useEggs((s) => s.address);
	const editing = useEggs((s) => s.editingStreet);
	if (!verified || !address?.confirmed || editing) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Onboarding, {});
	return children;
}
var styles_default = "/assets/styles-gT9YT9YU.css";
var Route$20 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Eggsclusive — Chennai street eggs" },
			{
				name: "description",
				content: "Neighbourhood egg delivery in Chennai. Matched to your street, not a pin-code guess."
			},
			{
				name: "theme-color",
				content: "#1c1915"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$19 = () => import("./routes-v_1rRKZo.mjs");
var Route$19 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$19, "component") });
var $$splitComponentImporter$18 = () => import("./account-BhifFOpe.mjs");
var Route$18 = createFileRoute("/account")({ component: lazyRouteComponent($$splitComponentImporter$18, "component") });
var $$splitComponentImporter$17 = () => import("./admin-rRckGftk.mjs");
var Route$17 = createFileRoute("/admin")({ component: lazyRouteComponent($$splitComponentImporter$17, "component") });
var $$splitComponentImporter$16 = () => import("./browse-CVW9gKDr.mjs");
var Route$16 = createFileRoute("/browse")({ component: lazyRouteComponent($$splitComponentImporter$16, "component") });
var $$splitComponentImporter$15 = () => import("./cart-CTzBYuU9.mjs");
var Route$15 = createFileRoute("/cart")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./orders-q_g0CcC5.mjs");
var Route$14 = createFileRoute("/orders")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./plans-CAfmcQ35.mjs");
var Route$13 = createFileRoute("/plans")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./vendor-Cd-EsRpB.mjs");
var Route$12 = createFileRoute("/vendor")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./admin.index-DDqdd-Gz.mjs");
var Route$11 = createFileRoute("/admin/")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./admin.catalogue-BFj_FnZZ.mjs");
var Route$10 = createFileRoute("/admin/catalogue")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./admin.ops-rc73FJkq.mjs");
var Route$9 = createFileRoute("/admin/ops")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./admin.orders-Br0mfJ6T.mjs");
var Route$8 = createFileRoute("/admin/orders")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./admin.streets-kzBuW1Q4.mjs");
var Route$7 = createFileRoute("/admin/streets")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./admin.vendors-CdlyrLQc.mjs");
var Route$6 = createFileRoute("/admin/vendors")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./product._sku-BbR-Fkuz.mjs");
var Route$5 = createFileRoute("/product/$sku")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./track._orderId-BcUltXp6.mjs");
var Route$4 = createFileRoute("/track/$orderId")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./vendor.index-CG1oI-5r.mjs");
var Route$3 = createFileRoute("/vendor/")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./vendor.ledger-DbYzKlNr.mjs");
var Route$2 = createFileRoute("/vendor/ledger")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./vendor.stock-bynWmimA.mjs");
var Route$1 = createFileRoute("/vendor/stock")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./vendor.streets-HrKvYc52.mjs");
var Route = createFileRoute("/vendor/streets")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var IndexRoute = Route$19.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$20
});
var AccountRoute = Route$18.update({
	id: "/account",
	path: "/account",
	getParentRoute: () => Route$20
});
var AdminRoute = Route$17.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => Route$20
});
var BrowseRoute = Route$16.update({
	id: "/browse",
	path: "/browse",
	getParentRoute: () => Route$20
});
var CartRoute = Route$15.update({
	id: "/cart",
	path: "/cart",
	getParentRoute: () => Route$20
});
var OrdersRoute = Route$14.update({
	id: "/orders",
	path: "/orders",
	getParentRoute: () => Route$20
});
var PlansRoute = Route$13.update({
	id: "/plans",
	path: "/plans",
	getParentRoute: () => Route$20
});
var VendorRoute = Route$12.update({
	id: "/vendor",
	path: "/vendor",
	getParentRoute: () => Route$20
});
var AdminIndexRoute = Route$11.update({
	id: "/",
	path: "/",
	getParentRoute: () => AdminRoute
});
var AdminCatalogueRoute = Route$10.update({
	id: "/catalogue",
	path: "/catalogue",
	getParentRoute: () => AdminRoute
});
var AdminOpsRoute = Route$9.update({
	id: "/ops",
	path: "/ops",
	getParentRoute: () => AdminRoute
});
var AdminOrdersRoute = Route$8.update({
	id: "/orders",
	path: "/orders",
	getParentRoute: () => AdminRoute
});
var AdminStreetsRoute = Route$7.update({
	id: "/streets",
	path: "/streets",
	getParentRoute: () => AdminRoute
});
var AdminVendorsRoute = Route$6.update({
	id: "/vendors",
	path: "/vendors",
	getParentRoute: () => AdminRoute
});
var ProductSkuRoute = Route$5.update({
	id: "/product/$sku",
	path: "/product/$sku",
	getParentRoute: () => Route$20
});
var TrackOrderIdRoute = Route$4.update({
	id: "/track/$orderId",
	path: "/track/$orderId",
	getParentRoute: () => Route$20
});
var VendorIndexRoute = Route$3.update({
	id: "/",
	path: "/",
	getParentRoute: () => VendorRoute
});
var VendorLedgerRoute = Route$2.update({
	id: "/ledger",
	path: "/ledger",
	getParentRoute: () => VendorRoute
});
var VendorStockRoute = Route$1.update({
	id: "/stock",
	path: "/stock",
	getParentRoute: () => VendorRoute
});
var VendorStreetsRoute = Route.update({
	id: "/streets",
	path: "/streets",
	getParentRoute: () => VendorRoute
});
var AdminRouteChildren = {
	AdminCatalogueRoute,
	AdminOpsRoute,
	AdminOrdersRoute,
	AdminStreetsRoute,
	AdminVendorsRoute,
	AdminIndexRoute
};
var AdminRouteWithChildren = AdminRoute._addFileChildren(AdminRouteChildren);
var VendorRouteChildren = {
	VendorLedgerRoute,
	VendorStockRoute,
	VendorStreetsRoute,
	VendorIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AccountRoute,
	AdminRoute: AdminRouteWithChildren,
	BrowseRoute,
	CartRoute,
	OrdersRoute,
	PlansRoute,
	VendorRoute: VendorRoute._addFileChildren(VendorRouteChildren),
	ProductSkuRoute,
	TrackOrderIdRoute
};
var routeTree = Route$20._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { Gate as i, Route$4 as n, Route$5 as r, router_exports as t };
