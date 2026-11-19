import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSql, dbSource } from "./db";
import { requestPhoneOtp, verifyPhoneOtp, tokenDigest, dispatchOrderStatusSms } from "./native-api.server";
import { normalizeIndianPhone } from "./customer-otp.server";

type Row = Record<string, unknown>;
type Vendor = {
  id: string; name: string; phone: string;
  status: "pending" | "approved" | "suspended";
  servicePincodes: string[]; acceptingOrders: boolean;
  opensAt: string; closesAt: string;
};

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}
function requirePersistentDatabase() {
  if (dbSource !== "neon") throw new Error("persistent_database_not_configured");
}
function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
function isSuperAdminRequest(request: Request) {
  const expected = env("NATIVE_SUPERADMIN_API_KEY");
  const supplied = request.headers.get("x-native-superadmin-key") ?? "";
  return Boolean(expected && supplied && safeEqual(expected, supplied));
}
function bearerToken(request: Request) {
  const match = /^Bearer\s+([A-Za-z0-9_-]{30,})$/i.exec(request.headers.get("authorization") ?? "");
  return match?.[1] ?? null;
}
function mapVendor(row: Row): Vendor {
  return {
    id: String(row.id), name: String(row.name), phone: String(row.phone),
    status: String(row.status) as Vendor["status"],
    servicePincodes: Array.isArray(row.service_pincodes) ? row.service_pincodes.map(String) : [],
    acceptingOrders: Boolean(row.accepting_orders),
    opensAt: String(row.opens_at ?? "05:00"), closesAt: String(row.closes_at ?? "14:00"),
  };
}
async function authenticateVendor(request: Request) {
  const token = bearerToken(request);
  if (!token) return null;
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "select v.id,v.name,v.phone,v.status,v.service_pincodes,v.accepting_orders,v.opens_at,v.closes_at " +
    "from native_vendor_sessions s join native_vendors v on v.id=s.vendor_id " +
    "where s.token_hash=$1 and s.revoked_at is null and s.expires_at>now() limit 1",
    [tokenDigest(token)],
  );
  const row = rows[0];
  if (!row || row.status !== "approved") return null;
  await sql.query("update native_vendor_sessions set last_seen_at=now() where token_hash=$1", [tokenDigest(token)]);
  return { vendor: mapVendor(row) };
}

export async function requestVendorOtp(phoneInput: unknown, requester: unknown) {
  requirePersistentDatabase();
  const phone = normalizeIndianPhone(phoneInput);
  if (!phone) return { ok: false as const, status: 400, error: "Enter a valid 10-digit Indian mobile number." };
  const sql = await getSql();
  const rows = await sql.query<Row>("select status from native_vendors where phone=$1 limit 1", [phone]);
  if (!rows[0]) {
    return { ok: false as const, status: 403, error: "This mobile number is not registered as a Spencer's vendor." };
  }
  if (rows[0].status !== "approved") {
    return { ok: false as const, status: 403, error: rows[0].status === "pending" ? "Your vendor account is awaiting approval." : "This vendor account is suspended. Contact platform operations." };
  }
  return requestPhoneOtp(phone, "vendor:" + (typeof requester === "string" ? requester.slice(0, 120) : "native-app"));
}

export async function verifyVendorOtp(phoneInput: unknown, code: unknown, _name: unknown) {
  requirePersistentDatabase();
  const phone = normalizeIndianPhone(phoneInput);
  if (!phone) return { ok: false as const, status: 400, error: "Enter a valid 10-digit Indian mobile number." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "select id,name,phone,status,service_pincodes,accepting_orders,opens_at,closes_at from native_vendors where phone=$1 limit 1",
    [phone],
  );
  if (!rows[0]) {
    return { ok: false as const, status: 403, error: "This mobile number is not registered as a Spencer's vendor." };
  }
  const vendor = mapVendor(rows[0]);
  if (vendor.status !== "approved") {
    return { ok: false as const, status: 403, error: vendor.status === "pending" ? "Your vendor account is awaiting approval." : "This vendor account is suspended. Contact platform operations." };
  }

  // Preserve an existing customer name when a phone number is shared by a vendor and customer.
  const existingCustomer = await sql.query<{ name: string }>(
    "select name from native_customers where phone=$1 limit 1",
    [phone],
  );
  const verified = await verifyPhoneOtp(phone, code, existingCustomer[0]?.name || vendor.name);
  if (!verified.ok) return verified;

  const token = randomBytes(32).toString("base64url");
  await sql.query(
    "insert into native_vendor_sessions(token_hash,vendor_id,expires_at) values($1,$2,now()+interval '30 days')",
    [tokenDigest(token), vendor.id],
  );
  await sql.query("update native_customer_sessions set revoked_at=now() where token_hash=$1", [tokenDigest(verified.token)]);
  return { ok: true as const, token, vendor, expiresInSeconds: 30 * 86400 };
}
export async function getVendorSession(request: Request) {
  requirePersistentDatabase();
  const auth = await authenticateVendor(request);
  if (!auth) return { ok: false as const, status: 401, error: "Vendor session expired. Sign in again." };
  return { ok: true as const, vendor: auth.vendor };
}

