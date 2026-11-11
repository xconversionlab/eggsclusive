import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { getSql, dbSource } from "./db";

type Row = Record<string, unknown>;
const OTP_TTL_SECONDS = 300;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_PER_HOUR = 5;
const SESSION_DAYS = 30;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function secret(): string {
  const value = env("NATIVE_AUTH_SECRET");
  if (!value || value.length < 32) throw new Error("native_auth_not_configured");
  return value;
}

export function apiJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
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

function tokenDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const encryptionKey = () => createHash("sha256").update(`delivery-otp|${secret()}`).digest();

function encryptOtp(otp: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(otp, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

function decryptOtp(value: string): string {
  const [ivText, tagText, ciphertextText] = value.split(".");
  if (!ivText || !tagText || !ciphertextText) throw new Error("invalid_encrypted_otp");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
}

function constantTimeHexEqual(a: string, b: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

function requirePersistentDatabase() {
  if (dbSource !== "neon") {
    throw new Error("persistent_database_not_configured");
  }
}

export async function requestPhoneOtp(phoneInput: unknown) {
  requirePersistentDatabase();
  const phone = normalizeIndianPhone(phoneInput);
  if (!phone) return { ok: false as const, status: 400, error: "Enter a valid 10-digit Indian mobile number." };
  const apiKey = env("TWOFACTOR_API_KEY");
  const templateName = env("TWOFACTOR_OTP_TEMPLATE_NAME");
  if (!apiKey || !templateName) {
    return { ok: false as const, status: 503, error: "SMS provider setup is incomplete. Configure the 2Factor API key and approved OTP template." };
  }

  const sql = await getSql();
  const recent = await sql.query<{ created_at: string; count: string | number }>(
    "select max(created_at) as created_at, count(*)::int as count from native_otp_challenges where phone = $1 and created_at > now() - interval '1 hour'",
    [phone],
  );
  const count = Number(recent[0]?.count ?? 0);
  const lastAt = recent[0]?.created_at ? new Date(recent[0].created_at).getTime() : 0;
  if (lastAt && Date.now() - lastAt < OTP_RESEND_SECONDS * 1000) {
    return { ok: false as const, status: 429, error: "Please wait one minute before requesting another OTP." };
  }
  if (count >= OTP_MAX_PER_HOUR) {
    return { ok: false as const, status: 429, error: "OTP request limit reached. Try again after an hour." };
  }

  const otp = String(randomInt(100000, 1000000));
  const providerResponse = await fetch("https://2factor.in/API/V1/OTP/SEND", {
    method: "POST",
    headers: { "content-type": "application/json", "accept": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({ to: phone, template_name: templateName, var1: otp }),
    signal: AbortSignal.timeout(12000),
  }).catch(() => null);

  if (!providerResponse) {
    return { ok: false as const, status: 502, error: "SMS provider could not be reached. Please try again." };
  }
  const providerBody = await providerResponse.json().catch(() => ({})) as {
    status?: string; type?: string; Status?: string; error?: string; message?: string; session_id?: string;
  };
  const providerStatus = String(providerBody.status ?? providerBody.type ?? providerBody.Status ?? "").toLowerCase();
  const sent = providerResponse.ok && (["sent", "success"].includes(providerStatus) || Boolean(providerBody.session_id));
  if (!sent) {
    return { ok: false as const, status: 502, error: "SMS was not accepted by the provider. Check the API key and approved DLT OTP template." };
  }

  const challengeId = randomUUID();
  await sql.query(
    "insert into native_otp_challenges (id, phone, otp_hash, expires_at) values ($1, $2, $3, now() + interval '5 minutes')",
    [challengeId, phone, otpDigest(phone, otp)],
  );
  return { ok: true as const, phone, expiresInSeconds: OTP_TTL_SECONDS, resendAfterSeconds: OTP_RESEND_SECONDS };
}

export async function verifyPhoneOtp(phoneInput: unknown, codeInput: unknown, nameInput: unknown) {
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
    return { ok: false as const, status: 400, error: "OTP expired. Request a new one." };
  }
  if (challenge.attempts >= 5) {
    return { ok: false as const, status: 429, error: "Too many incorrect attempts. Request a new OTP." };
  }
  if (!constantTimeHexEqual(challenge.otp_hash, otpDigest(phone, code))) {
    await sql.query("update native_otp_challenges set attempts = attempts + 1 where id = $1", [challenge.id]);
    return { ok: false as const, status: 400, error: "Incorrect OTP. Please try again." };
  }

  await sql.query("update native_otp_challenges set consumed_at = now() where id = $1", [challenge.id]);
  const customerId = randomUUID();
  const customers = await sql.query<{ id: string }>(
    "insert into native_customers (id, phone, name) values ($1, $2, $3) on conflict (phone) do update set name = excluded.name, verified_at = now(), updated_at = now() returning id",
    [customerId, phone, name],
  );
  const customer = customers[0];
  if (!customer) throw new Error("customer_upsert_failed");
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await sql.query(
    "insert into native_customer_sessions (token_hash, customer_id, expires_at) values ($1, $2, $3)",
    [tokenDigest(token), customer.id, expiresAt],
  );
  return { ok: true as const, token, expiresAt, customer: { id: customer.id, name, phone } };
}

export type NativeCustomer = { id: string; name: string; phone: string };

export async function authenticateNativeRequest(request: Request): Promise<NativeCustomer | null> {
  const match = /^Bearer\s+([A-Za-z0-9_-]{30,})$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) return null;
  const sql = await getSql();
  const rows = await sql.query<NativeCustomer>(
    `select c.id, c.name, c.phone
       from native_customer_sessions s
       join native_customers c on c.id = s.customer_id
      where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()
      limit 1`,
    [tokenDigest(match[1])],
  );
  if (!rows[0]) return null;
  await sql.query("update native_customer_sessions set last_seen_at = now() where token_hash = $1", [tokenDigest(match[1])]);
  return rows[0];
}

type DeliveryPartner = {
  shop: string; rider: string; phone: string; lat: number; lng: number; price: number; stock: number;
};

const DELIVERY_PARTNERS: DeliveryPartner[] = [
  { shop: "Murugan Egg Mart", rider: "Selvam", phone: "9841022001", lat: 13.0003, lng: 80.2668, price: 700, stock: 420 },
  { shop: "Lakshmi Naatu Kozhi", rider: "Kannan", phone: "9841022014", lat: 13.0368, lng: 80.2676, price: 720, stock: 280 },
  { shop: "Anna Fresh Trays", rider: "Imran", phone: "9841022030", lat: 13.0850, lng: 80.2101, price: 680, stock: 640 },
  { shop: "Velachery Sunrise", rider: "Divya", phone: "9841022042", lat: 12.9815, lng: 80.2180, price: 740, stock: 180 },
];

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function safeAddress(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const text = (key: string, max: number) => typeof value[key] === "string" ? (value[key] as string).trim().slice(0, max) : "";
  const pincode = text("pincode", 6);
  const city = text("city", 60);
  const door = text("door", 80);
  const street = text("street", 120);
  const area = text("area", 120);
  const label = text("label", 40) || "Home";
  const landmark = text("landmark", 120);
  const latitude = typeof value.latitude === "number" && Number.isFinite(value.latitude) ? value.latitude : null;
  const longitude = typeof value.longitude === "number" && Number.isFinite(value.longitude) ? value.longitude : null;
  if (!door || !street || !area || !city || !/^\d{6}$/.test(pincode) || latitude === null || longitude === null) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { label, door, street, area, landmark, city, pincode, latitude, longitude,
    line: [door, street, area, landmark].filter(Boolean).join(", ") };
}

export async function createNativeOrder(request: Request, body: unknown) {
  requirePersistentDatabase();
  const customer = await authenticateNativeRequest(request);
  if (!customer) return { ok: false as const, status: 401, error: "Please log in again." };
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false as const, status: 400, error: "Invalid order details." };
  const value = body as Record<string, unknown>;
  const quantity = Number(value.quantity);
  const address = safeAddress(value.address);
  const payment = typeof value.payment === "string" ? value.payment : "UPI · demo";
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 360 || !address) {
    return { ok: false as const, status: 400, error: "Check egg quantity and delivery address." };
  }
  const partner = DELIVERY_PARTNERS
    .map((candidate) => ({ candidate, distance: distanceKm(address.latitude, address.longitude, candidate.lat, candidate.lng) }))
    .filter(({ candidate, distance }) => distance <= 5 && candidate.stock >= quantity)
    .sort((a, b) => a.distance - b.distance)[0]?.candidate;
  if (!partner) return { ok: false as const, status: 422, error: "No active delivery partner is available at this map location." };

  const totalPaise = quantity * partner.price;
  const orderId = `SP-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const deliveryOtp = String(randomInt(100000, 1000000));
  const sql = await getSql();
  await sql.query(
    `insert into native_orders
      (id, customer_id, customer_phone, customer_name, quantity, unit_price_paise, total_paise,
       payment_method, status, partner_shop, partner_name, partner_phone, delivery_otp_encrypted,
       address_label, address_line, city, pincode, latitude, longitude)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'placed',$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [orderId, customer.id, customer.phone, customer.name, quantity, partner.price, totalPaise,
      payment, partner.shop, partner.rider, partner.phone, encryptOtp(deliveryOtp),
      address.label, address.line, address.city, address.pincode, address.latitude, address.longitude],
  );
  await sql.query(
    "insert into native_order_events (id, order_id, from_status, to_status, note, actor) values ($1,$2,null,'placed','Order placed by customer','customer')",
    [randomUUID(), orderId],
  );
  return {
    ok: true as const,
    order: {
      id: orderId, createdAt: new Date().toISOString(), quantity, totalPaise,
      status: "placed", payment, partnerName: partner.rider, partnerPhone: partner.phone,
      deliveryOtp, addressLabel: address.label, deliveryAddress: [address.line, address.city, address.pincode].join(", "),
    },
  };
}

