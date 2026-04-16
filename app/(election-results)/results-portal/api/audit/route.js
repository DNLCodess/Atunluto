/**
 * GET /results-portal/api/audit?page=&action=&table=&adminId=&dateFrom=&dateTo=
 * fetchAuditLog — state_admin only
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";

const PAGE_SIZE = 50;

export async function GET(request) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0", 10);
  const action = searchParams.get("action") || "";
  const table = searchParams.get("table") || "";
  const adminId = searchParams.get("adminId") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const supabase = createAdminClient();

  let query = supabase
    .from("result_audit_log")
    .select(
      `id, action, table_name, record_id, old_values, new_values, notes, ip_address, created_at,
       performer:performed_by ( id, full_name, role, lga )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (action) query = query.eq("action", action);
  if (table) query = query.eq("table_name", table);
  if (adminId) query = query.eq("performed_by", adminId);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59Z");

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entries: data, total: count, page, pageSize: PAGE_SIZE });
}