export async function listVendorOrders(request: Request) {
  requirePersistentDatabase();
  const auth = await authenticateVendor(request);
  if (!auth) return { ok: false as const, status: 401, error: "Vendor session expired. Sign in again." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "select id,customer_name,customer_phone,quantity,unit_price_paise,water_can_quantity,milk_quantity,curd_quantity," +
    "milk_unit_price_paise,curd_unit_price_paise,bottle_deposit_paise,empty_bottles_to_return,total_paise," +
    "payment_method,payment_status,status,address_label,address_line,city,pincode,created_at,status_changed_at " +
    "from native_orders where vendor_id=$1 order by created_at desc limit 250",
    [auth.vendor.id],
  );
  return {
    ok: true as const,
    orders: rows.map((row) => ({
      id: String(row.id), customerName: String(row.customer_name), phone: String(row.customer_phone),
      eggQuantity: Number(row.quantity ?? 0), eggUnitPricePaise: Number(row.unit_price_paise ?? 700),
      waterCanQuantity: Number(row.water_can_quantity ?? 0), milkQuantity: Number(row.milk_quantity ?? 0),
      curdQuantity: Number(row.curd_quantity ?? 0), milkUnitPricePaise: Number(row.milk_unit_price_paise ?? 0),
      curdUnitPricePaise: Number(row.curd_unit_price_paise ?? 0), bottleDepositPaise: Number(row.bottle_deposit_paise ?? 0),
      emptyBottlesToReturn: Boolean(row.empty_bottles_to_return), totalPaise: Number(row.total_paise ?? 0),
      paymentMethod: String(row.payment_method), paymentStatus: String(row.payment_status), status: String(row.status),
      addressLabel: String(row.address_label), addressLine: String(row.address_line), city: String(row.city),
      pincode: String(row.pincode), createdAt: new Date(String(row.created_at)).getTime(),
      statusChangedAt: new Date(String(row.status_changed_at)).getTime(),
    })),
  };
}

