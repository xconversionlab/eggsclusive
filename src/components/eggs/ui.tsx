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
    primary: "bg-ink text-shell",
    line: "border border-line bg-shell text-ink",
    ghost: "bg-transparent text-ink",
    mark: "bg-mark text-shell",
  }[variant];
  return (
    <button
      className={cn(
        "press inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium disabled:opacity-40",
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
    <span className="inline-flex items-center gap-2 font-display text-xl tracking-tight text-ink">
      <span className="relative block h-5 w-3.5 rounded-full border border-ink bg-shell" aria-hidden>
        <span className="absolute top-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-mark" />
      </span>
      Eggsclusive
    </span>
  );
}

export function EggMark({ id }: { id: string }) {
  const quail = id === "quail";
  const duck = id === "duck";
  return (
    <span className="grid h-20 w-20 place-items-center rounded-card bg-foam" aria-hidden>
      <span className="relative">
        <span
          className={cn(
            "block rounded-full border border-line",
            id === "brown" || id === "country" ? "bg-foam" : "bg-shell",
            quail ? "h-8 w-6" : duck ? "h-14 w-10" : "h-12 w-9",
          )}
        />
        {id === "protein" ? <span className="absolute top-4 left-3 h-3 w-3 rounded-full bg-mark" /> : null}
        {id === "country" || id === "quail" ? <span className="absolute top-3 right-1 h-1 w-1 rounded-full bg-ink" /> : null}
        {id === "freerange" ? <span className="absolute -bottom-1 left-1 h-px w-6 bg-mark" /> : null}
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
        active ? "bg-ink text-shell" : "text-muted hover:bg-foam/70 hover:text-ink",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
