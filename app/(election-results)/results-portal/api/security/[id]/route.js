/**
 * PATCH /results-portal/api/security/[id]  — updateSecurityReport (state_admin only)
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["open", "investigating", "resolved"];

export async function PATCH(request, { params }) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { id: reportId } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, resolution_notes } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const hdrs = await headers();

  const update = {
    status,
    updated_at: new Date().toISOString(),
    ...(resolution_notes?.trim() && { resolution_notes: resolution_notes.trim() }),
    ...(status === "resolved" && {
      resolved_by: session.id,
      resolved_at: new Date().toISOString(),
    }),
  };

  const { error } = await supabase
    .from("security_reports")
    .update(update)
    .eq("id", reportId);

  if (error) return NextResponse.json({ error: "Failed to update report." }, { status: 500 });

  await supabase.from("result_audit_log").insert({
    action: "UPDATE",
    table_name: "security_reports",
    record_id: reportId,
    performed_by: session.id,
    ip_address: hdrs.get("x-forwarded-for") || "unknown",
    user_agent: hdrs.get("user-agent") || "unknown",
    notes: `Security report status updated to: ${status}`,
  });

  return NextResponse.json({ success: true });
}