export async function updateVendorOrderStatus(orderId: string, request: Request, body: unknown) {
  requirePersistentDatabase();
  const auth = await authenticateVendor(request);
  if (!auth) return { ok: false as const, status: 401, error: "Vendor session expired. Sign in again." };
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false as const, status: 400, error: "Invalid order update." };
  const value = body as Record<string, unknown>;
  const status = typeof value.status === "string" ? value.status : "";
  const note = typeof value.note === "string" ? value.note.trim().slice(0, 240) : "";
  const sql = await getSql();
  const current = await sql.query<Row>(
    "select status,payment_status,payment_method,customer_phone from native_orders where id=$1 and vendor_id=$2 limit 1",
    [orderId, auth.vendor.id],
  );
  if (!current[0]) return { ok: false as const, status: 404, error: "Order was not found for this vendor." };
  const previous = String(current[0].status);

  if (status === "rejected") {
    if (previous !== "placed") return { ok: false as const, status: 409, error: "Only a new order can be declined." };
    const reason = note || "Vendor unable to fulfil the order";
    const updated = await sql.query<Row>(
      "update native_orders set vendor_id=null,partner_shop='',partner_name='',partner_phone='',updated_at=now(),status_changed_at=now() " +
      "where id=$1 and vendor_id=$2 and status='placed' returning id",
      [orderId, auth.vendor.id],
    );
    if (!updated[0]) return { ok: false as const, status: 409, error: "Order changed elsewhere. Refresh and try again." };
    await sql.query(
      "insert into native_order_events(id,order_id,from_status,to_status,note,actor) values($1,$2,'placed','placed',$3,$4)",
      [randomUUID(), orderId, "Vendor declined: " + reason, "vendor:" + auth.vendor.id],
    );
    return { ok: true as const, orderId, status: "placed", assignmentReleased: true };
  }

  const nextByCurrent: Record<string, string> = {
    placed: "accepted", accepted: "preparing", preparing: "out_for_delivery", out_for_delivery: "delivered",
  };
  if (nextByCurrent[previous] !== status) {
    return { ok: false as const, status: 409, error: "This order cannot move to that status. Refresh to see the latest state." };
  }
  if (status === "delivered" && String(current[0].payment_method) === "cash_on_delivery" &&
      value.cashCollected !== true && value.cashCollected !== false) {
    return { ok: false as const, status: 400, error: "Confirm whether cash was collected before marking delivered." };
  }
  const paymentStatus = status === "delivered" && value.cashCollected === true ? "paid" : String(current[0].payment_status);
  const updated = await sql.query<Row>(
    "update native_orders set status=$3,payment_status=$4,updated_at=now(),status_changed_at=now() " +
    "where id=$1 and vendor_id=$2 and status=$5 returning id",
    [orderId, auth.vendor.id, status, paymentStatus, previous],
  );
  if (!updated[0]) return { ok: false as const, status: 409, error: "Order changed elsewhere. Refresh and try again." };
  await sql.query(
    "insert into native_order_events(id,order_id,from_status,to_status,note,actor) values($1,$2,$3,$4,$5,$6)",
    [randomUUID(), orderId, previous, status, note || "Updated by vendor", "vendor:" + auth.vendor.id],
  );
  const notification = await dispatchOrderStatusSms(sql, orderId, String(current[0].customer_phone), status);
  return { ok: true as const, orderId, status, paymentStatus, notification };
}

export async function getVendorStock(request: Request) {
  requirePersistentDatabase();
  const auth = await authenticateVendor(request);
  if (!auth) return { ok: false as const, status: 401, error: "Vendor session expired. Sign in again." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "select product_key,stock_units,low_stock_at,available,updated_at from native_vendor_inventory where vendor_id=$1 order by product_key",
    [auth.vendor.id],
  );
  return { ok: true as const, stock: rows.map((row) => ({
    productKey: String(row.product_key), stockUnits: Number(row.stock_units), lowStockAt: Number(row.low_stock_at),
    available: Boolean(row.available), updatedAt: new Date(String(row.updated_at)).getTime(),
  })) };
}

export async function updateVendorStock(request: Request, body: unknown) {
  requirePersistentDatabase();
  const auth = await authenticateVendor(request);
  if (!auth) return { ok: false as const, status: 401, error: "Vendor session expired. Sign in again." };
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false as const, status: 400, error: "Invalid stock update." };
  const value = body as Record<string, unknown>;
  const key = typeof value.productKey === "string" ? value.productKey : "";
  const allowed = new Set(["egg", "water", "milk", "curd"]);
  const stock = Number(value.stockUnits);
  const low = Number(value.lowStockAt);
  if (!allowed.has(key) || !Number.isInteger(stock) || stock < 0 || stock > 100000 ||
      !Number.isInteger(low) || low < 0 || low > 100000 || typeof value.available !== "boolean") {
    return { ok: false as const, status: 400, error: "Enter valid stock and availability values." };
  }
  const sql = await getSql();
  await sql.query(
    "insert into native_vendor_inventory(vendor_id,product_key,stock_units,low_stock_at,available,updated_at) " +
    "values($1,$2,$3,$4,$5,now()) on conflict(vendor_id,product_key) do update set " +
    "stock_units=excluded.stock_units,low_stock_at=excluded.low_stock_at,available=excluded.available,updated_at=now()",
    [auth.vendor.id, key, stock, low, value.available],
  );
  return { ok: true as const, stock: await getVendorStock(request).then((result) => result.ok ? result.stock : []) };
}

