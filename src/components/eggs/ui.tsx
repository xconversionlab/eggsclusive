import { Link, useRouterState } from "@tanstack/react-router";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { tx } from "@/lib/eggs/labels";
import { useEggs } from "@/lib/eggs/store";
import type { Bi } from "@/lib/eggs/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function useTx() {
  const lang = useEggs((s) => s.lang);
  return (text: Bi) => tx(lang, text);
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "line" | "ghost" | "mark" }) {
  const look = {
    primary: "bg-ink text-white shadow-[0_9px_24px_rgba(7,23,46,.18)]",
    line: "border border-line bg-shell text-ink hover:bg-foam",
    ghost: "bg-transparent text-ink",
    mark: "bg-mark text-white shadow-[0_9px_24px_rgba(22,141,229,.22)]",
  }[variant];
  return (
    <button
      className={cn(
        "press inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold disabled:opacity-40",
        look,
        className,
      )}
      {...props}
    />
  );
}

export function Field({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-control border border-line bg-shell px-3 text-base text-ink placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-control border border-line bg-shell px-3 py-3 text-base text-ink placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "press min-h-11 shrink-0 rounded-full border px-3 text-sm",
        active ? "border-ink bg-ink text-shell" : "border-line bg-shell text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-card border border-line bg-shell p-4", className)}>{children}</section>;
}

export function Wordmark() {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <img src="/spencers-mark.jpg" alt="" className="h-10 w-10 rounded-xl object-cover shadow-[0_5px_14px_rgba(7,23,46,.14)]" />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink">Spencers</span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.31em] text-mark">Enterprices</span>
      </span>
    </span>
  );
}

export function EggMark({ id: _id }: { id: string }) {
  return (
    <span className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#f4f9ff] to-[#deedfb]" aria-hidden>
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.95),transparent_52%)]" />
      <span className="relative h-[58px] w-[43px] rounded-[52%_52%_46%_46%/60%_60%_40%_40%] border border-[#dce5ee] bg-gradient-to-br from-white via-[#fffefb] to-[#dfe6ed] shadow-[inset_-8px_-9px_13px_rgba(7,23,46,.08),0_8px_18px_rgba(7,23,46,.12)]">
        <span className="absolute left-[9px] top-[10px] h-5 w-3 rounded-full bg-white/90 blur-[2px]" />
      </span>
    </span>
  );
}

export function NavLink({
  to,
  label,
  icon,
  exact,
}: {
  to: string;
  label: string;
  icon?: ReactNode;
  exact?: boolean;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = exact || to === "/" ? path === to : path === to || path.startsWith(`${to}/`);
  return (
    <Link
      to={to}
      className={cn(
        "press inline-flex min-h-11 items-center justify-center rounded-control text-sm transition-colors",
        icon ? "min-h-[58px] flex-col gap-1 px-1 py-2 text-[10px] font-medium leading-tight sm:text-[11px]" : "gap-2 px-3",
        active ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-foam/70 hover:text-ink",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
