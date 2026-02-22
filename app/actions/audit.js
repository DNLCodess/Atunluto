"use server";

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/app/actions/election-auth";

const PAGE_SIZE = 50;

export async function fetchAuditLog({
  page = 0,
  action = "",
  table = "",
  adminId = "",
  dateFrom = "",
  dateTo = "",
} = {}) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();

  let query = supabase
    .from("result_audit_log")
    .select(
      `id, action, table_name, record_id, old_values, new_values, notes, ip_address, created_at, performer:performed_by ( id, full_name, role, lga )`,
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
  if (error) return { error: error.message };
  return { entries: data, total: count, page, pageSize: PAGE_SIZE };
}

export async function fetchAdminsList() {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("election_admins")
    .select("id, full_name, role, lga")
    .order("full_name");

  if (error) return { error: error.message };
  return data;
}

export async function fetchSecurityReports({ status = "", urgency = "" } = {}) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();

  let query = supabase
    .from("security_reports")
    .select(
      `id, report_type, urgency, description, evidence_url, status, resolution_notes, created_at, updated_at, reporter:reported_by ( id, full_name, lga ), resolver:resolved_by ( full_name )`,
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (urgency) query = query.eq("urgency", urgency);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return data;
}

export async function fetchMyReports(adminId) {
  const session = await getResultsSession();
  if (!session) return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("security_reports")
    .select("id, report_type, urgency, description, status, created_at")
    .eq("reported_by", adminId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return data;
}

export async function fetchChecksumScan(electionId) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("election_results")
    .select(
      `id, lga, ward, polling_unit, votes_cast, accredited_voters, registered_voters, checksum, submitted_at, election_id, candidate_id, candidate:candidate_id ( full_name, party ), submitter:submitted_by ( full_name )`,
    )
    .eq("election_id", electionId)
    .is("deleted_at", null);

  if (error) return { error: error.message };
  return data;
}