export async function updateVendorProfile(request: Request, body: unknown) {
  requirePersistentDatabase();
  const auth = await authenticateVendor(request);
  if (!auth) return { ok: false as const, status: 401, error: "Vendor session expired. Sign in again." };
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false as const, status: 400, error: "Invalid shop settings." };
  const value = body as Record<string, unknown>;
  const accepting = value.acceptingOrders;
  const opensAt = typeof value.opensAt === "string" ? value.opensAt : auth.vendor.opensAt;
  const closesAt = typeof value.closesAt === "string" ? value.closesAt : auth.vendor.closesAt;
  const validTime = (input: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(input);
  if (typeof accepting !== "boolean" || !validTime(opensAt) || !validTime(closesAt)) {
    return { ok: false as const, status: 400, error: "Enter valid opening hours and shop availability." };
  }
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "update native_vendors set accepting_orders=$2,opens_at=$3,closes_at=$4,updated_at=now() " +
    "where id=$1 and status='approved' returning id,name,phone,status,service_pincodes,accepting_orders,opens_at,closes_at",
    [auth.vendor.id, accepting, opensAt, closesAt],
  );
  if (!rows[0]) return { ok: false as const, status: 409, error: "Vendor account is no longer active." };
  return { ok: true as const, vendor: mapVendor(rows[0]) };
}

export async function logoutVendor(request: Request) {
  requirePersistentDatabase();
  const token = bearerToken(request);
  if (!token) return { ok: true as const };
  const sql = await getSql();
  await sql.query("update native_vendor_sessions set revoked_at=now() where token_hash=$1 and revoked_at is null", [tokenDigest(token)]);
  return { ok: true as const };
}

export async function listSuperAdminVendors(request: Request) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "select id,name,phone,status,service_pincodes,accepting_orders,opens_at,closes_at,created_at from native_vendors order by created_at desc",
  );
  return { ok: true as const, vendors: rows.map((row) => ({
    ...mapVendor(row), createdAt: new Date(String(row.created_at)).getTime(),
  })) };
}

export async function createSuperAdminVendor(request: Request, body: unknown) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false as const, status: 400, error: "Invalid vendor details." };
  const value = body as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim().slice(0, 100) : "";
  const digits = typeof value.phone === "string" ? value.phone.replace(/\D/g, "") : "";
  const phone = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  const pins = Array.isArray(value.servicePincodes)
    ? value.servicePincodes.filter((v): v is string => typeof v === "string" && /^\d{6}$/.test(v)).slice(0, 100)
    : [];
  if (!name || !/^[6-9]\d{9}$/.test(phone) || pins.length === 0) {
    return { ok: false as const, status: 400, error: "Provide a shop name, valid Indian mobile number and at least one six-digit service pincode." };
  }
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "insert into native_vendors(id,name,phone,status,service_pincodes,accepting_orders) " +
    "values($1,$2,$3,'pending',$4,false) on conflict(phone) do update set " +
    "name=excluded.name,service_pincodes=excluded.service_pincodes,updated_at=now() " +
    "returning id,name,phone,status,service_pincodes,accepting_orders,opens_at,closes_at",
    ["VN-" + randomUUID(), name, "+91" + phone, pins],
  );
  const vendor = mapVendor(rows[0]);
  for (const productKey of ["egg", "water", "milk", "curd"]) {
    await sql.query(
      "insert into native_vendor_inventory(vendor_id,product_key,stock_units,low_stock_at,available) values($1,$2,0,10,false) on conflict(vendor_id,product_key) do nothing",
      [vendor.id, productKey],
    );
  }
  return { ok: true as const, vendor };
}

export async function setSuperAdminVendorStatus(request: Request, vendorId: string, body: unknown) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  const status = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>).status : null;
  if (!["pending", "approved", "suspended"].includes(String(status))) return { ok: false as const, status: 400, error: "Unsupported vendor status." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "update native_vendors set status=$2,accepting_orders=case when $2='approved' then accepting_orders else false end,updated_at=now() " +
    "where id=$1 returning id,name,phone,status,service_pincodes,accepting_orders,opens_at,closes_at",
    [vendorId, status],
  );
  if (!rows[0]) return { ok: false as const, status: 404, error: "Vendor not found." };
  if (status !== "approved") await sql.query("update native_vendor_sessions set revoked_at=now() where vendor_id=$1 and revoked_at is null", [vendorId]);
  return { ok: true as const, vendor: mapVendor(rows[0]) };
}

