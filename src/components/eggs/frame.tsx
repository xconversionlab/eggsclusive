import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ClipboardList,
  Egg,
  Headset,
  Home,
  LayoutDashboard,
  MapPinned,
  Package,
  Repeat,
  Store,
  UserRound,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { readChennai } from "@/lib/eggs/clock";
import { bi, tx } from "@/lib/eggs/labels";
import { useEggs } from "@/lib/eggs/store";
import { Onboarding } from "./onboarding";
import { cn, NavLink, Wordmark } from "./ui";

function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const finish = () => setReady(true);
    if (useEggs.persist.hasHydrated()) finish();
    const unsub = useEggs.persist.onFinishHydration(finish);
    return unsub;
  }, []);
  return ready;
}

function Splash() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 text-ink">
      <div className="max-w-md">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Chennai · App preview</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Eggsclusive</h1>
        <p className="mt-3 text-base text-muted">Street delivery. Not a pin-code guess.</p>
      </div>
    </main>
  );
}

export function Frame({ children }: { children: ReactNode }) {
  const ready = useHydrated();
  const lang = useEggs((s) => s.lang);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang === "ta" ? "ta" : "en";
  }, [lang, ready]);
  if (!ready) return <Splash />;
  return (
    <div className="min-h-screen bg-paper text-ink">
      <TopBar />
      <PreviewNotice />
      <FlashBar />
      <Shell>{children}</Shell>
    </div>
  );
}

function TopBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const lang = useEggs((s) => s.lang);
  const setLang = useEggs((s) => s.setLang);
  const notices = useEggs((s) => s.notices);
  const mark = useEggs((s) => s.markNotices);
  const [open, setOpen] = useState(false);
  const [clock, setClock] = useState(() => readChennai());
  useEffect(() => {
    const timer = setInterval(() => setClock(readChennai()), 30000);
    return () => clearInterval(timer);
  }, []);
  const unread = notices.filter((notice) => !notice.read).length;
  const cartCount = useEggs((s) => s.cart.reduce((sum, line) => sum + line.qtyPacks, 0));
  const surface = path.startsWith("/admin") ? "/admin" : path.startsWith("/vendor") ? "/vendor" : "/";
  const t = (text: { en: string; ta: string }) => tx(lang, text);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-3 py-2.5 sm:px-4 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link to="/" className="min-h-11 shrink-0" aria-label="Eggsclusive home">
              <Wordmark />
            </Link>
            <span className="rounded-full border border-line bg-shell px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
              Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className="hidden text-xs tabular-nums text-muted lg:block">{clock.label}</p>
            {surface === "/" ? (
              <Link
                to="/cart"
                className="press inline-flex min-h-10 items-center rounded-control border border-line bg-shell px-3 text-sm font-medium"
              >
                {t(bi("Basket", "கூடை"))}
                {cartCount > 0 ? <span className="ml-2 rounded-full bg-foam px-2 py-0.5 text-xs tabular-nums">{cartCount}</span> : null}
              </Link>
            ) : null}
            <button
              className="press relative grid h-10 w-10 place-items-center rounded-control border border-line bg-shell"
              aria-label={t(bi("Notices", "அறிவிப்பு"))}
              aria-expanded={open}
              onClick={() => {
                setOpen((value) => !value);
                mark();
              }}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-mark" /> : null}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid flex-1 grid-cols-3 gap-1 rounded-card border border-line bg-shell p-1 md:flex-none">
            <Surface to="/" active={surface === "/"} label={t(bi("Customer", "வாடிக்கையாளர்"))} />
            <Surface to="/vendor" active={surface === "/vendor"} label={t(bi("Vendor", "கடை"))} />
            <Surface to="/admin" active={surface === "/admin"} label={t(bi("Command", "நிர்வாகம்"))} />
          </div>
          <button
            className="press min-h-11 shrink-0 rounded-control border border-line bg-shell px-3 text-sm"
            onClick={() => setLang(lang === "en" ? "ta" : "en")}
            aria-label={lang === "en" ? "Switch to Tamil" : "Switch to English"}
          >
            {lang === "en" ? "தமிழ்" : "English"}
          </button>
        </div>
      </div>
      {open ? (
        <div className="mx-auto w-full max-w-6xl px-3 pb-3 sm:px-4">
          <div className="max-h-72 space-y-3 overflow-auto rounded-card border border-line bg-shell p-4 shadow-panel">
            {notices.length === 0 ? <p className="text-sm text-muted">{t(bi("No notices.", "அறிவிப்பு இல்லை."))}</p> : null}
            {notices.slice(0, 8).map((notice) => (
              <article key={notice.id}>
                <h2 className="text-sm font-medium">{t(notice.title)}</h2>
                <p className="text-sm text-muted">{t(notice.body)}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Surface({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "press inline-flex min-h-10 items-center justify-center rounded-control px-2.5 text-xs font-medium sm:px-3 sm:text-sm",
        active ? "bg-ink text-shell shadow-sm" : "text-ink",
      )}
    >
      {label}
    </Link>
  );
}

function PreviewNotice() {
  const lang = useEggs((s) => s.lang);
  const t = (text: { en: string; ta: string }) => tx(lang, text);
  return (
    <div className="border-b border-line/80 bg-foam/65 px-3 py-2 text-center text-[11px] leading-4 text-muted sm:text-xs">
      <span className="font-semibold text-ink">{t(bi("Interactive product preview", "செயல்பாட்டு தயாரிப்பு முன்னோட்டம்"))}</span>
      <span className="mx-1.5 hidden text-muted/60 sm:inline">·</span>
      {t(bi("Sample data on this device · no live SMS or payments", "இந்தச் சாதனத்தில் மாதிரி தரவு · நேரடி SMS அல்லது பணப்பரிவர்த்தனை இல்லை"))}
    </div>
  );
}

function FlashBar() {
  const flash = useEggs((s) => s.flash);
  const lang = useEggs((s) => s.lang);
  const clear = useEggs((s) => s.clearFlash);
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => clear(), 3800);
    return () => clearTimeout(timer);
  }, [flash, clear]);
  if (!flash) return null;
  return <p role="status" className="border-b border-line bg-foam px-4 py-2 text-sm text-ink">{tx(lang, flash.text)}</p>;
}