export async function listNativeOrders(request: Request) {
  requirePersistentDatabase();
  const customer = await authenticateNativeRequest(request);
  if (!customer) return { ok: false as const, status: 401, error: "Please log in again." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    `select id, created_at, quantity, total_paise, payment_method, status,
            partner_name, partner_phone, delivery_otp_encrypted, address_label,
            address_line, city, pincode
       from native_orders
      where customer_id = $1
      order by created_at desc limit 100`,
    [customer.id],
  );
  const orders = [];
  for (const row of rows) {
    const events = await sql.query<Row>(
      "select to_status, note, actor, created_at from native_order_events where order_id = $1 order by created_at asc",
      [row.id],
    );
    orders.push({
      id: row.id,
      createdAt: new Date(String(row.created_at)).getTime(),
      quantity: Number(row.quantity),
      totalPaise: Number(row.total_paise),
      payment: String(row.payment_method),
      status: String(row.status),
      partnerName: String(row.partner_name),
      partnerPhone: String(row.partner_phone),
      deliveryOtp: decryptOtp(String(row.delivery_otp_encrypted)),
      addressLabel: String(row.address_label),
      deliveryAddress: [row.address_line, row.city, row.pincode].filter(Boolean).join(", "),
      events: events.map((event) => ({
        status: event.to_status, note: event.note, at: new Date(String(event.created_at)).getTime(),
      })),
    });
  }
  return { ok: true as const, orders };
}