export async function assignSuperAdminOrder(request: Request, orderId: string, body: unknown) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  const vendorId = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>).vendorId : null;
  if (typeof vendorId !== "string" || !vendorId.trim()) return { ok: false as const, status: 400, error: "Choose a vendor." };
  const sql = await getSql();
  const vendors = await sql.query<Row>("select id,name,phone from native_vendors where id=$1 and status='approved' limit 1", [vendorId]);
  if (!vendors[0]) return { ok: false as const, status: 404, error: "Approved vendor not found." };
  const current = await sql.query<Row>("select status,vendor_id from native_orders where id=$1 limit 1", [orderId]);
  if (!current[0]) return { ok: false as const, status: 404, error: "Order not found." };
  if (["cancelled", "delivered"].includes(String(current[0].status))) return { ok: false as const, status: 409, error: "Completed or cancelled orders cannot be reassigned." };
  const updated = await sql.query<Row>(
    "update native_orders set vendor_id=$2,partner_shop=$3,partner_name=$3,partner_phone=$4,updated_at=now() " +
    "where id=$1 and status not in ('cancelled','delivered') returning id",
    [orderId, vendorId, String(vendors[0].name), String(vendors[0].phone)],
  );
  if (!updated[0]) return { ok: false as const, status: 409, error: "Order changed elsewhere. Refresh and try again." };
  await sql.query(
    "insert into native_order_events(id,order_id,from_status,to_status,note,actor) values($1,$2,$3,$3,$4,'superadmin')",
    [randomUUID(), orderId, String(current[0].status), "Assigned to " + String(vendors[0].name)],
  );
  return { ok: true as const, orderId, vendorId, vendorName: String(vendors[0].name) };
}

export async function assignOrderAutomatically(sql: Awaited<ReturnType<typeof getSql>>, pincode: string) {
  const rows = await sql.query<Row>(
    "select v.id,v.name,v.phone from native_vendors v " +
    "where v.status='approved' and v.accepting_orders=true and $1=any(v.service_pincodes) " +
    "order by (select count(*) from native_orders o where o.vendor_id=v.id " +
    "and o.status in ('placed','accepted','preparing','out_for_delivery')) asc, v.created_at asc limit 1",
    [pincode],
  );
  return rows[0] ? { id: String(rows[0].id), name: String(rows[0].name), phone: String(rows[0].phone) } : null;
}


export async function getSuperAdminDashboard(request: Request) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  const sql = await getSql();
  const [orders, vendors, customers, complaints] = await Promise.all([
    sql.query<Row>(
      "select count(*)::int as total, " +
      "count(*) filter (where status in ('placed','accepted','preparing','out_for_delivery'))::int as open, " +
      "count(*) filter (where status='delivered')::int as delivered, " +
      "coalesce(sum(total_paise) filter (where status='delivered'),0)::bigint as delivered_value, " +
      "count(*) filter (where created_at >= date_trunc('day', now()))::int as today " +
      "from native_orders",
    ),
    sql.query<Row>(
      "select count(*)::int as total, " +
      "count(*) filter (where status='pending')::int as pending, " +
      "count(*) filter (where status='approved')::int as approved, " +
      "count(*) filter (where status='suspended')::int as suspended " +
      "from native_vendors",
    ),
    sql.query<Row>("select count(*)::int as total from native_customers"),
    sql.query<Row>(
      "select count(*) filter (where status in ('open','in_progress'))::int as open " +
      "from native_complaints",
    ),
  ]);
  const o = orders[0] ?? {};
  const v = vendors[0] ?? {};
  return {
    ok: true as const,
    stats: {
      orders: {
        total: Number(o.total ?? 0), open: Number(o.open ?? 0), delivered: Number(o.delivered ?? 0),
        deliveredValuePaise: Number(o.delivered_value ?? 0), today: Number(o.today ?? 0),
      },
      vendors: {
        total: Number(v.total ?? 0), pending: Number(v.pending ?? 0),
        approved: Number(v.approved ?? 0), suspended: Number(v.suspended ?? 0),
      },
      customers: Number(customers[0]?.total ?? 0),
      openComplaints: Number(complaints[0]?.open ?? 0),
    },
  };
}