function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const onboarded = useEggs((s) => s.profile.phoneVerified && !!s.address?.confirmed && !s.editingStreet);
  const lang = useEggs((s) => s.lang);
  const t = (text: { en: string; ta: string }) => tx(lang, text);
  const customer = !path.startsWith("/vendor") && !path.startsWith("/admin");
  const vendor = path.startsWith("/vendor");
  const admin = path.startsWith("/admin");
  const hasMobileNav = vendor || admin || (customer && onboarded);
  return (
    <div
      className={cn(
        "mx-auto w-full px-3 pt-4 sm:px-4",
        admin ? "max-w-6xl" : "max-w-3xl",
        hasMobileNav ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10" : "pb-10",
      )}
    >
      {vendor ? <div className="hidden md:block"><VendorNav t={t} /></div> : null}
      {admin ? <div className="hidden md:block"><AdminNav t={t} /></div> : null}
      {customer && onboarded ? (
        <nav className="mb-4 hidden gap-1 md:flex" aria-label={t(bi("Customer", "வாடிக்கையாளர்"))}>
          <CustomerLinks t={t} />
        </nav>
      ) : null}
      {children}
      {customer && onboarded ? <MobileBar columns="grid-cols-5" ariaLabel={t(bi("Customer", "வாடிக்கையாளர்"))}><CustomerLinks t={t} icons /></MobileBar> : null}
      {vendor ? <MobileBar columns="grid-cols-4" ariaLabel={t(bi("Vendor", "கடை"))}><VendorLinks t={t} /></MobileBar> : null}
      {admin ? <MobileBar columns="grid-cols-6" ariaLabel={t(bi("Command", "நிர்வாகம்"))}><AdminLinks t={t} /></MobileBar> : null}
    </div>
  );
}

function MobileBar({ children, columns, ariaLabel }: { children: ReactNode; columns: string; ariaLabel: string }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-shell shadow-[0_-8px_28px_rgba(28,25,21,0.06)] md:hidden"
      aria-label={ariaLabel}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className={cn("mx-auto grid max-w-3xl gap-1 px-1.5 pt-1.5", columns)}>{children}</div>
    </nav>
  );
}

