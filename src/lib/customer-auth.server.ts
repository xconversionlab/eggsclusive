import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { getSql, dbSource } from "@/lib/db";

const OTP_TTL_SECONDS = 300;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_PER_HOUR = 5;
const OTP_MAX_ATTEMPTS = 5;
const SESSION_DAYS = 30;
const SESSION_COOKIE = "__Host-spencers-customer";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function secret(): string {
  const value = env("NATIVE_AUTH_SECRET");
  if (!value || value.length < 32) throw new Error("native_auth_not_configured");
  return value;
}

export function apiJson(body: unknown, status = 200, headers?: HeadersInit): Response {
  const result = new Headers(headers);
  result.set("Cache-Control", "no-store");
  result.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers: result });
}

export function normalizeIndianPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  const national = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(national)) return null;
  return `+91${national}`;
}

function otpDigest(phone: string, otp: string): string {
  return createHmac("sha256", secret()).update(`otp|${phone}|${otp}`).digest("hex");
}

function requesterDigest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHmac("sha256", secret()).update(`ip|${ip}`).digest("hex");
}

function tokenDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function constantTimeHexEqual(a: string, b: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
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

export async function requestPhoneOtp(request: Request, phoneInput: unknown) {
  requirePersistentDatabase();
  if (!requestHasSameOrigin(request)) {
    return { ok: false as const, status: 403, error: "This request could not be verified. Refresh the page and try again." };
  }

  const phone = normalizeIndianPhone(phoneInput);
  if (!phone) {
    return { ok: false as const, status: 400, error: "Enter a valid 10-digit Indian mobile number." };
  }

  const apiKey = env("TWOFACTOR_API_KEY");
  const templateName = env("TWOFACTOR_OTP_TEMPLATE_NAME");
  if (!apiKey || !templateName) {
    return { ok: false as const, status: 503, error: "SMS setup is incomplete. The Spencer's team must finish the 2Factor API and approved OTP template setup." };
  }

  const sql = await getSql();
  const requesterHash = requesterDigest(request);
  const recent = await sql.query<{
    count: number | string;
    last_phone_at: string | null;
  }>(
    `select count(*)::int as count,
            max(created_at) filter (where phone = $1) as last_phone_at
       from native_otp_challenges
      where created_at > now() - interval '1 hour'
        and (phone = $1 or requester_hash = $2)`,
    [phone, requesterHash],
  );
  const recentCount = Number(recent[0]?.count ?? 0);
  const lastPhoneAt = recent[0]?.last_phone_at
    ? new Date(recent[0].last_phone_at).getTime()
    : 0;

  if (lastPhoneAt && Date.now() - lastPhoneAt < OTP_RESEND_SECONDS * 1000) {
    const wait = Math.ceil((OTP_RESEND_SECONDS * 1000 - (Date.now() - lastPhoneAt)) / 1000);
    return { ok: false as const, status: 429, error: `Please wait ${wait} seconds before requesting another OTP.` };
  }
  if (recentCount >= OTP_MAX_PER_HOUR) {
    return { ok: false as const, status: 429, error: "OTP request limit reached. Try again after an hour." };
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
    return { ok: false as const, status: 502, error: "The SMS service could not be reached. Please try again." };
  }

  const providerBody = await providerResponse.json().catch(() => ({})) as {
    status?: string;
    type?: string;
    Status?: string;
    message?: string;
    session_id?: string;
  };
  const providerStatus = String(
    providerBody.status ?? providerBody.type ?? providerBody.Status ?? "",
  ).toLowerCase();
  const accepted =
    providerResponse.ok &&
    (["sent", "success", "submitted"].includes(providerStatus) || Boolean(providerBody.session_id));

  if (!accepted) {
    return {
      ok: false as const,
      status: 502,
      error: "SMS was not accepted. Check the 2Factor API key and approved DLT OTP template.",
    };
  }

  await sql.query(
    "delete from native_otp_challenges where created_at < now() - interval '7 days'",
  );
  await sql.query(
    `insert into native_otp_challenges
      (id, phone, requester_hash, otp_hash, expires_at)
     values ($1, $2, $3, $4, now() + interval '5 minutes')`,
    [randomUUID(), phone, requesterHash, otpDigest(phone, otp)],
  );

  return {
    ok: true as const,
    phone,
    expiresInSeconds: OTP_TTL_SECONDS,
    resendAfterSeconds: OTP_RESEND_SECONDS,
  };
}

export async function verifyPhoneOtp(
  phoneInput: unknown,
  codeInput: unknown,
  nameInput: unknown,
) {
  requirePersistentDatabase();

  const phone = normalizeIndianPhone(phoneInput);
  const code = typeof codeInput === "string" ? codeInput.trim() : "";
  const name = typeof nameInput === "string" ? nameInput.trim().slice(0, 80) : "";

  if (!phone || !/^\d{6}$/.test(code) || name.length < 2) {
    return { ok: false as const, status: 400, error: "Enter your name, mobile number and 6-digit OTP." };
  }

  const sql = await getSql();
  const challenges = await sql.query<{
    id: string;
    otp_hash: string;
    attempts: number;
    expires_at: string;
  }>(
    `select id, otp_hash, attempts, expires_at
       from native_otp_challenges
      where phone = $1 and consumed_at is null
      order by created_at desc
      limit 1`,
    [phone],
  );
  const challenge = challenges[0];

  if (!challenge || new Date(challenge.expires_at).getTime() <= Date.now()) {
    return { ok: false as const, status: 400, error: "OTP expired. Request a new one." };
  }
  if (Number(challenge.attempts) >= OTP_MAX_ATTEMPTS) {
    return { ok: false as const, status: 429, error: "Too many incorrect attempts. Request a new OTP." };
  }

  if (!constantTimeHexEqual(challenge.otp_hash, otpDigest(phone, code))) {
    const updated = await sql.query<{ attempts: number }>(
      `update native_otp_challenges
          set attempts = attempts + 1
        where id = $1 and consumed_at is null and attempts < $2
        returning attempts`,
      [challenge.id, OTP_MAX_ATTEMPTS],
    );
    if (!updated[0] || Number(updated[0].attempts) >= OTP_MAX_ATTEMPTS) {
      return { ok: false as const, status: 429, error: "Too many incorrect attempts. Request a new OTP." };
    }
    return { ok: false as const, status: 400, error: "Incorrect OTP. Please try again." };
  }

  const consumed = await sql.query<{ id: string }>(
    `update native_otp_challenges
        set consumed_at = now()
      where id = $1
        and consumed_at is null
        and expires_at > now()
        and attempts < $2
      returning id`,
    [challenge.id, OTP_MAX_ATTEMPTS],
  );
  if (!consumed[0]) {
    return { ok: false as const, status: 400, error: "OTP expired or already used. Request a new one." };
  }

  const customerRows = await sql.query<{ id: string; name: string; phone: string }>(
    `insert into native_customers (id, phone, name)
     values ($1, $2, $3)
     on conflict (phone) do update
       set name = excluded.name, verified_at = now(), updated_at = now()
     returning id, name, phone`,
    [randomUUID(), phone, name],
  );
  const customer = customerRows[0];
  if (!customer) throw new Error("customer_upsert_failed");

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await sql.query(
    "insert into native_customer_sessions (token_hash, customer_id, expires_at) values ($1, $2, $3)",
    [tokenDigest(token), customer.id, expiresAt],
  );

  return {
    ok: true as const,
    customer: { id: customer.id, name: customer.name, phone: customer.phone },
    cookie: `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
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
  if (dbSource !== "neon") return { ok: true as const, authenticated: false as const, databaseReady: false };
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
  return {
    ok: true as const,
    clearCookie: `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  };
}