export async function listSuperAdminOrders(request: Request) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "select o.id,o.customer_name,o.customer_phone,o.quantity,o.unit_price_paise,o.water_can_quantity," +
    "o.milk_quantity,o.curd_quantity,o.milk_unit_price_paise,o.curd_unit_price_paise,o.bottle_deposit_paise," +
    "o.total_paise,o.payment_method,o.payment_status,o.status,o.partner_shop,o.partner_name,o.partner_phone," +
    "o.address_label,o.address_line,o.city,o.pincode,o.created_at,o.status_changed_at,o.vendor_id," +
    "v.name as assigned_vendor_name " +
    "from native_orders o left join native_vendors v on v.id=o.vendor_id " +
    "order by o.created_at desc limit 300",
  );
  return {
    ok: true as const,
    orders: rows.map((row) => ({
      id: String(row.id), customerName: String(row.customer_name), phone: String(row.customer_phone),
      eggQuantity: Number(row.quantity ?? 0), eggUnitPricePaise: Number(row.unit_price_paise ?? 0),
      waterCanQuantity: Number(row.water_can_quantity ?? 0), milkQuantity: Number(row.milk_quantity ?? 0),
      curdQuantity: Number(row.curd_quantity ?? 0), milkUnitPricePaise: Number(row.milk_unit_price_paise ?? 0),
      curdUnitPricePaise: Number(row.curd_unit_price_paise ?? 0), bottleDepositPaise: Number(row.bottle_deposit_paise ?? 0),
      totalPaise: Number(row.total_paise ?? 0), paymentMethod: String(row.payment_method ?? ""),
      paymentStatus: String(row.payment_status ?? "pending"), status: String(row.status ?? ""),
      partnerShop: String(row.partner_shop ?? ""), partnerName: String(row.partner_name ?? ""),
      partnerPhone: String(row.partner_phone ?? ""), addressLabel: String(row.address_label ?? "Home"),
      deliveryAddress: [row.address_line, row.city, row.pincode].filter(Boolean).map(String).join(", "),
      createdAt: new Date(String(row.created_at)).getTime(),
      statusChangedAt: new Date(String(row.status_changed_at)).getTime(),
      vendorId: row.vendor_id ? String(row.vendor_id) : null,
      vendorName: row.assigned_vendor_name ? String(row.assigned_vendor_name) : "",
    })),
  };
}

export async function listSuperAdminComplaints(request: Request) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "select id,customer_name,customer_phone,message,status,created_at,updated_at " +
    "from native_complaints order by created_at desc limit 250",
  );
  return {
    ok: true as const,
    complaints: rows.map((row) => ({
      id: String(row.id), customerName: String(row.customer_name), phone: String(row.customer_phone),
      message: String(row.message), status: String(row.status),
      createdAt: new Date(String(row.created_at)).getTime(),
      updatedAt: new Date(String(row.updated_at)).getTime(),
    })),
  };
}

export async function updateSuperAdminComplaintStatus(request: Request, complaintId: string, body: unknown) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  const status = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).status : null;
  if (!["open", "in_progress", "resolved", "closed"].includes(String(status))) {
    return { ok: false as const, status: 400, error: "Unsupported support ticket status." };
  }
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "update native_complaints set status=$2,updated_at=now() where id=$1 " +
    "returning id,customer_name,customer_phone,message,status,created_at,updated_at",
    [complaintId, status],
  );
  if (!rows[0]) return { ok: false as const, status: 404, error: "Support ticket not found." };
  const row = rows[0];
  return {
    ok: true as const,
    complaint: {
      id: String(row.id), customerName: String(row.customer_name), phone: String(row.customer_phone),
      message: String(row.message), status: String(row.status),
      createdAt: new Date(String(row.created_at)).getTime(),
      updatedAt: new Date(String(row.updated_at)).getTime(),
    },
  };
}

