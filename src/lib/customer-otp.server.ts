import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { getSql, dbSource } from "@/lib/db";

const OTP_TTL_SECONDS = 5 * 60;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_PER_HOUR = 5;
const OTP_MAX_ATTEMPTS = 5;
const SESSION_DAYS = 30;
const SESSION_COOKIE = "spencers_customer_session";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function authSecret(): string {
  const value = env("NATIVE_AUTH_SECRET");
  if (!value || value.length < 32) throw new Error("native_auth_not_configured");
  return value;
}

export function customerAuthJson(body: unknown, status = 200, headers?: HeadersInit) {
  const output = new Headers(headers);
  output.set("Cache-Control", "no-store, private");
  output.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers: output });
}

export function normalizeIndianPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  const national = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(national) ? `+91${national}` : null;
}

function otpDigest(phone: string, otp: string) {
  return createHmac("sha256", authSecret()).update(`otp|${phone}|${otp}`).digest("hex");
}

function sessionDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqualHex(left: string, right: string) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function requirePersistentDatabase() {
  if (dbSource !== "neon") throw new Error("persistent_database_not_configured");
}

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const split = part.trim().indexOf("=");
    if (split < 0) continue;
    if (part.trim().slice(0, split) === name) {
      try { return decodeURIComponent(part.trim().slice(split + 1)); } catch { return null; }
    }
  }
  return null;
}

export function customerSessionCookie(token: string) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearCustomerSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  try {
    if (new URL(origin).origin !== new URL(request.url).origin) throw new Error("origin_mismatch");
  } catch {
    throw new Error("origin_mismatch");
  }
}

export async function requestCustomerOtp(phoneInput: unknown, requesterInput: unknown) {
  requirePersistentDatabase();
  const phone = normalizeIndianPhone(phoneInput);
  if (!phone) return { ok: false as const, status: 400, error: "Enter a valid 10-digit Indian mobile number." };

  // Fail before contacting the SMS provider if the OTP/session signing secret is absent.
  authSecret();
  const apiKey = env("TWOFACTOR_API_KEY");
  const templateName = env("TWOFACTOR_OTP_TEMPLATE_NAME");
  if (!apiKey || !templateName) {
    return { ok: false as const, status: 503, error: "SMS delivery is not configured yet. Please contact the store." };
  }

  const requester = typeof requesterInput === "string" && requesterInput.trim()
    ? requesterInput.trim().slice(0, 160)
    : "unknown";
  const requesterHash = createHmac("sha256", authSecret()).update("requester|" + requester).digest("hex");
  const sql = await getSql();
  const recentPhone = await sql.query<{ last_at: string | null; count: number }>(
    "select max(created_at) as last_at, count(*)::int as count from native_otp_challenges where phone = $1 and created_at > now() - interval '1 hour'",
    [phone],
  );
  const phoneCount = Number(recentPhone[0]?.count ?? 0);
  const lastAt = recentPhone[0]?.last_at ? new Date(recentPhone[0].last_at).getTime() : 0;
  if (lastAt && Date.now() - lastAt < OTP_RESEND_SECONDS * 1000) {
    return { ok: false as const, status: 429, error: "Please wait before requesting another OTP." };
  }
  if (phoneCount >= OTP_MAX_PER_HOUR) {
    return { ok: false as const, status: 429, error: "OTP request limit reached for this number. Try again after an hour." };
  }
  const recentRequester = await sql.query<{ count: number }>(
    "select count(*)::int as count from native_otp_challenges where requester_hash = $1 and created_at > now() - interval '1 hour'",
    [requesterHash],
  );
  if (Number(recentRequester[0]?.count ?? 0) >= 15) {
    return { ok: false as const, status: 429, error: "Too many OTP requests from this connection. Try again later." };
  }

  const otp = String(randomInt(100000, 1000000));
  let providerResponse: Response;
  try {
    providerResponse = await fetch("https://2factor.in/API/V1/OTP/SEND", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ to: phone, template_name: templateName, var1: otp }),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return { ok: false as const, status: 502, error: "SMS provider could not be reached. Please try again." };
  }

  const providerBody = await providerResponse.json().catch(() => ({})) as {
    status?: string; type?: string; Status?: string; session_id?: string;
  };
  const providerStatus = String(providerBody.status ?? providerBody.type ?? providerBody.Status ?? "").toLowerCase();
  const accepted = providerResponse.ok && (
    ["sent", "success", "submitted"].includes(providerStatus) || Boolean(providerBody.session_id)
  );
  if (!accepted) {
    return { ok: false as const, status: 502, error: "SMS was not accepted. Check your approved OTP template and provider account." };
  }

  await sql.query(
    "insert into native_otp_challenges (id, phone, requester_hash, otp_hash, expires_at) values ($1, $2, $3, $4, now() + interval '5 minutes')",
    [randomUUID(), phone, requesterHash, otpDigest(phone, otp)],
  );
  return { ok: true as const, phone, expiresInSeconds: OTP_TTL_SECONDS, resendAfterSeconds: OTP_RESEND_SECONDS };
}

