import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { getSql, dbSource } from "./db";
import { requestCustomerOtp, verifyCustomerOtp } from "./customer-otp.server";

type Row = Record<string, unknown>;
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

export function tokenDigest(token: string): string {
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

function requirePersistentDatabase() {
  if (dbSource !== "neon") {
    throw new Error("persistent_database_not_configured");
  }
}

export async function requestPhoneOtp(phoneInput: unknown, requesterInput: unknown = "native-android") {
  return requestCustomerOtp(phoneInput, requesterInput);
}

export async function verifyPhoneOtp(phoneInput: unknown, codeInput: unknown, nameInput: unknown) {
  return verifyCustomerOtp(phoneInput, codeInput, nameInput);
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

const ORDER_STATUS_LABEL: Record<string, string> = {
  placed: "order placed",
  accepted: "delivery partner allocated",
  preparing: "order is being prepared",
  out_for_delivery: "out for delivery",
  delivered: "delivered",
  cancelled: "cancelled",
};

async function dispatchOrderStatusSms(
  sql: Awaited<ReturnType<typeof getSql>>,
  orderId: string,
  phone: string,
  status: string,
): Promise<"submitted" | "failed" | "not_configured"> {
  const outboxId = randomUUID();
  const vars = { orderId, status: ORDER_STATUS_LABEL[status] ?? status };
  const templateId = env("TWOFACTOR_STATUS_TEMPLATE_ID");
  if (!templateId) {
    await sql.query(
      "insert into native_sms_outbox (id, order_id, recipient, template_kind, template_vars, status, error) values ($1,$2,$3,'order_status',$4::jsonb,'not_configured','Transactional DLT template is not configured')",
      [outboxId, orderId, phone, JSON.stringify(vars)],
    );
    return "not_configured";
  }
  await sql.query(
    "insert into native_sms_outbox (id, order_id, recipient, template_kind, template_vars, status) values ($1,$2,$3,'order_status',$4::jsonb,'queued')",
    [outboxId, orderId, phone, JSON.stringify(vars)],
  );
  const apiKey = env("TWOFACTOR_API_KEY");
  if (!apiKey) {
    await sql.query("update native_sms_outbox set status = 'not_configured', error = '2Factor API key is not configured', updated_at = now() where id = $1", [outboxId]);
    return "not_configured";
  }
  try {
    const response = await fetch("https://2factor.in/API/V1/SMS/SEND", {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({
        to: phone,
        template_id: templateId,
        var1: vars.orderId,
        var2: vars.status,
      }),
      signal: AbortSignal.timeout(12000),
    });
    const body = await response.json().catch(() => ({})) as {
      status?: string; type?: string; Status?: string; message?: string; session_id?: string;
    };
    const providerStatus = String(body.status ?? body.type ?? body.Status ?? "").toLowerCase();
    const accepted = response.ok && ["success", "sent", "submitted"].includes(providerStatus);
    await sql.query(
      "update native_sms_outbox set status = $2, provider_message_id = $3, error = $4, updated_at = now() where id = $1",
      [outboxId, accepted ? "submitted" : "failed", body.session_id ?? body.message ?? null,
        accepted ? null : (body.message ?? "Provider did not accept the status message.")],
    );
    return accepted ? "submitted" : "failed";
  } catch (error) {
    await sql.query(
      "update native_sms_outbox set status = 'failed', error = $2, updated_at = now() where id = $1",
      [outboxId, error instanceof Error ? error.message.slice(0, 240) : "SMS request failed"],
    );
    return "failed";
  }
}

export async function createNativeOrder(request: Request, body: unknown) {
  requirePersistentDatabase();
  const customer = await authenticateNativeRequest(request);
  if (!customer) return { ok: false as const, status: 401, error: "Please log in again." };
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false as const, status: 400, error: "Invalid order details." };
  }
  const value = body as Record<string, unknown>;
  const productType = value.productType === "water_can" ? "water_can" : value.productType === "egg" ? "egg" : "";
  const quantity = Number(value.quantity);
  const address = safeAddress(value.address);
  const emptyBottlesToReturn = value.emptyBottlesToReturn !== false;
  const floorCount = Number.isInteger(value.floorCount) ? Number(value.floorCount) : 0;

  if (!productType || !Number.isInteger(quantity) || quantity < 1 ||
      (productType === "egg" && quantity > 360) ||
      (productType === "water_can" && quantity > 30) ||
      !address || floorCount < 0 || floorCount > 100) {
    return { ok: false as const, status: 400, error: "Check product, quantity and delivery address." };
  }

  const partner = DELIVERY_PARTNERS
    .map((candidate) => ({ candidate, distance: distanceKm(address.latitude, address.longitude, candidate.lat, candidate.lng) }))
    .filter(({ distance }) => distance <= 5)
    .sort((a, b) => a.distance - b.distance)[0]?.candidate;
  if (!partner) return { ok: false as const, status: 422, error: "No delivery partner is currently configured for this map location." };
  if (productType === "egg" && partner.stock < quantity) {
    return { ok: false as const, status: 422, error: "The assigned shop does not have enough egg stock for this quantity." };
  }

  // Client-confirmed Water Can rates. Floor charge remains zero until the business configures it.
  const unitPricePaise = productType === "water_can" ? 3000 : partner.price;
  const bottleDepositPaise = productType === "water_can" && !emptyBottlesToReturn ? quantity * 15000 : 0;
  const floorDeliveryChargePaise = 0;
  const totalPaise = (quantity * unitPricePaise) + bottleDepositPaise + floorDeliveryChargePaise;
  const orderId = \`EG-\${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-\${randomBytes(3).toString("hex").toUpperCase()}\`;
  const deliveryOtp = String(randomInt(100000, 1000000));
  const sql = await getSql();

  await sql.query(
    \`insert into native_orders
      (id, customer_id, customer_phone, customer_name, quantity, unit_price_paise, total_paise,
       payment_method, status, partner_shop, partner_name, partner_phone, delivery_otp_encrypted,
       address_label, address_line, city, pincode, latitude, longitude,
       product_type, bottle_deposit_paise, empty_bottles_to_return, floor_count,
       floor_delivery_charge_paise, payment_status)
     values ($1,$2,$3,$4,$5,$6,$7,'payment_pending','placed',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'pending')\`,
    [orderId, customer.id, customer.phone, customer.name, quantity, unitPricePaise, totalPaise,
      partner.shop, partner.rider, partner.phone, encryptOtp(deliveryOtp),
      address.label, address.line, address.city, address.pincode, address.latitude, address.longitude,
      productType, bottleDepositPaise, emptyBottlesToReturn, floorCount, floorDeliveryChargePaise],
  );
  await sql.query(
    "insert into native_order_events (id, order_id, from_status, to_status, note, actor) values ($1,$2,null,'placed','Order placed by customer','customer')",
    [randomUUID(), orderId],
  );
  await dispatchOrderStatusSms(sql, orderId, customer.phone, "placed");
  return {
    ok: true as const,
    order: {
      id: orderId,
      createdAt: new Date().toISOString(),
      productType,
      quantity,
      unitPricePaise,
      bottleDepositPaise,
      emptyBottlesToReturn,
      floorCount,
      floorDeliveryChargePaise,
      totalPaise,
      status: "placed",
      payment: "Payment pending",
      paymentStatus: "pending",
      partnerName: partner.rider,
      partnerPhone: partner.phone,
      deliveryOtp,
      addressLabel: address.label,
      deliveryAddress: [address.line, address.city, address.pincode].join(", "),
    },
  };
}
export async function listNativeOrders(request: Request) {
  requirePersistentDatabase();
  const customer = await authenticateNativeRequest(request);
  if (!customer) return { ok: false as const, status: 401, error: "Please log in again." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    `select id, created_at, quantity, total_paise, payment_method, payment_status, status,
            partner_name, partner_phone, delivery_otp_encrypted, address_label,
            address_line, city, pincode, product_type, bottle_deposit_paise, floor_count,
            floor_delivery_charge_paise, empty_bottles_to_return,
            exists(select 1 from native_wallet_transactions t where t.order_id = native_orders.id and t.transaction_type = 'refund') as refund_applied
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
      paymentStatus: String(row.payment_status ?? "pending"),
      status: String(row.status),
      productType: String(row.product_type ?? "egg"),
      bottleDepositPaise: Number(row.bottle_deposit_paise ?? 0),
      floorCount: Number(row.floor_count ?? 0),
      floorDeliveryChargePaise: Number(row.floor_delivery_charge_paise ?? 0),
      emptyBottlesToReturn: Boolean(row.empty_bottles_to_return ?? true),
      refundApplied: Boolean(row.refund_applied),
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

export async function createNativeComplaint(request: Request, body: unknown) {
  requirePersistentDatabase();
  const customer = await authenticateNativeRequest(request);
  if (!customer) return { ok: false as const, status: 401, error: "Please log in again." };
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false as const, status: 400, error: "Invalid support request." };
  }
  const message = typeof (body as Record<string, unknown>).message === "string"
    ? String((body as Record<string, unknown>).message).trim().slice(0, 2000)
    : "";
  if (message.length < 5) return { ok: false as const, status: 400, error: "Please describe your issue in at least five characters." };
  const id = "SUP-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + randomBytes(3).toString("hex").toUpperCase();
  const sql = await getSql();
  await sql.query(
    "insert into native_complaints (id, customer_id, customer_name, customer_phone, message) values ($1,$2,$3,$4,$5)",
    [id, customer.id, customer.name, customer.phone, message],
  );
  return { ok: true as const, ticketId: id, status: "open" };
}