export async function listSuperAdminInventory(request: Request) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "select i.vendor_id,v.name as vendor_name,v.status as vendor_status,i.product_key," +
    "i.stock_units,i.low_stock_at,i.available,i.updated_at " +
    "from native_vendor_inventory i join native_vendors v on v.id=i.vendor_id " +
    "order by v.name asc,i.product_key asc",
  );
  return {
    ok: true as const,
    inventory: rows.map((row) => ({
      vendorId: String(row.vendor_id), vendorName: String(row.vendor_name),
      vendorStatus: String(row.vendor_status), productKey: String(row.product_key),
      stockUnits: Number(row.stock_units), lowStockAt: Number(row.low_stock_at),
      available: Boolean(row.available), updatedAt: new Date(String(row.updated_at)).getTime(),
    })),
  };
}

export async function updateSuperAdminInventory(request: Request, vendorId: string, productKey: string, body: unknown) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  if (!["egg", "water", "milk", "curd"].includes(productKey)) {
    return { ok: false as const, status: 400, error: "Unsupported inventory product." };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false as const, status: 400, error: "Invalid inventory update." };
  }
  const value = body as Record<string, unknown>;
  const stock = Number(value.stockUnits);
  const low = Number(value.lowStockAt);
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000 ||
      !Number.isInteger(low) || low < 0 || low > 100000 || typeof value.available !== "boolean") {
    return { ok: false as const, status: 400, error: "Enter valid stock, low-stock threshold and availability." };
  }
  const sql = await getSql();
  const vendor = await sql.query<Row>("select id from native_vendors where id=$1 limit 1", [vendorId]);
  if (!vendor[0]) return { ok: false as const, status: 404, error: "Vendor not found." };
  await sql.query(
    "insert into native_vendor_inventory(vendor_id,product_key,stock_units,low_stock_at,available,updated_at) " +
    "values($1,$2,$3,$4,$5,now()) on conflict(vendor_id,product_key) do update set " +
    "stock_units=excluded.stock_units,low_stock_at=excluded.low_stock_at,available=excluded.available,updated_at=now()",
    [vendorId, productKey, stock, low, value.available],
  );
  return { ok: true as const, vendorId, productKey, stockUnits: stock, lowStockAt: low, available: value.available };
}

export async function getSuperAdminCatalog(request: Request) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  const sql = await getSql();
  const rows = await sql.query<Row>(
    "select product_key,unit_price_paise,pack_label,enabled,updated_at from native_product_catalog order by product_key",
  );
  return {
    ok: true as const,
    catalog: rows.map((row) => ({
      productKey: String(row.product_key), unitPricePaise: Number(row.unit_price_paise),
      packLabel: String(row.pack_label), enabled: Boolean(row.enabled),
      updatedAt: new Date(String(row.updated_at)).getTime(),
    })),
  };
}

export async function updateSuperAdminCatalog(request: Request, body: unknown) {
  requirePersistentDatabase();
  if (!isSuperAdminRequest(request)) return { ok: false as const, status: 401, error: "Super Admin authorization failed." };
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false as const, status: 400, error: "Invalid catalogue update." };
  }
  const value = body as Record<string, unknown>;
  const updates: Array<{ key: "milk" | "curd"; price: number; label: string; enabled: boolean }> = [];
  for (const key of ["milk", "curd"] as const) {
    const item = value[key];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false as const, status: 400, error: "Supply both Milk and Curd settings." };
    }
    const product = item as Record<string, unknown>;
    const price = Number(product.unitPricePaise);
    const label = typeof product.packLabel === "string" ? product.packLabel.trim().slice(0, 60) : "";
    if (!Number.isInteger(price) || price < 0 || price > 100000000 ||
        typeof product.enabled !== "boolean" || (product.enabled && (price <= 0 || !label))) {
      return { ok: false as const, status: 400, error: "Enter a valid price and pack label for each enabled product." };
    }
    updates.push({ key, price, label, enabled: product.enabled });
  }
  const sql = await getSql();
  for (const item of updates) {
    await sql.query(
      "insert into native_product_catalog(product_key,unit_price_paise,pack_label,enabled,updated_at) " +
      "values($1,$2,$3,$4,now()) on conflict(product_key) do update set " +
      "unit_price_paise=excluded.unit_price_paise,pack_label=excluded.pack_label,enabled=excluded.enabled,updated_at=now()",
      [item.key, item.price, item.label, item.enabled],
    );
  }
  return await getSuperAdminCatalog(request);
}