export async function verifyCustomerOtp(phoneInput: unknown, codeInput: unknown, nameInput: unknown) {
  requirePersistentDatabase();
  const phone = normalizeIndianPhone(phoneInput);
  const code = typeof codeInput === "string" ? codeInput.trim() : "";
  const name = typeof nameInput === "string" ? nameInput.trim().slice(0, 80) : "";
  if (!phone || !/^\d{6}$/.test(code) || !name) {
    return { ok: false as const, status: 400, error: "Enter your name, mobile number and 6-digit OTP." };
  }

  const sql = await getSql();
  const challenges = await sql.query<{ id: string; otp_hash: string; attempts: number; expires_at: string }>(
    "select id, otp_hash, attempts, expires_at from native_otp_challenges where phone = $1 and consumed_at is null order by created_at desc limit 1",
    [phone],
  );
  const challenge = challenges[0];
  if (!challenge || new Date(challenge.expires_at).getTime() <= Date.now()) {
    return { ok: false as const, status: 400, error: "OTP expired. Request a new code." };
  }
  if (Number(challenge.attempts) >= OTP_MAX_ATTEMPTS) {
    return { ok: false as const, status: 429, error: "Too many incorrect attempts. Request a new OTP." };
  }

  const candidateDigest = otpDigest(phone, code);
  if (!safeEqualHex(challenge.otp_hash, candidateDigest)) {
    await sql.query(
      "update native_otp_challenges set attempts = attempts + 1 where id = $1 and consumed_at is null and attempts < $2",
      [challenge.id, OTP_MAX_ATTEMPTS],
    );
    return { ok: false as const, status: 400, error: "Incorrect OTP. Please try again." };
  }

  const consumed = await sql.query<{ phone: string }>(
    "update native_otp_challenges set consumed_at = now() where id = $1 and consumed_at is null and expires_at > now() and attempts < $2 and otp_hash = $3 returning phone",
    [challenge.id, OTP_MAX_ATTEMPTS, candidateDigest],
  );
  if (!consumed[0]) return { ok: false as const, status: 400, error: "OTP has expired or was already used. Request a new code." };

  const rows = await sql.query<{ id: string; phone: string; name: string }>(
    "insert into native_customers (id, phone, name) values ($1, $2, $3) on conflict (phone) do update set name = excluded.name, verified_at = now(), updated_at = now() returning id, phone, name",
    [randomUUID(), phone, name],
  );
  const customer = rows[0];
  if (!customer) throw new Error("customer_upsert_failed");

  const token = randomBytes(32).toString("base64url");
  await sql.query(
    "insert into native_customer_sessions (token_hash, customer_id, expires_at) values ($1, $2, now() + interval '30 days')",
    [sessionDigest(token), customer.id],
  );
  return { ok: true as const, token, customer, expiresInSeconds: SESSION_DAYS * 86400 };
}

export async function getCustomerSession(request: Request) {
  requirePersistentDatabase();
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const sql = await getSql();
  const rows = await sql.query<{ id: string; phone: string; name: string }>(
    `select c.id, c.phone, c.name
       from native_customer_sessions s
       join native_customers c on c.id = s.customer_id
      where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()
      limit 1`,
    [sessionDigest(token)],
  );
  if (!rows[0]) return null;
  await sql.query(
    "update native_customer_sessions set last_seen_at = now() where token_hash = $1",
    [sessionDigest(token)],
  );
  return rows[0];
}

export async function revokeCustomerSession(request: Request) {
  requirePersistentDatabase();
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  const sql = await getSql();
  await sql.query(
    "update native_customer_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null",
    [sessionDigest(token)],
  );
}

export function isCustomerAuthConfigured() {
  return Boolean(env("TWOFACTOR_API_KEY") && env("TWOFACTOR_OTP_TEMPLATE_NAME") && env("NATIVE_AUTH_SECRET"));
}