export async function saveNativeCustomerAddresses(request: Request, body: unknown) {
  requirePersistentDatabase();
  const customer = await authenticateNativeRequest(request);
  if (!customer) return { ok: false as const, status: 401, error: "Please log in again." };
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false as const, status: 400, error: "Invalid addresses." };
  }
  const input = (body as Record<string, unknown>).addresses;
  if (!Array.isArray(input) || input.length > 4) {
    return { ok: false as const, status: 400, error: "You can save up to four delivery addresses." };
  }
  const addresses = input.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const value = item as Record<string, unknown>;
    const address = safeAddress(value);
    if (!address) return null;
    const id = typeof value.id === "string" && value.id.trim() ? value.id.trim().slice(0, 80) : randomUUID();
    return { id, ...address, isDefault: value.isDefault === true };
  });
  if (addresses.some((item) => item === null)) {
    return { ok: false as const, status: 400, error: "One of the saved addresses is incomplete or invalid." };
  }
  const sql = await getSql();
  const ids = addresses.map((item) => item!.id);
  if (ids.length) {
    await sql.query(
      "delete from native_customer_addresses where customer_id = $1 and not (id = any($2::text[]))",
      [customer.id, ids],
    );
  } else {
    await sql.query("delete from native_customer_addresses where customer_id = $1", [customer.id]);
  }
  for (const item of addresses) {
    if (!item) continue;
    await sql.query(
      \`insert into native_customer_addresses
        (id, customer_id, label, door, street, area, landmark, city, pincode, latitude, longitude, is_default, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now())
       on conflict (id) do update set
         label = excluded.label, door = excluded.door, street = excluded.street,
         area = excluded.area, landmark = excluded.landmark, city = excluded.city,
         pincode = excluded.pincode, latitude = excluded.latitude, longitude = excluded.longitude,
         is_default = excluded.is_default, updated_at = now()
       where native_customer_addresses.customer_id = excluded.customer_id\`,
      [item.id, customer.id, item.label, item.door, item.street, item.area, item.landmark,
       item.city, item.pincode, item.latitude, item.longitude, item.isDefault],
    );
  }
  return { ok: true as const, saved: addresses.length };
}

export async function listNativeCustomerAddresses(request: Request) {
  requirePersistentDatabase();
  const customer = await authenticateNativeRequest(request);
  if (!customer) return { ok: false as const, status: 401, error: "Please log in again." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    \`select id, label, door, street, area, landmark, city, pincode, latitude, longitude, is_default
       from native_customer_addresses where customer_id = $1 order by is_default desc, created_at asc\`,
    [customer.id],
  );
  return { ok: true as const, addresses: rows };
}

function isOperationsRequest(request: Request): boolean {
  const expected = env("NATIVE_OPS_API_KEY");
  const supplied = request.headers.get("x-native-ops-key") ?? "";
  if (!expected || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export async function listOperationsNativeOrders(request: Request) {
  requirePersistentDatabase();
  if (!isOperationsRequest(request)) {
    return { ok: false as const, status: 401, error: "Operations authorization failed." };
  }
  const sql = await getSql();
  const rows = await sql.query<Row>(
    `select id, customer_name, customer_phone, quantity, total_paise, payment_method, status,
            partner_shop, partner_name, partner_phone, address_label, address_line, city, pincode,
            created_at, status_changed_at
       from native_orders
      order by created_at desc limit 250`,
  );
  return {
    ok: true as const,
    orders: rows.map((row) => ({
      id: row.id,
      customerName: row.customer_name,
      phone: row.customer_phone,
      quantity: Number(row.quantity),
      totalPaise: Number(row.total_paise),
      payment: row.payment_method,
      status: row.status,
      partnerShop: row.partner_shop,
      partnerName: row.partner_name,
      partnerPhone: row.partner_phone,
      addressLabel: row.address_label,
      deliveryAddress: [row.address_line, row.city, row.pincode].filter(Boolean).join(", "),
      createdAt: new Date(String(row.created_at)).getTime(),
      statusChangedAt: new Date(String(row.status_changed_at)).getTime(),
    })),
  };
}

export async function getNativeWallet(request: Request) {
  requirePersistentDatabase();
  const customer = await authenticateNativeRequest(request);
  if (!customer) return { ok: false as const, status: 401, error: "Please log in again." };
  const sql = await getSql();
  const wallet = await sql.query<{ balance_paise: number }>(
    "select balance_paise from native_customer_wallets where customer_id = $1 limit 1",
    [customer.id],
  );
  const transactions = await sql.query<Row>(
    \`select id, order_id, transaction_type, amount_paise, balance_after_paise, description, created_at
       from native_wallet_transactions where customer_id = $1 order by created_at desc limit 100\`,
    [customer.id],
  );
  return {
    ok: true as const,
    balancePaise: Number(wallet[0]?.balance_paise ?? 0),
    transactions: transactions.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      type: row.transaction_type,
      amountPaise: Number(row.amount_paise),
      balanceAfterPaise: Number(row.balance_after_paise),
      description: row.description,
      createdAt: new Date(String(row.created_at)).getTime(),
    })),
  };
}

export async function listOperationsNativeComplaints(request: Request) {
  requirePersistentDatabase();
  if (!isOperationsRequest(request)) {
    return { ok: false as const, status: 401, error: "Operations authorization failed." };
  }
  const sql = await getSql();
  const rows = await sql.query<Row>(
    \`select id, customer_name, customer_phone, message, status, created_at, updated_at
       from native_complaints order by created_at desc limit 250\`,
  );
  return { ok: true as const, complaints: rows };
}

export async function updateNativeOrderStatus(orderId: string, request: Request, body: unknown) {
  requirePersistentDatabase();
  if (!isOperationsRequest(request)) {
    return { ok: false as const, status: 401, error: "Operations authorization failed." };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false as const, status: 400, error: "Invalid status update." };
  const value = body as Record<string, unknown>;
  const status = typeof value.status === "string" ? value.status : "";
  const allowed = new Set(["accepted", "preparing", "out_for_delivery", "delivered", "cancelled"]);
  if (!allowed.has(status)) return { ok: false as const, status: 400, error: "Unsupported status." };
  const sql = await getSql();
  const current = await sql.query<{ status: string; payment_status: string; customer_id: string; total_paise: number }>(
    "select status, payment_status, customer_id, total_paise from native_orders where id = $1 limit 1",
    [orderId],
  );
  if (!current[0]) return { ok: false as const, status: 404, error: "Order not found." };
  if (current[0].status === "cancelled") {
    return { ok: true as const, orderId, status: "cancelled", refundApplied: false, notification: "already_cancelled" };
  }
  if (current[0].status === "delivered") {
    return { ok: false as const, status: 409, error: "A delivered order cannot be cancelled or moved backwards." };
  }
  const note = typeof value.note === "string" ? value.note.trim().slice(0, 240) : "";
  const updated = await sql.query<{ customer_phone: string }>(
    \`update native_orders
        set status = $2, updated_at = now(), status_changed_at = now()
      where id = $1 and status not in ('cancelled', 'delivered')
      returning customer_phone\`,
    [orderId, status],
  );
  if (!updated[0]) return { ok: false as const, status: 409, error: "Order status changed elsewhere. Refresh and try again." };
  await sql.query(
    "insert into native_order_events (id, order_id, from_status, to_status, note, actor) values ($1,$2,$3,$4,$5,'operations')",
    [randomUUID(), orderId, current[0].status, status, note],
  );

  let refundApplied = false;
  if (status === "cancelled" && current[0].payment_status === "paid") {
    const wallet = await sql.query<{ balance_paise: number }>(
      \`insert into native_customer_wallets (customer_id, balance_paise, updated_at)
       values ($1,$2,now())
       on conflict (customer_id) do update
         set balance_paise = native_customer_wallets.balance_paise + excluded.balance_paise,
             updated_at = now()
       returning balance_paise\`,
      [current[0].customer_id, Number(current[0].total_paise)],
    );
    const balance = Number(wallet[0]?.balance_paise ?? 0);
    await sql.query(
      \`insert into native_wallet_transactions
        (id, customer_id, order_id, transaction_type, amount_paise, balance_after_paise, description)
       values ($1,$2,$3,'refund',$4,$5,$6)
       on conflict (order_id, transaction_type) do nothing\`,
      [randomUUID(), current[0].customer_id, orderId, Number(current[0].total_paise), balance, "Refund for cancelled order " + orderId],
    );
    refundApplied = true;
  }

  const notification = await dispatchOrderStatusSms(sql, orderId, updated[0].customer_phone, status);
  return { ok: true as const, orderId, status, refundApplied, notification };
}
