import { getSql } from "./db";
type Row = Record<string, unknown>;
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