function CustomerLinks({ t, icons }: { t: (text: { en: string; ta: string }) => string; icons?: boolean }) {
  return (
    <>
      <NavLink to="/" label={t(bi("Home", "முகப்பு"))} icon={icons ? <Home className="h-4 w-4" /> : undefined} />
      <NavLink to="/browse" label={t(bi("Eggs", "முட்டை"))} icon={icons ? <Egg className="h-4 w-4" /> : undefined} />
      <NavLink to="/orders" label={t(bi("Orders", "ஆர்டர்"))} icon={icons ? <Store className="h-4 w-4" /> : undefined} />
      <NavLink to="/plans" label={t(bi("Plans", "சந்தா"))} icon={icons ? <Repeat className="h-4 w-4" /> : undefined} />
      <NavLink to="/account" label={t(bi("You", "நீங்கள்"))} icon={icons ? <UserRound className="h-4 w-4" /> : undefined} />
    </>
  );
}

function VendorLinks({ t }: { t: (text: { en: string; ta: string }) => string }) {
  return (
    <>
      <NavLink to="/vendor" exact label={t(bi("Orders", "ஆர்டர்"))} icon={<ClipboardList className="h-4 w-4" />} />
      <NavLink to="/vendor/stock" label={t(bi("Stock", "இருப்பு"))} icon={<Package className="h-4 w-4" />} />
      <NavLink to="/vendor/streets" label={t(bi("Streets", "தெரு"))} icon={<MapPinned className="h-4 w-4" />} />
      <NavLink to="/vendor/ledger" label={t(bi("Money", "பணம்"))} icon={<Wallet className="h-4 w-4" />} />
    </>
  );
}

function AdminLinks({ t }: { t: (text: { en: string; ta: string }) => string }) {
  return (
    <>
      <NavLink to="/admin" exact label={t(bi("Live", "நேரலை"))} icon={<LayoutDashboard className="h-4 w-4" />} />
      <NavLink to="/admin/streets" label={t(bi("Streets", "தெருக்கள்"))} icon={<MapPinned className="h-4 w-4" />} />
      <NavLink to="/admin/vendors" label={t(bi("Vendors", "கடைகள்"))} icon={<Store className="h-4 w-4" />} />
      <NavLink to="/admin/orders" label={t(bi("Orders", "ஆர்டர்கள்"))} icon={<ClipboardList className="h-4 w-4" />} />
      <NavLink to="/admin/catalogue" label={t(bi("Catalog", "பட்டியல்"))} icon={<Egg className="h-4 w-4" />} />
      <NavLink to="/admin/ops" label={t(bi("Desk", "மேசை"))} icon={<Headset className="h-4 w-4" />} />
    </>
  );
}

function VendorNav({ t }: { t: (text: { en: string; ta: string }) => string }) {
  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto" aria-label={t(bi("Vendor", "கடை"))}>
      <NavLink to="/vendor" label={t(bi("Orders", "ஆர்டர்"))} exact />
      <NavLink to="/vendor/stock" label={t(bi("Stock", "இருப்பு"))} />
      <NavLink to="/vendor/streets" label={t(bi("Streets", "தெரு"))} />
      <NavLink to="/vendor/ledger" label={t(bi("Money", "பணம்"))} />
    </nav>
  );
}

function AdminNav({ t }: { t: (text: { en: string; ta: string }) => string }) {
  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto" aria-label={t(bi("Command", "நிர்வாகம்"))}>
      <NavLink to="/admin" label={t(bi("Live", "நேரலை"))} exact />
      <NavLink to="/admin/streets" label={t(bi("Streets", "தெருக்கள்"))} />
      <NavLink to="/admin/vendors" label={t(bi("Vendors", "கடைகள்"))} />
      <NavLink to="/admin/orders" label={t(bi("Orders", "ஆர்டர்கள்"))} />
      <NavLink to="/admin/catalogue" label={t(bi("Catalogue", "பட்டியல்"))} />
      <NavLink to="/admin/ops" label={t(bi("Desk", "மேசை"))} />
    </nav>
  );
}

export function Gate({ children }: { children: ReactNode }) {
  const verified = useEggs((s) => s.profile.phoneVerified);
  const address = useEggs((s) => s.address);
  const editing = useEggs((s) => s.editingStreet);
  if (!verified || !address?.confirmed || editing) return <Onboarding />;
  return children;
}
