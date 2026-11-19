import { createHash } from "node:crypto";
import { getSql, dbSource } from "@/lib/db";
import { requestCustomerOtp, verifyCustomerOtp } from "@/lib/customer-otp.server";

const SESSION_DAYS = 30;
const SESSION_COOKIE = "__Host-spencers-customer";

export function customerAuthJson(body: unknown, status = 200, headers?: HeadersInit) {
  const output = new Headers(headers);
  output.set("Cache-Control", "no-store, private");
  output.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers: output });
}

export function apiJson(body: unknown, status = 200, headers?: HeadersInit): Response {
  const output = new Headers(headers);
  output.set("Cache-Control", "no-store");
  output.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers: output });
}

export function normalizeIndianPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\\D/g, "");
  const national = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  return /^[6-9]\\d{9}$/.test(national) ? `+91${national}` : null;
}

function tokenDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function requirePersistentDatabase(): void {
  if (dbSource !== "neon") throw new Error("persistent_database_not_configured");
}

function requestHasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function customerSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}

export function clearCustomerSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function requestPhoneOtp(request: Request, phoneInput: unknown) {
  requirePersistentDatabase();
  if (!requestHasSameOrigin(request)) {
    return { ok: false as const, status: 403, error: "This request could not be verified. Refresh the page and try again." };
  }
  const requester = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "web-customer";
  return requestCustomerOtp(phoneInput, requester);
}

export async function verifyPhoneOtp(
  phoneInput: unknown,
  codeInput: unknown,
  nameInput: unknown,
) {
  requirePersistentDatabase();
  const result = await verifyCustomerOtp(phoneInput, codeInput, nameInput);
  if (!result.ok) return result;
  return {
    ok: true as const,
    customer: result.customer,
    cookie: customerSessionCookie(result.token),
  };
}

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim() || null;
    }
  }
  return null;
}

export async function readCustomerSession(request: Request) {
  if (dbSource !== "neon") {
    return { ok: true as const, authenticated: false as const, databaseReady: false };
  }
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{30,}$/.test(token)) {
    return { ok: true as const, authenticated: false as const, databaseReady: true };
  }

  const sql = await getSql();
  const rows = await sql.query<{ id: string; name: string; phone: string }>(
    `select c.id, c.name, c.phone
       from native_customer_sessions s
       join native_customers c on c.id = s.customer_id
      where s.token_hash = $1
        and s.revoked_at is null
        and s.expires_at > now()
      limit 1`,
    [tokenDigest(token)],
  );
  const customer = rows[0];
  if (!customer) return { ok: true as const, authenticated: false as const, databaseReady: true };

  await sql.query(
    "update native_customer_sessions set last_seen_at = now() where token_hash = $1",
    [tokenDigest(token)],
  );
  return { ok: true as const, authenticated: true as const, customer };
}

export async function revokeCustomerSession(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return { ok: false as const, status: 403, error: "This request could not be verified." };
  }
  if (dbSource === "neon") {
    const token = cookieValue(request, SESSION_COOKIE);
    if (token && /^[A-Za-z0-9_-]{30,}$/.test(token)) {
      const sql = await getSql();
      await sql.query(
        "update native_customer_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null",
        [tokenDigest(token)],
      );
    }
  }
  return { ok: true as const, clearCookie: clearCustomerSessionCookie() };
}
