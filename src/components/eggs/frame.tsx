import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Egg, Home, Repeat, Store, UserRound } from "lucide-react";
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
        <p className="text-sm text-muted">Chennai</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Eggsclusive</h1>
        <p className="mt-3 text-base text-muted">Street delivery. Not a pin-code guess.</p>
      </div>
    </main>
  );
}

export function Frame({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const ready = useHydrated();
  const lang = useEggs((s) => s.lang);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang === "ta" ? "ta" : "en";
  }, [lang, ready]);
  if (path === "/") return <>{children}</>;
  if (!ready) return <Splash />;
  return (
    <div className="min-h-screen bg-paper text-ink">
      <TopBar />
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
    const t = setInterval(() => setClock(readChennai()), 30000);
    return () => clearInterval(t);
  }, []);
  const unread = notices.filter((n) => !n.read).length;
  const cartCount = useEggs((s) => s.cart.reduce((sum, line) => sum + line.qtyPacks, 0));
  const surface = path.startsWith("/admin") ? "/admin" : path.startsWith("/vendor") ? "/vendor" : "/";
  const t = (text: { en: string; ta: string }) => tx(lang, text);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="min-h-11">
            <Wordmark />
          </Link>
          <p className="hidden text-sm text-muted md:block">{clock.label}</p>
          {surface === "/" ? (
            <Link to="/cart" className="press inline-flex min-h-11 items-center rounded-control border border-line bg-shell px-3 text-sm">
              {t(bi("Basket", "கூடை"))}
              {cartCount > 0 ? <span className="ml-2 tabular-nums">{cartCount}</span> : null}
            </Link>
          ) : null}
          <button
            className="press relative grid h-11 w-11 place-items-center rounded-control border border-line bg-shell"
            aria-label={t(bi("Notices", "அறிவிப்பு"))}
            onClick={() => {
              setOpen((v) => !v);
              mark();
            }}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 ? <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-mark" /> : null}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid flex-1 grid-cols-3 gap-1 rounded-card border border-line bg-shell p-1 md:flex-none">
            <Surface to="/" active={surface === "/"} label={t(bi("Customer", "வாடிக்கையாளர்"))} />
            <Surface to="/vendor" active={surface === "/vendor"} label={t(bi("Vendor", "கடை"))} />
            <Surface to="/admin" active={surface === "/admin"} label={t(bi("Command", "நிர்வாகம்"))} />
          </div>
          <button
            className="press min-h-11 rounded-control border border-line bg-shell px-3 text-sm"
            onClick={() => setLang(lang === "en" ? "ta" : "en")}
          >
            {lang === "en" ? "தமிழ்" : "English"}
          </button>
        </div>
      </div>
      {open ? (
        <div className="mx-auto w-full max-w-6xl px-4 pb-4">
          <div className="max-h-72 space-y-3 overflow-auto rounded-card border border-line bg-shell p-4">
            {notices.length === 0 ? <p className="text-sm text-muted">{t(bi("No notices.", "அறிவிப்பு இல்லை."))}</p> : null}
            {notices.slice(0, 8).map((n) => (
              <article key={n.id}>
                <h2 className="text-sm font-medium">{t(n.title)}</h2>
                <p className="text-sm text-muted">{t(n.body)}</p>
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
        "press inline-flex min-h-11 items-center justify-center rounded-control px-3 text-sm",
        active ? "bg-ink text-shell" : "text-ink",
      )}
    >
      {label}
    </Link>
  );
}

function FlashBar() {
  const flash = useEggs((s) => s.flash);
  const lang = useEggs((s) => s.lang);
  const clear = useEggs((s) => s.clearFlash);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => clear(), 3800);
    return () => clearTimeout(t);
  }, [flash, clear]);
  if (!flash) return null;
  return <p className="border-b border-line bg-foam px-4 py-2 text-sm text-ink">{tx(lang, flash.text)}</p>;
}

function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const onboarded = useEggs((s) => s.profile.phoneVerified && !!s.address?.confirmed && !s.editingStreet);
  const lang = useEggs((s) => s.lang);
  const t = (text: { en: string; ta: string }) => tx(lang, text);
  const customer = !path.startsWith("/vendor") && !path.startsWith("/admin");
  const vendor = path.startsWith("/vendor");
  const admin = path.startsWith("/admin");
  return (
    <div className={cn("mx-auto w-full px-4 pt-4", admin ? "max-w-6xl" : "max-w-3xl", customer && onboarded ? "pb-28 md:pb-10" : "pb-10")}>
      {vendor ? <VendorNav t={t} /> : null}
      {admin ? <AdminNav t={t} /> : null}
      {customer && onboarded ? (
        <nav className="mb-4 hidden gap-1 md:flex" aria-label={t(bi("Customer", "வாடிக்கையாளர்"))}>
          <CustomerLinks t={t} />
        </nav>
      ) : null}
      {children}
      {customer && onboarded ? (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-shell md:hidden" aria-label={t(bi("Customer", "வாடிக்கையாளர்"))}>
          <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 py-1">
            <CustomerLinks t={t} icons />
          </div>
        </nav>
      ) : null}
    </div>
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
