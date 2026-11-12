import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ClipboardList, Home, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { readChennai } from "@/lib/eggs/clock";
import { bi, tx } from "@/lib/eggs/labels";
import { useEggs } from "@/lib/eggs/store";
import { Onboarding } from "./onboarding";
import { cn, NavLink } from "./ui";

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
        <p className="text-sm font-semibold tracking-[0.18em] text-[#1689c2]">SPENCERS ENTERPRISES</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Deliver your Home Needs</h1>
        <p className="mt-3 text-base text-muted">Fresh eggs and water, delivered to your doorstep.</p>
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
    <div className="min-h-screen bg-[#f2f8fc] text-[#102b46]">
      <TopBar />
      <FlashBar />
      <Shell>{children}</Shell>
    </div>
  );
}

function TopBar() {
  const lang = useEggs((s) => s.lang);
  const setLang = useEggs((s) => s.setLang);
  const notices = useEggs((s) => s.notices);
  const mark = useEggs((s) => s.markNotices);
  const [open, setOpen] = useState(false);
  const unread = notices.filter((n) => !n.read).length;
  const cartCount = useEggs((s) => s.cart.reduce((sum, line) => sum + line.qtyPacks, 0));
  const t = (text: { en: string; ta: string }) => tx(lang, text);
  return (
    <header className="sticky top-0 z-30 border-b border-[#d9eaf5] bg-[#f7fbfe]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex min-h-11 min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0b5e96] text-white" aria-hidden>SE</span>
          <span className="min-w-0 text-xs font-bold tracking-[0.08em] text-[#0a2748] sm:text-sm">SPENCERS ENTERPRISES</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/cart" className="press inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d6e7f2] bg-white px-3 text-sm font-medium text-[#126a9e]">
            {t(bi("Basket", "கூடை"))}
            {cartCount > 0 ? <span className="rounded-full bg-[#e7f4fc] px-2 py-0.5 tabular-nums">{cartCount}</span> : null}
          </Link>
          <button className="press relative grid h-11 w-11 place-items-center rounded-xl border border-[#d6e7f2] bg-white text-[#126a9e]" aria-label={t(bi("Notices", "அறிவிப்பு"))} onClick={() => { setOpen((v) => !v); mark(); }}>
            <Bell className="h-4 w-4" />
            {unread > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#1594d0]" /> : null}
          </button>
          <button className="press min-h-11 rounded-xl border border-[#d6e7f2] bg-white px-3 text-sm text-[#126a9e]" onClick={() => setLang(lang === "en" ? "ta" : "en")}>
            {lang === "en" ? "தமிழ்" : "English"}
          </button>
        </div>
      </div>
      {open ? (
        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          <div className="max-h-72 space-y-3 overflow-auto rounded-2xl border border-[#d9eaf5] bg-white p-4">
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
          <div className="mx-auto grid max-w-3xl grid-cols-3 px-2 py-1">
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
      <NavLink to="/" label={t(bi("Home", "முகப்பு"))} icon={icons ? <Home className="h-4 w-4" /> : undefined} exact />
      <NavLink to="/orders" label={t(bi("Activity", "செயல்பாடு"))} icon={icons ? <ClipboardList className="h-4 w-4" /> : undefined} />
      <NavLink to="/account" label={t(bi("Profile", "சுயவிவரம்"))} icon={icons ? <UserRound className="h-4 w-4" /> : undefined} />
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
