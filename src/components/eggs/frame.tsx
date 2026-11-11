import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ClipboardList, Egg, Home, UserRound, Wallet } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { bi, inr, tx } from "@/lib/eggs/labels";
import { useEggs } from "@/lib/eggs/store";
import { Onboarding } from "./onboarding";
import { cn, NavLink, Wordmark } from "./ui";

function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const finish = () => setReady(true);
    if (useEggs.persist.hasHydrated()) finish();
    const unsubscribe = useEggs.persist.onFinishHydration(finish);
    return unsubscribe;
  }, []);
  return ready;
}

function Splash() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 text-ink">
      <div className="flex flex-col items-center text-center app-enter">
        <img src="/spencers-mark.webp" alt="" className="brand-mark brand-mark-large h-24 w-24 rounded-[1.8rem] object-cover shadow-xl" />
        <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[.32em] text-mark">Spencers Enterprices</p>
        <h1 className="mt-2 text-xl font-bold tracking-tight">Fresh eggs. Delivered.</h1>
        <p className="mt-2 text-sm text-muted">Chennai · Customer app preview</p>
      </div>
    </main>
  );
}

export function Frame({ children }: { children: ReactNode }) {
  const ready = useHydrated();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [transitioning, setTransitioning] = useState(false);
  useEffect(() => {
    if (!ready) return;
    setTransitioning(true);
    const timer = window.setTimeout(() => setTransitioning(false), 560);
    return () => window.clearTimeout(timer);
  }, [path, ready]);
  const lang = useEggs((s) => s.lang);
  useEffect(() => {
    if (ready) document.documentElement.lang = lang === "ta" ? "ta" : "en";
  }, [lang, ready]);
  if (!ready) return <Splash />;
  return (
    <div className="min-h-screen bg-paper text-ink">
      <TopBar />
      {transitioning ? <div className="route-transition" aria-label="Loading page" role="status"><img src="/spencers-mark.webp" alt="" /><span>SPENCERS</span></div> : null}
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
  const wallet = useEggs((s) => s.walletPaise);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const cartCount = useEggs((s) => s.cart.reduce((sum, line) => sum + line.qtyPacks, 0));
  const t = (text: { en: string; ta: string }) => tx(lang, text);
  const customerRoute = !path.startsWith("/vendor") && !path.startsWith("/admin");
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
        <Link to="/" className="min-w-0 rounded-xl" aria-label="Spencers Enterprices home">
          <Wordmark />
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {customerRoute ? (
            <>
              <Link to="/wallet" aria-label={t(bi("Wallet", "பணப்பை"))} className="press hidden min-h-10 items-center gap-1.5 rounded-xl border border-line bg-paper px-2.5 text-xs font-semibold text-ink sm:inline-flex">
                <Wallet className="h-4 w-4 text-mark" />
                {inr(wallet, lang)}
              </Link>
              <Link to="/cart" aria-label={t(bi("Basket", "கூடை"))} className="press relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-paper">
                <ClipboardList className="h-[18px] w-[18px]" />
                {cartCount > 0 ? <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-mark px-1 text-[10px] font-bold text-white">{cartCount}</span> : null}
              </Link>
            </>
          ) : null}
          <button
            type="button"
            className="press relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-paper"
            aria-label={t(bi("Notifications", "அறிவிப்புகள்"))}
            aria-expanded={noticesOpen}
            onClick={() => { setNoticesOpen((value) => !value); mark(); }}
          >
            <Bell className="h-[18px] w-[18px]" />
            {notices.some((notice) => !notice.read) ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-mark" /> : null}
          </button>
          <button
            type="button"
            className="press min-h-10 rounded-xl border border-line bg-paper px-2.5 text-xs font-bold"
            onClick={() => setLang(lang === "en" ? "ta" : "en")}
            aria-label={lang === "en" ? "Switch to Tamil" : "Switch to English"}
          >
            {lang === "en" ? "தமிழ்" : "EN"}
          </button>
        </div>
      </div>
      {noticesOpen ? (
        <div className="mx-auto max-w-3xl px-3 pb-3 sm:px-5">
          <div className="max-h-64 space-y-3 overflow-auto rounded-2xl border border-line bg-white p-4 shadow-panel">
            {notices.length === 0 ? <p className="text-sm text-muted">{t(bi("You’re all caught up.", "புதிய அறிவிப்புகள் இல்லை."))}</p> : null}
            {notices.slice(0, 8).map((notice) => (
              <article key={notice.id}>
                <h2 className="text-sm font-bold">{t(notice.title)}</h2>
                <p className="mt-1 text-sm text-muted">{t(notice.body)}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function PreviewNotice() {
  const lang = useEggs((s) => s.lang);
  return (
    <div className="border-b border-[#d9e8f7] bg-[#eaf3fc] px-3 py-2 text-center text-[10px] leading-4 text-[#42617e] sm:text-[11px]">
      <span className="font-extrabold uppercase tracking-[.12em] text-[#0c3761]">{tx(lang, bi("Interactive app preview", "செயல்பாட்டு செயலி முன்னோட்டம்"))}</span>
      <span className="mx-1.5">·</span>
      {tx(lang, bi("Demo wallet and orders stay in this browser. No live SMS or payments.", "டெமோ பணப்பை மற்றும் ஆர்டர்கள் இந்த உலாவியில் மட்டுமே. நேரடி SMS அல்லது பணப்பரிவர்த்தனை இல்லை."))}
    </div>
  );
}

function FlashBar() {
  const flash = useEggs((s) => s.flash);
  const lang = useEggs((s) => s.lang);
  const clear = useEggs((s) => s.clearFlash);
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => clear(), 3600);
    return () => clearTimeout(timer);
  }, [flash, clear]);
  if (!flash) return null;
  return <p role="status" className="border-b border-line bg-white px-4 py-2.5 text-center text-sm text-ink app-enter">{tx(lang, flash.text)}</p>;
}

function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const onboarded = useEggs((s) => s.profile.phoneVerified && !!s.address?.confirmed && !s.editingStreet);
  const lang = useEggs((s) => s.lang);
  const t = (text: { en: string; ta: string }) => tx(lang, text);
  const phaseTwo = path.startsWith("/vendor") || (path.startsWith("/admin") && path !== "/admin/native-orders");
  if (phaseTwo) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center app-enter">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#eaf3fc] text-mark"><Egg className="h-8 w-8" /></div>
        <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.24em] text-mark">Phase 02</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">{t(bi("Vendor & operations apps", "விற்பனையாளர் மற்றும் நிர்வாக செயலிகள்"))}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{t(bi("We’re focusing this first release on the customer ordering experience. Vendor and Command apps will be built and connected next.", "இந்த முதல் வெளியீடு வாடிக்கையாளர் ஆர்டர் அனுபவத்தில் கவனம் செலுத்துகிறது. விற்பனையாளர் மற்றும் நிர்வாக செயலிகள் அடுத்த கட்டத்தில் இணைக்கப்படும்."))}</p>
        <Link to="/" className="press mt-6 inline-flex min-h-12 items-center rounded-xl bg-ink px-5 text-sm font-bold text-white">{t(bi("Back to customer app", "வாடிக்கையாளர் செயலிக்குத் திரும்பு"))}</Link>
      </main>
    );
  }
  return (
    <div className={cn("mx-auto w-full max-w-3xl px-3 pt-4 sm:px-5", onboarded ? "pb-[calc(6.3rem+env(safe-area-inset-bottom))] md:pb-10" : "pb-8")}>
      {onboarded ? <nav className="mb-5 hidden gap-1 rounded-2xl border border-line bg-white p-1 md:flex" aria-label={t(bi("Customer app", "வாடிக்கையாளர் செயலி"))}><CustomerLinks t={t} /></nav> : null}
      <div key={path} className="app-enter">{children}</div>
      {onboarded ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-[0_-10px_30px_rgba(7,23,46,.07)] backdrop-blur-xl md:hidden" aria-label={t(bi("Customer app", "வாடிக்கையாளர் செயலி"))} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-1.5 pt-1.5">
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
      <NavLink to="/" exact label={t(bi("Home", "முகப்பு"))} icon={icons ? <Home className="h-[18px] w-[18px]" /> : undefined} />
      <NavLink to="/browse" label={t(bi("Order", "ஆர்டர்"))} icon={icons ? <Egg className="h-[18px] w-[18px]" /> : undefined} />
      <NavLink to="/orders" label={t(bi("Orders", "ஆர்டர்கள்"))} icon={icons ? <ClipboardList className="h-[18px] w-[18px]" /> : undefined} />
      <NavLink to="/wallet" label={t(bi("Wallet", "பணப்பை"))} icon={icons ? <Wallet className="h-[18px] w-[18px]" /> : undefined} />
      <NavLink to="/account" label={t(bi("Profile", "சுயவிவரம்"))} icon={icons ? <UserRound className="h-[18px] w-[18px]" /> : undefined} />
    </>
  );
}

export function Gate({ children }: { children: ReactNode }) {
  const verified = useEggs((s) => s.profile.phoneVerified);
  const address = useEggs((s) => s.address);
  const editing = useEggs((s) => s.editingStreet);
  if (!verified || !address?.confirmed || editing) return <Onboarding />;
  return children;
}