export async function updateNativeOrderStatus(orderId: string, request: Request, body: unknown) {
  requirePersistentDatabase();
  const expected = env("NATIVE_OPS_API_KEY");
  const supplied = request.headers.get("x-native-ops-key") ?? "";
  if (!expected || supplied.length !== expected.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return { ok: false as const, status: 401, error: "Operations authorization failed." };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false as const, status: 400, error: "Invalid status update." };
  const value = body as Record<string, unknown>;
  const status = typeof value.status === "string" ? value.status : "";
  const allowed = new Set(["accepted", "preparing", "out_for_delivery", "delivered", "cancelled"]);
  if (!allowed.has(status)) return { ok: false as const, status: 400, error: "Unsupported order status." };
  const sql = await getSql();
  const current = await sql.query<{ status: string }>("select status from native_orders where id = $1 limit 1", [orderId]);
  if (!current[0]) return { ok: false as const, status: 404, error: "Order not found." };
  const note = typeof value.note === "string" ? value.note.trim().slice(0, 240) : "";
  await sql.query(
    "update native_orders set status = $2, updated_at = now(), status_changed_at = now() where id = $1",
    [orderId, status],
  );
  await sql.query(
    "insert into native_order_events (id, order_id, from_status, to_status, note, actor) values ($1,$2,$3,$4,$5,'operations')",
    [randomUUID(), orderId, current[0].status, status, note],
  );
  return { ok: true as const, orderId, status, notification: "Status is saved. SMS status-template delivery must be enabled separately." };
}
